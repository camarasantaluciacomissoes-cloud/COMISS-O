import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testConnection } from '../firebase/config';
import { Councilor, Committee, Meeting, SystemSettings, ThemeId, Legislature } from '../types';

export const DEFAULT_LEGISLATURES: Legislature[] = [
  {
    id: 'leg-2025-2028',
    name: '18ª Legislatura',
    period: '2025 - 2028',
    startDate: '2025-01-01',
    endDate: '2028-12-31',
    isActive: true,
    councilorIds: ['c-01', 'c-02', 'c-03', 'c-04', 'c-05', 'c-06', 'c-07', 'c-08'],
    notes: 'Legislatura constitucional em exercício na Câmara Municipal de Santa Lúcia - PR.',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_SETTINGS: SystemSettings = {
  id: 'system',
  chamberName: 'Câmara Municipal de Santa Lúcia - PR',
  city: 'Santa Lúcia',
  state: 'PR',
  legislature: '2025 - 2028 (18ª Legislatura)',
  activeLegislatureId: 'leg-2025-2028',
  address: 'Rua das Palmeiras, 150 - Centro, Santa Lúcia - PR',
  phone: '(45) 3288-1200',
  cnpj: '78.291.402/0001-89',
  presidentName: 'Carlos Eduardo Silva',
  activeTheme: 'institucional_light',
  updatedAt: new Date().toISOString(),
};

export const INITIAL_COUNCILORS: Councilor[] = [
  {
    id: 'c-01',
    name: 'Carlos Eduardo Silva',
    nickname: 'Carlinhos da Saúde',
    politicalParty: 'PSD',
    role: 'Presidente da Câmara',
    email: 'carlinhos@camarasantalucia.pr.gov.br',
    phone: '(45) 99811-0101',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    isActive: true,
    legislature: '2025 - 2028',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c-02',
    name: 'Ana Paula Guimarães',
    nickname: 'Professora Ana',
    politicalParty: 'MDB',
    role: 'Vice-Presidente',
    email: 'anapaula@camarasantalucia.pr.gov.br',
    phone: '(45) 99811-0102',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    isActive: true,
    legislature: '2025 - 2028',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c-03',
    name: 'Roberto Santos de Oliveira',
    nickname: 'Betinho',
    politicalParty: 'PP',
    role: '1º Secretário',
    email: 'betinho@camarasantalucia.pr.gov.br',
    phone: '(45) 99811-0103',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    isActive: true,
    legislature: '2025 - 2028',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c-04',
    name: 'Marcos Vinicius Pereira',
    nickname: 'Marcão do Povo',
    politicalParty: 'UNIÃO',
    role: '2º Secretário',
    email: 'marcao@camarasantalucia.pr.gov.br',
    phone: '(45) 99811-0104',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    isActive: true,
    legislature: '2025 - 2028',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c-05',
    name: 'Juliana Mendes Ferreira',
    nickname: 'Juliana do Transporte',
    politicalParty: 'PL',
    role: 'Vereadora',
    email: 'juliana@camarasantalucia.pr.gov.br',
    phone: '(45) 99811-0105',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    isActive: true,
    legislature: '2025 - 2028',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c-06',
    name: 'Valdir Aparecido Ribeiro',
    nickname: 'Valdir do Campo',
    politicalParty: 'PSD',
    role: 'Vereador',
    email: 'valdir@camarasantalucia.pr.gov.br',
    phone: '(45) 99811-0106',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    isActive: true,
    legislature: '2025 - 2028',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c-07',
    name: 'Elaine Cristina Barbosa',
    nickname: 'Dra. Elaine',
    politicalParty: 'REPUBLICANOS',
    role: 'Vereadora',
    email: 'elaine@camarasantalucia.pr.gov.br',
    phone: '(45) 99811-0107',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    isActive: true,
    legislature: '2025 - 2028',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c-08',
    name: 'José Francisco Nogueira',
    nickname: 'Zé da Autoescola',
    politicalParty: 'PODE',
    role: 'Vereador',
    email: 'zedaautoescola@camarasantalucia.pr.gov.br',
    phone: '(45) 99811-0108',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
    isActive: true,
    legislature: '2025 - 2028',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_COMMITTEES: Committee[] = [
  {
    id: 'com-ccjr',
    name: 'Comissão de Constituição, Justiça e Redação',
    acronym: 'CCJR',
    description: 'Apreciação da constitucionalidade, legalidade, regimentalidade e redação final das proposições legislativas.',
    legislature: '2025 - 2028',
    isActive: true,
    members: [
      { councilorId: 'c-03', councilorName: 'Roberto Santos de Oliveira', role: 'Presidente' },
      { councilorId: 'c-07', councilorName: 'Elaine Cristina Barbosa', role: 'Relator' },
      { councilorId: 'c-04', councilorName: 'Marcos Vinicius Pereira', role: 'Membro' },
    ],
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'com-cfo',
    name: 'Comissão de Finanças, Tributação e Orçamento',
    acronym: 'CFO',
    description: 'Exame de planos orçamentários (PPA, LDO, LOA), matérias tributárias, abertura de créditos e contas municipais.',
    legislature: '2025 - 2028',
    isActive: true,
    members: [
      { councilorId: 'c-06', councilorName: 'Valdir Aparecido Ribeiro', role: 'Presidente' },
      { councilorId: 'c-02', councilorName: 'Ana Paula Guimarães', role: 'Relator' },
      { councilorId: 'c-08', councilorName: 'José Francisco Nogueira', role: 'Membro' },
    ],
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'com-cosp',
    name: 'Comissão de Obras, Serviços Públicos e Desenvolvimento',
    acronym: 'COSP',
    description: 'Fiscalização de obras municipais, concessões, saneamento básico, habitação e desenvolvimento rural e urbano.',
    legislature: '2025 - 2028',
    isActive: true,
    members: [
      { councilorId: 'c-04', councilorName: 'Marcos Vinicius Pereira', role: 'Presidente' },
      { councilorId: 'c-05', councilorName: 'Juliana Mendes Ferreira', role: 'Relator' },
      { councilorId: 'c-01', councilorName: 'Carlos Eduardo Silva', role: 'Membro' },
    ],
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'com-cesa',
    name: 'Comissão de Educação, Saúde e Assistência Social',
    acronym: 'CESA',
    description: 'Acompanhamento de políticas de ensino infantil e fundamental, rede de saúde pública municipal e programas sociais.',
    legislature: '2025 - 2028',
    isActive: true,
    members: [
      { councilorId: 'c-02', councilorName: 'Ana Paula Guimarães', role: 'Presidente' },
      { councilorId: 'c-05', councilorName: 'Juliana Mendes Ferreira', role: 'Relator' },
      { councilorId: 'c-03', councilorName: 'Roberto Santos de Oliveira', role: 'Membro' },
    ],
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'meet-01',
    committeeId: 'com-ccjr',
    committeeName: 'Comissão de Constituição, Justiça e Redação',
    date: '2026-02-10',
    time: '14:00',
    location: 'Sala das Comissões Parlamentares',
    topic: 'Projeto de Lei Complementar nº 02/2026 - Dispõe sobre o zoneamento urbano e diretrizes do Plano Diretor Municipal.',
    description: 'Análise de constitucionalidade e legalidade formal da matéria encaminhada pelo Poder Executivo Municipal.',
    status: 'realizada',
    attendances: [
      {
        councilorId: 'c-03',
        councilorName: 'Roberto Santos de Oliveira',
        committeeRole: 'Presidente',
        politicalParty: 'PP',
        status: 'presente',
        justificationReason: '',
        justificationDocument: '',
        justificationSigned: false,
      },
      {
        councilorId: 'c-07',
        councilorName: 'Elaine Cristina Barbosa',
        committeeRole: 'Relator',
        politicalParty: 'REPUBLICANOS',
        status: 'presente',
        justificationReason: '',
        justificationDocument: '',
        justificationSigned: false,
      },
      {
        councilorId: 'c-04',
        councilorName: 'Marcos Vinicius Pereira',
        committeeRole: 'Membro',
        politicalParty: 'UNIÃO',
        status: 'presente',
        justificationReason: '',
        justificationDocument: '',
        justificationSigned: false,
      },
    ],
    minutesText: `ATA DA 1ª REUNIÃO ORDINÁRIA DA COMISSÃO DE CONSTITUIÇÃO, JUSTIÇA E REDAÇÃO (CCJR) DA CÂMARA MUNICIPAL DE SANTA LÚCIA - PR.
Aos dez dias do mês de fevereiro do ano de dois mil e vinte e seis, às quatorze horas, reuniu-se a Comissão de Constituição, Justiça e Redação no recinto oficial da Câmara Municipal de Santa Lúcia - PR.
Presentes os vereadores: Roberto Santos de Oliveira (Presidente), Elaine Cristina Barbosa (Relatora) e Marcos Vinicius Pereira (Membro).
Havendo número regimental, o senhor Presidente declarou aberta a presente reunião.
Passou-se à apreciação da pauta: Projeto de Lei Complementar nº 02/2026, de autoria do Poder Executivo, que dispõe sobre adequações ao zoneamento urbano.
A senhora Relatora proferiu voto favorável pela constitucionalidade da matéria, que foi acolhido por unanimidade pelos presentes.
Nada mais havendo a tratar, o Presidente encerrou os trabalhos e mandou lavrar a presente Ata.`,
    minutesApproved: true,
    createdAt: new Date('2026-02-10T14:00:00').toISOString(),
    updatedAt: new Date('2026-02-10T15:30:00').toISOString(),
  },
  {
    id: 'meet-02',
    committeeId: 'com-cfo',
    committeeName: 'Comissão de Finanças, Tributação e Orçamento',
    date: '2026-02-24',
    time: '09:30',
    location: 'Plenário da Câmara Municipal',
    topic: 'Abertura de Crédito Adicional Especial nº 05/2026 destinado à aquisição de equipamentos para a Unidade Básica de Saúde.',
    description: 'Verificação do impacto orçamentário e disponibilidade de superávit financeiro do exercício anterior.',
    status: 'realizada',
    attendances: [
      {
        councilorId: 'c-06',
        councilorName: 'Valdir Aparecido Ribeiro',
        committeeRole: 'Presidente',
        politicalParty: 'PSD',
        status: 'presente',
        justificationReason: '',
        justificationDocument: '',
        justificationSigned: false,
      },
      {
        councilorId: 'c-02',
        councilorName: 'Ana Paula Guimarães',
        committeeRole: 'Relator',
        politicalParty: 'MDB',
        status: 'presente',
        justificationReason: '',
        justificationDocument: '',
        justificationSigned: false,
      },
      {
        councilorId: 'c-08',
        councilorName: 'José Francisco Nogueira',
        committeeRole: 'Membro',
        politicalParty: 'PODE',
        status: 'ausente_justificado',
        justificationReason: 'Tratamento de saúde e consulta médica especializada devidamente comprovada na data da reunião.',
        justificationDocument: 'Atestado Médico CRM/PR 34.890 - Protocolo Geral nº 104/2026',
        justificationSigned: true,
        signatureDate: '2026-02-24',
        signedByName: 'José Francisco Nogueira',
      },
    ],
    minutesText: `ATA DA 2ª REUNIÃO EXTRAORDINÁRIA DA COMISSÃO DE FINANÇAS, TRIBUTAÇÃO E ORÇAMENTO (CFO) DA CÂMARA MUNICIPAL DE SANTA LÚCIA - PR.
Aos vinte e quatro dias do mês de fevereiro do ano de dois mil e vinte e seis, às nove horas e trinta minutos, reuniu-se a Comissão de Finanças, Tributação e Orçamento.
Registrou-se a presença do Presidente Vereador Valdir Aparecido Ribeiro e da Relatora Vereadora Ana Paula Guimarães.
Registrada a ausência justificada do Vereador José Francisco Nogueira, que apresentou atestado e termo formal de justificativa assinado protocolado sob nº 104/2026, acatado pela Comissão.
Havendo quórum legal (maioria dos membros), a matéria foi discutida e a Relatora emitiu Parecer Favorável com quórum qualificado favorável.
Nada mais a tratar, lavrou-se a presente ata.`,
    minutesApproved: true,
    createdAt: new Date('2026-02-24T09:30:00').toISOString(),
    updatedAt: new Date('2026-02-24T11:00:00').toISOString(),
  },
  {
    id: 'meet-03',
    committeeId: 'com-cesa',
    committeeName: 'Comissão de Educação, Saúde e Assistência Social',
    date: '2026-03-12',
    time: '15:00',
    location: 'Sala das Comissões',
    topic: 'Avaliação do Programa Municipal de Transporte Escolar e Fornecimento de Merenda nas Escolas da Zona Rural.',
    description: 'Audiência de trabalho com representações de pais, professores e Secretaria Municipal de Educação.',
    status: 'agendada',
    attendances: [
      {
        councilorId: 'c-02',
        councilorName: 'Ana Paula Guimarães',
        committeeRole: 'Presidente',
        politicalParty: 'MDB',
        status: 'presente',
        justificationReason: '',
        justificationDocument: '',
        justificationSigned: false,
      },
      {
        councilorId: 'c-05',
        councilorName: 'Juliana Mendes Ferreira',
        committeeRole: 'Relator',
        politicalParty: 'PL',
        status: 'presente',
        justificationReason: '',
        justificationDocument: '',
        justificationSigned: false,
      },
      {
        councilorId: 'c-03',
        councilorName: 'Roberto Santos de Oliveira',
        committeeRole: 'Membro',
        politicalParty: 'PP',
        status: 'presente',
        justificationReason: '',
        justificationDocument: '',
        justificationSigned: false,
      },
    ],
    minutesText: '',
    minutesApproved: false,
    createdAt: new Date('2026-03-01T10:00:00').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface LegislativeContextType {
  councilors: Councilor[];
  committees: Committee[];
  meetings: Meeting[];
  legislatures: Legislature[];
  activeLegislature: Legislature | null;
  settings: SystemSettings;
  isLoading: boolean;
  firebaseConnected: boolean;
  addCouncilor: (councilor: Omit<Councilor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCouncilor: (id: string, councilor: Partial<Councilor>) => Promise<void>;
  deleteCouncilor: (id: string) => Promise<void>;
  addCommittee: (committee: Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCommittee: (id: string, committee: Partial<Committee>) => Promise<void>;
  deleteCommittee: (id: string) => Promise<void>;
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMeeting: (id: string, meeting: Partial<Meeting>) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  addLegislature: (
    legData: Omit<Legislature, 'id' | 'createdAt' | 'updatedAt'>,
    selectedExistingCouncilorIds: string[],
    newCouncilors: Omit<Councilor, 'id' | 'createdAt' | 'updatedAt'>[],
    autoCreateCommittees?: boolean
  ) => Promise<void>;
  updateLegislature: (id: string, partial: Partial<Legislature>) => Promise<void>;
  setActiveLegislature: (id: string) => Promise<void>;
  deleteLegislature: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  seedInitialData: () => Promise<void>;
  exportBackup: () => string;
  importBackup: (jsonData: string) => Promise<void>;
}

const LegislativeContext = createContext<LegislativeContextType | undefined>(undefined);

export const LegislativeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [councilors, setCouncilors] = useState<Councilor[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [legislatures, setLegislatures] = useState<Legislature[]>(DEFAULT_LEGISLATURES);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);

  // Active legislature
  const activeLegislature =
    legislatures.find((l) => l.isActive) ||
    legislatures.find((l) => l.id === settings.activeLegislatureId) ||
    legislatures[0] ||
    null;

  // Initialize listeners
  useEffect(() => {
    let unsubCouncilors = () => {};
    let unsubCommittees = () => {};
    let unsubMeetings = () => {};
    let unsubLegislatures = () => {};
    let unsubSettings = () => {};

    const setupListeners = async () => {
      try {
        const isOnline = await testConnection();
        setFirebaseConnected(isOnline);

        // Legislatures listener
        const legislaturesCol = collection(db, 'legislatures');
        unsubLegislatures = onSnapshot(
          legislaturesCol,
          (snapshot) => {
            const list: Legislature[] = [];
            snapshot.forEach((d) => {
              list.push(d.data() as Legislature);
            });
            if (list.length === 0 && snapshot.metadata.fromCache === false) {
              setDoc(doc(db, 'legislatures', DEFAULT_LEGISLATURES[0].id), DEFAULT_LEGISLATURES[0]).catch(
                console.error
              );
            } else if (list.length > 0) {
              setLegislatures(list);
            }
          },
          (error) => {
            console.error('Erro ao escutar legislaturas:', error);
            handleFirestoreError(error, OperationType.GET, 'legislatures');
          }
        );

        // Councilor listener
        const councilorsCol = collection(db, 'councilors');
        unsubCouncilors = onSnapshot(
          councilorsCol,
          (snapshot) => {
            const list: Councilor[] = [];
            snapshot.forEach((d) => {
              list.push(d.data() as Councilor);
            });
            // If empty on first load, seed initial data!
            if (list.length === 0 && snapshot.metadata.fromCache === false) {
              console.log('Banco vazio. Inicializando dados da Câmara de Santa Lúcia...');
              seedInitialData();
            } else {
              setCouncilors(list);
            }
          },
          (error) => {
            console.error('Erro ao escutar vereadores:', error);
            handleFirestoreError(error, OperationType.GET, 'councilors');
          }
        );

        // Committee listener
        const committeesCol = collection(db, 'committees');
        unsubCommittees = onSnapshot(
          committeesCol,
          (snapshot) => {
            const list: Committee[] = [];
            snapshot.forEach((d) => {
              list.push(d.data() as Committee);
            });
            setCommittees(list);
          },
          (error) => {
            console.error('Erro ao escutar comissões:', error);
            handleFirestoreError(error, OperationType.GET, 'committees');
          }
        );

        // Meeting listener
        const meetingsCol = collection(db, 'meetings');
        unsubMeetings = onSnapshot(
          meetingsCol,
          (snapshot) => {
            const list: Meeting[] = [];
            snapshot.forEach((d) => {
              list.push(d.data() as Meeting);
            });
            // Sort by date desc
            list.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
            setMeetings(list);
            setIsLoading(false);
          },
          (error) => {
            console.error('Erro ao escutar reuniões:', error);
            handleFirestoreError(error, OperationType.GET, 'meetings');
          }
        );

        // Settings listener
        const settingsDoc = doc(db, 'settings', 'system');
        unsubSettings = onSnapshot(
          settingsDoc,
          (docSnap) => {
            if (docSnap.exists()) {
              setSettings(docSnap.data() as SystemSettings);
            } else {
              // Create default settings
              setDoc(doc(db, 'settings', 'system'), DEFAULT_SETTINGS).catch((e) =>
                console.error('Erro ao salvar settings padrão:', e)
              );
            }
          },
          (error) => {
            console.error('Erro ao escutar configurações:', error);
            handleFirestoreError(error, OperationType.GET, 'settings/system');
          }
        );
      } catch (err) {
        console.error('Erro ao configurar Firestore:', err);
        setIsLoading(false);
      }
    };

    setupListeners();

    return () => {
      unsubCouncilors();
      unsubCommittees();
      unsubMeetings();
      unsubLegislatures();
      unsubSettings();
    };
  }, []);

  // Seed standard data for Câmara Municipal de Santa Lúcia
  const seedInitialData = async () => {
    try {
      // 1. Settings
      await setDoc(doc(db, 'settings', 'system'), DEFAULT_SETTINGS);

      // 2. Legislatures
      for (const leg of DEFAULT_LEGISLATURES) {
        await setDoc(doc(db, 'legislatures', leg.id), leg);
      }

      // 3. Councilors
      for (const c of INITIAL_COUNCILORS) {
        await setDoc(doc(db, 'councilors', c.id), c);
      }

      // 4. Committees
      for (const com of INITIAL_COMMITTEES) {
        await setDoc(doc(db, 'committees', com.id), com);
      }

      // 5. Meetings
      for (const m of INITIAL_MEETINGS) {
        await setDoc(doc(db, 'meetings', m.id), m);
      }

      setCouncilors(INITIAL_COUNCILORS);
      setCommittees(INITIAL_COMMITTEES);
      setMeetings(INITIAL_MEETINGS);
      setLegislatures(DEFAULT_LEGISLATURES);
      setSettings(DEFAULT_SETTINGS);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'seedInitialData');
    }
  };

  // Councilors CRUD
  const addCouncilor = async (councilorData: Omit<Councilor, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = 'c-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();
    const newDoc: Councilor = {
      ...councilorData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'councilors', id), newDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `councilors/${id}`);
    }
  };

  const updateCouncilor = async (id: string, partial: Partial<Councilor>) => {
    const current = councilors.find((c) => c.id === id);
    if (!current) return;
    const updated: Councilor = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'councilors', id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `councilors/${id}`);
    }
  };

  const deleteCouncilor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'councilors', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `councilors/${id}`);
    }
  };

  // Committees CRUD
  const addCommittee = async (committeeData: Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = 'com-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();
    const newDoc: Committee = {
      ...committeeData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'committees', id), newDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `committees/${id}`);
    }
  };

  const updateCommittee = async (id: string, partial: Partial<Committee>) => {
    const current = committees.find((c) => c.id === id);
    if (!current) return;
    const updated: Committee = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'committees', id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `committees/${id}`);
    }
  };

  const deleteCommittee = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'committees', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `committees/${id}`);
    }
  };

  // Meetings CRUD
  const addMeeting = async (meetingData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = 'meet-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();
    const newDoc: Meeting = {
      ...meetingData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'meetings', id), newDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `meetings/${id}`);
    }
  };

  const updateMeeting = async (id: string, partial: Partial<Meeting>) => {
    const current = meetings.find((m) => m.id === id);
    if (!current) return;
    const updated: Meeting = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'meetings', id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `meetings/${id}`);
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'meetings', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `meetings/${id}`);
    }
  };

  // Settings
  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    const updated: SystemSettings = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'settings', 'system'), updated);
      setSettings(updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/system');
    }
  };

  // Legislatures CRUD
  const addLegislature = async (
    legData: Omit<Legislature, 'id' | 'createdAt' | 'updatedAt'>,
    selectedExistingCouncilorIds: string[],
    newCouncilors: Omit<Councilor, 'id' | 'createdAt' | 'updatedAt'>[],
    autoCreateCommittees = true
  ) => {
    const cleanPeriod = legData.period.replace(/\s+/g, '').replace(/[^a-zA-Z0-9-]/g, '');
    const id = 'leg-' + cleanPeriod;
    const now = new Date().toISOString();

    try {
      // 1. Create brand new councilors if provided
      const createdCouncilorIds: string[] = [];
      for (const nc of newCouncilors) {
        const cId = 'c-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        const newCouncilorDoc: Councilor = {
          ...nc,
          id: cId,
          legislature: legData.period,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(doc(db, 'councilors', cId), newCouncilorDoc);
        createdCouncilorIds.push(cId);
      }

      const allCouncilorIds = [...selectedExistingCouncilorIds, ...createdCouncilorIds];

      // 2. If new leg is marked active, unmark previous ones
      if (legData.isActive) {
        for (const existingLeg of legislatures) {
          if (existingLeg.isActive) {
            await setDoc(doc(db, 'legislatures', existingLeg.id), {
              ...existingLeg,
              isActive: false,
              updatedAt: now,
            });
          }
        }
      }

      // 3. Save new Legislature doc
      const newLegDoc: Legislature = {
        ...legData,
        id,
        councilorIds: allCouncilorIds,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'legislatures', id), newLegDoc);

      // 4. If autoCreateCommittees is true, create template committees for this new legislature
      if (autoCreateCommittees) {
        const templateComms = [
          { name: 'Comissão de Constituição, Justiça e Redação', acronym: 'CCJR', desc: 'Apreciação da constitucionalidade, legalidade e redação final.' },
          { name: 'Comissão de Finanças, Tributação e Orçamento', acronym: 'CFO', desc: 'Exame de planos orçamentários, matérias tributárias e contas municipais.' },
          { name: 'Comissão de Obras, Serviços Públicos e Desenvolvimento', acronym: 'COSP', desc: 'Fiscalização de obras, concessões, saneamento e desenvolvimento.' },
          { name: 'Comissão de Educação, Saúde e Assistência Social', acronym: 'CESA', desc: 'Acompanhamento do ensino, rede de saúde e programas sociais.' },
        ];

        for (const t of templateComms) {
          const commId = 'com-' + t.acronym.toLowerCase() + '-' + cleanPeriod;
          const newComm: Committee = {
            id: commId,
            name: t.name,
            acronym: t.acronym,
            description: t.desc,
            legislature: legData.period,
            isActive: true,
            members: [
              { councilorId: allCouncilorIds[0] || '', councilorName: councilors.find((c) => c.id === allCouncilorIds[0])?.name || '', role: 'Presidente' },
              { councilorId: allCouncilorIds[1] || '', councilorName: councilors.find((c) => c.id === allCouncilorIds[1])?.name || '', role: 'Relator' },
              { councilorId: allCouncilorIds[2] || '', councilorName: councilors.find((c) => c.id === allCouncilorIds[2])?.name || '', role: 'Membro' },
            ],
            createdAt: now,
            updatedAt: now,
          };
          await setDoc(doc(db, 'committees', commId), newComm);
        }
      }

      // 5. Update settings if active
      if (legData.isActive) {
        await updateSettings({
          legislature: `${legData.period} (${legData.name})`,
          activeLegislatureId: id,
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `legislatures/${id}`);
    }
  };

  const updateLegislature = async (id: string, partial: Partial<Legislature>) => {
    const current = legislatures.find((l) => l.id === id);
    if (!current) return;
    const updated: Legislature = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'legislatures', id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `legislatures/${id}`);
    }
  };

  const setActiveLegislature = async (id: string) => {
    const target = legislatures.find((l) => l.id === id);
    if (!target) return;
    const now = new Date().toISOString();

    try {
      for (const leg of legislatures) {
        const isTarget = leg.id === id;
        await setDoc(doc(db, 'legislatures', leg.id), {
          ...leg,
          isActive: isTarget,
          updatedAt: now,
        });
      }

      await updateSettings({
        legislature: `${target.period} (${target.name})`,
        activeLegislatureId: id,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `legislatures/${id}`);
    }
  };

  const deleteLegislature = async (id: string) => {
    if (legislatures.length <= 1) {
      alert('Não é possível excluir a única legislatura cadastrada no sistema.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'legislatures', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `legislatures/${id}`);
    }
  };

  // Export Backup
  const exportBackup = (): string => {
    const data = {
      exportedAt: new Date().toISOString(),
      chamber: settings.chamberName,
      settings,
      legislatures,
      councilors,
      committees,
      meetings,
    };
    return JSON.stringify(data, null, 2);
  };

  // Import Backup
  const importBackup = async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.settings) {
        await setDoc(doc(db, 'settings', 'system'), parsed.settings);
      }
      if (Array.isArray(parsed.legislatures)) {
        for (const leg of parsed.legislatures) {
          await setDoc(doc(db, 'legislatures', leg.id), leg);
        }
      }
      if (Array.isArray(parsed.councilors)) {
        for (const c of parsed.councilors) {
          await setDoc(doc(db, 'councilors', c.id), c);
        }
      }
      if (Array.isArray(parsed.committees)) {
        for (const com of parsed.committees) {
          await setDoc(doc(db, 'committees', com.id), com);
        }
      }
      if (Array.isArray(parsed.meetings)) {
        for (const m of parsed.meetings) {
          await setDoc(doc(db, 'meetings', m.id), m);
        }
      }
    } catch (err) {
      console.error('Erro ao importar backup:', err);
      throw new Error('Formato de arquivo JSON inválido.');
    }
  };

  return (
    <LegislativeContext.Provider
      value={{
        councilors,
        committees,
        meetings,
        legislatures,
        activeLegislature,
        settings,
        isLoading,
        firebaseConnected,
        addCouncilor,
        updateCouncilor,
        deleteCouncilor,
        addCommittee,
        updateCommittee,
        deleteCommittee,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        addLegislature,
        updateLegislature,
        setActiveLegislature,
        deleteLegislature,
        updateSettings,
        seedInitialData,
        exportBackup,
        importBackup,
      }}
    >
      {children}
    </LegislativeContext.Provider>
  );
};

export const useLegislative = () => {
  const context = useContext(LegislativeContext);
  if (!context) {
    throw new Error('useLegislative must be used within a LegislativeProvider');
  }
  return context;
};
