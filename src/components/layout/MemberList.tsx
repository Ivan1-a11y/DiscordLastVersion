import React from 'react';
import { useServerStore } from '../../store/useServerStore';
import { useFriendStore } from '../../store/useFriendStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Avatar } from '../common/Avatar';
import { Crown, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Member, Role } from '../../types';

export const MemberList: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { servers, currentServerId, selectServer } = useServerStore();
  const { setActiveDMUser } = useFriendStore();

  const currentServer = servers.find((s) => s.id === currentServerId);
  if (!currentServer) return null;

  // Group members by hoisted roles
  const hoistedRoles = [...currentServer.roles]
    .filter((r) => r.hoist)
    .sort((a, b) => a.position - b.position);

  const assignedMemberIds = new Set<string>();
  const roleGroups: Array<{ role: Role; members: Member[] }> = [];

  for (const role of hoistedRoles) {
    const roleMembers = currentServer.members.filter((m) => {
      if (assignedMemberIds.has(m.id)) return false;
      const hasRole = m.roles.some((r) => r.id === role.id);
      return hasRole;
    });

    if (roleMembers.length > 0) {
      roleMembers.forEach((m) => assignedMemberIds.add(m.id));
      roleGroups.push({ role, members: roleMembers });
    }
  }

  // Remaining members grouped into Online & Offline
  const remainingMembers = currentServer.members.filter((m) => !assignedMemberIds.has(m.id));
  const onlineMembers = remainingMembers.filter((m) => m.user?.status !== 'OFFLINE');
  const offlineMembers = remainingMembers.filter((m) => m.user?.status === 'OFFLINE');

  const handleMemberClick = (member: Member) => {
    if (!member.user || member.userId === currentUser?.id) return;
    // Switch to Home DMs and open conversation with this member
    selectServer(null);
    setActiveDMUser(member.user);
  };

  const renderMemberRow = (member: Member, roleColor?: string) => {
    const isOwner = member.userId === currentServer.ownerId;
    const isCurrent = member.userId === currentUser?.id;

    return (
      <div
        key={member.id}
        onClick={() => handleMemberClick(member)}
        className={`group flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors cursor-pointer ${
          isCurrent ? 'bg-[#35373c]/30' : 'hover:bg-[#35373c]/60'
        }`}
        title={isCurrent ? 'You' : `Direct message ${member.user?.displayName || member.user?.username}`}
      >
        <Avatar
          src={member.user?.avatarUrl}
          name={member.nickname || member.user?.displayName || 'User'}
          size="sm"
          status={member.user?.status}
        />
        <div className="truncate flex-1">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className="font-medium text-xs truncate"
              style={{ color: roleColor || '#dbdee1' }}
            >
              {member.nickname || member.user?.displayName || member.user?.username}
            </span>
            {isOwner && (
              <span title="Server Owner">
                <Crown className="w-3.5 h-3.5 text-[#f0b232] shrink-0" />
              </span>
            )}
          </div>
          {member.user?.customStatus && (
            <p className="text-[10px] text-[#949ba4] truncate leading-tight mt-0.5">
              {member.user.customStatus}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-60 h-screen bg-[#2b2d31] overflow-y-auto px-2 py-4 space-y-4 shrink-0 select-none border-l border-[#1f2023] hidden lg:block">
      {/* Hoisted Roles */}
      {roleGroups.map(({ role, members }) => (
        <div key={role.id} className="space-y-0.5">
          <p
            className="text-[11px] font-bold uppercase tracking-wider px-2 mb-1 flex items-center justify-between"
            style={{ color: role.color }}
          >
            <span>{role.name} — {members.length}</span>
          </p>
          {members.map((m) => renderMemberRow(m, role.color))}
        </div>
      ))}

      {/* Online Group */}
      {onlineMembers.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] px-2 mb-1">
            Online — {onlineMembers.length}
          </p>
          {onlineMembers.map((m) => renderMemberRow(m))}
        </div>
      )}

      {/* Offline Group */}
      {offlineMembers.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#80848e] px-2 mb-1">
            Offline — {offlineMembers.length}
          </p>
          {offlineMembers.map((m) => renderMemberRow(m))}
        </div>
      )}
    </div>
  );
};
