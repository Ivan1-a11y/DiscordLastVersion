import React, { useState } from 'react';
import { X, Shield, Link, Plus, Check, Trash2, Copy } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { Role } from '../../types';

export const ServerSettingsModal: React.FC = () => {
  const {
    servers,
    currentServerId,
    isServerSettingsOpen,
    closeServerSettings,
    createRole,
    updateRole,
  } = useServerStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'invites'>('overview');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // New role state
  const [roleName, setRoleName] = useState('');
  const [roleColor, setRoleColor] = useState('#5865F2');
  const [roleHoist, setRoleHoist] = useState(true);
  const [permManageChannels, setPermManageChannels] = useState(false);
  const [permKickMembers, setPermKickMembers] = useState(false);
  const [permBanMembers, setPermBanMembers] = useState(false);
  const [permSendMessages, setPermSendMessages] = useState(true);
  const [permConnectVoice, setPermConnectVoice] = useState(true);
  const [isSavingRole, setIsSavingRole] = useState(false);

  if (!isServerSettingsOpen || !currentServerId) return null;

  const currentServer = servers.find(s => s.id === currentServerId);
  if (!currentServer) return null;

  const selectedRole = currentServer.roles.find(r => r.id === selectedRoleId) || currentServer.roles[0];

  const handleCreateNewRole = async () => {
    try {
      const newRole = await createRole(currentServer.id, {
        name: 'new role',
        color: '#99AAB5',
        hoist: false,
        manageChannels: false,
        kickMembers: false,
        banMembers: false,
        sendMessages: true,
        connectVoice: true,
      });
      setSelectedRoleId(newRole.id);
    } catch (err) {
      console.error('Failed to create role', err);
    }
  };

  const handleSaveSelectedRole = async () => {
    if (!selectedRole) return;
    setIsSavingRole(true);
    try {
      await updateRole(currentServer.id, selectedRole.id, {
        name: roleName || selectedRole.name,
        color: roleColor || selectedRole.color,
        hoist: roleHoist,
        manageChannels: permManageChannels,
        kickMembers: permKickMembers,
        banMembers: permBanMembers,
        sendMessages: permSendMessages,
        connectVoice: permConnectVoice,
      });
    } catch (err) {
      console.error('Failed to save role', err);
    } finally {
      setIsSavingRole(false);
    }
  };

  const copyInvite = () => {
    const inviteUrl = `${window.location.origin}/join/${currentServer.inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const colorPresets = ['#ED4245', '#FEE75C', '#5865F2', '#23A55A', '#EB459E', '#9B59B6', '#1ABC9C', '#E67E22'];

  return (
    <div className="fixed inset-0 z-50 flex bg-[#000000]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex w-full h-full max-w-5xl mx-auto my-auto bg-[#313338] md:rounded-lg overflow-hidden shadow-2xl border border-[#232428]">
        {/* Left Nav */}
        <div className="w-60 bg-[#2b2d31] p-6 flex flex-col justify-between shrink-0 border-r border-[#1f2023]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] px-3 mb-2">
              {currentServer.name}
            </p>
            <nav className="space-y-0.5">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-[#383a40] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => {
                  setActiveTab('roles');
                  if (currentServer.roles.length > 0 && !selectedRoleId) {
                    const first = currentServer.roles[0];
                    setSelectedRoleId(first.id);
                    setRoleName(first.name);
                    setRoleColor(first.color);
                    setRoleHoist(first.hoist);
                    setPermManageChannels(first.manageChannels);
                    setPermKickMembers(first.kickMembers);
                    setPermBanMembers(first.banMembers);
                    setPermSendMessages(first.sendMessages);
                    setPermConnectVoice(first.connectVoice);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'roles'
                    ? 'bg-[#383a40] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                }`}
              >
                <Shield className="w-4 h-4" />
                Roles & Permissions
              </button>
              <button
                onClick={() => setActiveTab('invites')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'invites'
                    ? 'bg-[#383a40] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                }`}
              >
                <Link className="w-4 h-4" />
                Invites
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-y-auto p-8 relative">
          <div className="absolute top-6 right-6">
            <button
              onClick={closeServerSettings}
              className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#b5bac1] text-[#b5bac1] hover:text-white hover:border-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Server Overview</h2>
                <p className="text-sm text-[#949ba4]">
                  Manage basic details for {currentServer.name}.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
                    Server Name
                  </label>
                  <input
                    type="text"
                    defaultValue={currentServer.name}
                    className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
                    Server Invite Code
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentServer.inviteCode}
                      className="flex-1 bg-[#1e1f22] text-[#949ba4] font-mono px-3 py-2 rounded-md border border-[#232428] text-sm"
                    />
                    <button
                      type="button"
                      onClick={copyInvite}
                      className="flex items-center gap-2 px-4 py-2 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold transition-colors"
                    >
                      {copiedInvite ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedInvite ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="flex-1 flex gap-6 overflow-hidden">
              {/* Roles List */}
              <div className="w-48 bg-[#2b2d31] rounded-lg p-3 flex flex-col justify-between shrink-0">
                <div className="space-y-1 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#35373c]">
                    <span className="text-[11px] font-bold uppercase text-[#949ba4]">
                      Roles ({currentServer.roles.length})
                    </span>
                    <button
                      onClick={handleCreateNewRole}
                      className="p-1 hover:bg-[#383a40] rounded text-[#dbdee1] transition-colors"
                      title="Create Role"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {currentServer.roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedRoleId(r.id);
                        setRoleName(r.name);
                        setRoleColor(r.color);
                        setRoleHoist(r.hoist);
                        setPermManageChannels(r.manageChannels);
                        setPermKickMembers(r.kickMembers);
                        setPermBanMembers(r.banMembers);
                        setPermSendMessages(r.sendMessages);
                        setPermConnectVoice(r.connectVoice);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors ${
                        selectedRole?.id === r.id
                          ? 'bg-[#383a40] text-white'
                          : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="truncate">{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Details and Permissions */}
              {selectedRole ? (
                <div className="flex-1 overflow-y-auto space-y-5 pr-2">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block"
                        style={{ backgroundColor: roleColor }}
                      />
                      Edit Role — {selectedRole.name}
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
                      Role Name
                    </label>
                    <input
                      type="text"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
                      Role Color
                    </label>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {colorPresets.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setRoleColor(hex)}
                          className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                            roleColor.toLowerCase() === hex.toLowerCase()
                              ? 'border-white scale-110'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                      <input
                        type="color"
                        value={roleColor}
                        onChange={(e) => setRoleColor(e.target.value)}
                        className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                        title="Custom Color"
                      />
                    </div>
                  </div>

                  {/* Display role members separately */}
                  <div className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg border border-[#232428]">
                    <div>
                      <p className="text-sm font-medium text-white">Display Role Members Separately</p>
                      <p className="text-xs text-[#949ba4]">
                        Hoists members in this role into their own section on the member list
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRoleHoist(!roleHoist)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        roleHoist ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          roleHoist ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Permissions Toggles */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase text-[#b5bac1]">Permissions</h4>

                    <div className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg border border-[#232428]">
                      <div>
                        <p className="text-sm font-medium text-white">Manage Channels</p>
                        <p className="text-xs text-[#949ba4]">Allows creating, editing, and deleting channels</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPermManageChannels(!permManageChannels)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          permManageChannels ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            permManageChannels ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg border border-[#232428]">
                      <div>
                        <p className="text-sm font-medium text-white">Kick Members</p>
                        <p className="text-xs text-[#949ba4]">Allows kicking members with lower roles</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPermKickMembers(!permKickMembers)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          permKickMembers ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            permKickMembers ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg border border-[#232428]">
                      <div>
                        <p className="text-sm font-medium text-white">Send Messages</p>
                        <p className="text-xs text-[#949ba4]">Allows sending text messages in text channels</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPermSendMessages(!permSendMessages)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          permSendMessages ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            permSendMessages ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg border border-[#232428]">
                      <div>
                        <p className="text-sm font-medium text-white">Connect to Voice</p>
                        <p className="text-xs text-[#949ba4]">Allows joining voice channels and speaking</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPermConnectVoice(!permConnectVoice)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          permConnectVoice ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            permConnectVoice ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleSaveSelectedRole}
                      disabled={isSavingRole}
                      className="px-6 py-2.5 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium transition-colors"
                    >
                      {isSavingRole ? 'Saving Role...' : 'Save Role Changes'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB: INVITES */}
          {activeTab === 'invites' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Server Invites</h2>
                <p className="text-sm text-[#949ba4]">
                  Share this invite link with your friends to let them join {currentServer.name}.
                </p>
              </div>

              <div className="p-4 bg-[#1e1f22] rounded-lg border border-[#232428] space-y-3">
                <label className="block text-xs font-bold uppercase text-[#b5bac1]">
                  Direct Invite Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/join/${currentServer.inviteCode}`}
                    className="flex-1 bg-[#2b2d31] text-white px-3 py-2 rounded-md border border-[#232428] font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={copyInvite}
                    className="flex items-center gap-2 px-5 py-2 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold transition-colors"
                  >
                    {copiedInvite ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedInvite ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-[#949ba4]">
                  Code: <strong className="text-white font-mono">{currentServer.inviteCode}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
