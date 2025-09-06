// Serviço para cálculos e validações de galpões
import { z } from 'zod';

export interface GalpaoCalculations {
  area: number;
  capacity: number;
  density: number;
}

export interface GalpaoData {
  id: string;
  nome: string;
  largura: number;
  comprimento: number;
  altura: number;
  area: number;
  densidade: number;
  lotacaoMaxima: number;
  lotacaoManual?: number;
  lotacaoOverride: boolean;
  fotoFull?: string;
  fotoThumb?: string;
  responsaveis: Array<{ nome: string; funcao: string }>;
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class GalpaoService {
  // Constantes para galinha caipira
  private static readonly MIN_DENSITY = 5;
  private static readonly MAX_DENSITY = 7;
  private static readonly DENSITY_STEP = 0.5;
  
  // Limites de dimensões
  private static readonly MIN_DIMENSION = 0.1;
  private static readonly MAX_DIMENSION = 500;

  static computeArea(largura: number, comprimento: number): number {
    if (!this.isValidDimension(largura) || !this.isValidDimension(comprimento)) {
      return 0;
    }
    return Math.round((largura * comprimento) * 100) / 100; // 2 casas decimais
  }

  static computeCapacity(area: number, densidade: number): number {
    if (area <= 0 || densidade < this.MIN_DENSITY || densidade > this.MAX_DENSITY) {
      return 0;
    }
    return Math.floor(area * densidade);
  }

  static isValidDensity(densidade: number): boolean {
    return densidade >= this.MIN_DENSITY && 
           densidade <= this.MAX_DENSITY &&
           (densidade * 10) % (this.DENSITY_STEP * 10) === 0;
  }

  static isValidDimension(valor: number): boolean {
    return !isNaN(valor) && 
           valor >= this.MIN_DIMENSION && 
           valor <= this.MAX_DIMENSION;
  }

  static validateGalpao(data: Partial<GalpaoData>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Nome obrigatório
    if (!data.nome?.trim()) {
      errors.push('Nome do galpão é obrigatório');
    }

    // Dimensões
    if (!this.isValidDimension(data.largura || 0)) {
      errors.push('Largura deve ser entre 0,1 e 500 metros');
    }

    if (!this.isValidDimension(data.comprimento || 0)) {
      errors.push('Comprimento deve ser entre 0,1 e 500 metros');
    }

    if (!this.isValidDimension(data.altura || 0)) {
      errors.push('Altura deve ser entre 0,1 e 500 metros');
    }

    // Densidade
    if (!this.isValidDensity(data.densidade || 0)) {
      errors.push(`Densidade deve ser entre ${this.MIN_DENSITY} e ${this.MAX_DENSITY} aves/m²`);
    }

    // Responsáveis
    if (!data.responsaveis?.length) {
      errors.push('Adicione pelo menos um responsável');
    } else {
      data.responsaveis.forEach((resp, index) => {
        if (!resp.nome?.trim()) {
          errors.push(`Nome do responsável ${index + 1} é obrigatório`);
        }
        if (!resp.funcao?.trim()) {
          errors.push(`Função do responsável ${index + 1} é obrigatória`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  static generateId(): string {
    return `galpao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static sanitizeText(text: string): string {
    return text.trim().replace(/[<>]/g, '');
  }

  // Storage helpers (localStorage por enquanto)
  static async saveGalpao(galpao: GalpaoData): Promise<GalpaoData> {
    try {
      const galpoes = this.loadGalpoes();
      const index = galpoes.findIndex(g => g.id === galpao.id);
      
      const galpaoToSave = {
        ...galpao,
        atualizadoEm: new Date(),
        // Sanitizar textos
        nome: this.sanitizeText(galpao.nome),
        observacoes: galpao.observacoes ? this.sanitizeText(galpao.observacoes) : undefined,
        responsaveis: galpao.responsaveis.map(r => ({
          nome: this.sanitizeText(r.nome),
          funcao: this.sanitizeText(r.funcao)
        }))
      };

      if (index >= 0) {
        galpoes[index] = galpaoToSave;
      } else {
        galpaoToSave.criadoEm = new Date();
        galpoes.push(galpaoToSave);
      }

      localStorage.setItem('galpoes', JSON.stringify(galpoes));
      console.log('Galpão salvo com sucesso:', galpaoToSave.id);
      
      return galpaoToSave;
    } catch (error) {
      const errorId = Date.now().toString();
      console.error(`Erro ao salvar galpão (${errorId}):`, error);
      throw new Error(`Erro ao salvar. ID: ${errorId}`);
    }
  }

  static loadGalpoes(): GalpaoData[] {
    try {
      const stored = localStorage.getItem('galpoes');
      if (!stored) return [];
      
      return JSON.parse(stored).map((g: any) => ({
        ...g,
        criadoEm: new Date(g.criadoEm),
        atualizadoEm: new Date(g.atualizadoEm)
      }));
    } catch (error) {
      console.error('Erro ao carregar galpões:', error);
      return [];
    }
  }

  static deleteGalpao(id: string): void {
    const galpoes = this.loadGalpoes().filter(g => g.id !== id);
    localStorage.setItem('galpoes', JSON.stringify(galpoes));
  }

  // Configurações da densidade
  static getDensityConfig() {
    return {
      min: this.MIN_DENSITY,
      max: this.MAX_DENSITY,
      step: this.DENSITY_STEP,
      default: 6, // Valor padrão no meio da faixa
      tooltip: 'Recomendação para galinha caipira conforme boas práticas: 5–7 aves/m²'
    };
  }
}