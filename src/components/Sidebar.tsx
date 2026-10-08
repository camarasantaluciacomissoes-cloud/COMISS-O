import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLegislative } from '../context/LegislativeContext';
import { TabKey } from '../types';
import {
  LayoutDashboard,
  CalendarDays,
  Users2,
  UserCheck,
  FileSpreadsheet,
  ScrollText,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Landmark,
  ShieldCheck,
  Calendar,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  meetingsCount: number;
  committeesCount: number;
  councilorsCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  meetingsCount,
  committeesCount,
  councilorsCount,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { styles } = useTheme();
  const { settings, firebaseConnected, activeLegislature } = useLegislative();

  const navItems: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      key: 'dashboard',
      label: 'Dashboard Geral',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      key: 'reunioes',
      label: 'Reuniões & Presença',
      icon: <CalendarDays className="w-5 h-5 shrink-0" />,
      badge: meetingsCount,
    },
    {
      key: 'comissoes',
      label: 'Comissões Permanentes',
      icon: <Users2 className="w-5 h-5 shrink-0" />,
      badge: committeesCount,
    },
    {
      key: 'vereadores',
      label: 'Vereadores & Mandatos',
      icon: <UserCheck className="w-5 h-5 shrink-0" />,
      badge: councilorsCount,
    },
    {
      key: 'relatorios',
      label: 'Relatórios Analíticos',
      icon: <FileSpreadsheet className="w-5 h-5 shrink-0" />,
    },
    {
      key: 'atas',
      label: 'Atas & Documentos',
      icon: <ScrollText className="w-5 h-5 shrink-0" />,
    },
    {
      key: 'configuracoes',
      label: 'Configurações',
      icon: <Settings className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <aside
      className={`
        fixed top-0 bottom-0 left-0 z-40
        lg:static lg:z-auto
        flex flex-col h-screen
        ${styles.navBg} border-r ${styles.border}
        transition-all duration-300 ease-in-out select-none shadow-lg lg:shadow-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-68 w-72'}
      `}
    >
      {/* 1. Header / Chamber Brand */}
      <div className={`p-4 border-b ${styles.border} flex items-center justify-between min-h-[72px]`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-blue-600/20 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-inner">
            <Landmark className="w-6 h-6 text-amber-500" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="min-w-0 transition-opacity duration-200">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block font-mono leading-none mb-1">
                Poder Legislativo
              </span>
              <h2 className="text-sm font-bold truncate leading-tight font-serif" title={settings.chamberName}>
                {settings.chamberName}
              </h2>
              <p className={`text-[11px] ${styles.textMuted} truncate leading-tight`}>
                {settings.city} - {settings.state}
              </p>
            </div>
          )}
        </div>

        {/* Close Button for Mobile */}
        <button
          onClick={onCloseMobile}
          className={`lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800`}
          title="Fechar menu lateral"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Active Legislature Indicator Card */}
      {(!isCollapsed || isMobileOpen) && (
        <div className={`px-3 pt-3 pb-1`}>
          <div className={`p-2.5 rounded-xl border ${styles.border} ${styles.cardBg} shadow-xs`}>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-500" />
                Legislatura Ativa
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {activeLegislature ? activeLegislature.name : settings.legislature}
            </p>
            <p className={`text-[11px] ${styles.textMuted} font-mono mt-0.5`}>
              {activeLegislature ? activeLegislature.period : settings.legislature}
            </p>
          </div>
        </div>
      )}

      {/* 3. Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              title={isCollapsed && !isMobileOpen ? item.label : undefined}
              className={`
                w-full flex items-center rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer text-left
                ${isCollapsed && !isMobileOpen ? 'justify-center p-3' : 'px-3.5 py-2.5 gap-3'}
                ${
                  isActive
                    ? `${styles.sidebarActiveBg} border-l-4 border-blue-600 dark:border-indigo-400 shadow-sm`
                    : `${styles.textSecondary} ${styles.tableHoverBg} hover:text-slate-950 dark:hover:text-white`
                }
              `}
            >
              <div className={isActive ? 'text-blue-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}>
                {item.icon}
              </div>

              {(!isCollapsed || isMobileOpen) && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-2 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors shrink-0 ${
                        isActive
                          ? 'bg-blue-600 text-white dark:bg-indigo-500'
                          : styles.badgeNeutral
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* 4. Footer Area: Firebase Status + Collapse/Expand Toggle */}
      <div className={`p-3 border-t ${styles.border} space-y-2`}>
        {/* Firebase Cloud status */}
        <div
          className={`flex items-center rounded-lg p-2 text-xs border ${
            firebaseConnected
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
          } ${isCollapsed && !isMobileOpen ? 'justify-center' : 'gap-2'}`}
          title={firebaseConnected ? 'Banco Firestore sincronizado em nuvem' : 'Sincronizando com Firestore'}
        >
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              firebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          {(!isCollapsed || isMobileOpen) && (
            <span className="truncate font-semibold text-[11px]">
              {firebaseConnected ? 'Firebase Conectado' : 'Conectando ao Firestore'}
            </span>
          )}
        </div>

        {/* Desktop Collapse / Expand Button */}
        <button
          onClick={onToggleCollapse}
          className={`
            hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-xs font-semibold
            ${styles.textMuted} hover:text-slate-900 dark:hover:text-white ${styles.tableHoverBg}
            transition-colors cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-700
          `}
          title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        >
          {isCollapsed ? (
            <ChevronsRight className="w-4 h-4 text-slate-500" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronsLeft className="w-4 h-4 text-slate-500" />
              <span>Recolher Menu</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
