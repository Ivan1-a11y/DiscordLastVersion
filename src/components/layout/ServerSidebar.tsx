import React from 'react';
import { MessageSquare, Plus, Compass, Download } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';

export const ServerSidebar: React.FC = () => {
  const {
    servers,
    currentServerId,
    selectServer,
    openCreateServer,
    openJoinServer,
    openInstallModal,
  } = useServerStore();

  const isHomeActive = currentServerId === null;

  return (
    <div className="w-[72px] h-full bg-[#1e1f22] flex flex-col items-center py-3 gap-2 shrink-0 select-none border-r border-[#151618] overflow-hidden">
      {/* Home / Direct Messages Icon */}
      <div className="relative group flex items-center justify-center w-full">
        {/* White Pill Indicator */}
        <div
          className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
            isHomeActive
              ? 'h-10'
              : 'h-2 group-hover:h-5 opacity-0 group-hover:opacity-100'
          }`}
        />
        <button
          onClick={() => selectServer(null)}
          title="Direct Messages"
          className={`w-12 h-12 flex items-center justify-center transition-all duration-200 ${
            isHomeActive
              ? 'bg-[#5865F2] text-white rounded-2xl'
              : 'bg-[#313338] text-[#dbdee1] hover:bg-[#5865F2] hover:text-white rounded-3xl hover:rounded-2xl'
          }`}
        >
          <MessageSquare className="w-7 h-7" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-8 h-[2px] bg-[#35363c] rounded-full my-1" />

      {/* Server Icons List */}
      <div className="flex-1 w-full space-y-2 overflow-y-auto no-scrollbar flex flex-col items-center">
        {servers.map((server) => {
          const isActive = currentServerId === server.id;
          const initials = server.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 3)
            .toUpperCase();

          return (
            <div key={server.id} className="relative group flex items-center justify-center w-full">
              {/* White Pill Indicator */}
              <div
                className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
                  isActive
                    ? 'h-10'
                    : 'h-2 group-hover:h-5 opacity-0 group-hover:opacity-100'
                }`}
              />
              <button
                onClick={() => selectServer(server.id)}
                title={server.name}
                className={`w-12 h-12 flex items-center justify-center transition-all duration-200 overflow-hidden font-semibold text-sm ${
                  isActive
                    ? 'bg-[#5865F2] text-white rounded-2xl'
                    : 'bg-[#313338] text-[#dbdee1] hover:bg-[#5865F2] hover:text-white rounded-3xl hover:rounded-2xl'
                }`}
              >
                {server.iconUrl ? (
                  <img
                    src={server.iconUrl}
                    alt={server.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </button>
            </div>
          );
        })}

        {/* Add a Server Button */}
        <div className="relative group flex items-center justify-center w-full pt-1">
          <div className="absolute left-0 w-1 bg-white rounded-r-full h-2 group-hover:h-5 opacity-0 group-hover:opacity-100 transition-all duration-200" />
          <button
            onClick={openCreateServer}
            title="Add a Server"
            className="w-12 h-12 rounded-3xl hover:rounded-2xl bg-[#313338] hover:bg-[#23a55a] text-[#23a55a] hover:text-white flex items-center justify-center transition-all duration-200"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Explore / Join Server with Invite */}
        <div className="relative group flex items-center justify-center w-full">
          <div className="absolute left-0 w-1 bg-white rounded-r-full h-2 group-hover:h-5 opacity-0 group-hover:opacity-100 transition-all duration-200" />
          <button
            onClick={openJoinServer}
            title="Join Server with Invite"
            className="w-12 h-12 rounded-3xl hover:rounded-2xl bg-[#313338] hover:bg-[#5865F2] text-[#5865F2] hover:text-white flex items-center justify-center transition-all duration-200"
          >
            <Compass className="w-6 h-6" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-8 h-[2px] bg-[#35363c] rounded-full my-1" />

        {/* Download / Install App (PWA) */}
        <div className="relative group flex items-center justify-center w-full">
          <div className="absolute left-0 w-1 bg-white rounded-r-full h-2 group-hover:h-5 opacity-0 group-hover:opacity-100 transition-all duration-200" />
          <button
            onClick={openInstallModal}
            title="Установить приложение Accord (PWA)"
            className="w-12 h-12 rounded-3xl hover:rounded-2xl bg-[#313338] hover:bg-[#23a55a] text-[#23a55a] hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm"
          >
            <Download className="w-5 h-5 animate-pulse" />
          </button>
        </div>
      </div>
    </div>
  );
};
