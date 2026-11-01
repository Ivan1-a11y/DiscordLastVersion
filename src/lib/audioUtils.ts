export interface AudioDevice {
  deviceId: string;
  label: string;
  isRealLabel: boolean;
  kind: MediaDeviceKind;
}

export interface AudioDevicesResult {
  inputs: AudioDevice[];
  outputs: AudioDevice[];
  permissionGranted: boolean;
  error?: string;
}

/**
 * Checks if the browser or origin already provides real labels without asking again
 */
export async function enumerateAudioDevicesQuick(): Promise<AudioDevicesResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return {
      inputs: [{ deviceId: 'default', label: 'Системный микрофон по умолчанию', isRealLabel: false, kind: 'audioinput' }],
      outputs: [{ deviceId: 'default', label: 'Системные динамики по умолчанию', isRealLabel: false, kind: 'audiooutput' }],
      permissionGranted: false,
      error: 'MediaDevices API не поддерживается вашим браузером.',
    };
  }

  try {
    const rawDevices = await navigator.mediaDevices.enumerateDevices();
    const rawInputs = rawDevices.filter((d) => d.kind === 'audioinput');
    const rawOutputs = rawDevices.filter((d) => d.kind === 'audiooutput');

    const hasRealInputs = rawInputs.some((d) => Boolean(d.label && d.label.trim().length > 0));
    const hasRealOutputs = rawOutputs.some((d) => Boolean(d.label && d.label.trim().length > 0));
    const isGranted = hasRealInputs || hasRealOutputs;

    const inputs: AudioDevice[] = rawInputs.length > 0
      ? rawInputs.map((d, idx) => ({
          deviceId: d.deviceId || (idx === 0 ? 'default' : `input-${idx}`),
          label: d.label && d.label.trim().length > 0
            ? d.label
            : (idx === 0 ? 'Микрофон по умолчанию (Default)' : `Микрофон ${idx + 1}`),
          isRealLabel: Boolean(d.label && d.label.trim().length > 0),
          kind: d.kind,
        }))
      : [{ deviceId: 'default', label: 'Системный микрофон по умолчанию', isRealLabel: false, kind: 'audioinput' }];

    const outputs: AudioDevice[] = rawOutputs.length > 0
      ? rawOutputs.map((d, idx) => ({
          deviceId: d.deviceId || (idx === 0 ? 'default' : `output-${idx}`),
          label: d.label && d.label.trim().length > 0
            ? d.label
            : (idx === 0 ? 'Динамики по умолчанию (Default)' : `Динамик / Наушники ${idx + 1}`),
          isRealLabel: Boolean(d.label && d.label.trim().length > 0),
          kind: d.kind,
        }))
      : [{ deviceId: 'default', label: 'Системные динамики по умолчанию', isRealLabel: false, kind: 'audiooutput' }];

    return {
      inputs,
      outputs,
      permissionGranted: isGranted,
    };
  } catch (err: any) {
    return {
      inputs: [{ deviceId: 'default', label: 'Системный микрофон по умолчанию', isRealLabel: false, kind: 'audioinput' }],
      outputs: [{ deviceId: 'default', label: 'Системные динамики по умолчанию', isRealLabel: false, kind: 'audiooutput' }],
      permissionGranted: false,
      error: err.message || 'Ошибка перечисления аудиоустройств',
    };
  }
}

/**
 * Requests microphone permission and retrieves full device list with real hardware labels.
 * CRITICAL: Keeps stream tracks alive until enumerateDevices() completes so browsers
 * do not immediately re-censor device names!
 */
export async function requestAndLoadAudioDevices(): Promise<AudioDevicesResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      inputs: [{ deviceId: 'default', label: 'Системный микрофон по умолчанию', isRealLabel: false, kind: 'audioinput' }],
      outputs: [{ deviceId: 'default', label: 'Системные динамики по умолчанию', isRealLabel: false, kind: 'audiooutput' }],
      permissionGranted: false,
      error: 'MediaDevices getUserMedia API не поддерживается вашим браузером.',
    };
  }

  let activeStream: MediaStream | null = null;
  let permError: string | undefined = undefined;
  let permGranted = false;

  try {
    // 1. Request microphone access with generic audio constraints
    activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    permGranted = true;
  } catch (err: any) {
    const name = err.name || '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      permError = 'Доступ к микрофону заблокирован браузером или политикой фрейма. Разрешите микрофон в настройках сайта или откройте приложение в отдельной вкладке.';
    } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      permError = 'Микрофон не обнаружен в операционной системе. Подключите гарнитуру или микрофон.';
    } else if (name === 'SecurityError') {
      permError = 'Iframe безопасности ограничил доступ к микрофону. Откройте приложение в новой отдельной вкладке по прямой ссылке.';
    } else {
      permError = err.message || 'Не удалось получить доступ к микрофону.';
    }
  }

  // 2. Query devices WHILE stream is still active (if opened)
  let rawDevices: MediaDeviceInfo[] = [];
  try {
    rawDevices = await navigator.mediaDevices.enumerateDevices();
  } catch (err) {
    console.warn('Could not enumerate devices:', err);
  }

  // 3. Immediately stop stream tracks to release the microphone
  if (activeStream) {
    try {
      activeStream.getTracks().forEach((track) => track.stop());
    } catch {
      // ignore
    }
  }

  // 4. Map devices
  const rawInputs = rawDevices.filter((d) => d.kind === 'audioinput');
  const rawOutputs = rawDevices.filter((d) => d.kind === 'audiooutput');

  const hasRealInputs = rawInputs.some((d) => Boolean(d.label && d.label.trim().length > 0));
  const hasRealOutputs = rawOutputs.some((d) => Boolean(d.label && d.label.trim().length > 0));
  if (hasRealInputs || hasRealOutputs) {
    permGranted = true;
    permError = undefined; // Real labels acquired successfully
  }

  const inputs: AudioDevice[] = rawInputs.length > 0
    ? rawInputs.map((d, idx) => ({
        deviceId: d.deviceId || (idx === 0 ? 'default' : `input-${idx}`),
        label: d.label && d.label.trim().length > 0
          ? d.label
          : (idx === 0 ? 'Микрофон по умолчанию (Default)' : `Микрофон ${idx + 1}`),
        isRealLabel: Boolean(d.label && d.label.trim().length > 0),
        kind: d.kind,
      }))
    : [{ deviceId: 'default', label: 'Системный микрофон по умолчанию', isRealLabel: false, kind: 'audioinput' }];

  const outputs: AudioDevice[] = rawOutputs.length > 0
    ? rawOutputs.map((d, idx) => ({
        deviceId: d.deviceId || (idx === 0 ? 'default' : `output-${idx}`),
        label: d.label && d.label.trim().length > 0
          ? d.label
          : (idx === 0 ? 'Динамики по умолчанию (Default)' : `Динамик / Наушники ${idx + 1}`),
        isRealLabel: Boolean(d.label && d.label.trim().length > 0),
        kind: d.kind,
      }))
    : [{ deviceId: 'default', label: 'Системные динамики по умолчанию', isRealLabel: false, kind: 'audiooutput' }];

  return {
    inputs,
    outputs,
    permissionGranted: permGranted,
    error: permError,
  };
}

/**
 * Backward-compatible helper for legacy calls
 */
export async function getAudioInputDevices(requestIfEmpty = false): Promise<AudioDevice[]> {
  const res = requestIfEmpty ? await requestAndLoadAudioDevices() : await enumerateAudioDevicesQuick();
  return res.inputs;
}

export async function getAudioOutputDevices(requestIfEmpty = false): Promise<AudioDevice[]> {
  const res = requestIfEmpty ? await requestAndLoadAudioDevices() : await enumerateAudioDevicesQuick();
  return res.outputs;
}

export async function requestAudioPermissions(): Promise<{ success: boolean; error?: string }> {
  const res = await requestAndLoadAudioDevices();
  return { success: res.permissionGranted, error: res.error };
}

/**
 * Plays a test chime to verify the chosen audio output device works
 */
export function playTestSound(outputDeviceId?: string) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone chord: 587.33Hz (D5) -> 880Hz (A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (outputDeviceId && outputDeviceId !== 'default' && typeof (ctx as any).setSinkId === 'function') {
      (ctx as any).setSinkId(outputDeviceId).catch(() => {});
    }

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (err) {
    console.warn('Could not play test sound', err);
  }
}

/**
 * Web Audio Mic Tester with real-time VU frequency analysis
 */
export class MicTester {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private onLevelCallback: ((level: number) => void) | null = null;

  async start(
    deviceId?: string,
    echoCancellation = true,
    noiseSuppression = true,
    onLevel?: (level: number) => void
  ): Promise<boolean> {
    this.stop();
    this.onLevelCallback = onLevel || null;

    try {
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation,
        noiseSuppression,
        autoGainControl: true,
      };

      if (deviceId && deviceId !== 'default') {
        audioConstraints.deviceId = { exact: deviceId };
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false,
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;

      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const checkLevel = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((average / 128) * 100));

        if (this.onLevelCallback) {
          this.onLevelCallback(normalized);
        }

        this.animationFrameId = requestAnimationFrame(checkLevel);
      };

      checkLevel();
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or device not found for test:', err);
      return false;
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.microphone) {
      try {
        this.microphone.disconnect();
      } catch {}
      this.microphone = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
  }
}
