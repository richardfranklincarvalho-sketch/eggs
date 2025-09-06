/**
 * Presets NOVOgen Tinted - Baseados nos guias oficiais
 * Cronograma detalhado de fases produtivas, vacinação e pesagens
 */

import { RacaParametros, Vacina, PesagemAves } from '@/types';

// ============= PRESETS NOVOGEN TINTED =============

export const NOVOGEN_TINTED_PRESET: RacaParametros = {
  id: 'novogen-tinted',
  nome: 'NOVOgen Tinted',
  fases: {
    recria: {
      semanas: 18,
      consumoAcumulado: 4000 // 4kg total até 18 semanas
    },
    crescimento: {
      semanas: 4, // semanas 18-22
      consumoPorSemana: 140 
    },
    producao: {
      semanas: 54, // semanas 22-76
      consumoPorSemana: 120 // 115-125g/dia média
    }
  },
  cores: {
    recria: '#3B82F6',      // Azul - Recria
    crescimento: '#10B981',  // Verde - Crescimento  
    producao: '#F59E0B'     // Laranja - Produção
  },
  criadoEm: new Date(),
  atualizadoEm: new Date()
};

// ============= FASES DETALHADAS NOVOGEN =============

export const FASES_NOVOGEN = {
  'recria-1': {
    nome: 'Recria 1',
    semanas: [0, 1, 2, 3, 4, 5, 6],
    pesoAlvo: 450, // gramas ao final
    consumoAcumulado: 280, // gramas
    cor: '#60A5FA', // Azul médio
    descricao: 'Desenvolvimento inicial - peso-alvo crescente até ~450g'
  },
  'recria-2': {
    nome: 'Recria 2', 
    semanas: [7, 8, 9, 10, 11, 12],
    pesoAlvo: 950, // gramas ao final
    consumoAcumulado: 1800, // 1.8kg
    cor: '#3B82F6', // Azul
    descricao: 'Crescimento acelerado - peso-alvo ~950g'
  },
  'pre-postura': {
    nome: 'Pré-postura',
    semanas: [13, 14, 15, 16, 17],
    pesoAlvo: 1400, // 1.3-1.4kg
    consumoAcumulado: 4000, // 4kg
    cor: '#10B981', // Verde
    descricao: 'Preparação para postura - peso-alvo 1.3-1.4kg'
  },
  'producao': {
    nome: 'Produção',
    semanas: Array.from({length: 58}, (_, i) => i + 18), // semanas 18-75
    consumoDiario: 120, // 115-125g/ave/dia
    picoPostura: [24, 25, 26, 27, 28], // semanas de pico
    cor: '#F59E0B', // Laranja
    descricao: 'Período produtivo - consumo médio 115-125g/ave/dia'
  }
};

// ============= CRONOGRAMA VACINAÇÃO NOVOGEN =============

export const VACINAS_NOVOGEN: Vacina[] = [
  // Dia 0
  {
    id: 'marek-0d',
    nome: 'Marek',
    fabricante: 'Zoetis',
    tipo: 'viva',
    viaAplicacao: 'subcutanea',
    idadeAplicacao: 0,
    doseML: 0.2,
    observacoes: 'Incubatório - proteção contra Marek',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Semana 1 (7 dias)
  {
    id: 'newcastle-7d',
    nome: 'Newcastle + Bronquite',
    fabricante: 'MSD Saúde Animal',
    tipo: 'viva',
    viaAplicacao: 'ocular',
    idadeAplicacao: 7,
    doseML: 0.03,
    intervaloReforco: 14,
    observacoes: 'Primeira vacinação respiratória 👁️',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Semana 2 (14 dias) 
  {
    id: 'gumboro-14d',
    nome: 'Gumboro (IBD)',
    fabricante: 'Boehringer',
    tipo: 'viva',
    viaAplicacao: 'oral',
    idadeAplicacao: 14,
    doseML: 0.5,
    intervaloReforco: 14,
    observacoes: 'Primeira dose Gumboro - via água 💧',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Semana 3 (21 dias)
  {
    id: 'newcastle-21d', 
    nome: 'Newcastle + Bronquite (Reforço)',
    fabricante: 'MSD Saúde Animal',
    tipo: 'viva',
    viaAplicacao: 'spray',
    idadeAplicacao: 21,
    doseML: 1.0,
    observacoes: 'Reforço respiratório - spray 🌫️',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Semana 4 (28 dias)
  {
    id: 'gumboro-28d',
    nome: 'Gumboro (Cepa Forte)',
    fabricante: 'Boehringer',
    tipo: 'viva', 
    viaAplicacao: 'oral',
    idadeAplicacao: 28,
    doseML: 0.5,
    observacoes: 'Segunda dose - cepa intermediária 💧',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Semana 5 (35 dias)
  {
    id: 'newcastle-35d',
    nome: 'Newcastle (Reforço)',
    fabricante: 'Zoetis',
    tipo: 'viva',
    viaAplicacao: 'spray',
    idadeAplicacao: 35,
    doseML: 1.0,
    observacoes: 'Terceiro reforço respiratório 🌫️',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Semana 7 (49 dias)
  {
    id: 'bouba-49d',
    nome: 'Bouba Aviária (Pox)',
    fabricante: 'Zoetis',
    tipo: 'viva',
    viaAplicacao: 'subcutanea',
    idadeAplicacao: 49,
    doseML: 0.01,
    observacoes: 'Transfixação na asa - pox 🪶',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Semana 8 (56 dias) 
  {
    id: 'gumboro-56d',
    nome: 'Gumboro (Final)',
    fabricante: 'Boehringer',
    tipo: 'viva',
    viaAplicacao: 'oral',
    idadeAplicacao: 56,
    doseML: 0.5,
    observacoes: 'Terceira e última dose Gumboro 💧',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Semana 10 (70 dias)
  {
    id: 'encefalomielite-70d',
    nome: 'Encefalomielite Aviária',
    fabricante: 'MSD Saúde Animal',
    tipo: 'viva',
    viaAplicacao: 'oral',
    idadeAplicacao: 70,
    doseML: 0.5,
    observacoes: 'Proteção neurológica 💧',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Semana 16 (112 dias)
  {
    id: 'newcastle-112d',
    nome: 'Newcastle (Pré-postura)',
    fabricante: 'Zoetis',
    tipo: 'inativada',
    viaAplicacao: 'intramuscular',
    idadeAplicacao: 112,
    doseML: 0.5,
    observacoes: 'Vacina inativada para postura 💉',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Semana 20 (140 dias) 
  {
    id: 'sindrome-queda-140d',
    nome: 'Síndrome Queda Postura',
    fabricante: 'Boehringer',
    tipo: 'inativada',
    viaAplicacao: 'intramuscular',
    idadeAplicacao: 140,
    doseML: 0.5,
    observacoes: 'Antes do pico de postura 💉',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  }
];

// ============= CRONOGRAMA DE PESAGENS =============

/**
 * Tabela de pesos ideais NOVOgen Tinted por semana (gramas)
 */
export const PESOS_IDEAIS_NOVOGEN = {
  1: 70,    2: 120,   3: 200,   4: 300,   5: 420,   6: 550,   7: 680,   8: 810,   
  9: 940,   10: 1060, 11: 1170, 12: 1270, 13: 1360, 14: 1440, 15: 1510, 16: 1570,
  17: 1620, 18: 1660, 19: 1700, 20: 1730, 21: 1750, 22: 1780, 26: 1850, 30: 1900,
  34: 1950, 38: 2000, 42: 2020, 46: 2030, 50: 2040, 54: 2050, 58: 2060, 62: 2070,
  66: 2070, 70: 2070, 74: 2070
} as const;

/**
 * Cronograma de pesagens conforme guias NOVOgen
 */
export const CRONOGRAMA_PESAGENS_NOVOGEN = {
  semanais: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
  mensais: [34, 38, 42, 46, 50, 54, 58, 62, 66, 70, 74]
};

// ============= UTILITÁRIOS =============

/**
 * Gera cronograma de vacinação para um lote NOVOgen
 */
export function gerarCronogramaVacinacaoNovogen(
  dataEntrada: Date,
  loteId: string
): Array<{
  vacina: Vacina;
  dataPrevista: Date;
  idadeAves: number;
  loteId: string;
}> {
  return VACINAS_NOVOGEN.map(vacina => {
    const dataPrevista = new Date(dataEntrada);
    dataPrevista.setDate(dataPrevista.getDate() + vacina.idadeAplicacao);
    
    return {
      vacina,
      dataPrevista,
      idadeAves: vacina.idadeAplicacao,
      loteId
    };
  });
}

/**
 * Gera cronograma de pesagens NOVOgen
 */
export function gerarCronogramaPesagensNovogen(
  loteId: string,
  dataEntrada: Date
): PesagemAves[] {
  const pesagens: PesagemAves[] = [];
  const todasSemanas = [
    ...CRONOGRAMA_PESAGENS_NOVOGEN.semanais,
    ...CRONOGRAMA_PESAGENS_NOVOGEN.mensais
  ];

  todasSemanas.forEach(semana => {
    const dataPrevista = new Date(dataEntrada);
    dataPrevista.setDate(dataPrevista.getDate() + (semana * 7));

    const pesoIdeal = PESOS_IDEAIS_NOVOGEN[semana as keyof typeof PESOS_IDEAIS_NOVOGEN] || 2070;

    pesagens.push({
      id: `pesagem-${loteId}-${semana}`,
      loteId,
      semana,
      idadeAves: semana * 7,
      dataPrevista,
      pesoMedioIdeal: pesoIdeal,
      status: 'pendente',
      criadoEm: new Date()
    });
  });

  return pesagens;
}

/**
 * Gera fases produtivas detalhadas NOVOgen
 */
export function gerarFasesProdutivasNovogen(
  loteId: string,
  dataEntrada: Date,
  numeroAves: number
): Array<{
  id: string;
  loteId: string;
  fase: string;
  semana: number;
  dataInicio: Date;
  dataFim: Date;
  pesoAlvo?: number;
  consumoPorAve: number;
  consumoTotal: number;
  descricao: string;
  cor: string;
}> {
  const fases = [];
  let semanaAtual = 1;

  // Recria 1 (0-6 semanas)
  for (let i = 0; i <= 6; i++) {
    const dataInicio = new Date(dataEntrada);
    dataInicio.setDate(dataInicio.getDate() + (i * 7));
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 6);

    fases.push({
      id: `fase-${loteId}-${semanaAtual}`,
      loteId,
      fase: 'recria-1',
      semana: semanaAtual,
      dataInicio,
      dataFim,
      pesoAlvo: i === 6 ? 450 : undefined,
      consumoPorAve: 40, // ~280g/7semanas = 40g/semana
      consumoTotal: Math.round((40 * numeroAves) / 1000),
      descricao: FASES_NOVOGEN['recria-1'].descricao,
      cor: FASES_NOVOGEN['recria-1'].cor
    });
    semanaAtual++;
  }

  // Recria 2 (7-12 semanas) 
  for (let i = 7; i <= 12; i++) {
    const dataInicio = new Date(dataEntrada);
    dataInicio.setDate(dataInicio.getDate() + (i * 7));
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 6);

    fases.push({
      id: `fase-${loteId}-${semanaAtual}`,
      loteId,
      fase: 'recria-2',
      semana: semanaAtual,
      dataInicio,
      dataFim,
      pesoAlvo: i === 12 ? 950 : undefined,
      consumoPorAve: 253, // (~1800-280)/6 = 253g/semana
      consumoTotal: Math.round((253 * numeroAves) / 1000),
      descricao: FASES_NOVOGEN['recria-2'].descricao,
      cor: FASES_NOVOGEN['recria-2'].cor
    });
    semanaAtual++;
  }

  // Pré-postura (13-17 semanas)
  for (let i = 13; i <= 17; i++) {
    const dataInicio = new Date(dataEntrada);
    dataInicio.setDate(dataInicio.getDate() + (i * 7));
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 6);

    fases.push({
      id: `fase-${loteId}-${semanaAtual}`,
      loteId,
      fase: 'pre-postura',
      semana: semanaAtual,
      dataInicio,
      dataFim,
      pesoAlvo: i === 17 ? 1400 : undefined,
      consumoPorAve: 440, // (4000-1800)/5 = 440g/semana
      consumoTotal: Math.round((440 * numeroAves) / 1000),
      descricao: FASES_NOVOGEN['pre-postura'].descricao,
      cor: FASES_NOVOGEN['pre-postura'].cor
    });
    semanaAtual++;
  }

  // Produção (18-75 semanas)
  for (let i = 18; i <= 75; i++) {
    const dataInicio = new Date(dataEntrada);
    dataInicio.setDate(dataInicio.getDate() + (i * 7));
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 6);

    const ehPico = FASES_NOVOGEN.producao.picoPostura.includes(i);

    fases.push({
      id: `fase-${loteId}-${semanaAtual}`,
      loteId,
      fase: 'producao',
      semana: semanaAtual,
      dataInicio,
      dataFim,
      consumoPorAve: 840, // 120g/dia * 7 = 840g/semana
      consumoTotal: Math.round((840 * numeroAves) / 1000),
      descricao: ehPico ? 'Pico de postura - máxima produção' : FASES_NOVOGEN.producao.descricao,
      cor: ehPico ? '#FF6B35' : FASES_NOVOGEN.producao.cor // Laranja mais vibrante no pico
    });
    semanaAtual++;
  }

  return fases;
}

/**
 * Obter cor da fase por nome
 */
export function getCorFase(nomeFase: string): string {
  const coresFases = {
    'recria-1': '#60A5FA',
    'recria-2': '#3B82F6', 
    'pre-postura': '#10B981',
    'producao': '#F59E0B',
    'recria': '#3B82F6',
    'crescimento': '#10B981'
  };
  
  return coresFases[nomeFase as keyof typeof coresFases] || '#6B7280';
}

/**
 * Obter ícone da vacina por via
 */
export function getIconeVacina(via: string): string {
  const icones = {
    'ocular': '👁️',
    'oral': '💧', 
    'spray': '🌫️',
    'subcutanea': '💉',
    'intramuscular': '💉',
    'nasal': '🌫️'
  };
  
  return icones[via as keyof typeof icones] || '💉';
}