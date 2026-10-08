import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLegislative } from '../context/LegislativeContext';
import { Councilor } from '../types';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Shield,
  Award,
  CheckCircle,
  XCircle,
  Percent,
  Upload,
  Camera,
  Image as ImageIcon,
  X,
  Link as LinkIcon,
} from 'lucide-react';

export const CouncilorsTab: React.FC = () => {
  const { styles } = useTheme();
  const {
    councilors,
    committees,
    meetings,
    addCouncilor,
    updateCouncilor,
    deleteCouncilor,
    settings,
    legislatures,
    activeLegislature,
  } = useLegislative();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCouncilor, setEditingCouncilor] = useState<Councilor | null>(null);
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLegislature, setFilterLegislature] = useState<string>('all');
  const [filterParty, setFilterParty] = useState<string>('all');

  const [formData, setFormData] = useState<{
    name: string;
    nickname: string;
    politicalParty: string;
    role: string;
    email: string;
    phone: string;
    photoUrl: string;
    isActive: boolean;
    legislature: string;
  }>({
    name: '',
    nickname: '',
    politicalParty: 'PSD',
    role: 'Vereador',
    email: '',
    phone: '',
    photoUrl: '',
    isActive: true,
    legislature: activeLegislature?.period || settings.legislature,
  });

  // Handle direct file upload from PC with automatic canvas resize/compression
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setFormData((prev) => ({ ...prev, photoUrl: compressedDataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenNew = () => {
    setEditingCouncilor(null);
    setFormData({
      name: '',
      nickname: '',
      politicalParty: 'PSD',
      role: 'Vereador',
      email: '',
      phone: '',
      photoUrl: '',
      isActive: true,
      legislature: activeLegislature?.period || settings.legislature,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (councilor: Councilor) => {
    setEditingCouncilor(councilor);
    setFormData({
      name: councilor.name,
      nickname: councilor.nickname || '',
      politicalParty: councilor.politicalParty,
      role: councilor.role || 'Vereador',
      email: councilor.email || '',
      phone: councilor.phone || '',
      photoUrl: councilor.photoUrl || '',
      isActive: councilor.isActive,
      legislature: councilor.legislature || activeLegislature?.period || settings.legislature,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.politicalParty.trim()) {
      alert('Preencha pelo menos o nome e o partido do vereador.');
      return;
    }

    try {
      if (editingCouncilor) {
        await updateCouncilor(editingCouncilor.id, formData);
      } else {
        await addCouncilor(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar vereador no Firebase.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    // Check if councilor is currently on any committee
    const onCommittee = committees.some((com) =>
      com.members.some((m) => m.councilorId === id)
    );

    let confirmMsg = `Deseja realmente remover o parlamentar ${name}?`;
    if (onCommittee) {
      confirmMsg += `\nAtenção: Este parlamentar está vinculado a comissões permanentes ativas.`;
    }

    if (confirm(confirmMsg)) {
      try {
        await deleteCouncilor(id);
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir vereador.');
      }
    }
  };

  // Distinct parties for filter
  const parties = Array.from(new Set(councilors.map((c) => c.politicalParty))).filter(Boolean);

  // Filtered councilors
  const filteredCouncilors = councilors.filter((c) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match =
        c.name.toLowerCase().includes(term) ||
        (c.nickname && c.nickname.toLowerCase().includes(term)) ||
        c.politicalParty.toLowerCase().includes(term);
      if (!match) return false;
    }
    if (filterLegislature !== 'all') {
      const cLeg = c.legislature || '';
      if (!cLeg.includes(filterLegislature)) return false;
    }
    if (filterParty !== 'all' && c.politicalParty !== filterParty) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-inherit">
            Vereadores da Câmara Municipal
          </h2>
          <p className={`text-xs sm:text-sm ${styles.textMuted}`}>
            Cadastro parlamentar, partidos políticos, mandatos por legislatura e assiduidade
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${styles.btnPrimary} self-start sm:self-auto`}
        >
          <Plus className="w-4 h-4" />
          <span>Novo Vereador</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-xl border ${styles.cardBg} ${styles.border} flex flex-col md:flex-row items-stretch md:items-center gap-3`}>
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, apelido ou partido..."
            className={`w-full pl-3 pr-3 py-2 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Legislature filter */}
          <select
            value={filterLegislature}
            onChange={(e) => setFilterLegislature(e.target.value)}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm border ${styles.inputBg} font-medium`}
          >
            <option value="all">Todas as Legislaturas ({councilors.length})</option>
            {legislatures.map((leg) => (
              <option key={leg.id} value={leg.period}>
                {leg.name} ({leg.period}) {leg.isActive ? '★ Ativa' : ''}
              </option>
            ))}
          </select>

          {/* Party filter */}
          <select
            value={filterParty}
            onChange={(e) => setFilterParty(e.target.value)}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm border ${styles.inputBg} font-medium`}
          >
            <option value="all">Todos os Partidos</option>
            {parties.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Councilors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredCouncilors.map((c) => {
          // Find committees this councilor belongs to
          const memberCommittees = committees.filter((com) =>
            com.members.some((m) => m.councilorId === c.id)
          );

          // Compute attendance stats
          let totalCalls = 0;
          let presents = 0;
          let justified = 0;
          let unjustified = 0;

          meetings
            .filter((m) => m.status === 'realizada')
            .forEach((m) => {
              const att = m.attendances.find((a) => a.councilorId === c.id);
              if (att) {
                totalCalls++;
                if (att.status === 'presente') presents++;
                else if (att.status === 'ausente_justificado') justified++;
                else if (att.status === 'ausente_injustificado') unjustified++;
              }
            });

          const rate = totalCalls > 0 ? Math.round((presents / totalCalls) * 100) : 100;

          return (
            <div
              key={c.id}
              className={`rounded-xl border ${styles.cardBg} ${styles.border} p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:shadow-md`}
            >
              <div>
                {/* Top: Avatar & Action Buttons */}
                <div className="flex items-start justify-between">
                  <div className="relative">
                    <img
                      src={
                        c.photoUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=0284c7&color=fff`
                      }
                      alt={c.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.name);
                      }}
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                        c.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      title={c.isActive ? 'Mandato Ativo' : 'Inativo / Licenciado'}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className={`p-1.5 rounded-lg text-xs font-medium ${styles.tableHoverBg} text-slate-600 dark:text-slate-300`}
                      title="Editar Vereador"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="p-1.5 rounded-lg text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      title="Excluir Vereador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Councilor Identity */}
                <div className="mt-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-mono">
                      {c.politicalParty}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {c.role || 'Vereador'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 ml-auto">
                      {c.legislature || activeLegislature?.period || '2025 - 2028'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-inherit mt-1 leading-snug">
                    {c.name}
                  </h3>
                  {c.nickname && (
                    <p className={`text-xs ${styles.textMuted} italic`}>
                      "{c.nickname}"
                    </p>
                  )}
                </div>

                {/* Committees badges */}
                <div className="mt-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Comissões Integradas:
                  </span>
                  {memberCommittees.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Nenhuma comissão</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {memberCommittees.map((com) => {
                        const m = com.members.find((mb) => mb.councilorId === c.id);
                        return (
                          <span
                            key={com.id}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            title={`${com.name} (${m?.role})`}
                          >
                            {com.acronym}: {m?.role}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Contact details */}
                <div className="mt-3 pt-3 border-t border-inherit text-[11px] space-y-1 text-slate-500">
                  {c.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Bar */}
              <div className="pt-3 border-t border-inherit">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`text-[11px] ${styles.textMuted}`}>Frequência Regimental</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {rate}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{presents} presenças</span>
                  <span>{justified} justif.</span>
                  {unjustified > 0 && (
                    <span className="text-rose-500 font-semibold">{unjustified} faltas</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Councilor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`relative w-full max-w-xl rounded-xl shadow-2xl border ${styles.cardBg} ${styles.border} ${styles.textPrimary} max-h-[92vh] flex flex-col`}
          >
            <div className={`px-6 py-4 border-b ${styles.border} flex items-center justify-between`}>
              <div>
                <h3 className="font-bold text-lg text-inherit font-serif">
                  {editingCouncilor ? 'Editar Vereador' : 'Novo Parlamentar'}
                </h3>
                <p className={`text-xs ${styles.textMuted}`}>
                  Dados cadastrais e informações do mandato legislativo
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-black/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Carlos Eduardo Silva"
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Nome Parlamentar / Apelido
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="Ex: Carlinhos da Saúde"
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Partido Político *
                  </label>
                  <input
                    type="text"
                    value={formData.politicalParty}
                    onChange={(e) => setFormData({ ...formData, politicalParty: e.target.value })}
                    placeholder="Ex: PSD, MDB, PP..."
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Cargo na Casa
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                  >
                    <option value="Vereador">Vereador</option>
                    <option value="Vereadora">Vereadora</option>
                    <option value="Presidente da Câmara">Presidente da Câmara</option>
                    <option value="Vice-Presidente">Vice-Presidente</option>
                    <option value="1º Secretário">1º Secretário</option>
                    <option value="2º Secretário">2º Secretário</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Legislatura do Mandato *
                  </label>
                  <select
                    value={formData.legislature}
                    onChange={(e) => setFormData({ ...formData, legislature: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                    required
                  >
                    {legislatures.map((leg) => (
                      <option key={leg.id} value={leg.period}>
                        {leg.name} ({leg.period}) {leg.isActive ? '★' : ''}
                      </option>
                    ))}
                    {!legislatures.some((l) => l.period === formData.legislature) && (
                      <option value={formData.legislature}>{formData.legislature}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    E-mail Oficial
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="carlinhos@camarasantalucia.pr.gov.br"
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(45) 99811-0000"
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                  />
                </div>
              </div>

              {/* PHOTO UPLOAD & PREVIEW SECTION */}
              <div className={`p-4 rounded-xl border ${styles.border} bg-slate-50/50 dark:bg-slate-800/40 space-y-3`}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Foto do Parlamentar
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPhotoMode('upload')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        photoMode === 'upload'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Enviar do Computador
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoMode('url')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        photoMode === 'url'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Colar Link (URL)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Photo Preview Thumbnail */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center shadow-xs">
                    {formData.photoUrl ? (
                      <img
                        src={formData.photoUrl}
                        alt="Foto do vereador"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://ui-avatars.com/api/?name=' + encodeURIComponent(formData.name || 'V');
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}

                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photoUrl: '' })}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
                        title="Remover foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    {photoMode === 'upload' ? (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handlePhotoFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border ${styles.border} ${styles.tableHoverBg} text-slate-800 dark:text-slate-100 shadow-xs`}
                        >
                          <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Escolher Foto do Computador (JPG/PNG)</span>
                        </button>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          A imagem será otimizada automaticamente e gravada no Firebase.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          value={formData.photoUrl}
                          onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                          placeholder="Cole a URL pública da foto (https://...)"
                          className={`w-full px-3 py-2 rounded-lg text-xs border ${styles.inputBg}`}
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Insira o endereço direto de uma imagem na internet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Mandato Parlamentar Ativo (Exercício do Cargo)
                </label>
              </div>

              <div className={`pt-4 border-t ${styles.border} flex justify-end gap-3`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${styles.btnSecondary}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-medium ${styles.btnPrimary}`}
                >
                  {editingCouncilor ? 'Salvar Alterações' : 'Cadastrar Vereador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
