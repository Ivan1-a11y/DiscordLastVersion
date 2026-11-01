import { getSocket } from './socket';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class WebRTCVoiceManager {
  private localStream: MediaStream | null = null;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private remoteAudioElements = new Map<string, HTMLAudioElement>();
  private pendingCandidates = new Map<string, RTCIceCandidateInit[]>();
  private makingOffer = new Map<string, boolean>();
  private myUserId: string | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private speechCheckInterval: number | null = null;
  private currentChannelId: string | null = null;
  private isSpeaking = false;
  private isMuted = false;
  private isDeafened = false;
  private currentInputDeviceId = 'default';
  private currentOutputDeviceId = 'default';

  public onSpeakingChange?: (isSpeaking: boolean) => void;

  setMyUserId(userId: string | null) {
    this.myUserId = userId;
  }

  // Deterministic tie-breaker for WebRTC Perfect Negotiation
  private isPolite(peerId: string): boolean {
    if (!this.myUserId) return false;
    // Alphabetically higher user ID yields (is polite)
    return this.myUserId > peerId;
  }

  async joinChannel(
    channelId: string,
    initialMuted = false,
    initialDeafened = false,
    inputDeviceId = 'default',
    outputDeviceId = 'default',
    echoCancellation = true,
    noiseSuppression = true
  ) {
    this.leaveChannel();
    this.currentChannelId = channelId;
    this.isMuted = initialMuted;
    this.isDeafened = initialDeafened;
    this.currentInputDeviceId = inputDeviceId;
    this.currentOutputDeviceId = outputDeviceId;

    const socket = getSocket();

    try {
      const constraints: MediaTrackConstraints = {
        echoCancellation,
        noiseSuppression,
        autoGainControl: true,
      };

      if (inputDeviceId && inputDeviceId !== 'default') {
        constraints.deviceId = { exact: inputDeviceId };
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: constraints,
        video: false,
      });

      // Mute audio track if currently muted
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMuted;
      });

      this.setupSpeakingDetector();
    } catch (err) {
      console.warn('[WebRTC] Microphone access unavailable or denied:', err);
      // Still allow listening even if mic cannot be opened
      this.localStream = new MediaStream();
    }

    // Join room on socket
    socket.emit('voice:join', {
      channelId,
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
    });
  }

  // Live switch microphone input device
  async switchInputDevice(inputDeviceId: string, echoCancellation = true, noiseSuppression = true) {
    this.currentInputDeviceId = inputDeviceId;
    if (!this.currentChannelId) return;

    try {
      const constraints: MediaTrackConstraints = {
        echoCancellation,
        noiseSuppression,
        autoGainControl: true,
      };

      if (inputDeviceId && inputDeviceId !== 'default') {
        constraints.deviceId = { exact: inputDeviceId };
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: constraints,
        video: false,
      });

      const newAudioTrack = newStream.getAudioTracks()[0];
      if (newAudioTrack) {
        newAudioTrack.enabled = !this.isMuted;

        // Replace track on all existing peer connections
        this.peerConnections.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
          if (sender) {
            sender.replaceTrack(newAudioTrack).catch(console.warn);
          }
        });

        // Clean up old stream
        if (this.localStream) {
          this.localStream.getTracks().forEach((t) => t.stop());
        }

        this.localStream = newStream;
        this.setupSpeakingDetector();
      }
    } catch (err) {
      console.warn('[WebRTC] Error switching audio input device:', err);
    }
  }

  // Live switch output audio device (speaker/headphones)
  switchOutputDevice(outputDeviceId: string) {
    this.currentOutputDeviceId = outputDeviceId;
    this.remoteAudioElements.forEach((audio) => {
      if (outputDeviceId && outputDeviceId !== 'default' && typeof (audio as any).setSinkId === 'function') {
        (audio as any).setSinkId(outputDeviceId).catch((e: any) => console.warn('[WebRTC] setSinkId error', e));
      }
    });
  }

  private setupSpeakingDetector() {
    if (this.speechCheckInterval) {
      clearInterval(this.speechCheckInterval);
      this.speechCheckInterval = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (!this.localStream || this.localStream.getAudioTracks().length === 0) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      this.micSource = this.audioContext.createMediaStreamSource(this.localStream);
      this.micSource.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);
      let silenceCounter = 0;

      this.speechCheckInterval = window.setInterval(() => {
        if (!this.analyser || this.isMuted) {
          if (this.isSpeaking) {
            this.setSpeakingState(false);
          }
          return;
        }

        this.analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;

        // Threshold for speaking
        if (avg > 18) {
          silenceCounter = 0;
          if (!this.isSpeaking) {
            this.setSpeakingState(true);
          }
        } else {
          silenceCounter++;
          // Give 300ms hangover before turning off speaking indicator
          if (silenceCounter > 3 && this.isSpeaking) {
            this.setSpeakingState(false);
          }
        }
      }, 100);
    } catch (e) {
      console.warn('[WebRTC] AudioContext speaking detector setup failed:', e);
    }
  }

  private setSpeakingState(speaking: boolean) {
    this.isSpeaking = speaking;
    if (this.onSpeakingChange) {
      this.onSpeakingChange(speaking);
    }
    const socket = getSocket();
    socket.emit('voice:state_change', { isSpeaking: speaking });
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    if (muted && this.isSpeaking) {
      this.setSpeakingState(false);
    }
    const socket = getSocket();
    socket.emit('voice:state_change', { isMuted: muted });
  }

  setDeafened(deafened: boolean) {
    this.isDeafened = deafened;
    // Mute or restore volume on all remote peer audio elements
    this.remoteAudioElements.forEach((audio) => {
      audio.muted = deafened;
    });

    if (deafened) {
      this.setMuted(true);
    }

    const socket = getSocket();
    socket.emit('voice:state_change', { isDeafened: deafened });
  }

  private getOrCreatePeerConnection(targetUserId: string): RTCPeerConnection {
    let pc = this.peerConnections.get(targetUserId);
    if (pc) return pc;

    pc = new RTCPeerConnection(RTC_CONFIG);
    this.peerConnections.set(targetUserId, pc);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          pc!.addTrack(track, this.localStream!);
        } catch (e) {
          console.warn('[WebRTC] Error adding track:', e);
        }
      });
    }

    const socket = getSocket();

    // ICE Candidate
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('voice:signal', {
          toUserId: targetUserId,
          signalData: { type: 'candidate', candidate: event.candidate.toJSON() },
        });
      }
    };

    // Remote track received
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.attachRemoteTrack(targetUserId, event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc!.connectionState === 'failed') {
        console.warn(`[WebRTC] Connection with peer ${targetUserId} failed, attempting ICE restart`);
        try {
          pc!.restartIce();
        } catch {
          // Ignore restart error
        }
      }
    };

    return pc;
  }

  // Create peer connection to initiate call to an existing participant
  async initiatePeerConnection(targetUserId: string) {
    const existing = this.peerConnections.get(targetUserId);
    if (existing && (existing.signalingState !== 'stable' || existing.connectionState === 'connected')) {
      return;
    }

    const pc = this.getOrCreatePeerConnection(targetUserId);
    const socket = getSocket();

    try {
      this.makingOffer.set(targetUserId, true);
      const offer = await pc.createOffer();
      if (pc.signalingState !== 'stable') {
        return;
      }
      await pc.setLocalDescription(offer);
      socket.emit('voice:signal', {
        toUserId: targetUserId,
        signalData: { type: 'offer', sdp: pc.localDescription || offer },
      });
    } catch (err) {
      console.warn('[WebRTC] Failed to create offer for peer', targetUserId, err);
    } finally {
      this.makingOffer.set(targetUserId, false);
    }
  }

  // Handle incoming signaling from peer
  async handleSignal(fromUserId: string, signalData: any) {
    if (!signalData || !signalData.type) return;
    const socket = getSocket();

    try {
      if (signalData.type === 'offer') {
        const pc = this.getOrCreatePeerConnection(fromUserId);
        const isOfferCollision =
          this.makingOffer.get(fromUserId) || pc.signalingState !== 'stable';

        const polite = this.isPolite(fromUserId);

        if (isOfferCollision) {
          if (!polite) {
            // Impolite peer drops colliding offer to let its own offer stand
            return;
          }
          // Polite peer rolls back in case of glare
          try {
            await pc.setLocalDescription({ type: 'rollback' } as any);
          } catch (e) {
            console.warn('[WebRTC] Rollback ignored:', e);
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

        // Flush any candidates received while remote description was pending
        await this.drainPendingCandidates(fromUserId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('voice:signal', {
          toUserId: fromUserId,
          signalData: { type: 'answer', sdp: pc.localDescription || answer },
        });
      } else if (signalData.type === 'answer') {
        const pc = this.peerConnections.get(fromUserId);
        if (!pc) return;

        // Defensive guard: RTCPeerConnection can ONLY accept an answer in 'have-local-offer' state
        if (pc.signalingState !== 'have-local-offer') {
          console.warn(
            `[WebRTC] Ignored answer from ${fromUserId}: signalingState is '${pc.signalingState}' (expected 'have-local-offer')`
          );
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

        // Flush any queued candidates
        await this.drainPendingCandidates(fromUserId, pc);
      } else if (signalData.type === 'candidate') {
        if (!signalData.candidate) return;

        const pc = this.peerConnections.get(fromUserId);
        // If peer connection not ready or remoteDescription not set, queue the candidate
        if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
          const queue = this.pendingCandidates.get(fromUserId) || [];
          queue.push(signalData.candidate);
          this.pendingCandidates.set(fromUserId, queue);
          return;
        }

        try {
          await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        } catch (e) {
          console.warn('[WebRTC] Error adding ICE candidate:', e);
        }
      }
    } catch (err) {
      console.warn(`[WebRTC] Handled error in signal '${signalData.type}' from ${fromUserId}:`, err);
    }
  }

  private async drainPendingCandidates(fromUserId: string, pc: RTCPeerConnection) {
    const queue = this.pendingCandidates.get(fromUserId);
    if (!queue || queue.length === 0) return;

    this.pendingCandidates.delete(fromUserId);
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[WebRTC] Error draining queued ICE candidate:', e);
      }
    }
  }

  private attachRemoteTrack(userId: string, stream: MediaStream) {
    let audio = this.remoteAudioElements.get(userId);
    if (!audio) {
      audio = new Audio();
      audio.autoplay = true;
      audio.muted = this.isDeafened;

      if (this.currentOutputDeviceId && this.currentOutputDeviceId !== 'default' && typeof (audio as any).setSinkId === 'function') {
        (audio as any).setSinkId(this.currentOutputDeviceId).catch(() => {});
      }

      this.remoteAudioElements.set(userId, audio);
    }
    audio.srcObject = stream;
    audio.play().catch((e) => console.warn('[WebRTC] Autoplay error', e));
  }

  removePeer(userId: string) {
    this.pendingCandidates.delete(userId);
    this.makingOffer.delete(userId);

    const pc = this.peerConnections.get(userId);
    if (pc) {
      try {
        pc.close();
      } catch {
        // Ignore close error
      }
      this.peerConnections.delete(userId);
    }

    const audio = this.remoteAudioElements.get(userId);
    if (audio) {
      audio.srcObject = null;
      this.remoteAudioElements.delete(userId);
    }
  }

  leaveChannel() {
    if (!this.currentChannelId) return;

    if (this.speechCheckInterval) {
      clearInterval(this.speechCheckInterval);
      this.speechCheckInterval = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.pendingCandidates.clear();
    this.makingOffer.clear();

    this.peerConnections.forEach((pc) => {
      try {
        pc.close();
      } catch {
        // Ignore close error
      }
    });
    this.peerConnections.clear();

    this.remoteAudioElements.forEach((audio) => {
      audio.srcObject = null;
    });
    this.remoteAudioElements.clear();

    const socket = getSocket();
    socket.emit('voice:leave');

    this.currentChannelId = null;
    this.isSpeaking = false;
  }
}

export const voiceManager = new WebRTCVoiceManager();
