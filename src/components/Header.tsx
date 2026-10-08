import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLegislative } from '../context/LegislativeContext';
import { TabKey } from '../types';
import {
  Landmark,
  Palette,
  Check,
  Calendar,
  CalendarDays,
  ChevronDown,
  Settings,
  Menu,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Users2,
  UserCheck,
  FileSpreadsheet,
  ScrollText,
} from 'lucide-react';

interface HeaderProps {
  activeTab?: TabKey;
  onNavigate?: (tab: any) => void;
  onToggleMobileSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapseSidebar?: () => void;
}

const TAB_INFO: Record<TabKey, { title: string; subtitle: string; icon: React.ReactNode }> = {
  dashboard: {
    title: 'Dashboard Geral',
    subtitle: 'Métricas, frequência e sessões recentes',
    icon: <LayoutDashboard className="w-4 h-4 text-amber-300" />,
  },
  reunioes: {
    title: 'Reuniões & Presença',
    subtitle: 'Registro de pautas, quórum e assinaturas',
    icon: <CalendarDays className="w-4 h-4 text-amber-300" />,
  },
  comissoes: {
    title: 'Comissões Permanentes',
    subtitle: 'Composição de membros e atribuições',
    icon: <Users2 className="w-4 h-4 text-amber-300" />,
  },
  vereadores: {
    title: 'Vereadores & Mandatos',
    subtitle: 'Galeria oficial e dados parlamentares',
    icon: <UserCheck className="w-4 h-4 text-amber-300" />,
  },
  relatorios: {
    title: 'Relatórios Analíticos',
    subtitle: 'Exportação em Word, Planilha e Impressão',
    icon: <FileSpreadsheet className="w-4 h-4 text-amber-300" />,
  },
  atas: {
    title: 'Atas & Documentos',
    subtitle: 'Livro oficial de atas e arquivos digitais',
    icon: <ScrollText className="w-4 h-4 text-amber-300" />,
  },
  configuracoes: {
    title: 'Configurações do Sistema',
    subtitle: 'Dados institucionais e gerenciamento de legislaturas',
    icon: <Settings className="w-4 h-4 text-amber-300" />,
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'dashboard',
  onNavigate,
  onToggleMobileSidebar,
  isSidebarCollapsed,
  onToggleCollapseSidebar,
}) => {
  const { theme, setTheme, styles, themeOptions } = useTheme();
  const { settings, firebaseConnected, legislatures, activeLegislature, setActiveLegislature } =
    useLegislative();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLegMenu, setShowLegMenu] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectLegislature = async (id: string) => {
    try {
      await setActiveLegislature(id);
      setShowLegMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  const currentTabInfo = TAB_INFO[activeTab] || TAB_INFO.dashboard;

  return (
    <header className={`${styles.headerBg} border-b ${styles.border} text-white shadow-md print:hidden sticky top-0 z-30 transition-colors duration-200`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left: Mobile Menu Toggle / Sidebar Expand Button & Active View Info */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            {/* Mobile Hamburger Button */}
            {onToggleMobileSidebar && (
              <button
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer shadow-xs"
                title="Abrir menu de navegação"
              >
                <Menu className="w-5 h-5 text-amber-300" />
              </button>
            )}

            {/* Desktop Quick Sidebar Collapse Toggle */}
            {onToggleCollapseSidebar && (
              <button
                onClick={onToggleCollapseSidebar}
                className="hidden lg:flex p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer shadow-xs transition-colors"
                title={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              >
                {isSidebarCollapsed ? (
                  <ChevronsRight className="w-5 h-5 text-amber-300" />
                ) : (
                  <ChevronsLeft className="w-5 h-5 text-amber-300" />
                )}
              </button>
            )}

            {/* Breadcrumb / Current Tab Context */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-300 font-semibold font-mono tracking-wide">
                  {currentTabInfo.icon}
                  <span className="uppercase">{currentTabInfo.title}</span>
                </div>
                <span className="hidden sm:inline text-white/40">•</span>
                <span className="text-xs text-white/80 font-medium truncate hidden md:inline">
                  {currentTabInfo.subtitle}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight font-serif truncate">
                {settings.chamberName}
              </h1>
            </div>
          </div>

          {/* Right: Legislature Switcher, Date, Firebase Status & Theme Selector */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Interactive Legislature Switcher Badge */}
            <div className="relative">
              <button
                onClick={() => setShowLegMenu(!showLegMenu)}
                className="flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white font-medium transition-all cursor-pointer shadow-xs"
                title="Alternar Mandato / Legislatura Ativa"
              >
                <CalendarDays className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline font-semibold">Legislatura:</span>
                <span className="font-bold text-amber-300">{settings.legislature}</span>
                <ChevronDown className="w-3 h-3 text-white/70" />
              </button>

              {showLegMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLegMenu(false)}
                  />
                  <div
                    className={`absolute right-0 mt-2 w-72 rounded-xl shadow-2xl border ${styles.cardBg} ${styles.border} ${styles.textPrimary} p-2 z-50`}
                  >
                    <div className="px-3 py-2 border-b border-inherit mb-1">
                      <p className="text-xs font-semibold text-inherit">Mandatos & Legislaturas</p>
                      <p className={`text-[11px] ${styles.textMuted}`}>
                        Selecione a legislatura ativa para trabalhar
                      </p>
                    </div>

                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {legislatures.map((leg) => {
                        const isCurrentActive =
                          leg.isActive || leg.id === settings.activeLegislatureId;
                        return (
                          <button
                            key={leg.id}
                            onClick={() => handleSelectLegislature(leg.id)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                              isCurrentActive
                                ? styles.sidebarActiveBg
                                : `${styles.tableHoverBg} ${styles.textPrimary}`
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{leg.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono font-semibold">
                                  {leg.period}
                                </span>
                              </div>
                              <p className={`text-[10px] ${styles.textMuted} mt-0.5`}>
                                {leg.councilorIds?.length || 8} vereadores vinculados
                              </p>
                            </div>
                            {isCurrentActive && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {onNavigate && (
                      <div className="mt-2 pt-2 border-t border-inherit">
                        <button
                          onClick={() => {
                            setShowLegMenu(false);
                            onNavigate('configuracoes');
                          }}
                          className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors`}
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Cadastrar / Gerenciar Legislaturas</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Realtime Date */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span className="capitalize">{currentDateTime}</span>
            </div>

            {/* Firebase Status Badge */}
            <div
              className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                firebaseConnected
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
              }`}
              title={firebaseConnected ? 'Banco Firestore sincronizado em nuvem' : 'Sincronizando com Firestore'}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  firebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden lg:inline">
                {firebaseConnected ? 'Firebase Ativo' : 'Conectando'}
              </span>
            </div>

            {/* 4 Themes Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition-all shadow-xs cursor-pointer"
                title="Mudar Tema do Sistema (2 Claros, 2 Escuros)"
              >
                <Palette className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">Tema:</span>
                <span className="font-semibold max-w-[90px] truncate">
                  {themeOptions.find((t) => t.id === theme)?.name.split(' ')[0]}
                </span>
              </button>

              {showThemeMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowThemeMenu(false)}
                  />
                  <div
                    className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl border ${styles.cardBg} ${styles.border} ${styles.textPrimary} p-2 z-50`}
                  >
                    <div className="px-3 py-2 border-b border-inherit mb-1">
                      <p className="text-xs font-semibold text-inherit">Aparência do Sistema</p>
                      <p className={`text-[11px] ${styles.textMuted}`}>
                        4 temas de alto contraste
                      </p>
                    </div>

                    <div className="space-y-1">
                      {themeOptions.map((opt) => {
                        const isSelected = theme === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setTheme(opt.id);
                              setShowThemeMenu(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                              isSelected
                                ? styles.sidebarActiveBg
                                : `${styles.tableHoverBg} ${styles.textPrimary}`
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-xs"
                                style={{ backgroundColor: opt.primaryColor }}
                              />
                              <div>
                                <p className="font-medium">{opt.name}</p>
                                <p className={`text-[10px] ${styles.textMuted}`}>
                                  {opt.category}
                                </p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
