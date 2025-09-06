/**
 * Lotes de exemplo para demonstração do sistema
 */

import { Lote } from '@/types';

export const LOTES_EXEMPLO: Lote[] = [
  {
    id: 'lote-001',
    nomeLote: 'Lote A - Galpão 1',
    numeroAves: 5000,
    dataNascimento: new Date('2024-01-15'),
    dataEntrada: new Date('2024-01-16'),
    raca: 'NOVOgen Tinted',
    observacoes: 'Lote de alta performance, origem alemã',
    centroCusto: 'Galpão 1',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'lote-002',
    nomeLote: 'Lote B - Galpão 2',
    numeroAves: 4500,
    dataNascimento: new Date('2024-02-10'),
    dataEntrada: new Date('2024-02-11'),
    raca: 'Hisex Brown',
    observacoes: 'Linhagem rústica, boa adaptação',
    centroCusto: 'Galpão 2',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'lote-003',
    nomeLote: 'Lote C - Galpão 3',
    numeroAves: 3800,
    dataNascimento: new Date('2024-03-05'),
    dataEntrada: new Date('2024-03-06'),
    raca: 'Lohmann LSL',
    observacoes: 'Ovos brancos, alta produtividade',
    centroCusto: 'Galpão 3',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  },
  {
    id: 'lote-004',
    nomeLote: 'Lote D - Recria',
    numeroAves: 6000,
    dataNascimento: new Date('2024-11-01'),
    dataEntrada: new Date('2024-11-02'),
    raca: 'NOVOgen Tinted',
    observacoes: 'Lote jovem em fase de recria',
    centroCusto: 'Galpão Recria',
    criadoEm: new Date(),
    atualizadoEm: new Date()
  }
];

/**
 * Função para carregar lotes de exemplo no localStorage
 */
export function carregarLotesExemplo() {
  const lotesExistentes = localStorage.getItem('lotes');
  
  if (!lotesExistentes) {
    localStorage.setItem('lotes', JSON.stringify(LOTES_EXEMPLO));
    return LOTES_EXEMPLO;
  }
  
  return JSON.parse(lotesExistentes);
}