import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLegislative } from '../context/LegislativeContext';
import { Committee, CommitteeMember, CommitteeMemberRole } from '../types';
import {
  Users2,
  Plus,
  Edit2,
  Trash2,
  Crown,
  BookOpen,
  User,
  CalendarDays,
  Shield,
  CheckCircle,
} from 'lucide-react';

export const CommitteesTab: React.FC = () => {
  const { styles } = useTheme();
  const {
    committees,
    councilors,
    meetings,
    addCommittee,
    updateCommittee,
    deleteCommittee,
    settings,
    legislatures,
    activeLegislature,
  } = useLegislative();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [filterLegislature, setFilterLegislature] = useState<string>('all');

  const [formData, setFormData] = useState<{
    name: string;
    acronym: string;
    description: string;
    legislature: string;
    isActive: boolean;
    members: CommitteeMember[];
  }>({
    name: '',
    acronym: '',
    description: '',
    legislature: activeLegislature?.period || settings.legislature,
    isActive: true,
    members: [
      { councilorId: '', councilorName: '', role: 'Presidente' },
      { councilorId: '', councilorName: '', role: 'Relator' },
      { councilorId: '', councilorName: '', role: 'Membro' },
    ],
  });

  const handleOpenNew = () => {
    setEditingCommittee(null);
    setFormData({
      name: '',
      acronym: '',
      description: '',
      legislature: activeLegislature?.period || settings.legislature,
      isActive: true,
      members: [
        { councilorId: councilors[0]?.id || '', councilorName: councilors[0]?.name || '', role: 'Presidente' },
        { councilorId: councilors[1]?.id || '', councilorName: councilors[1]?.name || '', role: 'Relator' },
        { councilorId: councilors[2]?.id || '', councilorName: councilors[2]?.name || '', role: 'Membro' },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (committee: Committee) => {
    setEditingCommittee(committee);

    // Ensure 3 members array
    const membersCopy: CommitteeMember[] = [
      committee.members[0] || { councilorId: '', councilorName: '', role: 'Presidente' },
      committee.members[1] || { councilorId: '', councilorName: '', role: 'Relator' },
      committee.members[2] || { councilorId: '', councilorName: '', role: 'Membro' },
    ];

    setFormData({
      name: committee.name,
      acronym: committee.acronym,
      description: committee.description,
      legislature: committee.legislature || activeLegislature?.period || settings.legislature,
      isActive: committee.isActive,
      members: membersCopy,
    });
    setIsModalOpen(true);
  };

  const handleMemberChange = (index: number, councilorId: string, role?: CommitteeMemberRole) => {
    const selectedCouncilor = councilors.find((c) => c.id === councilorId);
    setFormData((prev) => {
      const copy = [...prev.members];
      copy[index] = {
        councilorId,
        councilorName: selectedCouncilor ? selectedCouncilor.name : '',
        role: role !== undefined ? role : copy[index].role,
      };
      return { ...prev, members: copy };
    });
  };

  const handleRoleChange = (index: number, role: CommitteeMemberRole) => {
    setFormData((prev) => {
      const copy = [...prev.members];
      copy[index] = {
        ...copy[index],
        role,
      };
      return { ...prev, members: copy };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.acronym.trim()) {
      alert('Preencha o nome e a sigla da comissão.');
      return;
    }

    // Verify 3 distinct members
    const memberIds = formData.members.map((m) => m.councilorId).filter(Boolean);
    if (memberIds.length < 3) {
      alert('A comissão regimental deve ser composta obrigatoriamente por 3 vereadores.');
      return;
    }

    const uniqueIds = new Set(memberIds);
    if (uniqueIds.size !== 3) {
      alert('Os 3 membros da comissão devem ser vereadores diferentes.');
      return;
    }

    try {
      if (editingCommittee) {
        await updateCommittee(editingCommittee.id, formData);
      } else {
        await addCommittee(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar comissão.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir a comissão "${name}"?`)) {
      try {
        await deleteCommittee(id);
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir comissão.');
      }
    }
  };

  // Filtered committees
  const filteredCommittees = committees.filter((com) => {
    if (filterLegislature !== 'all') {
      const cLeg = com.legislature || '';
      if (!cLeg.includes(filterLegislature)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-inherit">
            Comissões Permanentes & Membros
          </h2>
          <p className={`text-xs sm:text-sm ${styles.textMuted}`}>
            Cada comissão é regimentalmente formada por 3 vereadores (Presidente, Relator e Membro)
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${styles.btnPrimary} self-start sm:self-auto`}
        >
          <Plus className="w-4 h-4" />
          <span>Nova Comissão</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className={`p-4 rounded-xl border ${styles.cardBg} ${styles.border} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Filtrar por Mandato:</span>
          <select
            value={filterLegislature}
            onChange={(e) => setFilterLegislature(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm border ${styles.inputBg} font-medium`}
          >
            <option value="all">Todas as Legislaturas ({committees.length})</option>
            {legislatures.map((leg) => (
              <option key={leg.id} value={leg.period}>
                {leg.name} ({leg.period}) {leg.isActive ? '★ Ativa' : ''}
              </option>
            ))}
          </select>
        </div>
        <span className={`text-xs ${styles.textMuted}`}>
          Exibindo {filteredCommittees.length} de {committees.length} comissões
        </span>
      </div>

      {/* Grid of Committees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCommittees.map((committee) => {
          const committeeMeetings = meetings.filter((m) => m.committeeId === committee.id);
          const completedCount = committeeMeetings.filter((m) => m.status === 'realizada').length;

          return (
            <div
              key={committee.id}
              className={`rounded-xl border ${styles.cardBg} ${styles.border} p-6 shadow-xs flex flex-col justify-between space-y-5 transition-all`}
            >
              <div>
                {/* Header with Acronym & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-mono">
                        {committee.acronym}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-mono">
                        {committee.legislature || activeLegislature?.period || '2025 - 2028'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold font-serif text-inherit pt-1 leading-snug">
                      {committee.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(committee)}
                      className={`p-2 rounded-lg text-xs font-medium ${styles.tableHoverBg} text-slate-600 dark:text-slate-300`}
                      title="Editar Comissão e Membros"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(committee.id, committee.name)}
                      className="p-2 rounded-lg text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      title="Excluir Comissão"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {committee.description && (
                  <p className={`text-xs ${styles.textSecondary} mt-3 leading-relaxed`}>
                    {committee.description}
                  </p>
                )}

                {/* The 3 Members Showcase */}
                <div className="mt-5 space-y-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Composição Regimental (3 Vereadores):
                  </p>

                  <div className="space-y-2">
                    {committee.members.map((member, i) => {
                      const councilorData = councilors.find((c) => c.id === member.councilorId);

                      let roleIcon = <User className="w-3.5 h-3.5 text-slate-400" />;
                      let roleBadgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

                      if (member.role === 'Presidente') {
                        roleIcon = <Crown className="w-3.5 h-3.5 text-amber-500" />;
                        roleBadgeClass = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20';
                      } else if (member.role === 'Relator') {
                        roleIcon = <BookOpen className="w-3.5 h-3.5 text-blue-500" />;
                        roleBadgeClass = 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20';
                      }

                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-2.5 rounded-lg border ${styles.border} ${styles.tableHoverBg} text-xs`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                councilorData?.photoUrl ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(member.councilorName || 'V')}`
                              }
                              alt={member.councilorName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.councilorName || 'V');
                              }}
                            />
                            <div>
                              <p className="font-semibold text-inherit">
                                {member.councilorName || 'Não designado'}
                              </p>
                              {councilorData?.politicalParty && (
                                <p className="text-[10px] text-slate-500">
                                  {councilorData.politicalParty} • {councilorData.nickname || 'Vereador(a)'}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {roleIcon}
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${roleBadgeClass}`}>
                              {member.role}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Footer Info */}
              <div className={`pt-4 border-t ${styles.border} flex items-center justify-between text-xs text-slate-500`}>
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>
                    {committeeMeetings.length} reunião(ões) • {completedCount} realizada(s)
                  </span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Comissão Regular
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Create/Edit Committee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`relative w-full max-w-2xl rounded-xl shadow-2xl border ${styles.cardBg} ${styles.border} ${styles.textPrimary} max-h-[92vh] flex flex-col`}
          >
            <div className={`px-6 py-4 border-b ${styles.border} flex items-center justify-between`}>
              <div>
                <h3 className="font-bold text-lg text-inherit font-serif">
                  {editingCommittee ? 'Editar Comissão Permanente' : 'Nova Comissão Permanente'}
                </h3>
                <p className={`text-xs ${styles.textMuted}`}>
                  Defina o nome da comissão e designe os 3 vereadores membros
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-black/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              {/* Committee Name, Acronym & Legislature */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Nome Oficial da Comissão *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Comissão de Constituição, Justiça e Redação"
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Sigla *
                  </label>
                  <input
                    type="text"
                    value={formData.acronym}
                    onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
                    placeholder="Ex: CCJR"
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Legislatura *
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

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                  Atribuição Regimental / Competência da Comissão
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Competência legal para emissão de pareceres sobre projetos, orçamentos ou fiscalizações..."
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                />
              </div>

              {/* THREE MEMBERS CONFIGURATION */}
              <div className={`p-4 rounded-xl border ${styles.border} bg-slate-50/50 dark:bg-slate-900/50 space-y-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-inherit">
                      Composição dos 3 Vereadores Membros
                    </h4>
                    <p className={`text-xs ${styles.textMuted}`}>
                      Designe quem será o Presidente, o Relator e o Membro (Vogal)
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.members.map((member, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${styles.border} ${styles.cardBg} grid grid-cols-1 sm:grid-cols-2 gap-3 items-center`}
                    >
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Vereador {idx + 1}
                        </label>
                        <select
                          value={member.councilorId}
                          onChange={(e) => handleMemberChange(idx, e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${styles.inputBg}`}
                          required
                        >
                          <option value="">Selecione o vereador...</option>
                          {councilors.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.politicalParty}) - {c.nickname || c.role}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Atribuição na Comissão
                        </label>
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(idx, e.target.value as CommitteeMemberRole)
                          }
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${styles.inputBg}`}
                        >
                          <option value="Presidente">Presidente da Comissão</option>
                          <option value="Relator">Relator da Comissão</option>
                          <option value="Membro">Membro (Vogal)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
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
                  {editingCommittee ? 'Salvar Comissão' : 'Cadastrar Comissão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
