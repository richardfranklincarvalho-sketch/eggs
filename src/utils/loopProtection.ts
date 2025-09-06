/**
 * Sistema de Proteção contra Loops e Economia de Créditos
 * Implementa timeouts, retry limits e deduplicação para evitar operações custosas
 */

interface OperationConfig {
  maxAttempts: number;
  timeoutMs: number;
  dedupWindowMs?: number;
  operationType: string;
}

interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attemptsUsed: number;
  creditsEstimate: number;
  economySummary: string;
}

class LoopProtectionManager {
  private operationCache = new Map<string, { timestamp: number; result: any }>();
  private runningOperations = new Set<string>();
  
  /**
   * Executa operação com proteção contra loops
   */
  async executeWithProtection<T>(
    operationId: string,
    operation: () => Promise<T>,
    config: OperationConfig
  ): Promise<OperationResult<T>> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: string | undefined;

    // Verificar cache/deduplicação
    if (config.dedupWindowMs) {
      const cached = this.operationCache.get(operationId);
      if (cached && (Date.now() - cached.timestamp) < config.dedupWindowMs) {
        console.log(`[CREDIT_SAVE] Cache hit for ${operationId} - 1 call avoided`);
        return {
          success: true,
          data: cached.result,
          attemptsUsed: 0,
          creditsEstimate: 1,
          economySummary: "Cache hit — 1 chamada evitada"
        };
      }
    }

    // Verificar se operação já está rodando
    if (this.runningOperations.has(operationId)) {
      return {
        success: false,
        error: "CONCURRENT_OPERATION - Operação já em execução",
        attemptsUsed: 0,
        creditsEstimate: 0,
        economySummary: "Execução concorrente evitada"
      };
    }

    this.runningOperations.add(operationId);

    try {
      while (attempts < config.maxAttempts) {
        attempts++;
        
        // Timeout check
        if (Date.now() - startTime > config.timeoutMs) {
          const economy = config.maxAttempts - attempts;
          return {
            success: false,
            error: "TIMEOUT - Tempo limite atingido — operação cancelada",
            attemptsUsed: attempts,
            creditsEstimate: economy,
            economySummary: `Timeout após ${attempts} tentativas — ${economy} chamadas evitadas`
          };
        }

        try {
          const result = await Promise.race([
            operation(),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Operation timeout')), config.timeoutMs)
            )
          ]);

          // Cache result if dedup enabled
          if (config.dedupWindowMs) {
            this.operationCache.set(operationId, {
              timestamp: Date.now(),
              result
            });
          }

          return {
            success: true,
            data: result,
            attemptsUsed: attempts,
            creditsEstimate: 0,
            economySummary: `Sucesso em ${attempts} tentativa(s)`
          };

        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
          
          // Exponential backoff
          if (attempts < config.maxAttempts) {
            const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Max attempts reached
      return {
        success: false,
        error: `LOOP_DETECT - Loop detectado — operação interrompida para economizar créditos após ${attempts} tentativas. Último erro: ${lastError}`,
        attemptsUsed: attempts,
        creditsEstimate: Math.floor(attempts * 0.5), // Estimativa de economia
        economySummary: `Loop detectado após ${attempts} tentativas — operação interrompida`
      };

    } finally {
      this.runningOperations.delete(operationId);
    }
  }

  /**
   * Limpa cache antigo para evitar vazamentos de memória
   */
  cleanupCache(maxAgeMs: number = 300000) { // 5 minutes default
    const now = Date.now();
    for (const [key, value] of this.operationCache.entries()) {
      if (now - value.timestamp > maxAgeMs) {
        this.operationCache.delete(key);
      }
    }
  }

  /**
   * Obter estatísticas de uso
   */
  getStats() {
    return {
      cacheSize: this.operationCache.size,
      runningOperations: this.runningOperations.size,
      cacheKeys: Array.from(this.operationCache.keys())
    };
  }
}

// Singleton instance
export const loopProtection = new LoopProtectionManager();

// Hook para React
export function useLoopProtection() {
  return {
    executeWithProtection: loopProtection.executeWithProtection.bind(loopProtection),
    cleanupCache: loopProtection.cleanupCache.bind(loopProtection),
    getStats: loopProtection.getStats.bind(loopProtection)
  };
}

// Configurações padrão para diferentes tipos de operação
export const OPERATION_CONFIGS = {
  CALENDAR_GENERATION: {
    maxAttempts: 3,
    timeoutMs: 10000,
    dedupWindowMs: 60000, // 1 minute
    operationType: 'calendar_generation'
  },
  PDF_EXPORT: {
    maxAttempts: 2,
    timeoutMs: 15000,
    dedupWindowMs: 30000, // 30 seconds
    operationType: 'pdf_export'
  },
  BATCH_SAVE: {
    maxAttempts: 3,
    timeoutMs: 5000,
    operationType: 'batch_save'
  },
  REPORT_GENERATION: {
    maxAttempts: 2,
    timeoutMs: 20000,
    dedupWindowMs: 120000, // 2 minutes
    operationType: 'report_generation'
  }
} as const;

// Auto cleanup task
setInterval(() => {
  loopProtection.cleanupCache();
}, 300000); // Run every 5 minutes