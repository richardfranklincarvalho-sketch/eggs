/**
 * Tipos TypeScript para o Sistema de Controle de Produção de Ovos
 */

export interface Lote {
  id: string;
  nomeLote: string;
  numeroAves: number;
  dataNascimento: Date;
  dataEntrada: Date;
  raca: string;
  observacoes?: string;
  centroCusto?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface SemanaProducao {
  semana: number;
  dataInicio: Date;
  dataFim: Date;
  fase: 'recria' | 'crescimento' | 'producao';
  consumoPorAve: number; // em gramas
  consumoTotal: number; // em kg
  descricao: string;
}

export interface FaseProducao {
  nome: string;
  cor: string;
  semanas: number;
  consumoBase: number;
}

export interface RacaParametros {
  id: string;
  nome: string;
  fases: {
    recria: {
      semanas: number;
      consumoAcumulado: number; // gramas total até o fim da recria
    };
    crescimento: {
      semanas: number;
      consumoPorSemana: number; // gramas por semana
    };
    producao: {
      semanas: number;
      consumoPorSemana: number; // gramas por semana
    };
  };
  cores: {
    recria: string;
    crescimento: string;
    producao: string;
  };
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface RelatorioConsumo {
  loteId: string;
  nomeLote: string;
  raca: string;
  numeroAves: number;
  consumoTotal: number; // kg
  consumoPorAve: number; // kg
  fases: {
    recria: {
      consumoTotal: number;
      consumoPorAve: number;
      semanas: number;
    };
    crescimento: {
      consumoTotal: number;
      consumoPorAve: number;
      semanas: number;
    };
    producao: {
      consumoTotal: number;
      consumoPorAve: number;
      semanas: number;
    };
  };
  periodo: {
    inicio: Date;
    fim: Date;
    totalSemanas: number;
  };
}

export interface ExportOptions {
  formato: 'csv' | 'pdf';
  incluirDetalhes: boolean;
  filtros?: {
    dataInicio?: Date;
    dataFim?: Date;
    fase?: 'recria' | 'crescimento' | 'producao';
    raca?: string;
  };
}

// Tipos para o sistema de proteção contra loops
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attemptsUsed: number;
  creditsEstimate: number;
  economySummary: string;
}

export interface OperationConfig {
  maxAttempts: number;
  timeoutMs: number;
  dedupWindowMs?: number;
  operationType: string;
}

// Tipos para API responses (quando implementado)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Enum para fases de produção
export enum FaseProducaoEnum {
  RECRIA = 'recria',
  CRESCIMENTO = 'crescimento',
  PRODUCAO = 'producao'
}

// ============= TIPOS PARA VACINAÇÃO =============

export interface Vacina {
  id: string;
  nome: string;
  fabricante: string;
  tipo: 'viva' | 'inativada' | 'recombinante';
  viaAplicacao: 'oral' | 'ocular' | 'nasal' | 'subcutanea' | 'intramuscular' | 'spray';
  idadeAplicacao: number; // em dias
  doseML: number;
  intervaloReforco?: number; // dias para próxima dose
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface VacinaAplicada {
  id: string;
  loteId: string;
  vacinaId: string;
  dataAplicacao: Date;
  idadeAves: number; // em dias
  numeroAvesVacinadas: number;
  loteVacina: string;
  responsavel: string;
  observacoes?: string;
  proximaAplicacao?: Date;
  criadoEm: Date;
}

export interface CronogramaVacinacao {
  id: string;
  loteId: string;
  vacinaId: string;
  datasPrevistas: Date[];
  status: 'pendente' | 'aplicada' | 'atrasada' | 'cancelada';
  alertaAntecedencia: number; // dias antes para alertar
  criadoEm: Date;
  atualizadoEm: Date;
}

// ============= TIPOS PARA ERP =============

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  contato: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Insumo {
  id: string;
  nome: string;
  categoria: 'grao' | 'farelo' | 'nucleo' | 'aditivo' | 'medicamento' | 'vacina' | 'outros';
  unidade: 'kg' | 'ton' | 'L' | 'ml' | 'unidade';
  custoUnitario: number;
  estoque: number;
  estoqueMinimo: number;
  fornecedorId?: string;
  loteCompra?: string;
  dataValidade?: Date;
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface MovimentacaoEstoque {
  id: string;
  insumoId: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  custoUnitario?: number;
  loteId?: string; // quando é saída para um lote específico
  motivo: string;
  responsavel: string;
  numeroNF?: string;
  observacoes?: string;
  criadoEm: Date;
}

export interface FormulacaoRacao {
  id: string;
  nome: string;
  fase: 'recria' | 'crescimento' | 'producao';
  ingredientes: {
    insumoId: string;
    percentual: number;
    quantidade: number; // kg para a formulação
  }[];
  quantidadeTotal: number; // kg total da formulação
  custoTotal: number;
  custoPorKg: number;
  observacoes?: string;
  ativa: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ProducaoRacao {
  id: string;
  formulacaoId: string;
  loteId?: string;
  quantidadeProduzida: number;
  custoReal: number;
  dataProducao: Date;
  responsavel: string;
  observacoes?: string;
  criadoEm: Date;
}

export interface CentroCusto {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'lote' | 'galpao' | 'equipamento' | 'manutencao' | 'administracao' | 'outros';
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface LancamentoCusto {
  id: string;
  centroCustoId: string;
  loteId?: string;
  descricao: string;
  valor: number;
  categoria: 'racao' | 'medicamento' | 'vacina' | 'energia' | 'agua' | 'mao_obra' | 'outros';
  data: Date;
  numeroNF?: string;
  fornecedorId?: string;
  observacoes?: string;
  criadoEm: Date;
}

// ============= TIPOS PARA CALENDÁRIO INTEGRADO =============

export interface EventoCalendario {
  id: string;
  loteId: string;
  tipo: 'fase' | 'vacina' | 'pesagem';
  data: Date;
  dataFim?: Date; // Para eventos que duram uma semana (fases)
  titulo: string;
  descricao?: string;
  status?: 'pendente' | 'aplicada' | 'realizada' | 'atrasada' | 'cancelada';
  dados?: any; // Dados específicos do tipo de evento
  cor?: string;
  icone?: string;
  criadoEm: Date;
  atualizadoEm?: Date;
}

export interface PesagemAves {
  id: string;
  loteId: string;
  semana: number;
  idadeAves: number; // em dias
  dataPrevista: Date;
  dataRealizada?: Date;
  pesoMedioIdeal: number; // em gramas
  pesoMedioReal?: number; // em gramas
  numeroAvesAmostradas?: number;
  observacoes?: string;
  responsavel?: string;
  status: 'pendente' | 'realizada' | 'atrasada';
  criadoEm: Date;
  atualizadoEm?: Date;
}

export interface MetaProducaoLote {
  loteId: string;
  metaDiaria: number; // ovos por dia
  metaMensal: number; // ovos por mês
  metaPercentualPostura: number; // % de postura esperado
  custoAlvoOvo: number; // R$ por ovo
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface AlertaCalendario {
  id: string;
  loteId: string;
  eventoId: string;
  tipo: 'vacina_atrasada' | 'pesagem_atrasada' | 'peso_fora_ideal' | 'producao_baixa' | 'estoque_baixo';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  titulo: string;
  descricao: string;
  visualizado: boolean;
  resolvido: boolean;
  criadoEm: Date;
}

export interface FiltroCalendario {
  loteIds?: string[];
  tipoEvento?: ('fase' | 'vacina' | 'pesagem')[];
  periodo?: {
    inicio: Date;
    fim: Date;
  };
  status?: ('pendente' | 'aplicada' | 'realizada' | 'atrasada')[];
}

export interface DadosEstatisticasLote {
  loteId: string;
  nomeLote: string;
  totalEventos: number;
  eventosPendentes: number;
  eventosAtrasados: number;
  percentualVacinacao: number;
  pesoMedioAtual?: number;
  pesoIdealAtual?: number;
  desvioPercentualPeso?: number;
  producaoAtual?: number;
  metaProducao?: number;
  custoMedioOvo?: number;
  ultimaAtualizacao: Date;
}

// ============= SISTEMA DE PROTEÇÃO CONTRA LOOPS =============

export interface LoopProtectionConfig {
  maxAttempts: number;
  timeoutMs: number;
  dedupWindowMs: number;
  operationType: OperationType;
}

export type OperationType = 
  | 'CALENDAR_GENERATION'
  | 'PDF_EXPORT'
  | 'CSV_EXPORT'
  | 'BATCH_SAVE'
  | 'PARAMETER_SAVE'
  | 'VACCINATION_SCHEDULE'
  | 'STOCK_MOVEMENT'
  | 'RECIPE_CALCULATION';

export interface OperationMetrics {
  operationType: OperationType;
  attempts: number;
  startTime: number;
  endTime?: number;
  success: boolean;
  errorCode?: string;
  creditsUsed: number;
  creditsSaved: number;
}

export type ErrorCode = 
  | 'LOOP_DETECT'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'CONCURRENT_OPERATION'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR';

// Constantes para validação
export const VALIDATION_RULES = {
  LOTE: {
    NOME_MIN_LENGTH: 3,
    NOME_MAX_LENGTH: 100,
    NUMERO_AVES_MIN: 1,
    NUMERO_AVES_MAX: 100000,
    OBSERVACOES_MAX_LENGTH: 500
  },
  RACA: {
    NOME_MIN_LENGTH: 3,
    NOME_MAX_LENGTH: 50,
    SEMANAS_MIN: 1,
    SEMANAS_MAX: 100,
    CONSUMO_MIN: 0,
    CONSUMO_MAX: 1000
  },
  VACINA: {
    NOME_MIN_LENGTH: 3,
    NOME_MAX_LENGTH: 100,
    IDADE_MIN: 1,
    IDADE_MAX: 365,
    DOSE_MIN: 0.1,
    DOSE_MAX: 100
  },
  INSUMO: {
    NOME_MIN_LENGTH: 2,
    NOME_MAX_LENGTH: 100,
    CUSTO_MIN: 0,
    ESTOQUE_MIN: 0
  }
} as const;

// Constantes para configuração de proteção contra loops
export const LOOP_PROTECTION_CONFIGS: Record<OperationType, LoopProtectionConfig> = {
  CALENDAR_GENERATION: {
    maxAttempts: 3,
    timeoutMs: 10000,
    dedupWindowMs: 2000,
    operationType: 'CALENDAR_GENERATION'
  },
  PDF_EXPORT: {
    maxAttempts: 2,
    timeoutMs: 15000,
    dedupWindowMs: 5000,
    operationType: 'PDF_EXPORT'
  },
  CSV_EXPORT: {
    maxAttempts: 3,
    timeoutMs: 8000,
    dedupWindowMs: 3000,
    operationType: 'CSV_EXPORT'
  },
  BATCH_SAVE: {
    maxAttempts: 3,
    timeoutMs: 5000,
    dedupWindowMs: 1000,
    operationType: 'BATCH_SAVE'
  },
  PARAMETER_SAVE: {
    maxAttempts: 3,
    timeoutMs: 5000,
    dedupWindowMs: 1000,
    operationType: 'PARAMETER_SAVE'
  },
  VACCINATION_SCHEDULE: {
    maxAttempts: 3,
    timeoutMs: 8000,
    dedupWindowMs: 2000,
    operationType: 'VACCINATION_SCHEDULE'
  },
  STOCK_MOVEMENT: {
    maxAttempts: 3,
    timeoutMs: 5000,
    dedupWindowMs: 1000,
    operationType: 'STOCK_MOVEMENT'
  },
  RECIPE_CALCULATION: {
    maxAttempts: 3,
    timeoutMs: 8000,
    dedupWindowMs: 2000,
    operationType: 'RECIPE_CALCULATION'
  }
} as const;