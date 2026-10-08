import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLegislative } from '../context/LegislativeContext';
import { TabKey } from './Navbar';
import {
  CalendarDays,
  Users,
  CheckCircle,
  FileCheck2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Award,
  PlusCircle,
} from 'lucide-react';

interface DashboardTabProps {
  onNavigate: (tab: TabKey) => void;
  onOpenNewMeeting: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  onNavigate,
  onOpenNewMeeting,
}) => {
  const { styles } = useTheme();
  const { councilors, committees, meetings, settings } = useLegislative();

  // Computations
  const totalMeetings = meetings.length;
  const completedMeetings = meetings.filter((m) => m.status === 'realizada').length;
  const scheduledMeetings = meetings.filter((m) => m.status === 'agendada').length;

  // Attendance stats
  let totalAttendancesCount = 0;
  let presentCount = 0;
  let justifiedCount = 0;
  let unjustifiedCount = 0;

  meetings
    .filter((m) => m.status === 'realizada')
    .forEach((m) => {
      m.attendances.forEach((att) => {
        totalAttendancesCount++;
        if (att.status === 'presente') presentCount++;
        else if (att.status === 'ausente_justificado') justifiedCount++;
        else if (att.status === 'ausente_injustificado') unjustifiedCount++;
      });
    });

  const overallAttendanceRate =
    totalAttendancesCount > 0
      ? Math.round((presentCount / totalAttendancesCount) * 100)
      : 100;

  const activeCouncilorsCount = councilors.filter((c) => c.isActive).length;
  const activeCommitteesCount = committees.filter((c) => c.isActive).length;

  const upcomingMeetings = meetings
    .filter((m) => m.status === 'agendada')
    .slice(0, 3);

  const recentCompleted = meetings
    .filter((m) => m.status === 'realizada')
    .slice(0, 4);

  // Councilor presence summary
  const councilorPresenceSummary = councilors.map((c) => {
    let calls = 0;
    let present = 0;
    let justified = 0;
    let unjustified = 0;

    meetings
      .filter((m) => m.status === 'realizada')
      .forEach((m) => {
        const att = m.attendances.find((a) => a.councilorId === c.id);
        if (att) {
          calls++;
          if (att.status === 'presente') present++;
          else if (att.status === 'ausente_justificado') justified++;
          else if (att.status === 'ausente_injustificado') unjustified++;
        }
      });

    const rate = calls > 0 ? Math.round((present / calls) * 100) : 100;
    return {
      ...c,
      calls,
      present,
      justified,
      unjustified,
      rate,
    };
  });

  councilorPresenceSummary.sort((a, b) => b.rate - a.rate);

  return (
    <div className="space-y-6">
      {/* Top Welcome / Hero Banner */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border ${styles.cardBg} ${styles.border} shadow-sm`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Painel Legislativo
              </span>
              <span className={`text-xs ${styles.textMuted}`}>
                {settings.legislature}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-inherit">
              Comissões da {settings.chamberName}
            </h2>
            <p className={`text-sm ${styles.textSecondary} leading-relaxed`}>
              Gestão oficial de quórum, pautas, frequência regimental e formalização dos termos de justificativa de ausência parlamentar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewMeeting}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${styles.btnPrimary}`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Reunião</span>
            </button>
            <button
              onClick={() => onNavigate('relatorios')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${styles.btnSecondary}`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Gerar Relatório</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Meetings */}
        <div
          className={`p-5 rounded-xl border ${styles.cardBg} ${styles.border} shadow-xs flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${styles.textMuted}`}>
              Reuniões de Comissões
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-inherit">{totalMeetings}</span>
              <span className={`text-xs ${styles.textMuted}`}>sessões registradas</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {completedMeetings} realizadas
              </span>
              <span className={styles.textMuted}>•</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {scheduledMeetings} agendadas
              </span>
            </div>
          </div>
        </div>

        {/* Overall Attendance Rate */}
        <div
          className={`p-5 rounded-xl border ${styles.cardBg} ${styles.border} shadow-xs flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${styles.textMuted}`}>
              Assiduidade Geral
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {overallAttendanceRate}%
              </span>
              <span className={`text-xs ${styles.textMuted}`}>taxa de presença</span>
            </div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallAttendanceRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Committees */}
        <div
          className={`p-5 rounded-xl border ${styles.cardBg} ${styles.border} shadow-xs flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${styles.textMuted}`}>
              Comissões Regimentais
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-inherit">{activeCommitteesCount}</span>
              <span className={`text-xs ${styles.textMuted}`}>ativas na Casa</span>
            </div>
            <p className={`mt-2 text-xs ${styles.textSecondary}`}>
              Formadas por 3 vereadores cada (Presidente, Relator e Membro).
            </p>
          </div>
        </div>

        {/* Justifications */}
        <div
          className={`p-5 rounded-xl border ${styles.cardBg} ${styles.border} shadow-xs flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${styles.textMuted}`}>
              Termos de Justificativa
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                {justifiedCount}
              </span>
              <span className={`text-xs ${styles.textMuted}`}>ausências justificadas</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{unjustifiedCount} falta(s) sem justificativa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Meetings & Councilors Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Recent Meetings */}
        <div className={`lg:col-span-2 rounded-xl border ${styles.cardBg} ${styles.border} p-6 shadow-xs`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-inherit">Reuniões das Comissões</h3>
              <p className={`text-xs ${styles.textMuted}`}>
                Histórico recente e próximas sessões agendadas
              </p>
            </div>
            <button
              onClick={() => onNavigate('reunioes')}
              className={`flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-indigo-400 hover:underline`}
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {meetings.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-sm ${styles.textMuted}`}>
                  Nenhuma reunião registrada no sistema.
                </p>
              </div>
            ) : (
              meetings.slice(0, 5).map((m) => {
                const dateParts = m.date.split('-');
                const formattedDate =
                  dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : m.date;

                const presentMembers = m.attendances.filter((a) => a.status === 'presente').length;
                const justifiedMembers = m.attendances.filter((a) => a.status === 'ausente_justificado').length;

                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl border ${styles.border} ${styles.tableHoverBg} transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            m.status === 'realizada'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                              : m.status === 'agendada'
                              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                          }`}
                        >
                          {m.status}
                        </span>
                        <span className="text-xs font-bold text-inherit">{m.committeeName}</span>
                      </div>
                      <p className={`text-xs ${styles.textSecondary} line-clamp-1`}>
                        {m.topic}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {formattedDate} às {m.time}h
                        </span>
                        <span>•</span>
                        <span>{m.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                      <div className="text-right">
                        <div className="text-xs font-semibold">
                          <span className="text-emerald-600 dark:text-emerald-400">{presentMembers}</span>
                          <span className={styles.textMuted}>/</span>
                          <span>{m.attendances.length} presentes</span>
                        </div>
                        {justifiedMembers > 0 && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 block">
                            {justifiedMembers} justificativa(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 col: Councilor Assiduity Ranking */}
        <div className={`rounded-xl border ${styles.cardBg} ${styles.border} p-6 shadow-xs flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-inherit">Frequência dos Vereadores</h3>
                <p className={`text-xs ${styles.textMuted}`}>
                  Assiduidade regimental nas comissões
                </p>
              </div>
              <button
                onClick={() => onNavigate('vereadores')}
                className={`text-xs font-semibold text-blue-600 dark:text-indigo-400 hover:underline`}
              >
                Gerenciar
              </button>
            </div>

            <div className="space-y-3">
              {councilorPresenceSummary.slice(0, 6).map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={c.photoUrl}
                        alt={c.name}
                        className="w-6 h-6 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                        onError={(e) => {
                          // Fallback avatar
                          (e.target as HTMLImageElement).src =
                            'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.name);
                        }}
                      />
                      <span className="font-medium text-inherit">{c.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {c.politicalParty}
                      </span>
                    </div>
                    <span className="font-bold text-inherit">{c.rate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        c.rate >= 90
                          ? 'bg-emerald-500'
                          : c.rate >= 75
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${c.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-inherit">
            <button
              onClick={() => onNavigate('relatorios')}
              className={`w-full py-2 rounded-lg text-xs font-semibold text-center border ${styles.border} ${styles.tableHoverBg} transition-colors`}
            >
              Ver Relatório Completo de Assiduidade →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
