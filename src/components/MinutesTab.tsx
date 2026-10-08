import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLegislative } from '../context/LegislativeContext';
import { Meeting, AttendanceRecord } from '../types';
import { PrintAtaModal } from './PrintAtaModal';
import { JustificationModal } from './JustificationModal';
import {
  ScrollText,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Filter,
  FileText,
  Search,
  Download,
} from 'lucide-react';
import { exportMeetingMinutesToWord, exportJustificationTermToWord } from '../utils/wordExport';

export const MinutesTab: React.FC = () => {
  const { styles } = useTheme();
  const { meetings, committees, settings, councilors } = useLegislative();

  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'atas' | 'justificativas'>('atas');

  // Modal states
  const [selectedAtaMeeting, setSelectedAtaMeeting] = useState<Meeting | null>(null);
  const [selectedJustification, setSelectedJustification] = useState<{
    meeting: Meeting;
    attendance: AttendanceRecord;
  } | null>(null);

  // Filter meetings with minutes
  const meetingsWithMinutes = meetings.filter((m) => {
    const matchesCommittee =
      selectedCommitteeId === 'all' || m.committeeId === selectedCommitteeId;
    const matchesSearch =
      m.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.minutesText && m.minutesText.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCommittee && matchesSearch;
  });

  // Extract all justifications across meetings
  const allJustifications: { meeting: Meeting; attendance: AttendanceRecord }[] = [];
  meetings.forEach((m) => {
    m.attendances.forEach((att) => {
      if (att.status === 'ausente_justificado') {
        const matchesCommittee =
          selectedCommitteeId === 'all' || m.committeeId === selectedCommitteeId;
        const matchesSearch =
          att.councilorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
          att.justificationReason.toLowerCase().includes(searchTerm.toLowerCase());
        if (matchesCommittee && matchesSearch) {
          allJustifications.push({ meeting: m, attendance: att });
        }
      }
    });
  });

  const formatDateBR = (iso: string) => {
    if (!iso) return '';
    const parts = iso.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-inherit">
            Atas Legislativas & Documentos Oficiais
          </h2>
          <p className={`text-xs sm:text-sm ${styles.textMuted}`}>
            Arquivo oficial de atas de comissões e termos de justificativa de ausência assinados
          </p>
        </div>

        {/* Subtab toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('atas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'atas'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Atas de Comissões ({meetings.filter((m) => !!m.minutesText).length})
          </button>
          <button
            onClick={() => setActiveSubTab('justificativas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'justificativas'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Termos de Justificativa ({allJustifications.length})
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div
        className={`p-4 rounded-xl border ${styles.cardBg} ${styles.border} shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3`}
      >
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por termo na pauta, vereador ou conteúdo..."
            className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
          />
        </div>

        <div>
          <select
            value={selectedCommitteeId}
            onChange={(e) => setSelectedCommitteeId(e.target.value)}
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
      </div>

      {/* Subtab 1: Atas */}
      {activeSubTab === 'atas' && (
        <div className="space-y-4">
          {meetingsWithMinutes.length === 0 ? (
            <div
              className={`p-12 text-center rounded-xl border ${styles.cardBg} ${styles.border}`}
            >
              <ScrollText className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <h3 className="font-bold text-base text-inherit">Nenhuma ata encontrada</h3>
              <p className={`text-xs ${styles.textMuted} mt-1`}>
                Gere ou registre atas nas reuniões concluídas pela aba "Reuniões".
              </p>
            </div>
          ) : (
            meetingsWithMinutes.map((meeting) => (
              <div
                key={meeting.id}
                className={`rounded-xl border ${styles.cardBg} ${styles.border} p-5 shadow-xs space-y-3 transition-all`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono">
                        {meeting.committeeName}
                      </span>
                      {meeting.minutesApproved && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aprovada
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-inherit mt-1 font-serif">
                      Ata da Sessão de {formatDateBR(meeting.date)} às {meeting.time}h
                    </h3>
                    <p className={`text-xs ${styles.textSecondary} mt-0.5 line-clamp-1`}>
                      Pauta: {meeting.topic}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
                    <button
                      onClick={() => exportMeetingMinutesToWord(meeting, settings)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border ${styles.border} ${styles.tableHoverBg} text-blue-700 dark:text-blue-300 transition-colors`}
                      title="Baixar Ata em arquivo Word (.doc)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Word (.doc)</span>
                    </button>
                    <button
                      onClick={() => setSelectedAtaMeeting(meeting)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs ${styles.btnPrimary}`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Visualizar & Imprimir Ata</span>
                    </button>
                  </div>
                </div>

                {/* Snippet */}
                {meeting.minutesText ? (
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs font-serif leading-relaxed line-clamp-3 text-slate-700 dark:text-slate-300">
                    {meeting.minutesText}
                  </div>
                ) : (
                  <p className="text-xs text-amber-500 italic">
                    Minuta da ata ainda não redigida nesta reunião.
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Local: {meeting.location}</span>
                  <span>
                    Presenças:{' '}
                    {meeting.attendances.filter((a) => a.status === 'presente').length} /{' '}
                    {meeting.attendances.length} membros
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Subtab 2: Termos de Justificativa */}
      {activeSubTab === 'justificativas' && (
        <div className="space-y-4">
          {allJustifications.length === 0 ? (
            <div
              className={`p-12 text-center rounded-xl border ${styles.cardBg} ${styles.border}`}
            >
              <ShieldCheck className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <h3 className="font-bold text-base text-inherit">Nenhum termo de justificativa</h3>
              <p className={`text-xs ${styles.textMuted} mt-1`}>
                Quando um vereador for marcado como "Ausente com Justificativa", o termo é gerado aqui.
              </p>
            </div>
          ) : (
            allJustifications.map(({ meeting, attendance }, i) => (
              <div
                key={i}
                className={`rounded-xl border ${styles.cardBg} ${styles.border} p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      Termo Homologado
                    </span>
                    <span className="text-xs font-bold text-inherit">{attendance.councilorName}</span>
                    <span className="text-xs text-slate-400">({attendance.committeeRole})</span>
                  </div>

                  <p className="text-xs font-medium text-inherit">
                    Comissão: {meeting.committeeName} • Data: {formatDateBR(meeting.date)} às {meeting.time}h
                  </p>

                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/40">
                    <span className="font-semibold text-amber-800 dark:text-amber-300">Motivo:</span>{' '}
                    {attendance.justificationReason || 'Compromisso Oficial / Motivo de Saúde'}
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Doc. Comprobatório: {attendance.justificationDocument || 'Protocolado na Secretaria'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => {
                      const c = councilors.find((c) => c.id === attendance.councilorId);
                      exportJustificationTermToWord(meeting, attendance, settings, c);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border ${styles.border} ${styles.tableHoverBg} text-blue-700 dark:text-blue-300 transition-colors`}
                    title="Baixar Termo em arquivo Word (.doc)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Word (.doc)</span>
                  </button>
                  <button
                    onClick={() => setSelectedJustification({ meeting, attendance })}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs ${styles.btnPrimary}`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Termo Assinado</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {selectedAtaMeeting && (
        <PrintAtaModal
          meeting={selectedAtaMeeting}
          isOpen={true}
          onClose={() => setSelectedAtaMeeting(null)}
        />
      )}

      {selectedJustification && (
        <JustificationModal
          meeting={selectedJustification.meeting}
          attendance={selectedJustification.attendance}
          isOpen={true}
          onClose={() => setSelectedJustification(null)}
        />
      )}
    </div>
  );
};
