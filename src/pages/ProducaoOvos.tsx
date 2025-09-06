import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Calendar, Egg, TrendingUp, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface ProducaoDiaria {
  id: string;
  loteId: string;
  nomeLote: string;
  data: Date;
  ovosColetados: number;
  numeroAves: number;
  taxaPostura: number;
  observacoes?: string;
  criadoEm: Date;
}

interface MetaProducao {
  loteId: string;
  metaDiaria: number;
  metaMensal: number;
}

const producaoSchema = z.object({
  loteId: z.string().min(1, 'Selecione um lote'),
  data: z.string().min(1, 'Data é obrigatória'),
  ovosColetados: z.coerce.number().min(0, 'Número de ovos inválido'),
  observacoes: z.string().optional(),
});

type ProducaoData = z.infer<typeof producaoSchema>;

export default function ProducaoOvos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [producoes, setProducoes] = useState<ProducaoDiaria[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [metas, setMetas] = useState<MetaProducao[]>([]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [producaoEditando, setProducaoEditando] = useState<ProducaoDiaria | null>(null);

  const form = useForm<ProducaoData>({
    resolver: zodResolver(producaoSchema),
    defaultValues: {
      loteId: '',
      data: new Date().toISOString().split('T')[0],
      ovosColetados: 0,
      observacoes: '',
    },
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    // Carregar lotes
    const lotesStr = localStorage.getItem('lotes');
    if (lotesStr) {
      setLotes(JSON.parse(lotesStr));
    }

    // Carregar produções
    const producoesStr = localStorage.getItem('producoes-ovos');
    if (producoesStr) {
      const producoesParseadas = JSON.parse(producoesStr).map((p: any) => ({
        ...p,
        data: new Date(p.data),
        criadoEm: new Date(p.criadoEm),
      }));
      setProducoes(producoesParseadas);
    }

    // Carregar ou gerar metas padrão
    const metasStr = localStorage.getItem('metas-producao');
    if (metasStr) {
      setMetas(JSON.parse(metasStr));
    } else {
      gerarMetasPadrao();
    }
  };

  const gerarMetasPadrao = () => {
    const lotesStr = localStorage.getItem('lotes');
    if (lotesStr) {
      const lotesData = JSON.parse(lotesStr);
      const metasPadrao = lotesData.map((lote: any) => ({
        loteId: lote.id,
        metaDiaria: Math.floor(lote.numeroAves * 0.85), // 85% de postura
        metaMensal: Math.floor(lote.numeroAves * 0.85 * 30),
      }));
      setMetas(metasPadrao);
      localStorage.setItem('metas-producao', JSON.stringify(metasPadrao));
    }
  };

  const salvarProducoes = (novasProducoes: ProducaoDiaria[]) => {
    setProducoes(novasProducoes);
    localStorage.setItem('producoes-ovos', JSON.stringify(novasProducoes));
  };

  const onSubmit = (data: ProducaoData) => {
    const lote = lotes.find(l => l.id === data.loteId);
    if (!lote) return;

    const taxaPostura = (data.ovosColetados / lote.numeroAves) * 100;

    const novaProducao: ProducaoDiaria = {
      id: producaoEditando?.id || Date.now().toString(),
      loteId: data.loteId,
      nomeLote: lote.nomeLote,
      data: new Date(data.data),
      ovosColetados: data.ovosColetados,
      numeroAves: lote.numeroAves,
      taxaPostura,
      observacoes: data.observacoes,
      criadoEm: producaoEditando?.criadoEm || new Date(),
    };

    let novasProducoes;
    if (producaoEditando) {
      novasProducoes = producoes.map(p => p.id === producaoEditando.id ? novaProducao : p);
      toast({
        title: 'Produção atualizada!',
        description: `Produção do lote "${lote.nomeLote}" foi atualizada.`,
      });
    } else {
      novasProducoes = [...producoes, novaProducao];
      toast({
        title: 'Produção registrada!',
        description: `${data.ovosColetados} ovos registrados para "${lote.nomeLote}".`,
      });
    }

    salvarProducoes(novasProducoes);
    setDialogAberto(false);
    setProducaoEditando(null);
    form.reset();
  };

  const editarProducao = (producao: ProducaoDiaria) => {
    setProducaoEditando(producao);
    form.reset({
      loteId: producao.loteId,
      data: producao.data.toISOString().split('T')[0],
      ovosColetados: producao.ovosColetados,
      observacoes: producao.observacoes || '',
    });
    setDialogAberto(true);
  };

  const excluirProducao = (id: string) => {
    const producao = producoes.find(p => p.id === id);
    if (!producao) return;

    const novasProducoes = producoes.filter(p => p.id !== id);
    salvarProducoes(novasProducoes);
    
    toast({
      title: 'Produção excluída',
      description: `Registro de produção de ${producao.data.toLocaleDateString()} foi removido.`,
    });
  };

  const novaProducao = () => {
    setProducaoEditando(null);
    form.reset();
    setDialogAberto(true);
  };

  // Calcular estatísticas
  const hoje = new Date();
  const producaoHoje = producoes.filter(p => 
    p.data.toDateString() === hoje.toDateString()
  );

  const totalOvosHoje = producaoHoje.reduce((sum, p) => sum + p.ovosColetados, 0);
  const mediaPosturaHoje = producaoHoje.length > 0 
    ? producaoHoje.reduce((sum, p) => sum + p.taxaPostura, 0) / producaoHoje.length
    : 0;

  // Dados para gráfico - últimos 7 dias
  const ultimosSetesDias = Array.from({ length: 7 }, (_, i) => {
    const data = new Date();
    data.setDate(data.getDate() - (6 - i));
    const producaoData = producoes.filter(p => 
      p.data.toDateString() === data.toDateString()
    );
    return {
      data: data.toLocaleDateString('pt-BR', { weekday: 'short' }),
      ovos: producaoData.reduce((sum, p) => sum + p.ovosColetados, 0),
      taxa: producaoData.length > 0 
        ? producaoData.reduce((sum, p) => sum + p.taxaPostura, 0) / producaoData.length
        : 0,
    };
  });

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
                Produção de Ovos
              </h1>
              <p className="text-muted-foreground mt-2">
                Controle diário da produção e metas por lote
              </p>
            </div>
            
            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger asChild>
                <Button onClick={novaProducao}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Produção
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {producaoEditando ? 'Editar Produção' : 'Nova Produção'}
                  </DialogTitle>
                  <DialogDescription>
                    Registre a produção diária de ovos por lote
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="loteId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lote</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar lote" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {lotes.map((lote) => (
                                <SelectItem key={lote.id} value={lote.id}>
                                  {lote.nomeLote} ({lote.numeroAves} aves)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="data"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ovosColetados"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ovos Coletados</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Ex: 4250" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Input placeholder="Observações opcionais..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogAberto(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {producaoEditando ? 'Atualizar' : 'Salvar'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ovos Hoje</CardTitle>
              <Egg className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOvosHoje.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {producaoHoje.length} lote(s) registrado(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaPosturaHoje.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Taxa de postura hoje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lotes Ativos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lotes.length}</div>
              <p className="text-xs text-muted-foreground">
                Em produção
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meta do Dia</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metas.reduce((sum, m) => sum + m.metaDiaria, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Meta total diária
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Produção */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Produção dos Últimos 7 Dias</CardTitle>
              <CardDescription>
                Quantidade de ovos coletados por dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ultimosSetesDias}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${Number(value).toLocaleString()} ${name === 'ovos' ? 'ovos' : '%'}`,
                      name === 'ovos' ? 'Ovos' : 'Taxa de Postura'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ovos" 
                    stroke="hsl(var(--accent-2))" 
                    strokeWidth={2} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="taxa" 
                    stroke="hsl(var(--accent-1))" 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance por Lote</CardTitle>
              <CardDescription>
                Taxa de postura média por lote
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lotes.map((lote) => {
                  const producaoLote = producoes.filter(p => p.loteId === lote.id);
                  const taxaMedia = producaoLote.length > 0 
                    ? producaoLote.reduce((sum, p) => sum + p.taxaPostura, 0) / producaoLote.length
                    : 0;
                  const meta = metas.find(m => m.loteId === lote.id);
                  const metaTaxa = meta ? (meta.metaDiaria / lote.numeroAves) * 100 : 85;

                  return (
                    <div key={lote.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{lote.nomeLote}</span>
                        <span>{taxaMedia.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ 
                            width: `${Math.min((taxaMedia / metaTaxa) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Meta: {metaTaxa.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Produções */}
        <Card>
          <CardHeader>
            <CardTitle>Registros Recentes</CardTitle>
            <CardDescription>
              Últimas produções registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {producoes
                .sort((a, b) => b.data.getTime() - a.data.getTime())
                .slice(0, 10)
                .map((producao) => (
                  <div 
                    key={producao.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{producao.nomeLote}</p>
                          <p className="text-sm text-muted-foreground">
                            {producao.data.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant={producao.taxaPostura >= 80 ? 'default' : 'secondary'}>
                          {producao.taxaPostura.toFixed(1)}%
                        </Badge>
                      </div>
                      {producao.observacoes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {producao.observacoes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {producao.ovosColetados.toLocaleString()} ovos
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {producao.numeroAves} aves
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editarProducao(producao)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => excluirProducao(producao.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            
            {producoes.length === 0 && (
              <div className="text-center py-8">
                <Egg className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Nenhuma produção registrada ainda
                </p>
                <Button 
                  variant="outline" 
                  onClick={novaProducao}
                  className="mt-4"
                >
                  Registrar Primeira Produção
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}