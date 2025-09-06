import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Package, Users, Calendar, Target, Egg, Download, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DashboardData {
  totalLotes: number;
  totalAves: number;
  consumoMensal: number;
  custoMensal: number;
  alertasEstoque: number;
  producaoAtiva: number;
  producaoOvosHoje: number;
  metaProducaoMensal: number;
  producaoMensalAtual: number;
  custoPorOvo: number;
}

interface ProducaoOvos {
  id: string;
  loteId: string;
  data: Date;
  ovosColetados: number;
  ovosComerciais: number;
  ovosDescartados: number;
  observacoes?: string;
}

interface MetaProducao {
  metaDiaria: number;
  metaMensal: number;
  metaAnual: number;
}

interface ConsumoMensal {
  mes: string;
  consumo: number;
  custo: number;
}

interface DistribuicaoFases {
  fase: string;
  quantidade: number;
  cor: string;
}

const COLORS = ['#66B2FF', '#2ECC71', '#FFB86B', '#FF6B6B', '#9B59B6'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalLotes: 0,
    totalAves: 0,
    consumoMensal: 0,
    custoMensal: 0,
    alertasEstoque: 0,
    producaoAtiva: 0,
    producaoOvosHoje: 0,
    metaProducaoMensal: 50000,
    producaoMensalAtual: 45000,
    custoPorOvo: 0.12,
  });
  const [consumoMensal, setConsumoMensal] = useState<ConsumoMensal[]>([]);
  const [distribuicaoFases, setDistribuicaoFases] = useState<DistribuicaoFases[]>([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('6');

  useEffect(() => {
    carregarDados();
  }, [periodoSelecionado]);

  const carregarDados = () => {
    // Carregar lotes
    const lotesStr = localStorage.getItem('lotes');
    const lotes = lotesStr ? JSON.parse(lotesStr) : [];
    
    // Carregar insumos
    const insumosStr = localStorage.getItem('insumos');
    const insumos = insumosStr ? JSON.parse(insumosStr) : [];
    
    // Calcular estatísticas
    const totalLotes = lotes.length;
    const totalAves = lotes.reduce((sum: number, lote: any) => sum + lote.numeroAves, 0);
    const alertasEstoque = insumos.filter((i: any) => i.estoqueAtual <= i.estoqueMinimo).length;

    // Simular dados de consumo mensal (em produção viria de dados reais)
    const mesesPassados = parseInt(periodoSelecionado);
    const consumoData: ConsumoMensal[] = [];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesAtual = new Date().getMonth();
    
    for (let i = mesesPassados - 1; i >= 0; i--) {
      const mesIndex = (mesAtual - i + 12) % 12;
      const consumoBase = 120 * totalAves / 1000; // kg
      const variacao = (Math.random() - 0.5) * 0.2; // ±10% de variação
      const consumo = Math.max(consumoBase * (1 + variacao), 0);
      const custoMedio = 2.5; // R$ por kg
      
      consumoData.push({
        mes: meses[mesIndex],
        consumo: Math.round(consumo),
        custo: Math.round(consumo * custoMedio),
      });
    }

    // Distribuição por fases (simulado baseado nos lotes)
    const fasesData: DistribuicaoFases[] = [
      { fase: 'Recria', quantidade: Math.floor(totalLotes * 0.4), cor: '#66B2FF' },
      { fase: 'Crescimento', quantidade: Math.floor(totalLotes * 0.2), cor: '#2ECC71' },
      { fase: 'Produção', quantidade: Math.floor(totalLotes * 0.4), cor: '#FFB86B' },
    ];

    const consumoMensalAtual = consumoData[consumoData.length - 1]?.consumo || 0;
    const custoMensalAtual = consumoData[consumoData.length - 1]?.custo || 0;

    setDashboardData({
      totalLotes,
      totalAves,
      consumoMensal: consumoMensalAtual,
      custoMensal: custoMensalAtual,
      alertasEstoque,
      producaoAtiva: Math.floor(totalLotes * 0.6),
      producaoOvosHoje: Math.floor(totalAves * 0.8),
      metaProducaoMensal: totalAves * 24,
      producaoMensalAtual: Math.floor(totalAves * 22),
      custoPorOvo: custoMensalAtual / Math.max(totalAves * 22, 1),
    });

    setConsumoMensal(consumoData);
    setDistribuicaoFases(fasesData);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  return (
    <div className="page-transition">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Visão geral da produção e indicadores principais
              </p>
            </div>
            
            <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Lotes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(dashboardData.totalLotes)}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.producaoAtiva} em produção
              </p>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Aves</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(dashboardData.totalAves)}</div>
              <p className="text-xs text-muted-foreground">
                Em todas as fases
              </p>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consumo Mensal</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(dashboardData.consumoMensal)} kg</div>
              <p className="text-xs text-muted-foreground">
                Ração total consumida
              </p>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.custoMensal)}</div>
              <p className="text-xs text-muted-foreground">
                Custo com ração
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {dashboardData.alertasEstoque > 0 && (
          <Card className="mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-800 dark:text-red-400 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Atenção Necessária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 dark:text-red-300">
                    {dashboardData.alertasEstoque} insumo(s) com estoque baixo
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Recomendamos verificar o controle de insumos
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/controle-insumos')}
                  className="border-red-200 text-red-800 hover:bg-red-100"
                >
                  Ver Insumos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Consumo ao Longo do Tempo */}
          <Card>
            <CardHeader>
              <CardTitle>Consumo e Custo Mensal</CardTitle>
              <CardDescription>
                Evolução do consumo de ração e custos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={consumoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'consumo' ? `${value} kg` : formatCurrency(Number(value)),
                      name === 'consumo' ? 'Consumo' : 'Custo'
                    ]}
                  />
                  <Line type="monotone" dataKey="consumo" stroke="#2ECC71" strokeWidth={2} />
                  <Line type="monotone" dataKey="custo" stroke="#FFB86B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição por Fases */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Fases</CardTitle>
              <CardDescription>
                Lotes ativos em cada fase de produção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribuicaoFases}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ fase, quantidade }) => `${fase}: ${quantidade}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantidade"
                  >
                    {distribuicaoFases.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} lotes`]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Indicadores de Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eficiência Alimentar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">2.1</div>
                  <p className="text-sm text-muted-foreground">kg ração/kg ovo</p>
                </div>
                <TrendingDown className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: '85%' }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Meta: 2.0</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Produtividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">87%</div>
                  <p className="text-sm text-muted-foreground">Taxa de postura</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: '87%' }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Meta: 85%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custo por Ave</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">R$ 12,50</div>
                  <p className="text-sm text-muted-foreground">Por ave/mês</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full" 
                    style={{ width: '75%' }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Meta: R$ 11,00</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}