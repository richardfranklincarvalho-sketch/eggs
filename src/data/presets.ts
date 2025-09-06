import { RacaParametros } from '@/types';

/**
 * Presets iniciais para raças/linhagens de aves
 * Baseado em dados técnicos reais da indústria
 */

export const RACA_PRESETS: RacaParametros[] = [
  {
    id: 'novogen-tinted',
    nome: 'NOVOgen Tinted',
    fases: {
      recria: {
        semanas: 18,
        consumoAcumulado: 126 // gramas acumuladas até 18 semanas
      },
      crescimento: {
        semanas: 4, // semanas 18-22
        consumoPorSemana: 140 // gramas por semana
      },
      producao: {
        semanas: 54, // semanas 22-76
        consumoPorSemana: 126 // gramas por semana
      }
    },
    cores: {
      recria: '#66B2FF',     // Azul claro
      crescimento: '#2ECC71', // Verde
      producao: '#FFB86B'     // Laranja
    },
    criadoEm: new Date('2024-01-01'),
    atualizadoEm: new Date('2024-01-01')
  },
  {
    id: 'isa-brown',
    nome: 'Isa Brown',
    fases: {
      recria: {
        semanas: 16,
        consumoAcumulado: 115
      },
      crescimento: {
        semanas: 6, // semanas 16-22
        consumoPorSemana: 135
      },
      producao: {
        semanas: 54, // semanas 22-76
        consumoPorSemana: 120
      }
    },
    cores: {
      recria: '#8B4513',     // Marrom
      crescimento: '#228B22', // Verde floresta
      producao: '#FF8C00'     // Laranja escuro
    },
    criadoEm: new Date('2024-01-01'),
    atualizadoEm: new Date('2024-01-01')
  },
  {
    id: 'lohmann-brown',
    nome: 'Lohmann Brown',
    fases: {
      recria: {
        semanas: 17,
        consumoAcumulado: 118
      },
      crescimento: {
        semanas: 5, // semanas 17-22
        consumoPorSemana: 138
      },
      producao: {
        semanas: 54, // semanas 22-76
        consumoPorSemana: 118
      }
    },
    cores: {
      recria: '#CD853F',     // Peru
      crescimento: '#32CD32', // Verde lima
      producao: '#FF6347'     // Tomate
    },
    criadoEm: new Date('2024-01-01'),
    atualizadoEm: new Date('2024-01-01')
  },
  {
    id: 'hisex-white',
    nome: 'Hisex White',
    fases: {
      recria: {
        semanas: 18,
        consumoAcumulado: 108
      },
      crescimento: {
        semanas: 4, // semanas 18-22
        consumoPorSemana: 125
      },
      producao: {
        semanas: 54, // semanas 22-76
        consumoPorSemana: 110
      }
    },
    cores: {
      recria: '#E6E6FA',     // Lavanda
      crescimento: '#20B2AA', // Verde água escuro
      producao: '#FFA500'     // Laranja
    },
    criadoEm: new Date('2024-01-01'),
    atualizadoEm: new Date('2024-01-01')
  },
  {
    id: 'dekalb-white',
    nome: 'Dekalb White',
    fases: {
      recria: {
        semanas: 17,
        consumoAcumulado: 112
      },
      crescimento: {
        semanas: 5, // semanas 17-22
        consumoPorSemana: 128
      },
      producao: {
        semanas: 54, // semanas 22-76
        consumoPorSemana: 112
      }
    },
    cores: {
      recria: '#F0F8FF',     // Azul alice
      crescimento: '#00CED1', // Turquesa escuro
      producao: '#FF7F50'     // Coral
    },
    criadoEm: new Date('2024-01-01'),
    atualizadoEm: new Date('2024-01-01')
  }
];

/**
 * Função para obter preset por ID
 */
export function getPresetById(id: string): RacaParametros | undefined {
  return RACA_PRESETS.find(preset => preset.id === id);
}

/**
 * Função para obter preset por nome
 */
export function getPresetByName(nome: string): RacaParametros | undefined {
  return RACA_PRESETS.find(preset => 
    preset.nome.toLowerCase() === nome.toLowerCase()
  );
}

/**
 * Função para criar um novo preset customizado
 */
export function createCustomPreset(
  nome: string,
  basePresetId?: string
): RacaParametros {
  const basePreset = basePresetId ? getPresetById(basePresetId) : RACA_PRESETS[0];
  
  return {
    id: `custom-${Date.now()}`,
    nome,
    fases: basePreset ? { ...basePreset.fases } : RACA_PRESETS[0].fases,
    cores: basePreset ? { ...basePreset.cores } : RACA_PRESETS[0].cores,
    criadoEm: new Date(),
    atualizadoEm: new Date()
  };
}

/**
 * Cores padrão para fases (fallback)
 */
export const CORES_PADRAO = {
  recria: '#66B2FF',     // Azul claro
  crescimento: '#2ECC71', // Verde
  producao: '#FFB86B'     // Laranja
} as const;

/**
 * Função para validar parâmetros de raça
 */
export function validateRacaParametros(raca: Partial<RacaParametros>): string[] {
  const errors: string[] = [];

  if (!raca.nome || raca.nome.length < 3) {
    errors.push('Nome da raça deve ter pelo menos 3 caracteres');
  }

  if (raca.fases) {
    const { recria, crescimento, producao } = raca.fases;

    if (recria?.semanas && (recria.semanas < 1 || recria.semanas > 50)) {
      errors.push('Semanas de recria deve estar entre 1 e 50');
    }

    if (recria?.consumoAcumulado && (recria.consumoAcumulado < 0 || recria.consumoAcumulado > 1000)) {
      errors.push('Consumo acumulado de recria deve estar entre 0 e 1000g');
    }

    if (crescimento?.semanas && (crescimento.semanas < 1 || crescimento.semanas > 20)) {
      errors.push('Semanas de crescimento deve estar entre 1 e 20');
    }

    if (crescimento?.consumoPorSemana && (crescimento.consumoPorSemana < 0 || crescimento.consumoPorSemana > 500)) {
      errors.push('Consumo por semana de crescimento deve estar entre 0 e 500g');
    }

    if (producao?.semanas && (producao.semanas < 1 || producao.semanas > 100)) {
      errors.push('Semanas de produção deve estar entre 1 e 100');
    }

    if (producao?.consumoPorSemana && (producao.consumoPorSemana < 0 || producao.consumoPorSemana > 500)) {
      errors.push('Consumo por semana de produção deve estar entre 0 e 500g');
    }
  }

  return errors;
}