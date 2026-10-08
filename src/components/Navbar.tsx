import React from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  CalendarDays,
  Users2,
  UserCheck,
  FileSpreadsheet,
  ScrollText,
  Settings,
} from 'lucide-react';

export type TabKey =
  | 'dashboard'
  | 'reunioes'
  | 'comissoes'
  | 'vereadores'
  | 'relatorios'
  | 'atas'
  | 'configuracoes';

interface NavbarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  meetingsCount: number;
  committeesCount: number;
  councilorsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  meetingsCount,
  committeesCount,
  councilorsCount,
}) => {
  const { styles } = useTheme();

  const navItems: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      key: 'reunioes',
      label: 'Reuniões & Frequência',
      icon: <CalendarDays className="w-4 h-4" />,
      badge: meetingsCount,
    },
    {
      key: 'comissoes',
      label: 'Comissões',
      icon: <Users2 className="w-4 h-4" />,
      badge: committeesCount,
    },
    {
      key: 'vereadores',
      label: 'Vereadores',
      icon: <UserCheck className="w-4 h-4" />,
      badge: councilorsCount,
    },
    {
      key: 'relatorios',
      label: 'Relatórios Analíticos',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      key: 'atas',
      label: 'Atas & Documentos',
      icon: <ScrollText className="w-4 h-4" />,
    },
    {
      key: 'configuracoes',
      label: 'Configurações',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <nav className={`${styles.navBg} border-b ${styles.border} sticky top-0 z-30 shadow-xs print:hidden transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? styles.sidebarActiveBg
                    : `${styles.textSecondary} ${styles.tableHoverBg} hover:text-slate-900 dark:hover:text-white`
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 text-[11px] px-2 py-0.2 rounded-full font-semibold transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white dark:bg-indigo-500'
                        : styles.badgeNeutral
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
