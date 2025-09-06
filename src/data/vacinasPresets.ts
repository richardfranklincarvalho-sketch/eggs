/**
 * Presets de Vacinas para Avicultura
 * Baseado em cronogramas padrão da indústria avícola
 */

import { Vacina } from '@/types';

export const VACINAS_PRESETS: Vacina[] = [
  // Baseado na imagem de produtos veterinários
  {
    id: 'poulvac-e-coli',
    nome: 'POULVAC E-COLI',
    fabricante: 'Zoetis',
    tipo: 'viva',
    viaAplicacao: 'subcutanea',
    idadeAplicacao: 1,
    doseML: 0.5,
    observacoes: 'Contra colibacilose - R$ 239,57',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'poulvac-trt',
    nome: 'POULVAC TRT',
    fabricante: 'Zoetis', 
    tipo: 'viva',
    viaAplicacao: 'ocular',
    idadeAplicacao: 7,
    doseML: 0.03,
    observacoes: 'Contra rinotraqueíte - R$ 44,96',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Vacinas para 7-10 dias
  {
    id: 'newcastle-7d',
    nome: 'Newcastle (La Sota)',
    fabricante: 'MSD',
    tipo: 'viva',
    viaAplicacao: 'ocular',
    idadeAplicacao: 7,
    doseML: 0.03,
    intervaloReforco: 14,
    observacoes: 'Primeira vacinação contra Newcastle',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'bronquite-7d',
    nome: 'Bronquite Infecciosa (H120)',
    fabricante: 'Zoetis',
    tipo: 'viva',
    viaAplicacao: 'ocular',
    idadeAplicacao: 7,
    doseML: 0.03,
    intervaloReforco: 14,
    observacoes: 'Proteção contra bronquite infecciosa',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Vacinas para 14-21 dias
  {
    id: 'gumboro-14d',
    nome: 'Gumboro (Cepa Intermediária)',
    fabricante: 'Boehringer',
    tipo: 'viva',
    viaAplicacao: 'oral',
    idadeAplicacao: 14,
    doseML: 0.5,
    intervaloReforco: 7,
    observacoes: 'Segunda dose contra Gumboro',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'newcastle-21d',
    nome: 'Newcastle (La Sota)',
    fabricante: 'MSD',
    tipo: 'viva',
    viaAplicacao: 'spray',
    idadeAplicacao: 21,
    doseML: 1.0,
    observacoes: 'Reforço Newcastle - aplicação por spray',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Vacinas para 28-35 dias
  {
    id: 'gumboro-28d',
    nome: 'Gumboro (Cepa Forte)',
    fabricante: 'Boehringer',
    tipo: 'viva',
    viaAplicacao: 'oral',
    idadeAplicacao: 28,
    doseML: 0.5,
    observacoes: 'Terceira dose - cepa mais forte',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'encefalomielite-35d',
    nome: 'Encefalomielite Aviária',
    fabricante: 'Zoetis',
    tipo: 'viva',
    viaAplicacao: 'oral',
    idadeAplicacao: 35,
    doseML: 0.5,
    observacoes: 'Proteção contra encefalomielite',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Vacinas para 42-49 dias
  {
    id: 'coriza-42d',
    nome: 'Coriza Infecciosa',
    fabricante: 'MSD',
    tipo: 'inativada',
    viaAplicacao: 'subcutanea',
    idadeAplicacao: 42,
    doseML: 0.5,
    intervaloReforco: 21,
    observacoes: 'Primeira dose de coriza - vacina inativada',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'laringotraqueite-42d',
    nome: 'Laringotraqueíte Infecciosa',
    fabricante: 'Boehringer',
    tipo: 'viva',
    viaAplicacao: 'ocular',
    idadeAplicacao: 42,
    doseML: 0.03,
    observacoes: 'Proteção contra laringotraqueíte',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Vacinas para 56-70 dias
  {
    id: 'coriza-63d',
    nome: 'Coriza Infecciosa (Reforço)',
    fabricante: 'MSD',
    tipo: 'inativada',
    viaAplicacao: 'subcutanea',
    idadeAplicacao: 63,
    doseML: 0.5,
    observacoes: 'Segunda dose de coriza infecciosa',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Vacinas pré-postura (10-12 semanas)
  {
    id: 'newcastle-70d',
    nome: 'Newcastle (Inativada)',
    fabricante: 'Zoetis',
    tipo: 'inativada',
    viaAplicacao: 'intramuscular',
    idadeAplicacao: 70,
    doseML: 0.5,
    observacoes: 'Vacina inativada para proteção duradoura',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'bronquite-70d',
    nome: 'Bronquite Infecciosa (Inativada)',
    fabricante: 'MSD',
    tipo: 'inativada',
    viaAplicacao: 'intramuscular',
    idadeAplicacao: 70,
    doseML: 0.5,
    observacoes: 'Vacina inativada para período de postura',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Vacinas para início de postura (16-18 semanas)
  {
    id: 'sindrome-112d',
    nome: 'Síndrome da Queda de Postura',
    fabricante: 'Boehringer',
    tipo: 'inativada',
    viaAplicacao: 'intramuscular',
    idadeAplicacao: 112,
    doseML: 0.5,
    observacoes: 'Proteção contra síndrome da queda de postura',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'salmonela-112d',
    nome: 'Salmonela Enteritidis',
    fabricante: 'Zoetis',
    tipo: 'inativada',
    viaAplicacao: 'intramuscular',
    idadeAplicacao: 112,
    doseML: 0.5,
    observacoes: 'Prevenção de salmonela enteritidis',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  }
];

/**
 * Cronograma de vacinação padrão por fase
 */
export const CRONOGRAMA_PADRAO = {
  recria: [
    { vacinaId: 'marek-1dia', idade: 1 },
    { vacinaId: 'gumboro-1dia', idade: 1 },
    { vacinaId: 'newcastle-7d', idade: 7 },
    { vacinaId: 'bronquite-7d', idade: 7 },
    { vacinaId: 'gumboro-14d', idade: 14 },
    { vacinaId: 'newcastle-21d', idade: 21 },
    { vacinaId: 'gumboro-28d', idade: 28 },
    { vacinaId: 'encefalomielite-35d', idade: 35 },
    { vacinaId: 'coriza-42d', idade: 42 },
    { vacinaId: 'laringotraqueite-42d', idade: 42 }
  ],
  crescimento: [
    { vacinaId: 'coriza-63d', idade: 63 },
    { vacinaId: 'newcastle-70d', idade: 70 },
    { vacinaId: 'bronquite-70d', idade: 70 }
  ],
  producao: [
    { vacinaId: 'sindrome-112d', idade: 112 },
    { vacinaId: 'salmonela-112d', idade: 112 }
  ]
};

/**
 * Função para obter vacina por ID
 */
export function getVacinaById(id: string): Vacina | undefined {
  return VACINAS_PRESETS.find(vacina => vacina.id === id);
}

/**
 * Função para obter vacinas por fase
 */
export function getVacinasPorFase(fase: 'recria' | 'crescimento' | 'producao'): Vacina[] {
  const cronograma = CRONOGRAMA_PADRAO[fase];
  return cronograma
    .map(item => getVacinaById(item.vacinaId))
    .filter(Boolean) as Vacina[];
}

/**
 * Função para gerar cronograma de vacinação para um lote
 */
export function gerarCronogramaVacinacao(
  dataEntrada: Date,
  fase: 'recria' | 'crescimento' | 'producao' = 'recria'
): Array<{
  vacina: Vacina;
  dataPrevista: Date;
  idadeAves: number;
}> {
  const cronograma = CRONOGRAMA_PADRAO[fase];
  
  return cronograma.map(item => {
    const vacina = getVacinaById(item.vacinaId);
    if (!vacina) throw new Error(`Vacina não encontrada: ${item.vacinaId}`);
    
    const dataPrevista = new Date(dataEntrada);
    dataPrevista.setDate(dataPrevista.getDate() + item.idade);
    
    return {
      vacina,
      dataPrevista,
      idadeAves: item.idade
    };
  });
}