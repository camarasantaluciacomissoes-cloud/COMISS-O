import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLegislative } from '../context/LegislativeContext';
import { Meeting, AttendanceRecord } from '../types';
import { Printer, X, ShieldCheck, Calendar, Clock, MapPin, User, FileText, Download } from 'lucide-react';
import { exportJustificationTermToWord } from '../utils/wordExport';

interface JustificationModalProps {
  meeting: Meeting;
  attendance: AttendanceRecord;
  isOpen: boolean;
  onClose: () => void;
}

export const JustificationModal: React.FC<JustificationModalProps> = ({
  meeting,
  attendance,
  isOpen,
  onClose,
}) => {
  const { styles } = useTheme();
  const { settings, councilors } = useLegislative();

  if (!isOpen) return null;

  const councilor = councilors.find((c) => c.id === attendance.councilorId);

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    exportJustificationTermToWord(meeting, attendance, settings, councilor);
  };

  // Format date
  const formatDateBR = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`relative w-full max-w-3xl rounded-xl shadow-2xl border ${styles.cardBg} ${styles.border} ${styles.textPrimary} max-h-[90vh] flex flex-col`}
      >
        {/* Header Bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${styles.border} print:hidden`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-lg">Termo Oficial de Justificativa de Ausência</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportWord}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${styles.border} ${styles.tableHoverBg} text-blue-700 dark:text-blue-300 transition-colors`}
              title="Baixar arquivo formatado para Microsoft Word (.doc)"
            >
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Exportar Word (.doc)</span>
            </button>
            <button
              onClick={handlePrint}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${styles.btnPrimary}`}
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-8 overflow-y-auto print:p-0 print:overflow-visible text-slate-800 bg-white">
          {/* Official Chamber Coat & Heading */}
          <div className="text-center pb-6 border-b-2 border-slate-800 mb-6">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-50 text-slate-800 font-serif font-bold text-xl shadow-xs">
                ⚖️
              </div>
            </div>
            <h1 className="text-lg font-bold tracking-wider uppercase font-serif">
              ESTADO DO PARANÁ
            </h1>
            <h2 className="text-xl font-extrabold uppercase font-serif tracking-tight text-slate-900">
              {settings.chamberName}
            </h2>
            <p className="text-xs text-slate-600 uppercase tracking-widest mt-0.5">
              PALÁCIO LEGISLATIVO MUNICIPAL • {settings.legislature}
            </p>
            <p className="text-xs text-slate-500">
              {settings.address} • Tel: {settings.phone} • CNPJ: {settings.cnpj}
            </p>
          </div>

          {/* Title */}
          <div className="text-center my-6">
            <span className="inline-block px-4 py-1 text-xs font-bold uppercase tracking-wider bg-slate-100 border border-slate-300 rounded text-slate-800 mb-2">
              Processo Legislativo de Justificativa
            </span>
            <h3 className="text-base font-bold uppercase text-slate-900 underline underline-offset-4 font-serif">
              TERMO DE JUSTIFICATIVA DE AUSÊNCIA EM REUNIÃO DE COMISSÃO
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              (Conforme disposições do Regimento Interno da Câmara Municipal)
            </p>
          </div>

          {/* Document Content */}
          <div className="space-y-4 text-sm leading-relaxed text-slate-800">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                I. DADOS DO PARLAMENTAR
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-600">Nome do Parlamentar:</span>{' '}
                  <span className="font-bold text-slate-900">{attendance.councilorName}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Partido Político:</span>{' '}
                  <span className="font-bold text-slate-900">{councilor?.politicalParty || attendance.politicalParty || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Cargo na Comissão:</span>{' '}
                  <span className="font-bold text-slate-900">{attendance.committeeRole || 'Membro'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Mandato:</span>{' '}
                  <span className="font-bold text-slate-900">{councilor?.legislature || settings.legislature}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                II. DADOS DA REUNIÃO PARLAMENTAR
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-600">Comissão Permanente:</span>{' '}
                  <span className="font-bold text-slate-900">{meeting.committeeName}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Data e Horário:</span>{' '}
                  <span className="font-bold text-slate-900">{formatDateBR(meeting.date)} às {meeting.time}h</span>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-slate-600">Local de Realização:</span>{' '}
                  <span className="font-bold text-slate-900">{meeting.location}</span>
                </div>
                <div className="col-span-2 mt-1">
                  <span className="font-semibold text-slate-600">Pauta da Ordem do Dia:</span>{' '}
                  <p className="text-slate-800 italic mt-0.5 bg-white p-2 rounded border border-slate-200">
                    {meeting.topic}
                  </p>
                </div>
              </div>
            </div>

            {/* Justification details */}
            <div className="border border-slate-300 p-4 rounded-lg">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-2">
                III. MOTIVAÇÃO E FUNDAMENTAÇÃO DA AUSÊNCIA
              </h4>
              <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-line bg-slate-50 p-3 rounded border border-slate-200 min-h-[60px]">
                {attendance.justificationReason || 'Motivo alegado em processo formal junto à Mesa Diretora e Secretaria Geral.'}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">Documento Comprobatório / Protocolo:</span>{' '}
                <span className="font-bold text-slate-900">
                  {attendance.justificationDocument || 'Protocolado nos autos da comissão sob registro oficial.'}
                </span>
              </div>
            </div>

            {/* Legal terms statement */}
            <div className="text-xs text-slate-600 italic bg-amber-50/60 p-3 rounded border border-amber-200/80">
              "Declaro, sob as penas da lei e em conformidade com o Regimento Interno desta Casa de Leis,
              a veracidade das informações e documentos apresentados para justificar a ausência à referida reunião de comissão,
              solicitando o deferimento do registro de Ausência Justificada nos anais do Poder Legislativo."
            </div>

            {/* Signatures */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center mt-6">
              <div>
                <div className="border-t border-slate-800 pt-2">
                  <p className="text-xs font-bold text-slate-900">{attendance.councilorName}</p>
                  <p className="text-[11px] text-slate-600">Vereador(a) Requerente</p>
                  <p className="text-[10px] text-emerald-700 font-medium mt-1">
                    {attendance.justificationSigned ? '✓ Termo Assinado e Validado' : 'Aguardando Assinatura'}
                  </p>
                </div>
              </div>

              <div>
                <div className="border-t border-slate-800 pt-2">
                  <p className="text-xs font-bold text-slate-900">{settings.presidentName}</p>
                  <p className="text-[11px] text-slate-600">Presidente / Direção da Mesa</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Visto e Homologado em {attendance.signatureDate ? formatDateBR(attendance.signatureDate) : formatDateBR(meeting.date)}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200 text-[10px] text-center text-slate-400">
              Autenticação de Registro Legislativo Digital • {settings.chamberName} • Sistema de Controle de Comissões
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-3 border-t ${styles.border} flex justify-end gap-2 print:hidden`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${styles.btnSecondary}`}
          >
            Fechar
          </button>
          <button
            onClick={handleExportWord}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border ${styles.border} ${styles.tableHoverBg} text-blue-700 dark:text-blue-300`}
          >
            <Download className="w-4 h-4" />
            Exportar Word (.doc)
          </button>
          <button
            onClick={handlePrint}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${styles.btnPrimary}`}
          >
            <Printer className="w-4 h-4" />
            Imprimir Termo
          </button>
        </div>
      </div>
    </div>
  );
};
