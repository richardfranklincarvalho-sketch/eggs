# Controle de Produção de Ovos

Sistema completo para acompanhamento da produção de ovos com foco em **praticidade**, **interatividade**, **responsividade** e **economia de créditos/custos computacionais**.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Dark Theme Priorizado**: Interface otimizada para modo escuro com toggle light/dark/system
- **Proteção contra Loops**: Sistema avançado de detecção e prevenção de operações custosas
- **Calendário Interativo**: Visualização por fases com cores personalizáveis
- **Cadastro de Lotes**: Gerenciamento completo de informações dos lotes
- **Parâmetros Configuráveis**: Customização de fases, consumo e raças
- **Relatórios Exportáveis**: Geração de relatórios em CSV
- **Cache Inteligente**: Otimização de performance com TanStack Query

### 🔄 Em Desenvolvimento
- Backend Node.js + TypeScript + Fastify + Prisma
- Exportação PDF otimizada
- Testes unitários e e2e
- Documentação OpenAPI/Swagger

## 🎨 Design System

### Paleta de Cores (Dark Theme)
```css
--bg-main: #000000          /* Preto puro - fundo principal */
--bg-surface: #0A0A0A       /* Superfícies de cards/panels */
--text-primary: #E6E6E6     /* Texto principal (alto contraste) */
--text-secondary: #BDBDBD   /* Textos secundários */
--accent-1: #2ECC71         /* Verde - sucesso/consumo positivo */
--accent-2: #FFB86B         /* Laranja - fase produção */
--accent-3: #66B2FF         /* Azul claro - fase recria */
--danger: #FF6B6B           /* Vermelho - alertas */
```

### Acessibilidade
- ✅ Contraste WCAG 2.2 AA (4.5:1 mínimo)
- ✅ Navegação por teclado
- ✅ ARIA labels e roles
- ✅ Suporte a `prefers-color-scheme`
- ✅ Modo alto contraste opcional
- ✅ Redução de movimento (`prefers-reduced-motion`)

## 💰 Sistema de Economia de Créditos

### Proteção contra Loops
O sistema implementa várias camadas de proteção:

```typescript
// Configuração automática por tipo de operação
OPERATION_CONFIGS = {
  CALENDAR_GENERATION: { maxAttempts: 3, timeoutMs: 10000, dedupWindowMs: 60000 },
  PDF_EXPORT: { maxAttempts: 2, timeoutMs: 15000, dedupWindowMs: 30000 },
  BATCH_SAVE: { maxAttempts: 3, timeoutMs: 5000 },
  REPORT_GENERATION: { maxAttempts: 2, timeoutMs: 20000, dedupWindowMs: 120000 }
}
```

### Códigos de Erro Padronizados
- `LOOP_DETECT`: Loop detectado — operação interrompida para economizar créditos
- `TIMEOUT`: Tempo limite atingido — operação cancelada
- `RATE_LIMIT`: Limite de chamadas atingido — tente novamente mais tarde
- `CONCURRENT_OPERATION`: Operação já em execução

### Métricas de Economia
O sistema registra automaticamente:
- Número de chamadas evitadas por cache
- Operações interrompidas por timeout/loop
- Estimativa de economia de créditos
- Logs detalhados para auditoria

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Frontend (React + TypeScript + Vite)
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

### Backend (Em desenvolvimento)
```bash
# Navegar para pasta do backend
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Executar migrações
npx prisma migrate dev

# Executar em desenvolvimento
npm run dev
```

## 📊 Dados de Exemplo

### Preset NOVOgen Tinted
```json
{
  "raca": "NOVOgen Tinted",
  "fases": {
    "recria": { "semanas": 18, "consumoAcumulado": 126 },
    "crescimento": { "semanas": 4, "consumoPorSemana": 140 },
    "producao": { "semanas": 54, "consumoPorSemana": 126 }
  },
  "cores": {
    "recria": "#66B2FF",
    "crescimento": "#2ECC71", 
    "producao": "#FFB86B"
  }
}
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes com coverage
npm run test:coverage

# Testes e2e
npm run test:e2e
```

## 📡 API Endpoints (Planejados)

### Lotes
- `GET /api/batches` - Listar lotes
- `POST /api/batches` - Criar lote
- `GET /api/batches/:id` - Obter lote
- `PUT /api/batches/:id` - Atualizar lote
- `DELETE /api/batches/:id` - Remover lote

### Calendário
- `GET /api/batches/:id/calendar` - Gerar calendário de produção
- `POST /api/batches/:id/calendar/export` - Exportar calendário

### Relatórios
- `GET /api/reports/consumption` - Relatório de consumo
- `POST /api/reports/export` - Exportar relatórios

### Exemplo de Resposta - Calendário
```json
{
  "batchId": "batch_123",
  "weeks": [
    {
      "week": 1,
      "startDate": "2024-01-01",
      "endDate": "2024-01-07",
      "phase": "recria",
      "consumptionPerBird": 7,
      "totalConsumption": 3500,
      "description": "Fase de desenvolvimento inicial"
    }
  ],
  "summary": {
    "totalWeeks": 76,
    "phases": ["recria", "crescimento", "producao"],
    "totalConsumption": 952000
  }
}
```

## 🔧 Configuração de Desenvolvimento

### ESLint + Prettier
```bash
# Verificar código
npm run lint

# Corrigir automaticamente
npm run lint:fix

# Formatar código
npm run format
```

### Estrutura do Projeto
```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (shadcn)
│   ├── Layout.tsx      # Layout principal
│   └── ThemeToggle.tsx # Toggle de tema
├── hooks/              # Hooks customizados
├── pages/              # Páginas da aplicação
├── utils/              # Utilitários e helpers
│   └── loopProtection.ts # Sistema anti-loop
├── types/              # Definições TypeScript
└── styles/             # Estilos globais
```

## 🚦 Status das Funcionalidades

| Funcionalidade | Status | Prioridade |
|---------------|--------|------------|
| Dark Theme | ✅ Completo | Alta |
| Proteção Anti-Loop | ✅ Completo | Alta |
| Cadastro de Lotes | ✅ Completo | Alta |
| Calendário Interativo | ✅ Completo | Alta |
| Parâmetros Configuráveis | ✅ Completo | Média |
| Exportação CSV | ✅ Completo | Média |
| Backend API | 🔄 Em desenvolvimento | Alta |
| Exportação PDF | 🔄 Planejado | Baixa |
| Testes Automatizados | 🔄 Planejado | Média |
| Documentação API | 🔄 Planejado | Baixa |

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Add: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🔍 Troubleshooting

### Problemas Comuns

**Erro: "Loop detectado"**
- Verifique se a operação não está sendo chamada repetidamente
- Aumente o timeout ou reduza o número de tentativas
- Verifique os logs para identificar a causa

**Performance lenta**
- Ative o cache de operações
- Verifique se as operações estão sendo executadas no cliente
- Use debouncing para inputs que disparam processamento

**Tema não aplicado**
- Limpe o localStorage: `localStorage.clear()`
- Verifique se as classes CSS estão sendo aplicadas corretamente
- Recarregue a página

### Logs Importantes
```bash
# Ver logs de economia de créditos
grep "CREDIT_SAVE" logs/app.log

# Ver loops detectados
grep "LOOP_DETECT" logs/app.log

# Ver operações com timeout
grep "TIMEOUT" logs/app.log
```

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Procure issues similares no GitHub
3. Abra uma nova issue com detalhes do problema
4. Inclua logs relevantes e passos para reproduzir

**Desenvolvido com foco em economia de recursos e máxima eficiência** 🌱