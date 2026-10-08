/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LegislativeProvider, useLegislative } from './context/LegislativeContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TabKey } from './types';
import { DashboardTab } from './components/DashboardTab';
import { MeetingsTab } from './components/MeetingsTab';
import { CommitteesTab } from './components/CommitteesTab';
import { CouncilorsTab } from './components/CouncilorsTab';
import { ReportsTab } from './components/ReportsTab';
import { MinutesTab } from './components/MinutesTab';
import { SettingsTab } from './components/SettingsTab';
import { Landmark, Shield, Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { styles } = useTheme();
  const { meetings, committees, councilors, isLoading, settings } = useLegislative();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);

  // Sidebar State (saved to localStorage for user convenience)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('camara_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('camara_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleOpenNewMeeting = () => {
    setActiveTab('reunioes');
    setIsNewMeetingModalOpen(true);
  };

  return (
    <div className={`min-h-screen ${styles.appBg} ${styles.textPrimary} flex flex-row overflow-x-hidden transition-colors duration-200 font-sans`}>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Menu Lateral Executivo (Sidebar) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsMobileSidebarOpen(false);
          setIsNewMeetingModalOpen(false);
        }}
        meetingsCount={meetings.length}
        committeesCount={committees.length}
        councilorsCount={councilors.length}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Área Direita: Top Bar + Conteúdo Fluido Amplo + Rodapé */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Header Superior Executivo */}
        <Header
          activeTab={activeTab}
          onNavigate={setActiveTab}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleCollapseSidebar={toggleSidebarCollapse}
        />

        {/* Área Principal de Conteúdo - Fluida e Ampla (Sem faixas laterais vazias) */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 max-w-[1920px] mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-28 space-y-4">
              <Loader2 className="w-10 h-10 text-blue-600 dark:text-indigo-400 animate-spin" />
              <p className={`text-sm ${styles.textMuted} font-medium`}>
                Carregando dados da Câmara Municipal no Firebase...
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardTab
                  onNavigate={setActiveTab}
                  onOpenNewMeeting={handleOpenNewMeeting}
                />
              )}

              {activeTab === 'reunioes' && (
                <MeetingsTab
                  isCreateModalOpen={isNewMeetingModalOpen}
                  onCloseCreateModal={() => setIsNewMeetingModalOpen(false)}
                />
              )}

              {activeTab === 'comissoes' && <CommitteesTab />}

              {activeTab === 'vereadores' && <CouncilorsTab />}

              {activeTab === 'relatorios' && <ReportsTab />}

              {activeTab === 'atas' && <MinutesTab />}

              {activeTab === 'configuracoes' && <SettingsTab />}
            </>
          )}
        </main>

        {/* Rodapé Oficial da Câmara */}
        <footer className={`${styles.navBg} border-t ${styles.border} py-5 print:hidden mt-auto transition-colors duration-200`}>
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <Landmark className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-semibold text-inherit">{settings.chamberName}</span>
              <span>•</span>
              <span>{settings.legislature}</span>
            </div>

            <div className="flex items-center space-x-4 text-slate-500 dark:text-slate-400 text-center sm:text-left">
              <span>{settings.address}</span>
              <span>•</span>
              <span>Tel: {settings.phone}</span>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Sistema Legislativo em Nuvem • Firebase Firestore</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LegislativeProvider>
        <MainLayout />
      </LegislativeProvider>
    </ThemeProvider>
  );
}
