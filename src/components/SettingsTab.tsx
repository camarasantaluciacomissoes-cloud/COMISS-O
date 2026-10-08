import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLegislative } from '../context/LegislativeContext';
import { ThemeId, Legislature, Councilor } from '../types';
import {
  Settings,
  Palette,
  Landmark,
  Database,
  Download,
  Upload,
  RefreshCw,
  Check,
  ShieldCheck,
  Save,
  CheckCircle2,
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  Users2,
  ArrowRight,
  Sparkles,
  X,
  UserPlus,
  Image as ImageIcon,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export const SettingsTab: React.FC = () => {
  const { theme, setTheme, styles, themeOptions } = useTheme();
  const {
    settings,
    updateSettings,
    seedInitialData,
    exportBackup,
    importBackup,
    firebaseConnected,
    legislatures,
    activeLegislature,
    addLegislature,
    updateLegislature,
    setActiveLegislature,
    deleteLegislature,
    councilors,
    meetings,
  } = useLegislative();

  // Settings form
  const [formData, setFormData] = useState({
    chamberName: settings.chamberName,
    city: settings.city,
    state: settings.state,
    legislature: settings.legislature,
    address: settings.address,
    phone: settings.phone,
    cnpj: settings.cnpj,
    presidentName: settings.presidentName,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');

  // Legislature Modals State
  const [isNewLegModalOpen, setIsNewLegModalOpen] = useState(false);
  const [isEditLegModalOpen, setIsEditLegModalOpen] = useState(false);
  const [editingLeg, setEditingLeg] = useState<Legislature | null>(null);

  // New Legislature Form Wizard
  const [newLegForm, setNewLegForm] = useState({
    name: '19ª Legislatura',
    period: '2029 - 2032',
    startDate: '2029-01-01',
    endDate: '2032-12-31',
    isActive: true,
    autoCreateCommittees: true,
    notes: '',
  });

  // Selected existing councilors (re-elected)
  const [selectedCouncilorIds, setSelectedCouncilorIds] = useState<string[]>([]);

  // Brand new councilors created in wizard
  const [brandNewCouncilors, setBrandNewCouncilors] = useState<
    Omit<Councilor, 'id' | 'createdAt' | 'updatedAt'>[]
  >([]);

  // Temp form for adding 1 new councilor
  const [tempCouncilor, setTempCouncilor] = useState({
    name: '',
    nickname: '',
    politicalParty: 'PSD',
    role: 'Vereador',
    email: '',
    phone: '',
    photoUrl: '',
    isActive: true,
    legislature: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenNewLegislature = () => {
    // Guess next period
    const currentYear = new Date().getFullYear();
    const nextStart = currentYear >= 2028 ? 2029 : 2029;
    const nextEnd = nextStart + 3;

    setNewLegForm({
      name: `${legislatures.length + 18}ª Legislatura`,
      period: `${nextStart} - ${nextEnd}`,
      startDate: `${nextStart}-01-01`,
      endDate: `${nextEnd}-12-31`,
      isActive: true,
      autoCreateCommittees: true,
      notes: '',
    });
    // By default, preselect existing councilors for easy toggle
    setSelectedCouncilorIds([]);
    setBrandNewCouncilors([]);
    setIsNewLegModalOpen(true);
  };

  const handleOpenEditLegislature = (leg: Legislature) => {
    setEditingLeg(leg);
    setNewLegForm({
      name: leg.name,
      period: leg.period,
      startDate: leg.startDate,
      endDate: leg.endDate,
      isActive: leg.isActive,
      autoCreateCommittees: false,
      notes: leg.notes || '',
    });
    setIsEditLegModalOpen(true);
  };

  const toggleSelectCouncilor = (id: string) => {
    setSelectedCouncilorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddTempCouncilor = () => {
    if (!tempCouncilor.name.trim() || !tempCouncilor.politicalParty.trim()) {
      alert('Preencha o nome e o partido do novo vereador.');
      return;
    }
    setBrandNewCouncilors((prev) => [
      ...prev,
      {
        ...tempCouncilor,
        legislature: newLegForm.period,
      },
    ]);
    setTempCouncilor({
      name: '',
      nickname: '',
      politicalParty: 'PSD',
      role: 'Vereador',
      email: '',
      phone: '',
      photoUrl: '',
      isActive: true,
      legislature: '',
    });
  };

  const handleRemoveBrandNewCouncilor = (index: number) => {
    setBrandNewCouncilors((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotoUploadForNewCouncilor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 240;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setTempCouncilor((prev) => ({ ...prev, photoUrl: dataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitNewLegislature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLegForm.name.trim() || !newLegForm.period.trim()) {
      alert('Preencha o nome e o período da legislatura.');
      return;
    }

    try {
      await addLegislature(
        {
          name: newLegForm.name,
          period: newLegForm.period,
          startDate: newLegForm.startDate,
          endDate: newLegForm.endDate,
          isActive: newLegForm.isActive,
          councilorIds: [],
          notes: newLegForm.notes,
        },
        selectedCouncilorIds,
        brandNewCouncilors,
        newLegForm.autoCreateCommittees
      );
      setIsNewLegModalOpen(false);
      alert(`Legislatura ${newLegForm.name} (${newLegForm.period}) cadastrada com sucesso!`);
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar legislatura no Firebase.');
    }
  };

  const handleSubmitEditLegislature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeg) return;
    try {
      await updateLegislature(editingLeg.id, {
        name: newLegForm.name,
        period: newLegForm.period,
        startDate: newLegForm.startDate,
        endDate: newLegForm.endDate,
        notes: newLegForm.notes,
      });
      setIsEditLegModalOpen(false);
      setEditingLeg(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar legislatura.');
    }
  };

  const handleSetActive = async (leg: Legislature) => {
    if (confirm(`Deseja definir a "${leg.name} (${leg.period})" como a legislatura ativa no sistema?`)) {
      try {
        await setActiveLegislature(leg.id);
      } catch (err) {
        console.error(err);
        alert('Erro ao alterar legislatura ativa.');
      }
    }
  };

  const handleDeleteLeg = async (leg: Legislature) => {
    if (leg.isActive) {
      alert('Você não pode excluir a legislatura que está atualmente ativa.');
      return;
    }
    if (confirm(`Deseja realmente excluir a "${leg.name} (${leg.period})"?`)) {
      try {
        await deleteLegislature(leg.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Chamber settings form
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        ...formData,
        activeTheme: theme,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar configurações.');
    }
  };

  const handleApplyTheme = async (themeId: ThemeId) => {
    setTheme(themeId);
    try {
      await updateSettings({ activeTheme: themeId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedDefaults = async () => {
    if (
      confirm(
        'Deseja carregar os dados padrão da Câmara Municipal de Santa Lúcia - PR (8 vereadores, legislatura e 4 comissões regimentais com 3 membros cada)?'
      )
    ) {
      setIsResetting(true);
      try {
        await seedInitialData();
        alert('Dados padrão da Câmara de Santa Lúcia carregados com sucesso!');
      } catch (err) {
        console.error(err);
        alert('Erro ao carregar dados padrão.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_legislativo_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await importBackup(text);
        setImportStatus('Backup restaurado com sucesso!');
        setTimeout(() => setImportStatus(''), 4000);
      } catch (err) {
        console.error(err);
        setImportStatus('Erro: arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-inherit">
          Configurações do Sistema & Gestão de Mandatos
        </h2>
        <p className={`text-xs sm:text-sm ${styles.textMuted}`}>
          Gerenciamento de legislaturas, 4 temas visuais de alto contraste e dados da Câmara
        </p>
      </div>

      {/* LEGISLATURES MANAGEMENT PANEL */}
      <div className={`p-6 rounded-2xl border ${styles.cardBg} ${styles.border} shadow-xs space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-inherit">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-inherit">
                Gerenciador de Legislaturas (Mandatos da Câmara)
              </h3>
              <p className={`text-xs ${styles.textMuted}`}>
                Alterne entre legislaturas ou cadastre um novo mandato aproveitando vereadores reeleitos
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenNewLegislature}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm ${styles.btnPrimary} self-start sm:self-auto`}
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Legislatura</span>
          </button>
        </div>

        {/* Legislatures Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {legislatures.map((leg) => {
            const isCurrentActive = leg.isActive;
            const legMeetings = meetings.filter((m) =>
              leg.startDate && leg.endDate ? m.date >= leg.startDate && m.date <= leg.endDate : true
            );

            return (
              <div
                key={leg.id}
                className={`p-5 rounded-xl border-2 transition-all flex flex-col justify-between space-y-4 ${
                  isCurrentActive
                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                    : `border-slate-300 dark:border-slate-700 ${styles.cardBg}`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                      {leg.period}
                    </span>

                    {isCurrentActive ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                        <Check className="w-3.5 h-3.5" /> Ativa no Sistema
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">Histórico</span>
                    )}
                  </div>

                  <h4 className="font-bold text-base text-inherit font-serif">{leg.name}</h4>
                  <p className={`text-xs ${styles.textMuted} mt-1`}>
                    Período: {leg.startDate} até {leg.endDate}
                  </p>

                  <div className="mt-3 pt-3 border-t border-inherit text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p className="flex items-center justify-between">
                      <span>Vereadores Vinculados:</span>
                      <span className="font-bold text-inherit">{leg.councilorIds?.length || 8}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Reuniões Registradas:</span>
                      <span className="font-bold text-inherit">{legMeetings.length}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-inherit flex items-center justify-between gap-2">
                  {!isCurrentActive ? (
                    <button
                      onClick={() => handleSetActive(leg)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center border ${styles.border} ${styles.tableHoverBg} text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors`}
                    >
                      Definir como Ativa
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ Operando no Momento
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditLegislature(leg)}
                      className={`p-1.5 rounded-lg text-xs ${styles.tableHoverBg} text-slate-600 dark:text-slate-300`}
                      title="Editar Legislatura"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!isCurrentActive && (
                      <button
                        onClick={() => handleDeleteLeg(leg)}
                        className="p-1.5 rounded-lg text-xs hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40"
                        title="Excluir Legislatura"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 THEMES SELECTION PANEL */}
      <div className={`p-6 rounded-2xl border ${styles.cardBg} ${styles.border} shadow-xs space-y-5`}>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="font-bold text-base text-inherit">Aparência do Sistema (4 Opções de Tema)</h3>
            <p className={`text-xs ${styles.textMuted}`}>
              2 Temas Claros e 2 Temas Escuros com contraste rigoroso de alta legibilidade
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => handleApplyTheme(opt.id)}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 dark:border-indigo-500 shadow-md scale-[1.02] ring-2 ring-blue-500/20'
                    : `border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600`
                } bg-white dark:bg-slate-900`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        opt.category === 'Claro'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-indigo-950 text-indigo-200 border border-indigo-800'
                      }`}
                    >
                      {opt.category}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-indigo-400">
                        <Check className="w-3.5 h-3.5" /> Ativo
                      </span>
                    )}
                  </div>

                  <div
                    className="h-16 rounded-lg mb-3 border border-black/10 flex items-center justify-center p-2 gap-2 shadow-inner"
                    style={{ backgroundColor: opt.bgColor }}
                  >
                    <div
                      className="w-8 h-8 rounded-md shadow-xs border border-white/20 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: opt.primaryColor }}
                    >
                      ⚖️
                    </div>
                    <div className="space-y-1 flex-1">
                      <div
                        className="h-2 rounded w-3/4 opacity-90"
                        style={{ backgroundColor: opt.accentColor }}
                      />
                      <div
                        className="h-1.5 rounded w-1/2 opacity-70"
                        style={{ backgroundColor: opt.accentColor }}
                      />
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-950 dark:text-white">
                    {opt.name}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Clique para aplicar</span>
                  <div
                    className="w-4 h-4 rounded-full border border-black/20"
                    style={{ backgroundColor: opt.primaryColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHAMBER INSTITUTIONAL DATA FORM */}
      <div className={`p-6 rounded-2xl border ${styles.cardBg} ${styles.border} shadow-xs space-y-5`}>
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-blue-600 dark:text-indigo-400" />
          <div>
            <h3 className="font-bold text-base text-inherit">Dados Institucionais da Câmara</h3>
            <p className={`text-xs ${styles.textMuted}`}>
              Informações timbradas exibidas em atas, termos de justificativa e relatórios
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                Nome da Câmara Municipal *
              </label>
              <input
                type="text"
                value={formData.chamberName}
                onChange={(e) => setFormData({ ...formData, chamberName: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                Legislatura Atual *
              </label>
              <input
                type="text"
                value={formData.legislature}
                onChange={(e) => setFormData({ ...formData, legislature: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                Município *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                Estado (UF) *
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                CNPJ
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                Presidente da Mesa Diretora
              </label>
              <input
                type="text"
                value={formData.presidentName}
                onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                Telefone Oficial
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
              Endereço do Palácio Legislativo
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Configurações salvas no Firebase!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm ${styles.btnPrimary}`}
              >
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* FIREBASE PERSISTENCE & DATA MANAGEMENT */}
      <div className={`p-6 rounded-2xl border ${styles.cardBg} ${styles.border} shadow-xs space-y-5`}>
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="font-bold text-base text-inherit">Persistência em Nuvem Firebase</h3>
            <p className={`text-xs ${styles.textMuted}`}>
              Os dados salvos permanecem seguros e sincronizados no link publicado
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Status da Conexão:</span>
            <span
              className={`font-bold flex items-center gap-1.5 ${
                firebaseConnected
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-500'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  firebaseConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {firebaseConnected ? 'Conectado em Tempo Real' : 'Aguardando Sincronia'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Projeto Firebase:</span>
            <span className="font-mono text-slate-900 dark:text-slate-100">
              {firebaseConfig.projectId}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Banco de Dados Firestore:</span>
            <span className="font-mono text-slate-900 dark:text-slate-100">
              {firebaseConfig.firestoreDatabaseId}
            </span>
          </div>
        </div>

        {/* Action Buttons: Seed, Export, Import */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={handleSeedDefaults}
            disabled={isResetting}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border ${styles.border} ${styles.tableHoverBg}`}
            title="Recarrega os vereadores e comissões da Câmara de Santa Lúcia"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Recarregar Dados Iniciais</span>
          </button>

          <button
            onClick={handleExportBackup}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border ${styles.border} ${styles.tableHoverBg}`}
            title="Exportar cópia dos dados em arquivo JSON"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Backup em JSON</span>
          </button>

          <label
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border ${styles.border} ${styles.tableHoverBg} cursor-pointer`}
            title="Restaurar backup a partir de arquivo JSON"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Restaurar JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <p
            className={`text-xs font-semibold ${
              importStatus.includes('sucesso')
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600'
            }`}
          >
            {importStatus}
          </p>
        )}
      </div>

      {/* MODAL: CADASTRAR NOVA LEGISLATURA COM APROVEITAMENTO DE VEREADORES */}
      {isNewLegModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`relative w-full max-w-3xl rounded-2xl shadow-2xl border ${styles.cardBg} ${styles.border} ${styles.textPrimary} max-h-[92vh] flex flex-col`}
          >
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${styles.border} flex items-center justify-between`}>
              <div>
                <h3 className="font-bold text-lg text-inherit font-serif">
                  Cadastrar Nova Legislatura & Composição
                </h3>
                <p className={`text-xs ${styles.textMuted}`}>
                  Defina o novo mandato, selecione os vereadores reeleitos e inclua os novos parlamentares
                </p>
              </div>
              <button
                onClick={() => setIsNewLegModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-black/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitNewLegislature} className="p-6 overflow-y-auto space-y-6">
              {/* ETAPA 1: DADOS DA LEGISLATURA */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  <span>1. Dados do Novo Período de Mandato</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Identificação da Legislatura *
                    </label>
                    <input
                      type="text"
                      value={newLegForm.name}
                      onChange={(e) => setNewLegForm({ ...newLegForm, name: e.target.value })}
                      placeholder="Ex: 19ª Legislatura"
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Período (Anos) *
                    </label>
                    <input
                      type="text"
                      value={newLegForm.period}
                      onChange={(e) => setNewLegForm({ ...newLegForm, period: e.target.value })}
                      placeholder="Ex: 2029 - 2032"
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Data de Início do Mandato *
                    </label>
                    <input
                      type="date"
                      value={newLegForm.startDate}
                      onChange={(e) => setNewLegForm({ ...newLegForm, startDate: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Data de Término do Mandato *
                    </label>
                    <input
                      type="date"
                      value={newLegForm.endDate}
                      onChange={(e) => setNewLegForm({ ...newLegForm, endDate: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newLegForm.isActive}
                      onChange={(e) => setNewLegForm({ ...newLegForm, isActive: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Definir imediatamente como a Legislatura Ativa no Sistema</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newLegForm.autoCreateCommittees}
                      onChange={(e) =>
                        setNewLegForm({ ...newLegForm, autoCreateCommittees: e.target.checked })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Criar automaticamente as 4 Comissões Regimentais para este mandato</span>
                  </label>
                </div>
              </div>

              {/* ETAPA 2: APROVEITAMENTO DE VEREADORES REELEITOS */}
              <div className="space-y-3 pt-4 border-t border-inherit">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Users2 className="w-4 h-4" />
                      <span>2. Aproveitamento de Vereadores Reeleitos</span>
                    </h4>
                    <p className={`text-[11px] ${styles.textMuted}`}>
                      Marque quem continua com mandato para reaproveitar fotos, nomes e partidos sem redigitar:
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedCouncilorIds(councilors.map((c) => c.id))}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      Marcar Todos
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCouncilorIds([])}
                      className="text-slate-500 hover:underline"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1 border border-inherit rounded-xl">
                  {councilors.map((c) => {
                    const isChecked = selectedCouncilorIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleSelectCouncilor(c.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          isChecked
                            ? 'bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-100 font-semibold'
                            : `${styles.border} ${styles.cardBg} text-slate-700 dark:text-slate-300`
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <img
                            src={
                              c.photoUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}`
                            }
                            alt={c.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-black/10"
                          />
                          <div className="truncate">
                            <p className="truncate">{c.name}</p>
                            <p className="text-[10px] text-slate-500">{c.politicalParty} • {c.nickname || c.role}</p>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="rounded text-blue-600 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ETAPA 3: INCLUSÃO DE NOVOS VEREADORES */}
              <div className="space-y-3 pt-4 border-t border-inherit">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  <span>3. Inclusão de Novos Vereadores Eleitos</span>
                </h4>

                {/* List of already added new councilors */}
                {brandNewCouncilors.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <p className="text-[11px] font-bold text-slate-500">
                      Novos vereadores a serem cadastrados ({brandNewCouncilors.length}):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {brandNewCouncilors.map((nc, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg border border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {nc.photoUrl ? (
                              <img
                                src={nc.photoUrl}
                                alt={nc.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                                {nc.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">{nc.name}</p>
                              <p className="text-[10px] text-slate-500">{nc.politicalParty} • {nc.nickname || nc.role}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveBrandNewCouncilor(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                            title="Remover da lista"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mini-form for new councilor */}
                <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3 bg-slate-50/60 dark:bg-slate-800/40">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Adicionar Novo Parlamentar para este Mandato:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <input
                        type="text"
                        value={tempCouncilor.name}
                        onChange={(e) => setTempCouncilor({ ...tempCouncilor, name: e.target.value })}
                        placeholder="Nome completo do vereador"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${styles.inputBg}`}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={tempCouncilor.nickname}
                        onChange={(e) => setTempCouncilor({ ...tempCouncilor, nickname: e.target.value })}
                        placeholder="Nome parlamentar (apelido)"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${styles.inputBg}`}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={tempCouncilor.politicalParty}
                        onChange={(e) => setTempCouncilor({ ...tempCouncilor, politicalParty: e.target.value })}
                        placeholder="Partido (ex: PSD, MDB)"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${styles.inputBg}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoUploadForNewCouncilor}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${styles.border} ${styles.tableHoverBg}`}
                      >
                        <Upload className="w-3 h-3 text-blue-600" />
                        <span>Foto do PC</span>
                      </button>

                      <input
                        type="text"
                        placeholder="Ou URL da foto (https://...)"
                        value={tempCouncilor.photoUrl.startsWith('data:') ? '' : tempCouncilor.photoUrl}
                        onChange={(e) => setTempCouncilor({ ...tempCouncilor, photoUrl: e.target.value })}
                        className={`px-2.5 py-1 rounded-lg text-xs border ${styles.inputBg} w-44 sm:w-56`}
                      />

                      {tempCouncilor.photoUrl && (
                        <div className="flex items-center gap-1.5">
                          <img
                            src={tempCouncilor.photoUrl}
                            alt="preview"
                            className="w-5 h-5 rounded-full object-cover border"
                          />
                          <span className="text-[11px] text-emerald-600 font-bold">✓ Anexada</span>
                          <button
                            type="button"
                            onClick={() => setTempCouncilor({ ...tempCouncilor, photoUrl: '' })}
                            className="text-rose-500 hover:text-rose-700 text-xs px-1"
                            title="Remover foto"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddTempCouncilor}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs self-start sm:self-auto shrink-0"
                    >
                      + Incluir na Nova Legislatura
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`pt-4 border-t ${styles.border} flex justify-end gap-3`}>
                <button
                  type="button"
                  onClick={() => setIsNewLegModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${styles.btnSecondary}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm ${styles.btnPrimary}`}
                >
                  Criar Legislatura & Iniciar Mandato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR LEGISLATURA */}
      {isEditLegModalOpen && editingLeg && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`relative w-full max-w-lg rounded-2xl shadow-2xl border ${styles.cardBg} ${styles.border} ${styles.textPrimary} max-h-[90vh] flex flex-col`}
          >
            <div className={`px-6 py-4 border-b ${styles.border} flex items-center justify-between`}>
              <h3 className="font-bold text-base text-inherit font-serif">
                Editar {editingLeg.name} ({editingLeg.period})
              </h3>
              <button
                onClick={() => setIsEditLegModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditLegislature} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nome da Legislatura
                </label>
                <input
                  type="text"
                  value={newLegForm.name}
                  onChange={(e) => setNewLegForm({ ...newLegForm, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Período
                </label>
                <input
                  type="text"
                  value={newLegForm.period}
                  onChange={(e) => setNewLegForm({ ...newLegForm, period: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Início
                  </label>
                  <input
                    type="date"
                    value={newLegForm.startDate}
                    onChange={(e) => setNewLegForm({ ...newLegForm, startDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Término
                  </label>
                  <input
                    type="date"
                    value={newLegForm.endDate}
                    onChange={(e) => setNewLegForm({ ...newLegForm, endDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                    required
                  />
                </div>
              </div>

              <div className={`pt-4 border-t ${styles.border} flex justify-end gap-2`}>
                <button
                  type="button"
                  onClick={() => setIsEditLegModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium ${styles.btnSecondary}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg text-xs font-semibold shadow-sm ${styles.btnPrimary}`}
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
