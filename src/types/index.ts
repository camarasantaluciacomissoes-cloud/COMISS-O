export type ThemeId = 'institucional_light' | 'civico_light' | 'midnight_dark' | 'carvao_dark';

export type TabKey =
  | 'dashboard'
  | 'reunioes'
  | 'comissoes'
  | 'vereadores'
  | 'relatorios'
  | 'atas'
  | 'configuracoes';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  category: 'Claro' | 'Escuro';
  description: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  cardColor: string;
}

export interface Councilor {
  id: string;
  name: string;
  nickname: string;
  politicalParty: string;
  role: string; // Ex: 'Vereador', 'Presidente da Câmara', 'Vice-Presidente', etc.
  email: string;
  phone: string;
  photoUrl: string;
  isActive: boolean;
  legislature: string;
  createdAt: string;
  updatedAt: string;
}

export type CommitteeMemberRole = 'Presidente' | 'Relator' | 'Membro';

export interface CommitteeMember {
  councilorId: string;
  councilorName: string;
  role: CommitteeMemberRole;
}

export interface Committee {
  id: string;
  name: string;
  acronym: string;
  description: string;
  legislature: string;
  members: CommitteeMember[]; // Formada por 3 vereadores
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'presente' | 'ausente_justificado' | 'ausente_injustificado';

export interface AttendanceRecord {
  councilorId: string;
  councilorName: string;
  politicalParty?: string;
  committeeRole?: CommitteeMemberRole;
  status: AttendanceStatus;
  justificationReason: string;
  justificationDocument: string; // Número de protocolo, atestado ou ofício
  justificationSigned: boolean;
  signatureDate?: string;
  signedByName?: string;
}

export type MeetingStatus = 'agendada' | 'realizada' | 'cancelada';

export interface Meeting {
  id: string;
  committeeId: string;
  committeeName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  topic: string; // Pauta / Ordem do Dia
  description: string; // Detalhes da pauta e matérias apreciadas
  status: MeetingStatus;
  attendances: AttendanceRecord[];
  minutesText: string; // Texto oficial da Ata
  minutesApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  id: string;
  chamberName: string;
  city: string;
  state: string;
  legislature: string;
  activeLegislatureId?: string;
  address: string;
  phone: string;
  cnpj: string;
  presidentName: string;
  activeTheme: ThemeId;
  updatedAt: string;
}

export interface Legislature {
  id: string;
  name: string; // Ex: '18ª Legislatura'
  period: string; // Ex: '2025 - 2028'
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  councilorIds: string[]; // IDs dos vereadores vinculados a este mandato
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
