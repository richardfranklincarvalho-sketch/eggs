/**
 * Presets de Insumos e Ingredientes para Avicultura
 * Baseado em ingredientes comuns na formulação de ração
 */

import { Insumo } from '@/types';

export const INSUMOS_PRESETS: Insumo[] = [
  // Grãos e cereais - Baseado nas imagens
  {
    id: 'milho-grao',
    nome: 'Milho Grão',
    categoria: 'grao',
    unidade: 'kg',
    custoUnitario: 1.87, // R$ 74,90 para 40kg = R$ 1,87/kg
    estoque: 0,
    estoqueMinimo: 1000,
    observacoes: 'Base energética da ração - 60-65% da formulação',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'sorgo-granifero',
    nome: 'Sorgo Granífero',
    categoria: 'grao',
    unidade: 'kg',
    custoUnitario: 0.58,
    estoque: 0,
    estoqueMinimo: 500,
    observacoes: 'Alternativa ao milho, menor custo',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'trigo',
    nome: 'Trigo',
    categoria: 'grao',
    unidade: 'kg',
    custoUnitario: 0.75,
    estoque: 0,
    estoqueMinimo: 200,
    observacoes: 'Rico em proteína, usado em pequenas quantidades',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Farelos proteicos
  {
    id: 'farelo-soja-46',
    nome: 'Farelo de Soja (46%)',
    categoria: 'farelo',
    unidade: 'kg',
    custoUnitario: 2.85, // R$ 142,30 para 50kg = R$ 2,85/kg
    estoque: 0,
    estoqueMinimo: 800,
    observacoes: 'Principal fonte proteica - 46% PB',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'farelo-algodao',
    nome: 'Farelo de Algodão',
    categoria: 'farelo',
    unidade: 'kg',
    custoUnitario: 1.20,
    estoque: 0,
    estoqueMinimo: 300,
    observacoes: '28% PB - alternativa ao farelo de soja',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'farinha-peixe',
    nome: 'Farinha de Peixe',
    categoria: 'farelo',
    unidade: 'kg',
    custoUnitario: 4.50,
    estoque: 0,
    estoqueMinimo: 100,
    observacoes: '65% PB - alta qualidade proteica',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Fontes de cálcio e fósforo
  {
    id: 'calcario-calcitico',
    nome: 'Calcário Calcítico',
    categoria: 'aditivo',
    unidade: 'kg',
    custoUnitario: 1.13, // R$ 56,70 para 50kg = R$ 1,13/kg
    estoque: 0,
    estoqueMinimo: 500,
    observacoes: '38% Ca - principal fonte de cálcio',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'fosfato-bicalcico',
    nome: 'Fosfato Bicálcico',
    categoria: 'aditivo',
    unidade: 'kg',
    custoUnitario: 2.80,
    estoque: 0,
    estoqueMinimo: 100,
    observacoes: '18% P e 24% Ca - fonte de fósforo',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'casca-ostra',
    nome: 'Casca de Ostra',
    categoria: 'aditivo',
    unidade: 'kg',
    custoUnitario: 0.45,
    estoque: 0,
    estoqueMinimo: 200,
    observacoes: '36% Ca - para aves em postura',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Sal e aminoácidos
  {
    id: 'sal-comum',
    nome: 'Sal Comum (NaCl)',
    categoria: 'aditivo',
    unidade: 'kg',
    custoUnitario: 0.80,
    estoque: 0,
    estoqueMinimo: 50,
    observacoes: 'Fonte de sódio e cloro - max 0,5%',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'dl-metionina',
    nome: 'DL-Metionina',
    categoria: 'aditivo',
    unidade: 'kg',
    custoUnitario: 18.50,
    estoque: 0,
    estoqueMinimo: 25,
    observacoes: '99% - aminoácido essencial',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'l-lisina',
    nome: 'L-Lisina HCl',
    categoria: 'aditivo',
    unidade: 'kg',
    custoUnitario: 8.50,
    estoque: 0,
    estoqueMinimo: 30,
    observacoes: '78% - primeiro aminoácido limitante',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'l-treonina',
    nome: 'L-Treonina',
    categoria: 'aditivo',
    unidade: 'kg',
    custoUnitario: 12.00,
    estoque: 0,
    estoqueMinimo: 20,
    observacoes: '98% - terceiro aminoácido limitante',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Núcleos e premixes - Baseado nas imagens
  {
    id: 'nucleo-inicial',
    nome: 'Núcleo Inicial',
    categoria: 'nucleo',
    unidade: 'kg',
    custoUnitario: 9.95, // R$ 199,00 para 20kg = R$ 9,95/kg
    estoque: 0,
    estoqueMinimo: 100,
    observacoes: 'Vitaminas e minerais para fase inicial',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'nucleo-crescimento',
    nome: 'Núcleo Crescimento',
    categoria: 'nucleo',
    unidade: 'kg',
    custoUnitario: 9.77, // R$ 293,00 para 30kg = R$ 9,77/kg
    estoque: 0,
    estoqueMinimo: 100,
    observacoes: 'Vitaminas e minerais para crescimento',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'nucleo-postura',
    nome: 'Núcleo Postura',
    categoria: 'nucleo',
    unidade: 'kg',
    custoUnitario: 10.52, // R$ 263,00 para 25kg = R$ 10,52/kg
    estoque: 0,
    estoqueMinimo: 150,
    observacoes: 'Vitaminas e minerais para postura',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Aditivos especiais
  {
    id: 'adsorvente-micotoxinas',
    nome: 'Adsorvente Micotox',
    categoria: 'aditivo',
    unidade: 'kg',
    custoUnitario: 9.65, // R$ 241,25 para 25kg = R$ 9,65/kg
    estoque: 0,
    estoqueMinimo: 50,
    observacoes: 'Controle de micotoxinas - 1-2 kg/ton',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'pro-prebioticos',
    nome: 'Pró e Prebióticos',
    categoria: 'aditivo',
    unidade: 'kg',
    custoUnitario: 60.00, // R$ 60,00 para 1kg conforme imagem
    estoque: 0,
    estoqueMinimo: 10,
    observacoes: 'Melhora saúde intestinal - 0,5-1 kg/ton',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'acidificante',
    nome: 'Acidificante Orgânico',
    categoria: 'aditivo',
    unidade: 'kg',
    custoUnitario: 6.50,
    estoque: 0,
    estoqueMinimo: 25,
    observacoes: 'Reduz pH intestinal - 1-3 kg/ton',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },

  // Óleos e gorduras
  {
    id: 'oleo-soja',
    nome: 'Óleo de Soja Degomado',
    categoria: 'aditivo',
    unidade: 'kg',
    custoUnitario: 4.20,
    estoque: 0,
    estoqueMinimo: 200,
    observacoes: 'Fonte de energia - até 8% da ração',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  }
];

/**
 * Categorias de insumos com descrições
 */
export const CATEGORIAS_INSUMOS = {
  grao: {
    nome: 'Grãos e Cereais',
    descricao: 'Fontes energéticas primárias',
    cor: '#FFB86B'
  },
  farelo: {
    nome: 'Farelos Proteicos',
    descricao: 'Fontes de proteína',
    cor: '#2ECC71'
  },
  nucleo: {
    nome: 'Núcleos e Premixes',
    descricao: 'Vitaminas e minerais',
    cor: '#66B2FF'
  },
  aditivo: {
    nome: 'Aditivos',
    descricao: 'Minerais, aminoácidos e melhoradores',
    cor: '#9B59B6'
  },
  medicamento: {
    nome: 'Medicamentos',
    descricao: 'Antibióticos e medicamentos',
    cor: '#E74C3C'
  },
  vacina: {
    nome: 'Vacinas',
    descricao: 'Produtos biológicos',
    cor: '#F39C12'
  },
  outros: {
    nome: 'Outros',
    descricao: 'Diversos insumos',
    cor: '#95A5A6'
  }
};

/**
 * Função para obter insumo por ID
 */
export function getInsumoById(id: string): Insumo | undefined {
  return INSUMOS_PRESETS.find(insumo => insumo.id === id);
}

/**
 * Função para obter insumos por categoria
 */
export function getInsumosPorCategoria(categoria: string): Insumo[] {
  return INSUMOS_PRESETS.filter(insumo => insumo.categoria === categoria);
}

/**
 * Formulações base por fase
 */
export const FORMULACOES_BASE = {
  recria: [
    { insumoId: 'milho-amarelo', percentual: 60.0 },
    { insumoId: 'farelo-soja', percentual: 30.0 },
    { insumoId: 'nucleo-inicial', percentual: 4.0 },
    { insumoId: 'calcario-calcitico', percentual: 1.2 },
    { insumoId: 'fosfato-bicalcico', percentual: 1.5 },
    { insumoId: 'oleo-soja', percentual: 2.0 },
    { insumoId: 'sal-comum', percentual: 0.4 },
    { insumoId: 'dl-metionina', percentual: 0.25 },
    { insumoId: 'l-lisina', percentual: 0.35 },
    { insumoId: 'adsorvente-micotoxinas', percentual: 0.2 },
    { insumoId: 'acidificante', percentual: 0.1 }
  ],
  crescimento: [
    { insumoId: 'milho-amarelo', percentual: 62.0 },
    { insumoId: 'farelo-soja', percentual: 26.0 },
    { insumoId: 'nucleo-crescimento', percentual: 4.0 },
    { insumoId: 'calcario-calcitico', percentual: 1.8 },
    { insumoId: 'fosfato-bicalcico', percentual: 1.2 },
    { insumoId: 'oleo-soja', percentual: 3.5 },
    { insumoId: 'sal-comum', percentual: 0.4 },
    { insumoId: 'dl-metionina', percentual: 0.2 },
    { insumoId: 'l-lisina', percentual: 0.25 },
    { insumoId: 'adsorvente-micotoxinas', percentual: 0.15 },
    { insumoId: 'prebiotico', percentual: 0.05 },
    { insumoId: 'acidificante', percentual: 0.1 }
  ],
  producao: [
    { insumoId: 'milho-amarelo', percentual: 64.0 },
    { insumoId: 'farelo-soja', percentual: 22.0 },
    { insumoId: 'nucleo-postura', percentual: 4.0 },
    { insumoId: 'calcario-calcitico', percentual: 8.5 },
    { insumoId: 'casca-ostra', percentual: 1.0 },
    { insumoId: 'fosfato-bicalcico', percentual: 0.8 },
    { insumoId: 'oleo-soja', percentual: 2.5 },
    { insumoId: 'sal-comum', percentual: 0.4 },
    { insumoId: 'dl-metionina', percentual: 0.18 },
    { insumoId: 'l-lisina', percentual: 0.15 },
    { insumoId: 'adsorvente-micotoxinas', percentual: 0.15 },
    { insumoId: 'prebiotico', percentual: 0.05 }
  ]
};