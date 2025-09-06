import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Edit2, Trash2, Package, Calculator, Download, Upload, DollarSign, TrendingUp, AlertTriangle, FileText, Building, Thermometer, Droplets, Settings, Camera, Users, BarChart3, LineChart, ZoomIn, RotateCw, Ruler } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Novos componentes e serviços
import { MeasurementGuide } from '@/components/MeasurementGuide';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { GalpaoService, type GalpaoData } from '@/services/galpaoService';
import { GalpaoManagement } from '@/components/GalpaoManagement';

interface Insumo {
  id: string;
  nome: string;
  categoria: 'racao' | 'medicamento' | 'suplemento' | 'material' | 'outro';
  precoPorKg: number;
  unidade: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  fornecedor?: string;
  dataCompra?: Date;
  dataValidade?: Date;
  loteCompra?: string;
}

interface IngredienteFormula {
  insumoId: string;
  nome: string;
  percentual: number;
  precoPorKg: number;
}

interface Formula {
  id: string;
  nome: string;
  tipo: 'inicial' | 'crescimento' | 'postura' | 'terminacao';
  ingredientes: IngredienteFormula[];
  custoTotal: number;
  criadoEm: Date;
  atualizadoEm: Date;
}

interface CentroCusto {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  criadoEm: Date;
}

interface MovimentoEstoque {
  id: string;
  insumoId: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  custoUnitario?: number;
  custoTotal?: number;
  data: Date;
  centroCustoId?: string;
  observacoes?: string;
  documento?: string;
}

interface Galpao {
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
  responsaveis: Array<{
    nome: string;
    funcao: string;
  }>;
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

interface RegistroTemperatura {
  id: string;
  galpaoId: string;
  data: Date;
  horario: string;
  temperatura: number;
  responsavel: string;
  observacoes?: string;
}

interface RegistroAgua {
  id: string;
  galpaoId: string;
  data: Date;
  horario: string;
  consumo: number; // m³
  responsavel: string;
  observacoes?: string;
}

interface ObservacaoManutencao {
  id: string;
  galpaoId: string;
  data: Date;
  responsavel: string;
  descricao: string;
  anexo?: string; // Base64 ou URL
  tipo: 'manutencao' | 'limpeza' | 'inspecao' | 'reparo' | 'outro';
}

const insumoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.enum(['racao', 'medicamento', 'suplemento', 'material', 'outro']),
  precoPorKg: z.coerce.number().min(0.01, 'Preço deve ser maior que zero'),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  estoqueAtual: z.coerce.number().min(0, 'Estoque não pode ser negativo'),
  estoqueMinimo: z.coerce.number().min(0, 'Estoque mínimo não pode ser negativo'),
  fornecedor: z.string().optional(),
  dataValidade: z.string().optional(),
  loteCompra: z.string().optional(),
});

const formulaSchema = z.object({
  nome: z.string().min(1, 'Nome da fórmula é obrigatório'),
  tipo: z.enum(['inicial', 'crescimento', 'postura', 'terminacao']),
  ingredientes: z.array(z.object({
    insumoId: z.string(),
    percentual: z.coerce.number().min(0.1, 'Mínimo 0.1%').max(100, 'Máximo 100%'),
  })).min(1, 'Adicione pelo menos um ingrediente'),
});

const centroCustoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
});

const movimentoSchema = z.object({
  insumoId: z.string().min(1, 'Selecione um insumo'),
  tipo: z.enum(['entrada', 'saida']),
  quantidade: z.coerce.number().min(0.01, 'Quantidade deve ser maior que zero'),
  custoUnitario: z.coerce.number().min(0).optional(),
  centroCustoId: z.string().optional(),
  observacoes: z.string().optional(),
  documento: z.string().optional(),
});

const galpaoSchema = z.object({
  nome: z.string().min(1, 'Nome do galpão é obrigatório'),
  largura: z.coerce.number().min(0.1, 'Largura deve ser maior que 0,1m').max(500, 'Largura máxima: 500m'),
  comprimento: z.coerce.number().min(0.1, 'Comprimento deve ser maior que 0,1m').max(500, 'Comprimento máximo: 500m'),
  altura: z.coerce.number().min(0.1, 'Altura deve ser maior que 0,1m').max(500, 'Altura máxima: 500m'),
  densidade: z.coerce.number().min(5, 'Mínimo 5 aves/m²').max(7, 'Máximo 7 aves/m²'),
  lotacaoManual: z.coerce.number().optional(),
  observacoes: z.string().optional(),
  responsaveis: z.array(z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    funcao: z.string().min(1, 'Função é obrigatória'),
  })).min(1, 'Adicione pelo menos um responsável'),
});

const temperaturaSchema = z.object({
  galpaoId: z.string().min(1, 'Selecione um galpão'),
  temperatura: z.coerce.number().min(-50).max(80, 'Temperatura deve estar entre -50°C e 80°C'),
  responsavel: z.string().min(1, 'Responsável é obrigatório'),
  observacoes: z.string().optional(),
});

const aguaSchema = z.object({
  galpaoId: z.string().min(1, 'Selecione um galpão'),
  consumo: z.coerce.number().min(0.001, 'Consumo deve ser maior que zero'),
  responsavel: z.string().min(1, 'Responsável é obrigatório'),
  observacoes: z.string().optional(),
});

const manutencaoSchema = z.object({
  galpaoId: z.string().min(1, 'Selecione um galpão'),
  responsavel: z.string().min(1, 'Responsável é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  tipo: z.enum(['manutencao', 'limpeza', 'inspecao', 'reparo', 'outro']),
});

const categorias = {
  racao: { nome: 'Ração', cor: 'bg-orange-100 text-orange-800' },
  medicamento: { nome: 'Medicamento', cor: 'bg-red-100 text-red-800' },
  suplemento: { nome: 'Suplemento', cor: 'bg-green-100 text-green-800' },
  material: { nome: 'Material', cor: 'bg-blue-100 text-blue-800' },
  outro: { nome: 'Outro', cor: 'bg-gray-100 text-gray-800' },
};

const tiposFormula = {
  inicial: { nome: 'Inicial', cor: 'bg-blue-100 text-blue-800' },
  crescimento: { nome: 'Crescimento', cor: 'bg-green-100 text-green-800' },
  postura: { nome: 'Postura', cor: 'bg-orange-100 text-orange-800' },
  terminacao: { nome: 'Terminação', cor: 'bg-purple-100 text-purple-800' },
};

export default function Gerenciamento() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoEstoque[]>([]);
  
  // Estados para galpões
  const [galpoes, setGalpoes] = useState<Galpao[]>([]);
  const [registrosTemperatura, setRegistrosTemperatura] = useState<RegistroTemperatura[]>([]);
  const [registrosAgua, setRegistrosAgua] = useState<RegistroAgua[]>([]);
  const [observacoesManutencao, setObservacoesManutencao] = useState<ObservacaoManutencao[]>([]);
  const [visualizacao, setVisualizacao] = useState<'lista' | 'grafico'>('lista');
  
  // Estados do formulário de galpão
  const [dialogGalpao, setDialogGalpao] = useState(false);
  const [galpaoEditando, setGalpaoEditando] = useState<Galpao | null>(null);
  const [galpaoSelecionado, setGalpaoSelecionado] = useState<string>('');
  const [responsaveisGalpao, setResponsaveisGalpao] = useState<Array<{nome: string, funcao: string}>>([{nome: '', funcao: ''}]);
  
  // Estados para foto e cálculos
  const [fotoProcessing, setFotoProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  
  // Estados para cálculos automáticos
  const [larguraInput, setLarguraInput] = useState(0);
  const [comprimentoInput, setComprimentoInput] = useState(0);
  const [areaCalculada, setAreaCalculada] = useState(0);
  const [densidadeInput, setDensidadeInput] = useState([6]); // Array para Slider
  const [lotacaoCalculada, setLotacaoCalculada] = useState(0);
  const [lotacaoOverride, setLotacaoOverride] = useState(false);
  const [lotacaoManual, setLotacaoManual] = useState<number | undefined>();
  
  const [dialogInsumo, setDialogInsumo] = useState(false);
  const [dialogFormula, setDialogFormula] = useState(false);
  const [dialogCentroCusto, setDialogCentroCusto] = useState(false);
  const [dialogMovimento, setDialogMovimento] = useState(false);
  
  // Dialogs para galpões
  const [dialogGalpao, setDialogGalpao] = useState(false);
  const [dialogTemperatura, setDialogTemperatura] = useState(false);
  const [dialogAgua, setDialogAgua] = useState(false);
  const [dialogManutencao, setDialogManutencao] = useState(false);
  
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null);
  const [formulaEditando, setFormulaEditando] = useState<Formula | null>(null);
  const [centroCustoEditando, setCentroCustoEditando] = useState<CentroCusto | null>(null);
  
  // Estados de edição para galpões
  const [galpaoEditando, setGalpaoEditando] = useState<Galpao | null>(null);
  const [galpaoSelecionado, setGalpaoSelecionado] = useState<string>('');
  
  const [ingredientesSelecionados, setIngredientesSelecionados] = useState<IngredienteFormula[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  
  // Estados para galpões
  const [responsaveisGalpao, setResponsaveisGalpao] = useState<Array<{nome: string, funcao: string}>>([{nome: '', funcao: ''}]);
  const [fotoGalpao, setFotoGalpao] = useState<string>('');
  
  // Funções de exportação
  const exportarCSVTemperatura = (galpaoId: string) => {
    const registros = registrosTemperatura.filter(r => r.galpaoId === galpaoId);
    const galpao = galpoes.find(g => g.id === galpaoId);
    
    if (registros.length === 0) {
      toast({
        title: 'Sem dados',
        description: 'Não há registros de temperatura para exportar.',
        variant: 'destructive',
      });
      return;
    }

    const csvContent = [
      ['Data', 'Horário', 'Temperatura (°C)', 'Responsável', 'Observações'],
      ...registros.map(r => [
        r.data.toLocaleDateString('pt-BR'),
        r.horario,
        r.temperatura.toString(),
        r.responsavel,
        r.observacoes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `temperatura_${galpao?.nome}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Exportação concluída',
      description: 'Dados de temperatura exportados com sucesso.',
    });
  };

  const exportarCSVAgua = (galpaoId: string) => {
    const registros = registrosAgua.filter(r => r.galpaoId === galpaoId);
    const galpao = galpoes.find(g => g.id === galpaoId);
    
    if (registros.length === 0) {
      toast({
        title: 'Sem dados',
        description: 'Não há registros de consumo de água para exportar.',
        variant: 'destructive',
      });
      return;
    }

    const csvContent = [
      ['Data', 'Horário', 'Consumo (m³)', 'Responsável', 'Observações'],
      ...registros.map(r => [
        r.data.toLocaleDateString('pt-BR'),
        r.horario,
        r.consumo.toString(),
        r.responsavel,
        r.observacoes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `agua_${galpao?.nome}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Exportação concluída',
      description: 'Dados de consumo exportados com sucesso.',
    });
  };

  const exportarPDFTemperatura = async (galpaoId: string) => {
    try {
      const { jsPDF } = await import('jspdf');
      const registros = registrosTemperatura.filter(r => r.galpaoId === galpaoId);
      const galpao = galpoes.find(g => g.id === galpaoId);
      
      if (registros.length === 0) {
        toast({
          title: 'Sem dados',
          description: 'Não há registros de temperatura para exportar.',
          variant: 'destructive',
        });
        return;
      }

      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(16);
      doc.text(`Relatório de Temperatura - ${galpao?.nome}`, 20, 20);
      
      // Data do relatório
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
      
      // Cabeçalhos
      doc.setFontSize(12);
      let y = 50;
      doc.text('Data', 20, y);
      doc.text('Horário', 60, y);
      doc.text('Temperatura', 100, y);
      doc.text('Responsável', 140, y);
      
      // Dados
      doc.setFontSize(10);
      y += 10;
      
      registros.forEach((registro, index) => {
        if (y > 270) { // Nova página
          doc.addPage();
          y = 20;
        }
        
        doc.text(registro.data.toLocaleDateString('pt-BR'), 20, y);
        doc.text(registro.horario, 60, y);
        doc.text(`${registro.temperatura}°C`, 100, y);
        doc.text(registro.responsavel, 140, y);
        
        y += 8;
      });

      doc.save(`temperatura_${galpao?.nome}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: 'Exportação concluída',
        description: 'Relatório PDF gerado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar o PDF.',
        variant: 'destructive',
      });
    }
  };

  // Funções para campos personalizados
  const adicionarCampoPersonalizado = () => {
    setNovosCampos([...novosCampos, { nome: '', tipo: 'texto', valor: '' }]);
  };

  const removerCampoPersonalizado = (index: number) => {
    setNovosCampos(novosCampos.filter((_, i) => i !== index));
  };

  const atualizarCampoPersonalizado = (index: number, campo: string, valor: any) => {
    const novos = [...novosCampos];
    novos[index] = { ...novos[index], [campo]: valor };
    setNovosCampos(novos);
  };

  const salvarCamposPersonalizados = (galpaoId: string) => {
    const galpao = galpoes.find(g => g.id === galpaoId);
    if (!galpao) return;

    const camposFormatados = novosCampos.reduce((acc, campo) => {
      if (campo.nome && campo.valor !== undefined) {
        acc[campo.nome] = campo.valor;
      }
      return acc;
    }, {} as Record<string, any>);

    const galpaoAtualizado = {
      ...galpao,
      camposPersonalizados: { ...galpao.camposPersonalizados, ...camposFormatados },
      atualizadoEm: new Date(),
    };

    const novosGalpoes = galpoes.map(g => g.id === galpaoId ? galpaoAtualizado : g);
    setGalpoes(novosGalpoes);
    localStorage.setItem('galpoes', JSON.stringify(novosGalpoes));

    toast({
      title: 'Campos salvos!',
      description: 'Campos personalizados atualizados com sucesso.',
    });

    setNovosCampos([]);
  };

  // Função para preparar dados dos gráficos
  const prepararDadosGraficoTemperatura = (galpaoId: string) => {
    return registrosTemperatura
      .filter(r => r.galpaoId === galpaoId)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(-10) // Últimos 10 registros
      .map(r => ({
        data: r.data.toLocaleDateString('pt-BR'),
        temperatura: r.temperatura,
        horario: r.horario
      }));
  };

  const prepararDadosGraficoAgua = (galpaoId: string) => {
    return registrosAgua
      .filter(r => r.galpaoId === galpaoId)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(-10) // Últimos 10 registros
      .map(r => ({
        data: r.data.toLocaleDateString('pt-BR'),
        consumo: r.consumo,
        horario: r.horario
      }));
  };

  const formInsumo = useForm<any>({
    resolver: zodResolver(insumoSchema),
    defaultValues: {
      nome: '',
      categoria: 'racao',
      precoPorKg: 0,
      unidade: 'kg',
      estoqueAtual: 0,
      estoqueMinimo: 0,
      fornecedor: '',
      dataValidade: '',
      loteCompra: '',
    },
  });

  const formFormula = useForm<any>({
    resolver: zodResolver(formulaSchema),
    defaultValues: {
      nome: '',
      tipo: 'inicial',
      ingredientes: [],
    },
  });

  const formCentroCusto = useForm({
    resolver: zodResolver(centroCustoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
    },
  });

  const formMovimento = useForm({
    resolver: zodResolver(movimentoSchema),
    defaultValues: {
      insumoId: '',
      tipo: 'entrada' as const,
      quantidade: 0,
      custoUnitario: 0,
      centroCustoId: '',
      observacoes: '',
      documento: '',
    },
  });

  // Forms para galpões
  const formGalpao = useForm({
    resolver: zodResolver(galpaoSchema),
    defaultValues: {
      nome: '',
      area: 0,
      comprimento: 0,
      largura: 0,
      altura: 0,
      responsaveis: [{ nome: '', funcao: '' }],
    },
  });

  const formTemperatura = useForm({
    resolver: zodResolver(temperaturaSchema),
    defaultValues: {
      galpaoId: '',
      temperatura: 0,
      responsavel: '',
      observacoes: '',
    },
  });

  const formAgua = useForm({
    resolver: zodResolver(aguaSchema),
    defaultValues: {
      galpaoId: '',
      consumo: 0,
      responsavel: '',
      observacoes: '',
    },
  });

  const formManutencao = useForm({
    resolver: zodResolver(manutencaoSchema),
    defaultValues: {
      galpaoId: '',
      responsavel: '',
      descricao: '',
      tipo: 'manutencao' as const,
    },
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    // Carregar insumos
    const insumosStr = localStorage.getItem('insumos');
    if (insumosStr) {
      setInsumos(JSON.parse(insumosStr));
    }

    // Carregar fórmulas
    const formulasStr = localStorage.getItem('formulas-racao');
    if (formulasStr) {
      const formulasParseadas = JSON.parse(formulasStr).map((f: any) => ({
        ...f,
        criadoEm: new Date(f.criadoEm),
        atualizadoEm: new Date(f.atualizadoEm),
      }));
      setFormulas(formulasParseadas);
    }

    // Carregar centros de custo
    const centrosStr = localStorage.getItem('centros-custo');
    if (centrosStr) {
      const centrosParseados = JSON.parse(centrosStr).map((c: any) => ({
        ...c,
        criadoEm: new Date(c.criadoEm),
      }));
      setCentrosCusto(centrosParseados);
    }

    // Carregar movimentos
    const movimentosStr = localStorage.getItem('movimentos-estoque');
    if (movimentosStr) {
      const movimentosParseados = JSON.parse(movimentosStr).map((m: any) => ({
        ...m,
        data: new Date(m.data),
      }));
      setMovimentos(movimentosParseados);
    }

    // Carregar galpões
    const galpoesStr = localStorage.getItem('galpoes');
    if (galpoesStr) {
      const galpoesParseados = JSON.parse(galpoesStr).map((g: any) => ({
        ...g,
        criadoEm: new Date(g.criadoEm),
        atualizadoEm: new Date(g.atualizadoEm),
      }));
      setGalpoes(galpoesParseados);
    }

    // Carregar registros de temperatura
    const temperaturasStr = localStorage.getItem('registros-temperatura');
    if (temperaturasStr) {
      const temperaturasParseadas = JSON.parse(temperaturasStr).map((t: any) => ({
        ...t,
        data: new Date(t.data),
      }));
      setRegistrosTemperatura(temperaturasParseadas);
    }

    // Carregar registros de água
    const aguaStr = localStorage.getItem('registros-agua');
    if (aguaStr) {
      const aguaParseadas = JSON.parse(aguaStr).map((a: any) => ({
        ...a,
        data: new Date(a.data),
      }));
      setRegistrosAgua(aguaParseadas);
    }

    // Carregar observações de manutenção
    const manutencoesStr = localStorage.getItem('observacoes-manutencao');
    if (manutencoesStr) {
      const manutencoesParseadas = JSON.parse(manutencoesStr).map((m: any) => ({
        ...m,
        data: new Date(m.data),
      }));
      setObservacoesManutencao(manutencoesParseadas);
    }
  };

  const salvarInsumo = (data: any) => {
    const novoInsumo: Insumo = {
      id: insumoEditando?.id || Date.now().toString(),
      ...data,
      dataCompra: new Date(),
      dataValidade: data.dataValidade ? new Date(data.dataValidade) : undefined,
    };

    let novosInsumos;
    if (insumoEditando) {
      novosInsumos = insumos.map(i => i.id === insumoEditando.id ? novoInsumo : i);
      toast({
        title: 'Insumo atualizado!',
        description: `"${data.nome}" foi atualizado com sucesso.`,
      });
    } else {
      novosInsumos = [...insumos, novoInsumo];
      toast({
        title: 'Insumo cadastrado!',
        description: `"${data.nome}" foi adicionado ao estoque.`,
      });
    }

    setInsumos(novosInsumos);
    localStorage.setItem('insumos', JSON.stringify(novosInsumos));
    setDialogInsumo(false);
    setInsumoEditando(null);
    formInsumo.reset();
  };

  const salvarFormula = (data: any) => {
    if (calcularPercentualTotal() !== 100) {
      toast({
        title: 'Erro na formulação',
        description: 'A soma dos percentuais deve ser exatamente 100%',
        variant: 'destructive',
      });
      return;
    }

    const novaFormula: Formula = {
      id: formulaEditando?.id || Date.now().toString(),
      nome: data.nome,
      tipo: data.tipo,
      ingredientes: ingredientesSelecionados,
      custoTotal: calcularCustoTotal(),
      criadoEm: formulaEditando?.criadoEm || new Date(),
      atualizadoEm: new Date(),
    };

    let novasFormulas;
    if (formulaEditando) {
      novasFormulas = formulas.map(f => f.id === formulaEditando.id ? novaFormula : f);
      toast({
        title: 'Fórmula atualizada!',
        description: `"${data.nome}" foi atualizada com sucesso.`,
      });
    } else {
      novasFormulas = [...formulas, novaFormula];
      toast({
        title: 'Fórmula criada!',
        description: `"${data.nome}" foi criada com sucesso.`,
      });
    }

    setFormulas(novasFormulas);
    localStorage.setItem('formulas-racao', JSON.stringify(novasFormulas));
    setDialogFormula(false);
    setFormulaEditando(null);
    setIngredientesSelecionados([]);
    formFormula.reset();
  };

  const salvarCentroCusto = (data: any) => {
    const novoCentro: CentroCusto = {
      id: centroCustoEditando?.id || Date.now().toString(),
      nome: data.nome,
      descricao: data.descricao,
      ativo: true,
      criadoEm: centroCustoEditando?.criadoEm || new Date(),
    };

    let novosCentros;
    if (centroCustoEditando) {
      novosCentros = centrosCusto.map(c => c.id === centroCustoEditando.id ? novoCentro : c);
      toast({
        title: 'Centro de custo atualizado!',
        description: `"${data.nome}" foi atualizado com sucesso.`,
      });
    } else {
      novosCentros = [...centrosCusto, novoCentro];
      toast({
        title: 'Centro de custo criado!',
        description: `"${data.nome}" foi criado com sucesso.`,
      });
    }

    setCentrosCusto(novosCentros);
    localStorage.setItem('centros-custo', JSON.stringify(novosCentros));
    setDialogCentroCusto(false);
    setCentroCustoEditando(null);
    formCentroCusto.reset();
  };

  const salvarMovimento = (data: any) => {
    const novoMovimento: MovimentoEstoque = {
      id: Date.now().toString(),
      ...data,
      custoTotal: data.custoUnitario ? data.quantidade * data.custoUnitario : undefined,
      data: new Date(),
    };

    // Atualizar estoque
    const novosInsumos = insumos.map(insumo => {
      if (insumo.id === data.insumoId) {
        const novaQuantidade = data.tipo === 'entrada' 
          ? insumo.estoqueAtual + data.quantidade
          : insumo.estoqueAtual - data.quantidade;
        
        return {
          ...insumo,
          estoqueAtual: Math.max(0, novaQuantidade)
        };
      }
      return insumo;
    });

    const novosMovimentos = [...movimentos, novoMovimento];

    setInsumos(novosInsumos);
    setMovimentos(novosMovimentos);
    localStorage.setItem('insumos', JSON.stringify(novosInsumos));
    localStorage.setItem('movimentos-estoque', JSON.stringify(novosMovimentos));

    const insumo = insumos.find(i => i.id === data.insumoId);
    toast({
      title: 'Movimento registrado!',
      description: `${data.tipo === 'entrada' ? 'Entrada' : 'Saída'} de ${data.quantidade} ${insumo?.unidade || 'un'} de ${insumo?.nome}`,
    });

    setDialogMovimento(false);
    formMovimento.reset();
  };

  // Funções para galpões
  const salvarGalpao = (data: any) => {
    const novoGalpao: Galpao = {
      id: galpaoEditando?.id || Date.now().toString(),
      nome: data.nome,
      foto: fotoGalpao,
      tamanho: {
        area: data.area,
        comprimento: data.comprimento,
        largura: data.largura,
        altura: data.altura,
      },
      responsaveis: responsaveisGalpao.filter(r => r.nome && r.funcao),
      criadoEm: galpaoEditando?.criadoEm || new Date(),
      atualizadoEm: new Date(),
    };

    let novosGalpoes;
    if (galpaoEditando) {
      novosGalpoes = galpoes.map(g => g.id === galpaoEditando.id ? novoGalpao : g);
      toast({
        title: 'Galpão atualizado!',
        description: `"${data.nome}" foi atualizado com sucesso.`,
      });
    } else {
      novosGalpoes = [...galpoes, novoGalpao];
      toast({
        title: 'Galpão cadastrado!',
        description: `"${data.nome}" foi adicionado ao sistema.`,
      });
    }

    setGalpoes(novosGalpoes);
    localStorage.setItem('galpoes', JSON.stringify(novosGalpoes));
    setDialogGalpao(false);
    setGalpaoEditando(null);
    setResponsaveisGalpao([{nome: '', funcao: ''}]);
    setFotoGalpao('');
    formGalpao.reset();
  };

  const salvarTemperatura = (data: any) => {
    const novoRegistro: RegistroTemperatura = {
      id: Date.now().toString(),
      galpaoId: data.galpaoId,
      data: new Date(),
      horario: new Date().toLocaleTimeString('pt-BR'),
      temperatura: data.temperatura,
      responsavel: data.responsavel,
      observacoes: data.observacoes,
    };

    const novosRegistros = [...registrosTemperatura, novoRegistro];
    setRegistrosTemperatura(novosRegistros);
    localStorage.setItem('registros-temperatura', JSON.stringify(novosRegistros));

    const galpao = galpoes.find(g => g.id === data.galpaoId);
    toast({
      title: 'Temperatura registrada!',
      description: `${data.temperatura}°C no galpão "${galpao?.nome}"`,
    });

    setDialogTemperatura(false);
    formTemperatura.reset();
  };

  const salvarAgua = (data: any) => {
    const novoRegistro: RegistroAgua = {
      id: Date.now().toString(),
      galpaoId: data.galpaoId,
      data: new Date(),
      horario: new Date().toLocaleTimeString('pt-BR'),
      consumo: data.consumo,
      responsavel: data.responsavel,
      observacoes: data.observacoes,
    };

    const novosRegistros = [...registrosAgua, novoRegistro];
    setRegistrosAgua(novosRegistros);
    localStorage.setItem('registros-agua', JSON.stringify(novosRegistros));

    const galpao = galpoes.find(g => g.id === data.galpaoId);
    toast({
      title: 'Consumo de água registrado!',
      description: `${data.consumo} m³ no galpão "${galpao?.nome}"`,
    });

    setDialogAgua(false);
    formAgua.reset();
  };

  const salvarManutencao = (data: any) => {
    const novaObservacao: ObservacaoManutencao = {
      id: Date.now().toString(),
      galpaoId: data.galpaoId,
      data: new Date(),
      responsavel: data.responsavel,
      descricao: data.descricao,
      tipo: data.tipo,
    };

    const novasObservacoes = [...observacoesManutencao, novaObservacao];
    setObservacoesManutencao(novasObservacoes);
    localStorage.setItem('observacoes-manutencao', JSON.stringify(novasObservacoes));

    const galpao = galpoes.find(g => g.id === data.galpaoId);
    toast({
      title: 'Observação registrada!',
      description: `Manutenção no galpão "${galpao?.nome}"`,
    });

    setDialogManutencao(false);
    formManutencao.reset();
  };

  const adicionarIngrediente = () => {
    setIngredientesSelecionados([
      ...ingredientesSelecionados,
      { insumoId: '', nome: '', percentual: 0, precoPorKg: 0 }
    ]);
  };

  const removerIngrediente = (index: number) => {
    setIngredientesSelecionados(ingredientesSelecionados.filter((_, i) => i !== index));
  };

  const atualizarIngrediente = (index: number, campo: keyof IngredienteFormula, valor: any) => {
    const novosIngredientes = [...ingredientesSelecionados];
    if (campo === 'insumoId') {
      const insumo = insumos.find(i => i.id === valor);
      if (insumo) {
        novosIngredientes[index] = {
          ...novosIngredientes[index],
          insumoId: valor,
          nome: insumo.nome,
          precoPorKg: insumo.precoPorKg,
        };
      }
    } else {
      novosIngredientes[index] = {
        ...novosIngredientes[index],
        [campo]: valor,
      };
    }
    setIngredientesSelecionados(novosIngredientes);
  };

  const calcularCustoTotal = () => {
    return ingredientesSelecionados.reduce((total, ing) => {
      return total + (ing.precoPorKg * ing.percentual / 100);
    }, 0);
  };

  const calcularPercentualTotal = () => {
    return ingredientesSelecionados.reduce((total, ing) => total + ing.percentual, 0);
  };

  const editarInsumo = (insumo: Insumo) => {
    setInsumoEditando(insumo);
    formInsumo.reset({
      nome: insumo.nome,
      categoria: insumo.categoria,
      precoPorKg: insumo.precoPorKg,
      unidade: insumo.unidade,
      estoqueAtual: insumo.estoqueAtual,
      estoqueMinimo: insumo.estoqueMinimo,
      fornecedor: insumo.fornecedor || '',
      dataValidade: insumo.dataValidade ? insumo.dataValidade.toISOString().split('T')[0] : '',
      loteCompra: insumo.loteCompra || '',
    });
    setDialogInsumo(true);
  };

  const editarFormula = (formula: Formula) => {
    setFormulaEditando(formula);
    setIngredientesSelecionados(formula.ingredientes);
    formFormula.reset({
      nome: formula.nome,
      tipo: formula.tipo,
      ingredientes: formula.ingredientes.map(i => ({
        insumoId: i.insumoId,
        percentual: i.percentual,
      })),
    });
    setDialogFormula(true);
  };

  const editarCentroCusto = (centro: CentroCusto) => {
    setCentroCustoEditando(centro);
    formCentroCusto.reset({
      nome: centro.nome,
      descricao: centro.descricao || '',
    });
    setDialogCentroCusto(true);
  };

  const excluirInsumo = (id: string) => {
    const novosInsumos = insumos.filter(i => i.id !== id);
    setInsumos(novosInsumos);
    localStorage.setItem('insumos', JSON.stringify(novosInsumos));
    toast({
      title: 'Insumo excluído',
      description: 'O insumo foi removido do sistema.',
    });
  };

  const excluirFormula = (id: string) => {
    const novasFormulas = formulas.filter(f => f.id !== id);
    setFormulas(novasFormulas);
    localStorage.setItem('formulas-racao', JSON.stringify(novasFormulas));
    toast({
      title: 'Fórmula excluída',
      description: 'A fórmula foi removida do sistema.',
    });
  };

  const excluirCentroCusto = (id: string) => {
    const novosCentros = centrosCusto.filter(c => c.id !== id);
    setCentrosCusto(novosCentros);
    localStorage.setItem('centros-custo', JSON.stringify(novosCentros));
    toast({
      title: 'Centro de custo excluído',
      description: 'O centro de custo foi removido do sistema.',
    });
  };

  // Funções de edição e exclusão para galpões
  const editarGalpao = (galpao: Galpao) => {
    setGalpaoEditando(galpao);
    setResponsaveisGalpao(galpao.responsaveis);
    setFotoGalpao(galpao.foto || '');
    formGalpao.reset({
      nome: galpao.nome,
      area: galpao.tamanho.area,
      comprimento: galpao.tamanho.comprimento,
      largura: galpao.tamanho.largura,
      altura: galpao.tamanho.altura,
      responsaveis: galpao.responsaveis,
    });
    setDialogGalpao(true);
  };

  const excluirGalpao = (id: string) => {
    const novosGalpoes = galpoes.filter(g => g.id !== id);
    setGalpoes(novosGalpoes);
    localStorage.setItem('galpoes', JSON.stringify(novosGalpoes));
    toast({
      title: 'Galpão excluído',
      description: 'O galpão foi removido do sistema.',
    });
  };

  // Funções auxiliares para galpões
  const adicionarResponsavel = () => {
    setResponsaveisGalpao([...responsaveisGalpao, { nome: '', funcao: '' }]);
  };

  const removerResponsavel = (index: number) => {
    setResponsaveisGalpao(responsaveisGalpao.filter((_, i) => i !== index));
  };

  const atualizarResponsavel = (index: number, campo: 'nome' | 'funcao', valor: string) => {
    const novosResponsaveis = [...responsaveisGalpao];
    novosResponsaveis[index][campo] = valor;
    setResponsaveisGalpao(novosResponsaveis);
  };

  const handleUploadFoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFotoGalpao(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const insumosFiltrados = filtroCategoria === 'todas' 
    ? insumos 
    : insumos.filter(i => i.categoria === filtroCategoria);

  const insumosComEstoqueBaixo = insumos.filter(i => i.estoqueAtual <= i.estoqueMinimo);
  const valorTotalEstoque = insumos.reduce((total, i) => total + (i.estoqueAtual * i.precoPorKg), 0);

  return (
    <div className="page-transition">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gerenciamento ERP
              </h1>
              <p className="text-muted-foreground mt-2">
                Controle completo de insumos, formulação e custos
              </p>
            </div>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover-glow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Insumos
                  </p>
                  <p className="text-2xl font-semibold">{insumos.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-secondary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Fórmulas
                  </p>
                  <p className="text-2xl font-semibold">{formulas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-success" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Valor Estoque
                  </p>
                  <p className="text-2xl font-semibold">
                    R$ {valorTotalEstoque.toFixed(0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Estoque Baixo
                  </p>
                  <p className="text-2xl font-semibold">{insumosComEstoqueBaixo.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {insumosComEstoqueBaixo.length > 0 && (
          <Card className="mb-8 border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Atenção: Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Os seguintes insumos estão com estoque abaixo do mínimo:
                </p>
                <div className="flex flex-wrap gap-2">
                  {insumosComEstoqueBaixo.map(insumo => (
                    <Badge key={insumo.id} variant="destructive">
                      {insumo.nome}: {insumo.estoqueAtual} {insumo.unidade}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Principais */}
        <Tabs defaultValue="insumos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="insumos">
              <Package className="w-4 h-4 mr-2" />
              Insumos
            </TabsTrigger>
            <TabsTrigger value="galpoes">
              <Building className="w-4 h-4 mr-2" />
              Galpões
            </TabsTrigger>
            <TabsTrigger value="formulas">
              <Calculator className="w-4 h-4 mr-2" />
              Fórmulas
            </TabsTrigger>
            <TabsTrigger value="movimentos">
              <TrendingUp className="w-4 h-4 mr-2" />
              Movimentos
            </TabsTrigger>
            <TabsTrigger value="centros-custo">
              <DollarSign className="w-4 h-4 mr-2" />
              Centros de Custo
            </TabsTrigger>
            <TabsTrigger value="relatorios">
              <FileText className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Gestão de Galpões */}
          <TabsContent value="galpoes">
            <GalpaoManagement />
          </TabsContent>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Controle de Galpões</h3>
                
                <Dialog open={dialogGalpao} onOpenChange={setDialogGalpao}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { 
                      setGalpaoEditando(null); 
                      setResponsaveisGalpao([{nome: '', funcao: ''}]);
                      setFotoGalpao('');
                      formGalpao.reset(); 
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Galpão
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {galpaoEditando ? 'Editar Galpão' : 'Cadastrar Novo Galpão'}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...formGalpao}>
                      <form onSubmit={formGalpao.handleSubmit(salvarGalpao)} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Dados Básicos */}
                          <div className="space-y-4">
                            <h4 className="font-medium">Dados Básicos</h4>
                            <FormField
                              control={formGalpao.control}
                              name="nome"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome do Galpão *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Ex: Galpão A, Aviário 1..." />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {/* Upload de Foto */}
                            <div className="space-y-2">
                              <FormLabel>Foto do Galpão</FormLabel>
                              <div className="flex items-center space-x-4">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleUploadFoto}
                                  className="w-full"
                                />
                                <Camera className="w-5 h-5 text-muted-foreground" />
                              </div>
                              {fotoGalpao && (
                                <div className="mt-2">
                                  <img 
                                    src={fotoGalpao} 
                                    alt="Preview" 
                                    className="w-32 h-24 object-cover rounded border"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Dimensões */}
                          <div className="space-y-4">
                            <h4 className="font-medium">Dimensões</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={formGalpao.control}
                                name="area"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Área (m²) *</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" step="0.01" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={formGalpao.control}
                                name="comprimento"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Comprimento (m) *</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" step="0.01" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={formGalpao.control}
                                name="largura"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Largura (m) *</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" step="0.01" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={formGalpao.control}
                                name="altura"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Altura (m) *</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" step="0.01" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Responsáveis */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Responsáveis</h4>
                            <Button type="button" variant="outline" size="sm" onClick={adicionarResponsavel}>
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar
                            </Button>
                          </div>
                          {responsaveisGalpao.map((responsavel, index) => (
                            <div key={index} className="flex gap-4 items-end">
                              <div className="flex-1">
                                <Input
                                  placeholder="Nome do responsável"
                                  value={responsavel.nome}
                                  onChange={(e) => atualizarResponsavel(index, 'nome', e.target.value)}
                                />
                              </div>
                              <div className="flex-1">
                                <Input
                                  placeholder="Função"
                                  value={responsavel.funcao}
                                  onChange={(e) => atualizarResponsavel(index, 'funcao', e.target.value)}
                                />
                              </div>
                              {responsaveisGalpao.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removerResponsavel(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setDialogGalpao(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit">
                            {galpaoEditando ? 'Atualizar' : 'Salvar'} Galpão
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Lista de Galpões */}
              {galpoes.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">Nenhum galpão cadastrado</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Comece cadastrando seu primeiro galpão.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {galpoes.map((galpao) => {
                    const ultimaTemperatura = registrosTemperatura
                      .filter(r => r.galpaoId === galpao.id)
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
                    
                    const ultimoConsumoAgua = registrosAgua
                      .filter(r => r.galpaoId === galpao.id)
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];

                    return (
                      <Card key={galpao.id} className="hover-glow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{galpao.nome}</CardTitle>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editarGalpao(galpao)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => excluirGalpao(galpao.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          
                          {galpao.foto && (
                            <div className="w-full h-32 bg-muted rounded overflow-hidden">
                              <img 
                                src={galpao.foto} 
                                alt={galpao.nome}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <span className="text-muted-foreground">Área:</span>
                              <span>{galpao.tamanho.area} m²</span>
                              <span className="text-muted-foreground">Dimensões:</span>
                              <span>{galpao.tamanho.comprimento}×{galpao.tamanho.largura}×{galpao.tamanho.altura} m</span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center">
                                  <Thermometer className="w-4 h-4 mr-1" />
                                  Última temperatura:
                                </span>
                                <span className={ultimaTemperatura ? "font-medium" : "text-muted-foreground"}>
                                  {ultimaTemperatura ? `${ultimaTemperatura.temperatura}°C` : 'Sem registro'}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center">
                                  <Droplets className="w-4 h-4 mr-1" />
                                  Último consumo:
                                </span>
                                <span className={ultimoConsumoAgua ? "font-medium" : "text-muted-foreground"}>
                                  {ultimoConsumoAgua ? `${ultimoConsumoAgua.consumo} m³` : 'Sem registro'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="border-t pt-2">
                              <p className="text-xs text-muted-foreground mb-1">Responsáveis:</p>
                              <div className="flex flex-wrap gap-1">
                                {galpao.responsaveis.map((resp, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {resp.nome} ({resp.funcao})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Seção de Registros */}
              {galpoes.length > 0 && (
                <div className="mt-8">
                  <Tabs defaultValue="temperatura" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="temperatura">
                        <Thermometer className="w-4 h-4 mr-2" />
                        Temperatura
                      </TabsTrigger>
                      <TabsTrigger value="agua">
                        <Droplets className="w-4 h-4 mr-2" />
                        Consumo Água
                      </TabsTrigger>
                      <TabsTrigger value="manutencao">
                        <Settings className="w-4 h-4 mr-2" />
                        Manutenção
                      </TabsTrigger>
                      <TabsTrigger value="personalizados">
                        <Users className="w-4 h-4 mr-2" />
                        Campos
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="temperatura" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold">Histórico de Temperatura</h4>
                        <div className="flex items-center space-x-2">
                          <div className="flex rounded-md border">
                            <Button
                              variant={visualizacao === 'lista' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setVisualizacao('lista')}
                            >
                              Lista
                            </Button>
                            <Button
                              variant={visualizacao === 'grafico' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setVisualizacao('grafico')}
                            >
                              <LineChart className="w-4 h-4 mr-1" />
                              Gráfico
                            </Button>
                          </div>
                          <Select onValueChange={(value) => setGalpaoSelecionado(value)}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Selecionar galpão" />
                            </SelectTrigger>
                            <SelectContent>
                              {galpoes.map((galpao) => (
                                <SelectItem key={galpao.id} value={galpao.id}>
                                  {galpao.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {galpaoSelecionado && (
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportarCSVTemperatura(galpaoSelecionado)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                CSV
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportarPDFTemperatura(galpaoSelecionado)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                PDF
                              </Button>
                            </div>
                          )}
                          <Dialog open={dialogTemperatura} onOpenChange={setDialogTemperatura}>
                            <DialogTrigger asChild>
                              <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Registrar Temperatura
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Registrar Temperatura</DialogTitle>
                              </DialogHeader>
                              <Form {...formTemperatura}>
                                <form onSubmit={formTemperatura.handleSubmit(salvarTemperatura)} className="space-y-4">
                                  <FormField
                                    control={formTemperatura.control}
                                    name="galpaoId"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Galpão</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecione um galpão" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {galpoes.map((galpao) => (
                                              <SelectItem key={galpao.id} value={galpao.id}>
                                                {galpao.nome}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={formTemperatura.control}
                                    name="temperatura"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Temperatura (°C)</FormLabel>
                                        <FormControl>
                                          <Input {...field} type="number" step="0.1" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={formTemperatura.control}
                                    name="responsavel"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Responsável</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={formTemperatura.control}
                                    name="observacoes"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Observações</FormLabel>
                                        <FormControl>
                                          <Textarea {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <Button type="button" variant="outline" onClick={() => setDialogTemperatura(false)}>
                                      Cancelar
                                    </Button>
                                    <Button type="submit">Salvar</Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      {visualizacao === 'grafico' && galpaoSelecionado ? (
                        <Card>
                          <CardContent className="p-6">
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsLineChart data={prepararDadosGraficoTemperatura(galpaoSelecionado)}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="data" />
                                  <YAxis />
                                  <Tooltip 
                                    labelFormatter={(label) => `Data: ${label}`}
                                    formatter={(value, name) => [`${value}°C`, 'Temperatura']}
                                  />
                                  <Legend />
                                  <Line 
                                    type="monotone" 
                                    dataKey="temperatura" 
                                    stroke="hsl(var(--primary))" 
                                    strokeWidth={2}
                                    dot={{ fill: 'hsl(var(--primary))' }}
                                  />
                                </RechartsLineChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Galpão</TableHead>
                                  <TableHead>Data</TableHead>
                                  <TableHead>Horário</TableHead>
                                  <TableHead>Temperatura</TableHead>
                                  <TableHead>Responsável</TableHead>
                                  <TableHead>Observações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {registrosTemperatura.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                      Nenhum registro encontrado
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  registrosTemperatura
                                    .filter(r => !galpaoSelecionado || r.galpaoId === galpaoSelecionado)
                                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                                    .slice(0, 20)
                                    .map((registro) => {
                                      const galpao = galpoes.find(g => g.id === registro.galpaoId);
                                      return (
                                        <TableRow key={registro.id}>
                                          <TableCell>{galpao?.nome}</TableCell>
                                          <TableCell>{registro.data.toLocaleDateString('pt-BR')}</TableCell>
                                          <TableCell>{registro.horario}</TableCell>
                                          <TableCell>{registro.temperatura}°C</TableCell>
                                          <TableCell>{registro.responsavel}</TableCell>
                                          <TableCell>{registro.observacoes || '-'}</TableCell>
                                        </TableRow>
                                      );
                                    })
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="agua" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold">Histórico de Consumo de Água</h4>
                        <div className="flex items-center space-x-2">
                          <div className="flex rounded-md border">
                            <Button
                              variant={visualizacao === 'lista' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setVisualizacao('lista')}
                            >
                              Lista
                            </Button>
                            <Button
                              variant={visualizacao === 'grafico' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setVisualizacao('grafico')}
                            >
                              <BarChart3 className="w-4 h-4 mr-1" />
                              Gráfico
                            </Button>
                          </div>
                          <Select onValueChange={(value) => setGalpaoSelecionado(value)}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Selecionar galpão" />
                            </SelectTrigger>
                            <SelectContent>
                              {galpoes.map((galpao) => (
                                <SelectItem key={galpao.id} value={galpao.id}>
                                  {galpao.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {galpaoSelecionado && (
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportarCSVAgua(galpaoSelecionado)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                CSV
                              </Button>
                            </div>
                          )}
                          <Dialog open={dialogAgua} onOpenChange={setDialogAgua}>
                            <DialogTrigger asChild>
                              <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Registrar Consumo
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Registrar Consumo de Água</DialogTitle>
                              </DialogHeader>
                              <Form {...formAgua}>
                                <form onSubmit={formAgua.handleSubmit(salvarAgua)} className="space-y-4">
                                  <FormField
                                    control={formAgua.control}
                                    name="galpaoId"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Galpão</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecione um galpão" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {galpoes.map((galpao) => (
                                              <SelectItem key={galpao.id} value={galpao.id}>
                                                {galpao.nome}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={formAgua.control}
                                    name="consumo"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Consumo (m³)</FormLabel>
                                        <FormControl>
                                          <Input {...field} type="number" step="0.001" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={formAgua.control}
                                    name="responsavel"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Responsável</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={formAgua.control}
                                    name="observacoes"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Observações</FormLabel>
                                        <FormControl>
                                          <Textarea {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <Button type="button" variant="outline" onClick={() => setDialogAgua(false)}>
                                      Cancelar
                                    </Button>
                                    <Button type="submit">Salvar</Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      {visualizacao === 'grafico' && galpaoSelecionado ? (
                        <Card>
                          <CardContent className="p-6">
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={prepararDadosGraficoAgua(galpaoSelecionado)}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="data" />
                                  <YAxis />
                                  <Tooltip 
                                    labelFormatter={(label) => `Data: ${label}`}
                                    formatter={(value, name) => [`${value} m³`, 'Consumo']}
                                  />
                                  <Legend />
                                  <Bar 
                                    dataKey="consumo" 
                                    fill="hsl(var(--secondary))" 
                                    name="Consumo (m³)"
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Galpão</TableHead>
                                  <TableHead>Data</TableHead>
                                  <TableHead>Horário</TableHead>
                                  <TableHead>Consumo (m³)</TableHead>
                                  <TableHead>Responsável</TableHead>
                                  <TableHead>Observações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {registrosAgua.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                      Nenhum registro encontrado
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  registrosAgua
                                    .filter(r => !galpaoSelecionado || r.galpaoId === galpaoSelecionado)
                                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                                    .slice(0, 20)
                                    .map((registro) => {
                                      const galpao = galpoes.find(g => g.id === registro.galpaoId);
                                      return (
                                        <TableRow key={registro.id}>
                                          <TableCell>{galpao?.nome}</TableCell>
                                          <TableCell>{registro.data.toLocaleDateString('pt-BR')}</TableCell>
                                          <TableCell>{registro.horario}</TableCell>
                                          <TableCell>{registro.consumo}</TableCell>
                                          <TableCell>{registro.responsavel}</TableCell>
                                          <TableCell>{registro.observacoes || '-'}</TableCell>
                                        </TableRow>
                                      );
                                    })
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="manutencao" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold">Observações de Manutenção</h4>
                        <Dialog open={dialogManutencao} onOpenChange={setDialogManutencao}>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="mr-2 h-4 w-4" />
                              Nova Observação
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Nova Observação de Manutenção</DialogTitle>
                            </DialogHeader>
                            <Form {...formManutencao}>
                              <form onSubmit={formManutencao.handleSubmit(salvarManutencao)} className="space-y-4">
                                <FormField
                                  control={formManutencao.control}
                                  name="galpaoId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Galpão</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecione um galpão" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {galpoes.map((galpao) => (
                                            <SelectItem key={galpao.id} value={galpao.id}>
                                              {galpao.nome}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={formManutencao.control}
                                  name="tipo"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Tipo</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="manutencao">Manutenção</SelectItem>
                                          <SelectItem value="limpeza">Limpeza</SelectItem>
                                          <SelectItem value="inspecao">Inspeção</SelectItem>
                                          <SelectItem value="reparo">Reparo</SelectItem>
                                          <SelectItem value="outro">Outro</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={formManutencao.control}
                                  name="responsavel"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Responsável</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={formManutencao.control}
                                  name="descricao"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Descrição</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end space-x-2">
                                  <Button type="button" variant="outline" onClick={() => setDialogManutencao(false)}>
                                    Cancelar
                                  </Button>
                                  <Button type="submit">Salvar</Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <Card>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Galpão</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Responsável</TableHead>
                                <TableHead>Descrição</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {observacoesManutencao.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    Nenhuma observação encontrada
                                  </TableCell>
                                </TableRow>
                              ) : (
                                observacoesManutencao
                                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                                  .slice(0, 10)
                                  .map((obs) => {
                                    const galpao = galpoes.find(g => g.id === obs.galpaoId);
                                    return (
                                      <TableRow key={obs.id}>
                                        <TableCell>{galpao?.nome}</TableCell>
                                        <TableCell>{obs.data.toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell className="capitalize">{obs.tipo}</TableCell>
                                        <TableCell>{obs.responsavel}</TableCell>
                                        <TableCell>{obs.descricao}</TableCell>
                                      </TableRow>
                                    );
                                  })
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="personalizados" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold">Campos Personalizados</h4>
                        <Button onClick={adicionarCampoPersonalizado}>
                          <Plus className="mr-2 h-4 w-4" />
                          Novo Campo
                        </Button>
                      </div>

                      {novosCampos.length > 0 && (
                        <Card>
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              {novosCampos.map((campo, index) => (
                                <div key={index} className="flex gap-4 items-end">
                                  <Input
                                    placeholder="Nome do campo"
                                    value={campo.nome}
                                    onChange={(e) => atualizarCampoPersonalizado(index, 'nome', e.target.value)}
                                    className="flex-1"
                                  />
                                  <Select
                                    value={campo.tipo}
                                    onValueChange={(value) => atualizarCampoPersonalizado(index, 'tipo', value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="texto">Texto</SelectItem>
                                      <SelectItem value="numero">Número</SelectItem>
                                      <SelectItem value="data">Data</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type={campo.tipo === 'numero' ? 'number' : campo.tipo === 'data' ? 'date' : 'text'}
                                    placeholder="Valor"
                                    value={campo.valor || ''}
                                    onChange={(e) => atualizarCampoPersonalizado(index, 'valor', e.target.value)}
                                    className="flex-1"
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removerCampoPersonalizado(index)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setNovosCampos([])}
                                >
                                  Cancelar
                                </Button>
                                <Button 
                                  onClick={() => galpaoSelecionado && salvarCamposPersonalizados(galpaoSelecionado)}
                                  disabled={!galpaoSelecionado}
                                >
                                  Salvar Campos
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {galpoes.map((galpao) => (
                        galpao.camposPersonalizados && Object.keys(galpao.camposPersonalizados).length > 0 && (
                          <Card key={galpao.id}>
                            <CardHeader>
                              <CardTitle className="text-base">{galpao.nome}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(galpao.camposPersonalizados).map(([nome, valor]) => (
                                  <div key={nome} className="flex justify-between">
                                    <span className="text-muted-foreground">{nome}:</span>
                                    <span>{valor}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Gestão de Insumos */}
          <TabsContent value="insumos">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as categorias</SelectItem>
                      {Object.entries(categorias).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={dialogInsumo} onOpenChange={setDialogInsumo}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setInsumoEditando(null); formInsumo.reset(); }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Insumo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {insumoEditando ? 'Editar Insumo' : 'Novo Insumo'}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...formInsumo}>
                      <form onSubmit={formInsumo.handleSubmit(salvarInsumo)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={formInsumo.control}
                            name="nome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={formInsumo.control}
                            name="categoria"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.entries(categorias).map(([key, value]) => (
                                      <SelectItem key={key} value={key}>
                                        {value.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={formInsumo.control}
                            name="precoPorKg"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preço por Kg (R$)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={formInsumo.control}
                            name="unidade"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unidade</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={formInsumo.control}
                            name="estoqueAtual"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estoque Atual</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={formInsumo.control}
                            name="estoqueMinimo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estoque Mínimo</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={formInsumo.control}
                            name="fornecedor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fornecedor</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={formInsumo.control}
                            name="dataValidade"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data de Validade</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={formInsumo.control}
                          name="loteCompra"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lote de Compra</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setDialogInsumo(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit">
                            {insumoEditando ? 'Atualizar' : 'Salvar'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Preço/Kg</TableHead>
                          <TableHead>Estoque</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Valor Total</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insumosFiltrados.map((insumo) => (
                          <TableRow key={insumo.id}>
                            <TableCell className="font-medium">{insumo.nome}</TableCell>
                            <TableCell>
                              <Badge className={categorias[insumo.categoria].cor}>
                                {categorias[insumo.categoria].nome}
                              </Badge>
                            </TableCell>
                            <TableCell>R$ {insumo.precoPorKg.toFixed(2)}</TableCell>
                            <TableCell>
                              {insumo.estoqueAtual} {insumo.unidade}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                insumo.estoqueAtual <= insumo.estoqueMinimo ? 'destructive' : 'default'
                              }>
                                {insumo.estoqueAtual <= insumo.estoqueMinimo ? 'Baixo' : 'OK'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              R$ {(insumo.estoqueAtual * insumo.precoPorKg).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => editarInsumo(insumo)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => excluirInsumo(insumo.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gestão de Fórmulas */}
          <TabsContent value="formulas">
            <div className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={dialogFormula} onOpenChange={setDialogFormula}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setFormulaEditando(null); setIngredientesSelecionados([]); formFormula.reset(); }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Fórmula
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {formulaEditando ? 'Editar Fórmula' : 'Nova Fórmula'}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <Form {...formFormula}>
                      <form onSubmit={formFormula.handleSubmit(salvarFormula)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={formFormula.control}
                            name="nome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome da Fórmula</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={formFormula.control}
                            name="tipo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.entries(tiposFormula).map(([key, value]) => (
                                      <SelectItem key={key} value={key}>
                                        {value.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Ingredientes */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium">Ingredientes</h3>
                            <Button type="button" onClick={adicionarIngrediente} size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar
                            </Button>
                          </div>

                          {ingredientesSelecionados.length > 0 && (
                            <div className="space-y-3">
                              {ingredientesSelecionados.map((ingrediente, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 border rounded">
                                  <Select
                                    value={ingrediente.insumoId}
                                    onValueChange={(value) => atualizarIngrediente(index, 'insumoId', value)}
                                  >
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Selecionar insumo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {insumos.filter(i => i.categoria === 'racao').map((insumo) => (
                                        <SelectItem key={insumo.id} value={insumo.id}>
                                          {insumo.nome} - R$ {insumo.precoPorKg.toFixed(2)}/kg
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  <Input
                                    type="number"
                                    placeholder="Percentual"
                                    value={ingrediente.percentual || ''}
                                    onChange={(e) => atualizarIngrediente(index, 'percentual', Number(e.target.value))}
                                    className="w-24"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                  />
                                  <span className="text-sm text-muted-foreground">%</span>
                                  
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removerIngrediente(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Resumo */}
                          {ingredientesSelecionados.length > 0 && (
                            <div className="mt-4 p-4 bg-muted rounded border">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium">
                                    Total: {calcularPercentualTotal().toFixed(1)}% 
                                    {calcularPercentualTotal() !== 100 && (
                                      <span className="text-red-500 ml-2">
                                        (deve ser 100%)
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Custo estimado: R$ {calcularCustoTotal().toFixed(2)}/kg
                                  </p>
                                </div>
                                <Calculator className="h-5 w-5 text-muted-foreground" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end space-x-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setDialogFormula(false);
                              setFormulaEditando(null);
                              setIngredientesSelecionados([]);
                              formFormula.reset();
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit">
                            {formulaEditando ? 'Atualizar' : 'Salvar'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {formulas.map((formula) => (
                  <Card key={formula.id} className="hover-glow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{formula.nome}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={tiposFormula[formula.tipo].cor}>
                              {tiposFormula[formula.tipo].nome}
                            </Badge>
                            <Badge variant="outline">
                              R$ {formula.custoTotal.toFixed(2)}/kg
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editarFormula(formula)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => excluirFormula(formula.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                          Ingredientes ({formula.ingredientes.length})
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {formula.ingredientes.map((ingrediente, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{ingrediente.nome}</span>
                              <span>{ingrediente.percentual}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Movimentos de Estoque */}
          <TabsContent value="movimentos">
            <div className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={dialogMovimento} onOpenChange={setDialogMovimento}>
                  <DialogTrigger asChild>
                    <Button onClick={() => formMovimento.reset()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Movimento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Movimento de Estoque</DialogTitle>
                    </DialogHeader>
                    <Form {...formMovimento}>
                      <form onSubmit={formMovimento.handleSubmit(salvarMovimento)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={formMovimento.control}
                            name="insumoId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Insumo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecionar insumo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {insumos.map((insumo) => (
                                      <SelectItem key={insumo.id} value={insumo.id}>
                                        {insumo.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={formMovimento.control}
                            name="tipo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="entrada">Entrada</SelectItem>
                                    <SelectItem value="saida">Saída</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={formMovimento.control}
                            name="quantidade"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantidade</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={formMovimento.control}
                            name="custoUnitario"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custo Unitário (R$)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={formMovimento.control}
                          name="centroCustoId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Centro de Custo</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecionar centro de custo (opcional)" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {centrosCusto.map((centro) => (
                                    <SelectItem key={centro.id} value={centro.id}>
                                      {centro.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={formMovimento.control}
                          name="documento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Documento/NF</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={formMovimento.control}
                          name="observacoes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observações</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setDialogMovimento(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit">Salvar</Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Insumo</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Custo Unit.</TableHead>
                          <TableHead>Custo Total</TableHead>
                          <TableHead>Centro Custo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movimentos.map((movimento) => {
                          const insumo = insumos.find(i => i.id === movimento.insumoId);
                          const centroCusto = centrosCusto.find(c => c.id === movimento.centroCustoId);
                          
                          return (
                            <TableRow key={movimento.id}>
                              <TableCell>
                                {movimento.data.toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>{insumo?.nome || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={movimento.tipo === 'entrada' ? 'default' : 'secondary'}>
                                  {movimento.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {movimento.quantidade} {insumo?.unidade || 'un'}
                              </TableCell>
                              <TableCell>
                                {movimento.custoUnitario ? `R$ ${movimento.custoUnitario.toFixed(2)}` : '-'}
                              </TableCell>
                              <TableCell>
                                {movimento.custoTotal ? `R$ ${movimento.custoTotal.toFixed(2)}` : '-'}
                              </TableCell>
                              <TableCell>{centroCusto?.nome || '-'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Centros de Custo */}
          <TabsContent value="centros-custo">
            <div className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={dialogCentroCusto} onOpenChange={setDialogCentroCusto}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setCentroCustoEditando(null); formCentroCusto.reset(); }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Centro de Custo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {centroCustoEditando ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...formCentroCusto}>
                      <form onSubmit={formCentroCusto.handleSubmit(salvarCentroCusto)} className="space-y-4">
                        <FormField
                          control={formCentroCusto.control}
                          name="nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={formCentroCusto.control}
                          name="descricao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setDialogCentroCusto(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit">
                            {centroCustoEditando ? 'Atualizar' : 'Salvar'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {centrosCusto.map((centro) => (
                  <Card key={centro.id} className="hover-glow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{centro.nome}</CardTitle>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editarCentroCusto(centro)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => excluirCentroCusto(centro.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {centro.descricao || 'Sem descrição'}
                      </p>
                      <div className="mt-4">
                        <Badge variant={centro.ativo ? 'default' : 'secondary'}>
                          {centro.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="relatorios">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover-glow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Package className="mr-2 h-5 w-5" />
                      Relatório de Estoque
                    </CardTitle>
                    <CardDescription>
                      Posição atual do estoque por categoria
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Gerar Relatório
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover-glow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Movimentação
                    </CardTitle>
                    <CardDescription>
                      Histórico de entrada e saída de materiais
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Gerar Relatório
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover-glow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="mr-2 h-5 w-5" />
                      Custos por Centro
                    </CardTitle>
                    <CardDescription>
                      Análise de custos por centro de custo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Gerar Relatório
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}