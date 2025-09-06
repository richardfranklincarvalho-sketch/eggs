/**
 * Presets e cronogramas para pesagem de aves
 * Baseado em diretrizes técnicas para NOVOgen Tinted
 */

import { PesagemAves } from '@/types';

/**
 * Cronograma padrão de pesagens por fase
 */
export const CRONOGRAMA_PESAGENS = {
  recria: {
    frequencia: 'semanal', // até semana 18
    semanas: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
  },
  crescimento: {
    frequencia: 'semanal', // semanas 19-22
    semanas: [19, 20, 21, 22]
  },
  producao: {
    frequencia: 'mensal', // a cada 4 semanas após semana 22
    semanas: [26, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66, 70, 74]
  }
};

/**
 * Tabela de pesos ideais por semana para NOVOgen Tinted (gramas)
 */
export const PESOS_IDEAIS_NOVOGEN = {
  1: 70,   // 1 semana
  2: 120,  // 2 semanas
  3: 200,  // 3 semanas
  4: 300,  // 4 semanas
  5: 420,  // 5 semanas
  6: 550,  // 6 semanas
  7: 680,  // 7 semanas
  8: 810,  // 8 semanas
  9: 940,  // 9 semanas
  10: 1060, // 10 semanas
  11: 1170, // 11 semanas
  12: 1270, // 12 semanas
  13: 1360, // 13 semanas
  14: 1440, // 14 semanas
  15: 1510, // 15 semanas
  16: 1570, // 16 semanas
  17: 1620, // 17 semanas
  18: 1660, // 18 semanas - final da recria
  19: 1700, // 19 semanas
  20: 1730, // 20 semanas
  21: 1750, // 21 semanas
  22: 1780, // 22 semanas - início da postura
  26: 1850, // 26 semanas
  30: 1900, // 30 semanas
  34: 1950, // 34 semanas
  38: 2000, // 38 semanas
  42: 2020, // 42 semanas
  46: 2030, // 46 semanas
  50: 2040, // 50 semanas
  54: 2050, // 54 semanas
  58: 2060, // 58 semanas
  62: 2070, // 62 semanas
  66: 2070, // 66 semanas
  70: 2070, // 70 semanas
  74: 2070  // 74 semanas
} as const;

/**
 * Gera cronograma de pesagens para um lote
 */
export function gerarCronogramaPesagens(
  loteId: string,
  dataEntrada: Date,
  raca: string = 'NOVOgen Tinted'
): PesagemAves[] {
  const pesagens: PesagemAves[] = [];
  const todasSemanas = [
    ...CRONOGRAMA_PESAGENS.recria.semanas,
    ...CRONOGRAMA_PESAGENS.crescimento.semanas,
    ...CRONOGRAMA_PESAGENS.producao.semanas
  ];

  todasSemanas.forEach(semana => {
    const dataPrevista = new Date(dataEntrada);
    dataPrevista.setDate(dataPrevista.getDate() + (semana * 7));

    const pesoIdeal = PESOS_IDEAIS_NOVOGEN[semana as keyof typeof PESOS_IDEAIS_NOVOGEN] || 2070;
    const idadeAves = semana * 7;

    pesagens.push({
      id: `pesagem-${loteId}-${semana}`,
      loteId,
      semana,
      idadeAves,
      dataPrevista,
      pesoMedioIdeal: pesoIdeal,
      status: 'pendente',
      criadoEm: new Date()
    });
  });

  return pesagens;
}

/**
 * Calcula desvio percentual do peso atual vs ideal
 */
export function calcularDesvioPercentualPeso(pesoReal: number, pesoIdeal: number): number {
  if (pesoIdeal === 0) return 0;
  return ((pesoReal - pesoIdeal) / pesoIdeal) * 100;
}

/**
 * Classifica o status do peso baseado no desvio
 */
export function classificarStatusPeso(desvioPercentual: number): {
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
  cor: string;
  descricao: string;
} {
  const absDesvio = Math.abs(desvioPercentual);

  if (absDesvio <= 5) {
    return {
      status: 'excelente',
      cor: '#10B981', // green-500
      descricao: 'Peso dentro do ideal'
    };
  } else if (absDesvio <= 10) {
    return {
      status: 'bom',
      cor: '#F59E0B', // yellow-500
      descricao: 'Pequeno desvio aceitável'
    };
  } else if (absDesvio <= 20) {
    return {
      status: 'atencao',
      cor: '#F97316', // orange-500
      descricao: 'Desvio requer atenção'
    };
  } else {
    return {
      status: 'critico',
      cor: '#EF4444', // red-500
      descricao: 'Desvio crítico - ação imediata'
    };
  }
}

/**
 * Obter próximas pesagens pendentes
 */
export function obterProximasPesagens(
  pesagens: PesagemAves[],
  diasAntecedencia: number = 3
): PesagemAves[] {
  const hoje = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(hoje.getDate() + diasAntecedencia);

  return pesagens
    .filter(p => 
      p.status === 'pendente' && 
      p.dataPrevista >= hoje && 
      p.dataPrevista <= dataLimite
    )
    .sort((a, b) => a.dataPrevista.getTime() - b.dataPrevista.getTime());
}