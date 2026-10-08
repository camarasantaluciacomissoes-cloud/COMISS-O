import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeId, ThemeOption } from '../types';

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'institucional_light',
    name: 'Claro Institucional',
    category: 'Claro',
    description: 'Azul Marinho Real, Branco Puro e alto contraste para leitura perfeita.',
    primaryColor: '#1d4ed8',
    accentColor: '#d97706',
    bgColor: '#f1f5f9',
    cardColor: '#ffffff',
  },
  {
    id: 'civico_light',
    name: 'Claro Verde Cívico',
    category: 'Claro',
    description: 'Verde Esmeralda Republicano com fundo claro nítido e textos escuros.',
    primaryColor: '#047857',
    accentColor: '#ca8a04',
    bgColor: '#f8fafc',
    cardColor: '#ffffff',
  },
  {
    id: 'midnight_dark',
    name: 'Escuro Noturno (Midnight)',
    category: 'Escuro',
    description: 'Azul meia-noite profundo com cartões destacados e textos em branco puro.',
    primaryColor: '#6366f1',
    accentColor: '#38bdf8',
    bgColor: '#020617',
    cardColor: '#0f172a',
  },
  {
    id: 'carvao_dark',
    name: 'Escuro Carvão (Charcoal)',
    category: 'Escuro',
    description: 'Preto nobre com cartões grafite definidos e detalhes em âmbar dourado.',
    primaryColor: '#f59e0b',
    accentColor: '#fbbf24',
    bgColor: '#000000',
    cardColor: '#18181b',
  },
];

export interface ThemeStyles {
  isDark: boolean;
  appBg: string;
  cardBg: string;
  headerBg: string;
  navBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  label: string;
  border: string;
  borderStrong: string;
  btnPrimary: string;
  btnSecondary: string;
  btnDanger: string;
  btnSuccess: string;
  inputBg: string;
  badgeNeutral: string;
  highlightBg: string;
  tableHeadBg: string;
  tableHoverBg: string;
  sidebarActiveBg: string;
}

const THEME_CLASSES: Record<ThemeId, ThemeStyles> = {
  institucional_light: {
    isDark: false,
    appBg: 'bg-slate-100',
    cardBg: 'bg-white',
    headerBg: 'bg-blue-950',
    navBg: 'bg-white',
    textPrimary: 'text-slate-950',
    textSecondary: 'text-slate-800',
    textMuted: 'text-slate-600',
    label: 'text-slate-800 font-bold',
    border: 'border-slate-300',
    borderStrong: 'border-slate-400',
    btnPrimary: 'bg-blue-700 hover:bg-blue-800 text-white shadow-sm font-semibold',
    btnSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-semibold',
    btnDanger: 'bg-rose-600 hover:bg-rose-700 text-white font-semibold',
    btnSuccess: 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold',
    inputBg: 'bg-white border-slate-300 text-slate-950 placeholder-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100',
    badgeNeutral: 'bg-slate-200 text-slate-800 border-slate-300',
    highlightBg: 'bg-blue-50 border-blue-300 text-blue-950',
    tableHeadBg: 'bg-slate-200 text-slate-900 font-bold',
    tableHoverBg: 'hover:bg-slate-50',
    sidebarActiveBg: 'bg-blue-50 text-blue-800 border-blue-600 font-bold shadow-xs',
  },
  civico_light: {
    isDark: false,
    appBg: 'bg-slate-100',
    cardBg: 'bg-white',
    headerBg: 'bg-emerald-900',
    navBg: 'bg-white',
    textPrimary: 'text-slate-950',
    textSecondary: 'text-slate-800',
    textMuted: 'text-slate-600',
    label: 'text-slate-800 font-bold',
    border: 'border-slate-300',
    borderStrong: 'border-emerald-600',
    btnPrimary: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm font-semibold',
    btnSecondary: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 font-semibold',
    btnDanger: 'bg-rose-600 hover:bg-rose-700 text-white font-semibold',
    btnSuccess: 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold',
    inputBg: 'bg-white border-slate-300 text-slate-950 placeholder-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100',
    badgeNeutral: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    highlightBg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
    tableHeadBg: 'bg-emerald-100 text-emerald-950 font-bold',
    tableHoverBg: 'hover:bg-emerald-50/60',
    sidebarActiveBg: 'bg-emerald-50 text-emerald-800 border-emerald-600 font-bold shadow-xs',
  },
  midnight_dark: {
    isDark: true,
    appBg: 'bg-slate-950',
    cardBg: 'bg-slate-900',
    headerBg: 'bg-slate-900',
    navBg: 'bg-slate-900',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-100',
    textMuted: 'text-slate-300',
    label: 'text-slate-200 font-bold',
    border: 'border-slate-700',
    borderStrong: 'border-slate-500',
    btnPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md font-semibold',
    btnSecondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-semibold',
    btnDanger: 'bg-rose-600 hover:bg-rose-500 text-white font-semibold',
    btnSuccess: 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold',
    inputBg: 'bg-slate-950 border-slate-600 text-white placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-900/50',
    badgeNeutral: 'bg-slate-800 text-slate-100 border-slate-600',
    highlightBg: 'bg-indigo-950 border-indigo-700 text-indigo-100',
    tableHeadBg: 'bg-slate-800 text-white font-bold',
    tableHoverBg: 'hover:bg-slate-800/80',
    sidebarActiveBg: 'bg-indigo-950 text-indigo-200 border-indigo-400 font-bold shadow-sm',
  },
  carvao_dark: {
    isDark: true,
    appBg: 'bg-black',
    cardBg: 'bg-zinc-900',
    headerBg: 'bg-zinc-950',
    navBg: 'bg-zinc-900',
    textPrimary: 'text-white',
    textSecondary: 'text-zinc-100',
    textMuted: 'text-zinc-300',
    label: 'text-zinc-200 font-bold',
    border: 'border-zinc-700',
    borderStrong: 'border-zinc-500',
    btnPrimary: 'bg-amber-600 hover:bg-amber-500 text-white shadow-md font-semibold',
    btnSecondary: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 font-semibold',
    btnDanger: 'bg-rose-600 hover:bg-rose-500 text-white font-semibold',
    btnSuccess: 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold',
    inputBg: 'bg-black border-zinc-600 text-white placeholder-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-900/50',
    badgeNeutral: 'bg-zinc-800 text-zinc-100 border-zinc-600',
    highlightBg: 'bg-amber-950 border-amber-700 text-amber-100',
    tableHeadBg: 'bg-zinc-800 text-white font-bold',
    tableHoverBg: 'hover:bg-zinc-800/80',
    sidebarActiveBg: 'bg-amber-950 text-amber-200 border-amber-400 font-bold shadow-sm',
  },
};

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  styles: ThemeStyles;
  themeOptions: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialTheme?: ThemeId }> = ({
  children,
  initialTheme = 'institucional_light',
}) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('camara_theme_preference');
    return (saved as ThemeId) || initialTheme;
  });

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem('camara_theme_preference', newTheme);
  };

  useEffect(() => {
    const isDark = theme === 'midnight_dark' || theme === 'carvao_dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const styles = THEME_CLASSES[theme] || THEME_CLASSES.institucional_light;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, styles, themeOptions: THEME_OPTIONS }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
