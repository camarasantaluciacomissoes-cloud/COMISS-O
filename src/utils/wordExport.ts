import { Meeting, AttendanceRecord, SystemSettings, Councilor } from '../types';

/**
 * Exports formatted HTML content into a Microsoft Word compatible (.doc) file
 * with clean XML headers, page margins, official styling, tables and borders.
 */
export function downloadWordDocument(filename: string, htmlContent: string) {
  const header = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${filename}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: 21.0cm 29.7cm; /* A4 */
    margin: 2.5cm 2.0cm 2.5cm 2.0cm;
    mso-page-orientation: portrait;
  }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #000000;
  }
  h1 { font-size: 14pt; font-weight: bold; text-align: center; margin: 0 0 4pt 0; text-transform: uppercase; }
  h2 { font-size: 16pt; font-weight: bold; text-align: center; margin: 0 0 4pt 0; text-transform: uppercase; }
  h3 { font-size: 13pt; font-weight: bold; text-align: center; margin: 12pt 0 6pt 0; text-transform: uppercase; }
  p { margin: 0 0 6pt 0; text-align: justify; }
  .text-center { text-align: center; }
  .text-justify { text-align: justify; }
  .header-box { border-bottom: 2pt solid #000000; padding-bottom: 12pt; margin-bottom: 18pt; text-align: center; }
  .sub-header { font-size: 10pt; color: #333333; margin: 2pt 0; }
  table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 10.5pt; }
  th, td { border: 1pt solid #000000; padding: 6pt; text-align: left; }
  th { background-color: #f2f2f2; font-weight: bold; }
  .badge { display: inline-block; padding: 2pt 6pt; font-size: 9pt; font-weight: bold; border-radius: 3pt; }
  .section-box { border: 1pt solid #999999; background-color: #fafafa; padding: 8pt; margin: 10pt 0; }
  .signatures { margin-top: 35pt; width: 100%; border: none; }
  .signatures td { border: none; text-align: center; vertical-align: top; padding: 12pt 15pt; width: 50%; }
  .sig-line { border-top: 1pt solid #000000; padding-top: 4pt; font-size: 10pt; font-weight: bold; }
  .sig-role { font-size: 9pt; color: #444444; }
  .watermark-footer { margin-top: 25pt; border-top: 1pt solid #cccccc; padding-top: 6pt; font-size: 8.5pt; color: #666666; text-align: center; }
</style>
</head>
<body>`;

  const footer = `</body></html>`;
  const fullDocument = header + htmlContent + footer;

  const blob = new Blob(['\ufeff' + fullDocument], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const formatDateBR = (isoDate: string) => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : isoDate;
};

/**
 * Builds and downloads official Word document for Meeting Minutes (Ata)
 */
export function exportMeetingMinutesToWord(meeting: Meeting, settings: SystemSettings) {
  const formattedDate = formatDateBR(meeting.date);

  let attendancesRows = '';
  meeting.attendances.forEach((att) => {
    const statusText =
      att.status === 'presente'
        ? 'PRESENTE'
        : att.status === 'ausente_justificado'
        ? 'AUSENTE COM JUSTIFICATIVA'
        : 'AUSENTE SEM JUSTIFICATIVA (FALTA)';

    const justificationInfo =
      att.status === 'ausente_justificado'
        ? `${att.justificationReason || 'Tratamento de Saúde / Ofício'} (Doc: ${att.justificationDocument || 'Termo Homologado'})`
        : '-';

    attendancesRows += `
      <tr>
        <td><b>${att.councilorName}</b></td>
        <td>${att.committeeRole || 'Membro'}</td>
        <td><b>${statusText}</b></td>
        <td>${justificationInfo}</td>
      </tr>
    `;
  });

  let signaturesCells = '';
  meeting.attendances.forEach((att) => {
    signaturesCells += `
      <td style="border: none; text-align: center; vertical-align: top; padding: 15pt;">
        <div style="border-top: 1pt solid #000000; padding-top: 4pt;">
          <b>${att.councilorName}</b><br/>
          <span style="font-size: 9pt;">${att.committeeRole || 'Membro da Comissão'}</span>
        </div>
      </td>
    `;
  });

  const html = `
    <div class="header-box">
      <h1>ESTADO DO PARANÁ</h1>
      <h2>${settings.chamberName}</h2>
      <p class="sub-header">PALÁCIO LEGISLATIVO MUNICIPAL • ${settings.legislature}</p>
      <p class="sub-header">${settings.address} • Tel: ${settings.phone} • CNPJ: ${settings.cnpj}</p>
    </div>

    <div class="text-center" style="margin: 15pt 0;">
      <p style="font-size: 10pt; text-align: center; font-weight: bold; letter-spacing: 1pt;">PROCESSO LEGISLATIVO • REGISTRO DE SESSÃO</p>
      <h3>ATA DA REUNIÃO DA ${meeting.committeeName.toUpperCase()}</h3>
      <p style="font-size: 10pt; text-align: center;">Data: ${formattedDate} às ${meeting.time}h | Local: ${meeting.location}</p>
    </div>

    <div style="margin: 15pt 0; text-align: justify; line-height: 1.6;">
      <p><b>ORDEM DO DIA / PAUTA DA SESSÃO:</b><br/>
      ${meeting.topic}</p>
      
      ${meeting.description ? `<p><b>OBSERVAÇÕES E MATÉRIAS:</b><br/>${meeting.description}</p>` : ''}
      
      <p><b>TEXTO OFICIAL DA ATA:</b></p>
      <div style="border: 1pt solid #cccccc; background-color: #fcfcfc; padding: 10pt; margin: 10pt 0; white-space: pre-line;">
        ${meeting.minutesText || 'A ata desta reunião ainda está em fase de redação e aprovação regimental.'}
      </div>
    </div>

    <div style="margin-top: 18pt;">
      <p><b>REGISTRO REGIMENTAL DE FREQUÊNCIA E QUÓRUM:</b></p>
      <table>
        <thead>
          <tr>
            <th>Vereador(a)</th>
            <th>Função na Comissão</th>
            <th>Situação</th>
            <th>Justificativa / Documento</th>
          </tr>
        </thead>
        <tbody>
          ${attendancesRows}
        </tbody>
      </table>
    </div>

    <div style="margin-top: 35pt;">
      <p class="text-center" style="font-size: 10pt; margin-bottom: 15pt;"><b>ASSINATURAS DOS MEMBROS DA COMISSÃO:</b></p>
      <table style="border: none; width: 100%;">
        <tr>
          ${signaturesCells}
        </tr>
      </table>
    </div>

    <div class="watermark-footer">
      Documento gerado oficialmente pelo Sistema de Gestão das Comissões • ${settings.chamberName} • Emissão em ${new Date().toLocaleDateString('pt-BR')}
    </div>
  `;

  const cleanName = `Ata_${meeting.committeeName.replace(/[^a-zA-Z0-9]/g, '_')}_${meeting.date}`;
  downloadWordDocument(cleanName, html);
}

/**
 * Builds and downloads official Word document for Justification Term
 */
export function exportJustificationTermToWord(
  meeting: Meeting,
  attendance: AttendanceRecord,
  settings: SystemSettings,
  councilor?: Councilor
) {
  const formattedDate = formatDateBR(meeting.date);
  const signatureDate = attendance.signatureDate ? formatDateBR(attendance.signatureDate) : formattedDate;

  const html = `
    <div class="header-box">
      <h1>ESTADO DO PARANÁ</h1>
      <h2>${settings.chamberName}</h2>
      <p class="sub-header">PALÁCIO LEGISLATIVO MUNICIPAL • ${settings.legislature}</p>
      <p class="sub-header">${settings.address} • Tel: ${settings.phone} • CNPJ: ${settings.cnpj}</p>
    </div>

    <div class="text-center" style="margin: 15pt 0;">
      <p style="font-size: 10pt; text-align: center; font-weight: bold; letter-spacing: 1pt;">PROCESSO LEGISLATIVO DE JUSTIFICATIVA</p>
      <h3>TERMO OFICIAL DE JUSTIFICATIVA DE AUSÊNCIA EM REUNIÃO DE COMISSÃO</h3>
      <p style="font-size: 9.5pt; text-align: center; color: #555555;">(Conforme disposições do Regimento Interno da Câmara Municipal)</p>
    </div>

    <table style="margin: 12pt 0;">
      <tr>
        <th colspan="2" style="background-color: #eaeaea;">I. IDENTIFICAÇÃO DO PARLAMENTAR</th>
      </tr>
      <tr>
        <td style="width: 50%;"><b>Nome do Parlamentar:</b> ${attendance.councilorName}</td>
        <td style="width: 50%;"><b>Partido Político:</b> ${councilor?.politicalParty || attendance.politicalParty || 'N/A'}</td>
      </tr>
      <tr>
        <td><b>Cargo na Comissão:</b> ${attendance.committeeRole || 'Membro'}</td>
        <td><b>Legislatura:</b> ${councilor?.legislature || settings.legislature}</td>
      </tr>
    </table>

    <table style="margin: 12pt 0;">
      <tr>
        <th colspan="2" style="background-color: #eaeaea;">II. DADOS DA REUNIÃO PARLAMENTAR</th>
      </tr>
      <tr>
        <td style="width: 50%;"><b>Comissão Permanente:</b> ${meeting.committeeName}</td>
        <td style="width: 50%;"><b>Data e Horário:</b> ${formattedDate} às ${meeting.time}h</td>
      </tr>
      <tr>
        <td colspan="2"><b>Local:</b> ${meeting.location}</td>
      </tr>
      <tr>
        <td colspan="2"><b>Pauta da Ordem do Dia:</b><br/>${meeting.topic}</td>
      </tr>
    </table>

    <table style="margin: 12pt 0;">
      <tr>
        <th style="background-color: #eaeaea;">III. MOTIVAÇÃO E FUNDAMENTAÇÃO DA AUSÊNCIA</th>
      </tr>
      <tr>
        <td style="padding: 10pt;">
          <p><b>Motivo Declarado:</b><br/>
          ${attendance.justificationReason || 'Compromisso oficial inadiável / tratamento de saúde justificado conforme regimento.'}</p>
          <p style="margin-top: 8pt;"><b>Documento Comprobatório / Protocolo:</b><br/>
          ${attendance.justificationDocument || 'Protocolado junto à Secretaria Geral da Câmara Municipal.'}</p>
        </td>
      </tr>
    </table>

    <div style="border: 1pt solid #dddddd; background-color: #fbfbfb; padding: 10pt; margin: 15pt 0; font-size: 10pt; text-align: justify; font-style: italic;">
      "Declaro, sob as penas da lei e em conformidade com o Regimento Interno desta Casa de Leis,
      a veracidade das informações e documentos apresentados para justificar a ausência à referida reunião de comissão,
      solicitando o deferimento do registro de Ausência Justificada nos anais do Poder Legislativo."
    </div>

    <table class="signatures" style="margin-top: 40pt;">
      <tr>
        <td>
          <div class="sig-line">
            ${attendance.councilorName}<br/>
            <span class="sig-role">Vereador(a) Requerente</span><br/>
            <span style="font-size: 8.5pt; color: green;">${attendance.justificationSigned ? '✓ Termo Assinado e Homologado' : 'Aguardando Assinatura'}</span>
          </div>
        </td>
        <td>
          <div class="sig-line">
            ${settings.presidentName}<br/>
            <span class="sig-role">Presidente / Direção da Mesa</span><br/>
            <span style="font-size: 8.5pt; color: #555555;">Visto e Homologado em ${signatureDate}</span>
          </div>
        </td>
      </tr>
    </table>

    <div class="watermark-footer">
      Autenticação de Registro Legislativo Digital • ${settings.chamberName} • Sistema de Controle de Comissões
    </div>
  `;

  const cleanName = `Termo_Justificativa_${attendance.councilorName.replace(/[^a-zA-Z0-9]/g, '_')}_${meeting.date}`;
  downloadWordDocument(cleanName, html);
}

/**
 * Builds and downloads official Word document for Analytics Report
 */
export function exportReportToWord(
  rows: any[],
  settings: SystemSettings,
  filterDescription: string,
  stats: { total: number; present: number; justified: number; unjustified: number; rate: number }
) {
  let tableRows = '';
  rows.forEach((r) => {
    const statusText =
      r.status === 'presente'
        ? 'Presente'
        : r.status === 'ausente_justificado'
        ? 'Ausente (Justificado)'
        : 'Ausente (Falta)';

    const justifText =
      r.status === 'ausente_justificado'
        ? `${r.justificationReason || 'Atestado'} (${r.justificationDocument || 'Assinado'})`
        : '-';

    tableRows += `
      <tr>
        <td>${formatDateBR(r.meetingDate)} ${r.meetingTime}h</td>
        <td>${r.committeeName}</td>
        <td><b>${r.councilorName}</b> (${r.politicalParty})</td>
        <td>${r.committeeRole}</td>
        <td><b>${statusText}</b></td>
        <td>${r.topic}</td>
        <td>${justifText}</td>
      </tr>
    `;
  });

  const html = `
    <div class="header-box">
      <h1>ESTADO DO PARANÁ</h1>
      <h2>${settings.chamberName}</h2>
      <p class="sub-header">PALÁCIO LEGISLATIVO MUNICIPAL • ${settings.legislature}</p>
      <p class="sub-header">${settings.address} • Tel: ${settings.phone} • CNPJ: ${settings.cnpj}</p>
    </div>

    <div class="text-center" style="margin: 15pt 0;">
      <h3>RELATÓRIO OFICIAL DE FREQUÊNCIA EM REUNIÕES DE COMISSÕES</h3>
      <p style="font-size: 10pt; color: #444444;">Filtros aplicados: ${filterDescription}</p>
      <p style="font-size: 9.5pt; color: #666666;">Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
    </div>

    <table style="margin: 15pt 0;">
      <tr>
        <th style="text-align: center;">Total de Registros</th>
        <th style="text-align: center;">Presenças Confirmadas</th>
        <th style="text-align: center;">Ausências Justificadas</th>
        <th style="text-align: center;">Faltas sem Justificativa</th>
        <th style="text-align: center;">Taxa de Assiduidade Geral</th>
      </tr>
      <tr>
        <td style="text-align: center; font-size: 13pt;"><b>${stats.total}</b></td>
        <td style="text-align: center; font-size: 13pt; color: green;"><b>${stats.present}</b></td>
        <td style="text-align: center; font-size: 13pt; color: #b45309;"><b>${stats.justified}</b></td>
        <td style="text-align: center; font-size: 13pt; color: red;"><b>${stats.unjustified}</b></td>
        <td style="text-align: center; font-size: 13pt; color: green;"><b>${stats.rate}%</b></td>
      </tr>
    </table>

    <div style="margin-top: 15pt;">
      <p><b>DETALHAMENTO DOS REGISTROS:</b></p>
      <table>
        <thead>
          <tr>
            <th>Data / Hora</th>
            <th>Comissão</th>
            <th>Vereador</th>
            <th>Função</th>
            <th>Frequência</th>
            <th>Pauta Apreciada</th>
            <th>Justificativa</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows || '<tr><td colspan="7" style="text-align: center;">Nenhum registro encontrado.</td></tr>'}
        </tbody>
      </table>
    </div>

    <table class="signatures" style="margin-top: 40pt;">
      <tr>
        <td>
          <div class="sig-line">
            ${settings.presidentName}<br/>
            <span class="sig-role">Presidente da Câmara Municipal</span>
          </div>
        </td>
        <td>
          <div class="sig-line">
            Diretoria de Apoio às Comissões Permanentes<br/>
            <span class="sig-role">Certidão Oficial de Frequência</span>
          </div>
        </td>
      </tr>
    </table>

    <div class="watermark-footer">
      Relatório gerado oficialmente pelo Sistema de Gestão Legislativa • ${settings.chamberName}
    </div>
  `;

  const cleanName = `Relatorio_Frequencia_Comissoes_${new Date().toISOString().split('T')[0]}`;
  downloadWordDocument(cleanName, html);
}
