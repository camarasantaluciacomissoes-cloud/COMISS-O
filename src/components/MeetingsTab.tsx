import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLegislative } from '../context/LegislativeContext';
import { Meeting, AttendanceRecord, AttendanceStatus, MeetingStatus, Committee } from '../types';
import { JustificationModal } from './JustificationModal';
import { PrintAtaModal } from './PrintAtaModal';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Printer,
  Sparkles,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  ChevronDown,
  Download,
} from 'lucide-react';
import { exportMeetingMinutesToWord } from '../utils/wordExport';

interface MeetingsTabProps {
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
}

export const MeetingsTab: React.FC<MeetingsTabProps> = ({
  isCreateModalOpen: externalCreateOpen,
  onCloseCreateModal: externalCloseCreate,
}) => {
  const { styles } = useTheme();
  const {
    meetings,
    committees,
    councilors,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    settings,
    legislatures,
    activeLegislature,
  } = useLegislative();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLegislature, setFilterLegislature] = useState('all');
  const [filterCommitteeId, setFilterCommitteeId] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen = externalCreateOpen !== undefined ? externalCreateOpen || internalModalOpen : internalModalOpen;
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Term of Justification Modal
  const [selectedJustification, setSelectedJustification] = useState<{
    meeting: Meeting;
    attendance: AttendanceRecord;
  } | null>(null);

  // Print Ata Modal
  const [selectedAtaMeeting, setSelectedAtaMeeting] = useState<Meeting | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    committeeId: string;
    committeeName: string;
    date: string;
    time: string;
    location: string;
    topic: string;
    description: string;
    status: MeetingStatus;
    attendances: AttendanceRecord[];
    minutesText: string;
    minutesApproved: boolean;
  }>({
    committeeId: '',
    committeeName: '',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    location: 'Sala de Comissões da Câmara Municipal',
    topic: '',
    description: '',
    status: 'realizada',
    attendances: [],
    minutesText: '',
    minutesApproved: false,
  });

  // Open modal for new meeting
  const handleOpenNew = () => {
    const firstCommittee = committees[0];
    const initialAttendances: AttendanceRecord[] = firstCommittee
      ? firstCommittee.members.map((m) => {
          const c = councilors.find((c) => c.id === m.councilorId);
          return {
            councilorId: m.councilorId,
            councilorName: m.councilorName,
            politicalParty: c?.politicalParty || '',
            committeeRole: m.role,
            status: 'presente',
            justificationReason: '',
            justificationDocument: '',
            justificationSigned: false,
          };
        })
      : [];

    setEditingMeeting(null);
    setFormData({
      committeeId: firstCommittee ? firstCommittee.id : '',
      committeeName: firstCommittee ? firstCommittee.name : '',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      location: 'Sala de Comissões da Câmara Municipal',
      topic: '',
      description: '',
      status: 'realizada',
      attendances: initialAttendances,
      minutesText: '',
      minutesApproved: false,
    });
    setInternalModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      committeeId: meeting.committeeId,
      committeeName: meeting.committeeName,
      date: meeting.date,
      time: meeting.time,
      location: meeting.location,
      topic: meeting.topic,
      description: meeting.description || '',
      status: meeting.status,
      attendances: meeting.attendances,
      minutesText: meeting.minutesText || '',
      minutesApproved: meeting.minutesApproved || false,
    });
    setInternalModalOpen(true);
  };

  const handleCloseModal = () => {
    setInternalModalOpen(false);
    if (externalCloseCreate) externalCloseCreate();
    setEditingMeeting(null);
  };

  // When committee changes in form, update attendances
  const handleCommitteeChange = (newCommitteeId: string) => {
    const comm = committees.find((c) => c.id === newCommitteeId);
    if (!comm) return;

    const newAttendances: AttendanceRecord[] = comm.members.map((m) => {
      const c = councilors.find((c) => c.id === m.councilorId);
      return {
        councilorId: m.councilorId,
        councilorName: m.councilorName,
        politicalParty: c?.politicalParty || '',
        committeeRole: m.role,
        status: 'presente',
        justificationReason: '',
        justificationDocument: '',
        justificationSigned: false,
      };
    });

    setFormData((prev) => ({
      ...prev,
      committeeId: comm.id,
      committeeName: comm.name,
      attendances: newAttendances,
    }));
  };

  // Update attendance of a specific member
  const handleAttendanceStatusChange = (
    index: number,
    status: AttendanceStatus
  ) => {
    setFormData((prev) => {
      const copy = [...prev.attendances];
      copy[index] = {
        ...copy[index],
        status,
        justificationSigned:
          status === 'ausente_justificado' ? copy[index].justificationSigned : false,
      };
      return { ...prev, attendances: copy };
    });
  };

  const handleAttendanceFieldChange = (
    index: number,
    field: 'justificationReason' | 'justificationDocument' | 'justificationSigned',
    value: any
  ) => {
    setFormData((prev) => {
      const copy = [...prev.attendances];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return { ...prev, attendances: copy };
    });
  };

  // Auto-generate standard minutes draft
  const handleGenerateMinutesDraft = () => {
    const dateParts = formData.date.split('-');
    const formattedDate =
      dateParts.length === 3
        ? `${dateParts[2]} de ${
            [
              'janeiro',
              'fevereiro',
              'março',
              'abril',
              'maio',
              'junho',
              'julho',
              'agosto',
              'setembro',
              'outubro',
              'novembro',
              'dezembro',
            ][parseInt(dateParts[1], 10) - 1]
          } de ${dateParts[0]}`
        : formData.date;

    const presentMembers = formData.attendances.filter((a) => a.status === 'presente');
    const justifiedMembers = formData.attendances.filter((a) => a.status === 'ausente_justificado');
    const unjustifiedMembers = formData.attendances.filter(
      (a) => a.status === 'ausente_injustificado'
    );

    let minutes = `ATA OFICIAL DE REUNIÃO DA ${formData.committeeName.toUpperCase()} DA ${settings.chamberName.toUpperCase()}\n\n`;
    minutes += `Aos ${formattedDate}, às ${formData.time} horas, reuniu-se a ${formData.committeeName} no recinto da ${formData.location}, sob a presidência do(a) respectivo(a) titular, para deliberação das matérias regimentais.\n\n`;

    minutes += `REGISTRO DE QUÓRUM E FREQUÊNCIA:\n`;
    minutes += `- Presentes: ${
      presentMembers.map((m) => `${m.councilorName} (${m.committeeRole})`).join(', ') || 'Nenhum'
    }.\n`;

    if (justifiedMembers.length > 0) {
      minutes += `- Ausência(s) Justificada(s): ${justifiedMembers
        .map(
          (m) =>
            `${m.councilorName} (Termo de justificativa apresentado sob alegação: "${
              m.justificationReason || 'Tratamento de Saúde/Compromisso Oficial'
            }")`
        )
        .join('; ')}.\n`;
    }

    if (unjustifiedMembers.length > 0) {
      minutes += `- Ausência(s) sem justificativa: ${unjustifiedMembers
        .map((m) => m.councilorName)
        .join(', ')}.\n`;
    }

    minutes += `\nORDEM DO DIA / PAUTA DELIBERATIVA:\n${formData.topic}\n\n`;
    if (formData.description) {
      minutes += `HISTÓRICO DOS TRABALHOS E DISCUSSÕES:\n${formData.description}\n\n`;
    }

    minutes += `DELIBERAÇÕES E CONCLUSÃO:\nHavendo número regimental suficiente, a comissão discutiu e exarou parecer sobre as matérias pautadas. Nada mais havendo a tratar, a reunião foi encerrada e lavrou-se a presente ata, que após lida e achada conforme, segue assinada pelos membros da comissão.`;

    setFormData((prev) => ({
      ...prev,
      minutesText: minutes,
      minutesApproved: true,
    }));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.committeeId || !formData.topic.trim()) {
      alert('Por favor, preencha a comissão e a pauta da reunião.');
      return;
    }

    try {
      if (editingMeeting) {
        await updateMeeting(editingMeeting.id, formData);
      } else {
        await addMeeting(formData);
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar reunião no Firebase.');
    }
  };

  // Delete meeting
  const handleDelete = async (id: string, topic: string) => {
    if (confirm(`Deseja realmente excluir a reunião sobre: "${topic}"?`)) {
      try {
        await deleteMeeting(id);
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir reunião.');
      }
    }
  };

  // Filter meetings
  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.committeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCommittee =
      filterCommitteeId === 'all' || m.committeeId === filterCommitteeId;

    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;

    const matchesLeg =
      filterLegislature === 'all' ||
      (() => {
        const leg = legislatures.find((l) => l.id === filterLegislature);
        if (!leg || !leg.startDate || !leg.endDate) return true;
        return m.date >= leg.startDate && m.date <= leg.endDate;
      })();

    return matchesSearch && matchesCommittee && matchesStatus && matchesLeg;
  });

  return (
    <div className="space-y-6">
      {/* Top action & filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-inherit">
            Reuniões de Comissões & Frequência
          </h2>
          <p className={`text-xs sm:text-sm ${styles.textMuted}`}>
            Controle de presenças, faltas justificadas com termo assinado, pautas e atas oficiais
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${styles.btnPrimary} self-start md:self-auto`}
        >
          <Plus className="w-4 h-4" />
          <span>Nova Reunião</span>
        </button>
      </div>

      {/* Filters Card */}
      <div
        className={`p-4 rounded-xl border ${styles.cardBg} ${styles.border} shadow-xs space-y-3`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por pauta, comissão ou local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
            />
          </div>

          {/* Legislature Select */}
          <div>
            <select
              value={filterLegislature}
              onChange={(e) => setFilterLegislature(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
            >
              <option value="all">Todas as Legislaturas</option>
              {legislatures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.period}) {l.isActive ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Committee Select */}
          <div>
            <select
              value={filterCommitteeId}
              onChange={(e) => setFilterCommitteeId(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
            >
              <option value="all">Todas as Comissões</option>
              {committees.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.acronym} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
            >
              <option value="all">Todos os Status</option>
              <option value="realizada">Realizadas</option>
              <option value="agendada">Agendadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {filteredMeetings.length === 0 ? (
          <div
            className={`p-12 text-center rounded-xl border ${styles.cardBg} ${styles.border}`}
          >
            <CalendarDays className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <h3 className="font-bold text-base text-inherit">Nenhuma reunião encontrada</h3>
            <p className={`text-xs ${styles.textMuted} mt-1`}>
              Tente ajustar os filtros ou crie uma nova reunião de comissão.
            </p>
          </div>
        ) : (
          filteredMeetings.map((meeting) => {
            const dateParts = meeting.date.split('-');
            const formattedDate =
              dateParts.length === 3
                ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
                : meeting.date;

            const presentMembers = meeting.attendances.filter((a) => a.status === 'presente');
            const justifiedMembers = meeting.attendances.filter(
              (a) => a.status === 'ausente_justificado'
            );
            const unjustifiedMembers = meeting.attendances.filter(
              (a) => a.status === 'ausente_injustificado'
            );

            return (
              <div
                key={meeting.id}
                className={`rounded-xl border ${styles.cardBg} ${styles.border} p-5 shadow-xs transition-all space-y-4`}
              >
                {/* Meeting Top Info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          meeting.status === 'realizada'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                            : meeting.status === 'agendada'
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                        }`}
                      >
                        {meeting.status}
                      </span>
                      <span className="font-bold text-sm text-inherit">
                        {meeting.committeeName}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-inherit pt-1">
                      {meeting.topic}
                    </h3>

                    {meeting.description && (
                      <p className={`text-xs ${styles.textSecondary} line-clamp-2`}>
                        {meeting.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {meeting.time}h
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {meeting.location}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {meeting.minutesText && (
                      <>
                        <button
                          onClick={() => exportMeetingMinutesToWord(meeting, settings)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${styles.border} ${styles.tableHoverBg} text-blue-700 dark:text-blue-300 transition-colors`}
                          title="Baixar Ata em Word (.doc)"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Word</span>
                        </button>
                        <button
                          onClick={() => setSelectedAtaMeeting(meeting)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-600/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40`}
                          title="Visualizar e Imprimir Ata Oficial"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver Ata</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleOpenEdit(meeting)}
                      className={`p-2 rounded-lg text-xs font-medium ${styles.tableHoverBg} text-slate-600 dark:text-slate-300`}
                      title="Editar Reunião e Presenças"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(meeting.id, meeting.topic)}
                      className={`p-2 rounded-lg text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400`}
                      title="Excluir Reunião"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Attendances Pill Row */}
                <div className={`pt-3 border-t ${styles.border}`}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Frequência Parlamentar dos 3 Membros:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {meeting.attendances.map((att, i) => {
                      const isPresent = att.status === 'presente';
                      const isJustified = att.status === 'ausente_justificado';
                      const isUnjustified = att.status === 'ausente_injustificado';

                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border text-xs flex flex-col justify-between gap-2 ${
                            isPresent
                              ? 'bg-emerald-500/5 border-emerald-500/20'
                              : isJustified
                              ? 'bg-amber-500/5 border-amber-500/20'
                              : 'bg-rose-500/5 border-rose-500/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-inherit">{att.councilorName}</p>
                              <p className="text-[10px] text-slate-500">
                                {att.committeeRole || 'Membro'}
                                {att.politicalParty ? ` • ${att.politicalParty}` : ''}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPresent
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                  : isJustified
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                  : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {isPresent
                                ? 'Presente'
                                : isJustified
                                ? 'Ausente (Justificado)'
                                : 'Ausente (Falta)'}
                            </span>
                          </div>

                          {/* Termo de Justificativa link if justified */}
                          {isJustified && (
                            <div className="pt-2 border-t border-inherit flex items-center justify-between">
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate max-w-[150px]">
                                {att.justificationReason || 'Atestado / Ofício anexado'}
                              </span>
                              <button
                                onClick={() =>
                                  setSelectedJustification({ meeting, attendance: att })
                                }
                                className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Termo Assinado</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal to Create/Edit Meeting */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`relative w-full max-w-3xl rounded-xl shadow-2xl border ${styles.cardBg} ${styles.border} ${styles.textPrimary} max-h-[92vh] flex flex-col`}
          >
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${styles.border} flex items-center justify-between`}>
              <div>
                <h3 className="font-bold text-lg text-inherit font-serif">
                  {editingMeeting ? 'Editar Reunião de Comissão' : 'Nova Reunião de Comissão'}
                </h3>
                <p className={`text-xs ${styles.textMuted}`}>
                  Configure a comissão, pauta, presenças dos membros e ata oficial
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-black/10"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              {/* Committee & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Comissão Permanente *
                  </label>
                  <select
                    value={formData.committeeId}
                    onChange={(e) => handleCommitteeChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                    required
                  >
                    <option value="">Selecione a comissão...</option>
                    {committees.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.acronym} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Situação da Reunião *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as MeetingStatus })
                    }
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                  >
                    <option value="realizada">Realizada (Concluída)</option>
                    <option value="agendada">Agendada (Futura)</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              {/* Date, Time, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Data da Reunião *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Horário *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    Local de Realização *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                    required
                  />
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                  Pauta / Ordem do Dia (Projetos e Matérias Apreciadas) *
                </label>
                <textarea
                  rows={2}
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="Ex: Projeto de Lei Complementar nº 02/2026 - Dispõe sobre o zoneamento urbano e diretrizes orçamentárias..."
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                  required
                />
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                  Resumo das Discussões / Detalhes Adicionais
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Observações complementares, relatórios verbais, convidados presentes..."
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${styles.inputBg}`}
                />
              </div>

              {/* ATTENDANCE SECTION: THE 3 VEREADORES */}
              <div className={`p-4 rounded-xl border ${styles.border} bg-slate-50/50 dark:bg-slate-900/50 space-y-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-inherit">
                      Controle de Frequência dos Membros da Comissão
                    </h4>
                    <p className={`text-xs ${styles.textMuted}`}>
                      Marque se o vereador esteve Presente, Ausente com Justificativa ou Ausente sem Justificativa.
                    </p>
                  </div>
                </div>

                {formData.attendances.length === 0 ? (
                  <p className="text-xs text-amber-500 italic">
                    Selecione uma comissão para carregar os 3 vereadores membros.
                  </p>
                ) : (
                  formData.attendances.map((att, idx) => (
                    <div
                      key={att.councilorId}
                      className={`p-3.5 rounded-lg border ${styles.border} ${styles.cardBg} space-y-3`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-inherit">
                            {att.councilorName}
                          </span>
                          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            {att.committeeRole || 'Membro'}
                          </span>
                        </div>

                        {/* 3 Status Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleAttendanceStatusChange(idx, 'presente')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              att.status === 'presente'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            ✓ Presente
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAttendanceStatusChange(idx, 'ausente_justificado')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              att.status === 'ausente_justificado'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            ⚠ Ausente com Justificativa
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAttendanceStatusChange(idx, 'ausente_injustificado')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              att.status === 'ausente_injustificado'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            ✗ Falta sem Justificativa
                          </button>
                        </div>
                      </div>

                      {/* Expanded Section for Ausente com Justificativa */}
                      {att.status === 'ausente_justificado' && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Dados do Termo de Justificativa Assinado</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                                Motivo da Ausência:
                              </label>
                              <input
                                type="text"
                                value={att.justificationReason}
                                onChange={(e) =>
                                  handleAttendanceFieldChange(
                                    idx,
                                    'justificationReason',
                                    e.target.value
                                  )
                                }
                                placeholder="Ex: Tratamento de saúde / Consulta médica"
                                className={`w-full px-2.5 py-1.5 rounded border text-xs ${styles.inputBg}`}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                                Documento / Protocolo de Comprovação:
                              </label>
                              <input
                                type="text"
                                value={att.justificationDocument}
                                onChange={(e) =>
                                  handleAttendanceFieldChange(
                                    idx,
                                    'justificationDocument',
                                    e.target.value
                                  )
                                }
                                placeholder="Ex: Atestado CRM 34.890 / Protocolo nº 104/2026"
                                className={`w-full px-2.5 py-1.5 rounded border text-xs ${styles.inputBg}`}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              id={`signed-${idx}`}
                              checked={att.justificationSigned}
                              onChange={(e) =>
                                handleAttendanceFieldChange(
                                  idx,
                                  'justificationSigned',
                                  e.target.checked
                                )
                              }
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <label
                              htmlFor={`signed-${idx}`}
                              className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                            >
                              Termo de Justificativa assinado pelo Vereador e homologado pela Mesa
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* MINUTES / ATA SECTION */}
              <div className={`p-4 rounded-xl border ${styles.border} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-inherit">Ata Oficial da Reunião</h4>
                    <p className={`text-xs ${styles.textMuted}`}>
                      Texto regimental da sessão de comissão
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateMinutesDraft}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-indigo-400 bg-blue-50 dark:bg-indigo-950/40 border border-blue-200 dark:border-indigo-800 hover:bg-blue-100 transition-colors`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gerar Minuta da Ata</span>
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={formData.minutesText}
                  onChange={(e) => setFormData({ ...formData, minutesText: e.target.value })}
                  placeholder="Clique em 'Gerar Minuta da Ata' ou digite o texto da ata formal da sessão..."
                  className={`w-full px-3 py-2 rounded-lg text-xs font-mono border ${styles.inputBg} leading-relaxed`}
                />

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="minutesApproved"
                    checked={formData.minutesApproved}
                    onChange={(e) =>
                      setFormData({ ...formData, minutesApproved: e.target.checked })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="minutesApproved"
                    className="text-xs font-semibold text-inherit cursor-pointer"
                  >
                    Ata aprovada e assinada pelos membros da comissão
                  </label>
                </div>
              </div>

              {/* Submit / Cancel Footer */}
              <div className={`pt-4 border-t ${styles.border} flex justify-end gap-3`}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${styles.btnSecondary}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-medium ${styles.btnPrimary}`}
                >
                  {editingMeeting ? 'Salvar Alterações' : 'Cadastrar Reunião'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Justification Modal */}
      {selectedJustification && (
        <JustificationModal
          meeting={selectedJustification.meeting}
          attendance={selectedJustification.attendance}
          isOpen={true}
          onClose={() => setSelectedJustification(null)}
        />
      )}

      {/* Print Ata Modal */}
      {selectedAtaMeeting && (
        <PrintAtaModal
          meeting={selectedAtaMeeting}
          isOpen={true}
          onClose={() => setSelectedAtaMeeting(null)}
        />
      )}
    </div>
  );
};
