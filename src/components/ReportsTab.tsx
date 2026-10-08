import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLegislative } from '../context/LegislativeContext';
import { AttendanceStatus } from '../types';
import {
  FileSpreadsheet,
  Filter,
  Printer,
  Download,
  Calendar,
  User,
  Users2,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  RotateCcw,
  Landmark,
  FileText,
} from 'lucide-react';
import { exportReportToWord } from '../utils/wordExport';

export const ReportsTab: React.FC = () => {
  const { styles } = useTheme();
  const { meetings, councilors, committees, settings, legislatures, activeLegislature } = useLegislative();

  // Filters State
  const [selectedLegislatureId, setSelectedLegislatureId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCouncilorId, setSelectedCouncilorId] = useState<string>('all');
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>('all');
  const [searchTopic, setSearchTopic] = useState<string>('');
  const [presenceFilter, setPresenceFilter] = useState<string>('all');
  const [meetingStatusFilter, setMeetingStatusFilter] = useState<string>('all');

  // Quick preset filters
  const handleSetCurrentLegislature = () => {
    if (activeLegislature?.startDate && activeLegislature?.endDate) {
      setStartDate(activeLegislature.startDate);
      setEndDate(activeLegislature.endDate);
      setSelectedLegislatureId(activeLegislature.id);
    }
  };

  const handleSetCurrentYear = () => {
    const currentYear = new Date().getFullYear();
    setStartDate(`${currentYear}-01-01`);
    setEndDate(`${currentYear}-12-31`);
    setSelectedLegislatureId('all');
  };

  const handleSetCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setStartDate(`${year}-${month}-01`);
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    setEndDate(`${year}-${month}-${lastDay}`);
    setSelectedLegislatureId('all');
  };

  const handleResetFilters = () => {
    setSelectedLegislatureId('all');
    setStartDate('');
    setEndDate('');
    setSelectedCouncilorId('all');
    setSelectedCommitteeId('all');
    setSearchTopic('');
    setPresenceFilter('all');
    setMeetingStatusFilter('all');
  };

  // Process rows
  interface ReportRow {
    meetingId: string;
    meetingDate: string;
    meetingTime: string;
    committeeName: string;
    committeeId: string;
    topic: string;
    councilorId: string;
    councilorName: string;
    politicalParty: string;
    committeeRole: string;
    status: AttendanceStatus;
    justificationReason: string;
    justificationDocument: string;
    justificationSigned: boolean;
  }

  const filteredData = useMemo(() => {
    const rows: ReportRow[] = [];

    meetings.forEach((meeting) => {
      // Filter meeting status
      if (meetingStatusFilter !== 'all' && meeting.status !== meetingStatusFilter) {
        return;
      }

      // Filter date range
      if (startDate && meeting.date < startDate) return;
      if (endDate && meeting.date > endDate) return;

      // Filter committee
      if (selectedCommitteeId !== 'all' && meeting.committeeId !== selectedCommitteeId) {
        return;
      }

      // Filter topic
      if (
        searchTopic.trim() &&
        !meeting.topic.toLowerCase().includes(searchTopic.toLowerCase()) &&
        !meeting.description.toLowerCase().includes(searchTopic.toLowerCase())
      ) {
        return;
      }

      // Iterate through attendances
      meeting.attendances.forEach((att) => {
        // Filter councilor
        if (selectedCouncilorId !== 'all' && att.councilorId !== selectedCouncilorId) {
          return;
        }

        // Filter presence
        if (presenceFilter !== 'all' && att.status !== presenceFilter) {
          return;
        }

        const councilorObj = councilors.find((c) => c.id === att.councilorId);

        rows.push({
          meetingId: meeting.id,
          meetingDate: meeting.date,
          meetingTime: meeting.time,
          committeeName: meeting.committeeName,
          committeeId: meeting.committeeId,
          topic: meeting.topic,
          councilorId: att.councilorId,
          councilorName: att.councilorName,
          politicalParty: councilorObj?.politicalParty || att.politicalParty || '',
          committeeRole: att.committeeRole || 'Membro',
          status: att.status,
          justificationReason: att.justificationReason,
          justificationDocument: att.justificationDocument,
          justificationSigned: att.justificationSigned,
        });
      });
    });

    // Sort by date desc, then committee, then councilor
    rows.sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
    return rows;
  }, [
    meetings,
    councilors,
    startDate,
    endDate,
    selectedCouncilorId,
    selectedCommitteeId,
    searchTopic,
    presenceFilter,
    meetingStatusFilter,
  ]);

  // Aggregate statistics
  const totalCalls = filteredData.length;
  const presentsCount = filteredData.filter((r) => r.status === 'presente').length;
  const justifiedCount = filteredData.filter((r) => r.status === 'ausente_justificado').length;
  const unjustifiedCount = filteredData.filter((r) => r.status === 'ausente_injustificado').length;
  const assiduityRate = totalCalls > 0 ? Math.round((presentsCount / totalCalls) * 100) : 100;

  // Aggregate per councilor in filter
  const councilorBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { name: string; party: string; total: number; present: number; justified: number; unjustified: number }
    >();

    filteredData.forEach((r) => {
      if (!map.has(r.councilorId)) {
        map.set(r.councilorId, {
          name: r.councilorName,
          party: r.politicalParty,
          total: 0,
          present: 0,
          justified: 0,
          unjustified: 0,
        });
      }
      const entry = map.get(r.councilorId)!;
      entry.total++;
      if (r.status === 'presente') entry.present++;
      else if (r.status === 'ausente_justificado') entry.justified++;
      else if (r.status === 'ausente_injustificado') entry.unjustified++;
    });

    return Array.from(map.values()).sort(
      (a, b) => (b.present / (b.total || 1)) - (a.present / (a.total || 1))
    );
  }, [filteredData]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('Não há dados filtrados para exportar.');
      return;
    }

    const headers = [
      'Data da Reunião',
      'Horário',
      'Comissão',
      'Pauta',
      'Vereador',
      'Partido',
      'Função na Comissão',
      'Situação de Frequência',
      'Motivo da Justificativa',
      'Documento de Justificativa',
      'Termo Assinado',
    ];

    const rows = filteredData.map((r) => [
      r.meetingDate,
      r.meetingTime,
      `"${r.committeeName.replace(/"/g, '""')}"`,
      `"${r.topic.replace(/"/g, '""')}"`,
      `"${r.councilorName.replace(/"/g, '""')}"`,
      r.politicalParty,
      r.committeeRole,
      r.status === 'presente'
        ? 'Presente'
        : r.status === 'ausente_justificado'
        ? 'Ausente com Justificativa'
        : 'Ausente sem Justificativa',
      `"${(r.justificationReason || '').replace(/"/g, '""')}"`,
      `"${(r.justificationDocument || '').replace(/"/g, '""')}"`,
      r.justificationSigned ? 'Sim' : 'Não',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Relatorio_Comissoes_${settings.chamberName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    if (filteredData.length === 0) {
      alert('Não há dados filtrados para exportar.');
      return;
    }

    const filtersSummary = [
      startDate || endDate ? `Período: ${startDate || 'Início'} até ${endDate || 'Hoje'}` : '',
      selectedCommitteeId !== 'all'
        ? `Comissão: ${committees.find((c) => c.id === selectedCommitteeId)?.name || ''}`
        : 'Todas as Comissões',
      selectedCouncilorId !== 'all'
        ? `Vereador: ${councilors.find((c) => c.id === selectedCouncilorId)?.name || ''}`
        : 'Todos os Vereadores',
      searchTopic ? `Pauta: "${searchTopic}"` : '',
      presenceFilter !== 'all' ? `Presença: ${presenceFilter}` : '',
    ]
      .filter(Boolean)
      .join(' • ');

    exportReportToWord(filteredData, settings, filtersSummary, {
      total: totalCalls,
      present: presentsCount,
      justified: justifiedCount,
      unjustified: unjustifiedCount,
      rate: assiduityRate,
    });
  };

  const formatDateBR = (iso: string) => {
    if (!iso) return '';
    const parts = iso.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-inherit">
            Relatórios Parlamentares & Frequência
          </h2>
          <p className={`text-xs sm:text-sm ${styles.textMuted}`}>
            Filtre por período, comissão, vereador e pauta com exportação para Word, PDF e planilha
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportWord}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border ${styles.border} ${styles.tableHoverBg} text-blue-700 dark:text-blue-300 transition-colors`}
            title="Exportar relatório formatado para Microsoft Word (.doc)"
          >
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Exportar Word (.doc)</span>
          </button>
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border ${styles.border} ${styles.tableHoverBg} transition-colors`}
            title="Exportar planilha compatível com Excel (.csv)"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium shadow-sm ${styles.btnPrimary}`}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* FILTERS PANEL */}
      <div
        className={`p-5 rounded-xl border ${styles.cardBg} ${styles.border} shadow-xs space-y-4 print:hidden`}
      >
        <div className="flex items-center justify-between border-b pb-3 border-inherit">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm text-inherit">Filtros Avançados de Consulta</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSetCurrentLegislature}
              className={`text-xs px-2.5 py-1 rounded-md border ${styles.border} ${styles.tableHoverBg} font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10`}
              title="Filtrar pelo período da legislatura ativa"
            >
              ★ {activeLegislature?.period || '2025-2028'}
            </button>
            <button
              onClick={handleSetCurrentMonth}
              className={`text-xs px-2.5 py-1 rounded-md border ${styles.border} ${styles.tableHoverBg}`}
            >
              Mês Atual
            </button>
            <button
              onClick={handleSetCurrentYear}
              className={`text-xs px-2.5 py-1 rounded-md border ${styles.border} ${styles.tableHoverBg}`}
            >
              Ano Atual
            </button>
            <button
              onClick={handleResetFilters}
              className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200`}
            >
              <RotateCcw className="w-3 h-3" />
              Limpar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Legislature */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Legislatura
            </label>
            <select
              value={selectedLegislatureId}
              onChange={(e) => {
                const legId = e.target.value;
                setSelectedLegislatureId(legId);
                if (legId === 'all') {
                  setStartDate('');
                  setEndDate('');
                } else {
                  const leg = legislatures.find((l) => l.id === legId);
                  if (leg?.startDate && leg?.endDate) {
                    setStartDate(leg.startDate);
                    setEndDate(leg.endDate);
                  }
                }
              }}
              className={`w-full px-3 py-1.5 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
            >
              <option value="all">Todas as Legislaturas</option>
              {legislatures.map((leg) => (
                <option key={leg.id} value={leg.id}>
                  {leg.name} ({leg.period}) {leg.isActive ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
            />
          </div>

          {/* Select Committee */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Comissão Permanente
            </label>
            <select
              value={selectedCommitteeId}
              onChange={(e) => setSelectedCommitteeId(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
            >
              <option value="all">Todas as Comissões</option>
              {committees.map((com) => (
                <option key={com.id} value={com.id}>
                  {com.acronym} - {com.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Councilor */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Vereador(a)
            </label>
            <select
              value={selectedCouncilorId}
              onChange={(e) => setSelectedCouncilorId(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
            >
              <option value="all">Todos os Vereadores</option>
              {councilors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.politicalParty})
                </option>
              ))}
            </select>
          </div>

          {/* Topic search */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Palavra-chave na Pauta
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                placeholder="Ex: orçamento, saúde, tributário, zoneamento..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
              />
            </div>
          </div>

          {/* Presence Status */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tipo de Presença
            </label>
            <select
              value={presenceFilter}
              onChange={(e) => setPresenceFilter(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
            >
              <option value="all">Todas as Situações</option>
              <option value="presente">Apenas Presentes</option>
              <option value="ausente_justificado">Apenas Ausências Justificadas</option>
              <option value="ausente_injustificado">Apenas Faltas sem Justificativa</option>
            </select>
          </div>

          {/* Meeting Status */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Situação da Reunião
            </label>
            <select
              value={meetingStatusFilter}
              onChange={(e) => setMeetingStatusFilter(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-lg text-xs sm:text-sm border ${styles.inputBg}`}
            >
              <option value="all">Todas as Reuniões</option>
              <option value="realizada">Realizadas</option>
              <option value="agendada">Agendadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <div className={`p-4 rounded-xl border ${styles.cardBg} ${styles.border} shadow-xs`}>
          <span className={`text-[11px] font-bold uppercase text-slate-500`}>Registros Encontrados</span>
          <p className="text-2xl font-extrabold text-inherit mt-1">{totalCalls}</p>
        </div>

        <div className={`p-4 rounded-xl border ${styles.cardBg} ${styles.border} shadow-xs`}>
          <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
            Presenças Confirmadas
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {presentsCount} <span className="text-xs font-medium">({assiduityRate}%)</span>
          </p>
        </div>

        <div className={`p-4 rounded-xl border ${styles.cardBg} ${styles.border} shadow-xs`}>
          <span className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400">
            Ausências Justificadas
          </span>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {justifiedCount}
          </p>
        </div>

        <div className={`p-4 rounded-xl border ${styles.cardBg} ${styles.border} shadow-xs`}>
          <span className="text-[11px] font-bold uppercase text-rose-600 dark:text-rose-400">
            Faltas sem Justificativa
          </span>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {unjustifiedCount}
          </p>
        </div>
      </div>

      {/* COUNCILOR ATTENDANCE RANKING (IF MULTIPLE) */}
      {councilorBreakdown.length > 1 && (
        <div className={`p-5 rounded-xl border ${styles.cardBg} ${styles.border} shadow-xs print:hidden space-y-3`}>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            <h4 className="font-bold text-sm text-inherit">Índice Comparativo de Assiduidade nos Filtros</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {councilorBreakdown.map((item, idx) => {
              const rate = Math.round((item.present / item.total) * 100);
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${styles.border} ${styles.tableHoverBg} space-y-1`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-inherit truncate max-w-[130px]">{item.name}</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{rate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>{item.present} presenças</span>
                    <span>{item.justified} justif.</span>
                    {item.unjustified > 0 && <span className="text-rose-500">{item.unjustified} faltas</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REPORT PRINTABLE TABLE CONTAINER */}
      <div
        className={`rounded-xl border ${styles.cardBg} ${styles.border} shadow-xs overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black`}
      >
        {/* Printable Official Document Header (Visible in print or clean view) */}
        <div className="hidden print:block text-center pb-6 border-b-2 border-slate-900 mb-6 p-6">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center font-serif font-bold text-lg">
              ⚖️
            </div>
          </div>
          <h1 className="text-sm font-bold tracking-wider uppercase font-serif">
            ESTADO DO PARANÁ
          </h1>
          <h2 className="text-lg font-extrabold uppercase font-serif tracking-tight text-slate-900">
            {settings.chamberName}
          </h2>
          <p className="text-[11px] text-slate-600 uppercase tracking-widest mt-0.5">
            RELATÓRIO OFICIAL DE FREQUÊNCIA E REUNIÕES DE COMISSÕES • {settings.legislature}
          </p>
          <p className="text-[10px] text-slate-500">
            Emissão em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`${styles.tableHeadBg} border-b ${styles.border} uppercase text-[10px] tracking-wider font-bold`}>
              <tr>
                <th className="p-3.5">Data / Hora</th>
                <th className="p-3.5">Comissão</th>
                <th className="p-3.5">Vereador(a)</th>
                <th className="p-3.5">Função</th>
                <th className="p-3.5">Frequência</th>
                <th className="p-3.5">Pauta Deliberada</th>
                <th className="p-3.5">Justificativa / Termo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, i) => (
                  <tr key={i} className={`${styles.tableHoverBg} transition-colors`}>
                    <td className="p-3.5 whitespace-nowrap font-medium text-inherit">
                      {formatDateBR(row.meetingDate)}
                      <span className="text-[10px] text-slate-400 block">{row.meetingTime}h</span>
                    </td>
                    <td className="p-3.5 font-semibold text-inherit whitespace-nowrap">
                      {row.committeeName}
                    </td>
                    <td className="p-3.5 font-bold text-inherit whitespace-nowrap">
                      {row.councilorName}
                      <span className="text-[10px] font-normal text-slate-400 block font-mono">
                        {row.politicalParty}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {row.committeeRole}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          row.status === 'presente'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : row.status === 'ausente_justificado'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {row.status === 'presente'
                          ? 'Presente'
                          : row.status === 'ausente_justificado'
                          ? 'Ausente (Justificado)'
                          : 'Ausente (Falta)'}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-300 truncate" title={row.topic}>
                      {row.topic}
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-500 max-w-xs">
                      {row.status === 'ausente_justificado' ? (
                        <div>
                          <span className="font-semibold text-amber-700 dark:text-amber-400 block truncate">
                            {row.justificationReason || 'Tratamento de Saúde/Compromisso'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Doc: {row.justificationDocument || 'Termo Assinado'}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Footer with Signatures */}
        <div className="hidden print:block pt-16 p-8 border-t border-slate-300 text-center">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <div className="border-t border-slate-900 pt-2">
                <p className="text-xs font-bold">{settings.presidentName}</p>
                <p className="text-[11px] text-slate-600">Presidente da Câmara Municipal</p>
              </div>
            </div>
            <div>
              <div className="border-t border-slate-900 pt-2">
                <p className="text-xs font-bold">Diretoria Legislativa e Comissões</p>
                <p className="text-[11px] text-slate-600">Certidão de Frequência Regimental</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
