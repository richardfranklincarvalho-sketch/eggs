import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Download, BarChart3, TrendingUp, Egg, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Lote {
  id: string;
  nomeLote: string;
  numeroAves: number;
  dataNascimento: Date;
  dataEntrada: Date;
  raca: string;
  observacoes?: string;
  criadoEm: Date;
}

interface RelatorioLote {
  lote: Lote;
  consumoTotalRecria: number;
  consumoTotalCrescimento: number;
  consumoTotalProducao: number;
  consumoGeral: number;
  consumoPorAve: number;
  semanasAtivas: number;
}

const fasesProducao = {
  recria: { nome: 'Recria', semanas: 18, consumoBase: 126 },
  crescimento: { nome: 'Crescimento', semanas: 4, consumoBase: 140 },
  producao: { nome: 'Produção', semanas: 54, consumoBase: 126 },
};

export default function Relatorios() {
  const navigate = useNavigate();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteSelecionado, setLoteSelecionado] = useState<string>('todos');
  const [relatorios, setRelatorios] = useState<RelatorioLote[]>([]);

  useEffect(() => {
    carregarLotes();
  }, []);

  useEffect(() => {
    if (lotes.length > 0) {
      gerarRelatorios();
    }
  }, [lotes, loteSelecionado]);

  const carregarLotes = () => {
    const lotesArmazenados = localStorage.getItem('lotes');
    if (lotesArmazenados) {
      const lotesParseados = JSON.parse(lotesArmazenados).map((lote: any) => ({
        ...lote,
        dataNascimento: new Date(lote.dataNascimento),
        dataEntrada: new Date(lote.dataEntrada),
        criadoEm: new Date(lote.criadoEm),
      }));
      setLotes(lotesParseados);
    }
  };

  const gerarRelatorios = () => {
    const lotesParaRelatorio = loteSelecionado === 'todos' 
      ? lotes 
      : lotes.filter(l => l.id === loteSelecionado);

    const relatoriosGerados: RelatorioLote[] = lotesParaRelatorio.map(lote => {
      // Calcular consumos por fase
      const consumoRecriaPorAve = fasesProducao.recria.consumoBase; // gramas acumuladas
      const consumoCrescimentoPorAve = fasesProducao.crescimento.consumoBase * fasesProducao.crescimento.semanas;
      const consumoProducaoPorAve = fasesProducao.producao.consumoBase * fasesProducao.producao.semanas;

      const consumoTotalRecria = (consumoRecriaPorAve * lote.numeroAves) / 1000; // kg
      const consumoTotalCrescimento = (consumoCrescimentoPorAve * lote.numeroAves) / 1000; // kg
      const consumoTotalProducao = (consumoProducaoPorAve * lote.numeroAves) / 1000; // kg

      const consumoGeral = consumoTotalRecria + consumoTotalCrescimento + consumoTotalProducao;
      const consumoPorAve = consumoGeral / lote.numeroAves;
      
      const semanasAtivas = fasesProducao.recria.semanas + 
                          fasesProducao.crescimento.semanas + 
                          fasesProducao.producao.semanas;

      return {
        lote,
        consumoTotalRecria,
        consumoTotalCrescimento,
        consumoTotalProducao,
        consumoGeral,
        consumoPorAve,
        semanasAtivas,
      };
    });

    setRelatorios(relatoriosGerados);
  };

  const exportarRelatorio = () => {
    if (relatorios.length === 0) return;

    const csvContent = [
      'Lote,Raça,Número de Aves,Data Entrada,Consumo Recria (kg),Consumo Crescimento (kg),Consumo Produção (kg),Consumo Total (kg),Consumo por Ave (kg)',
      ...relatorios.map(r => 
        `"${r.lote.nomeLote}","${r.lote.raca}",${r.lote.numeroAves},"${format(r.lote.dataEntrada, 'dd/MM/yyyy')}",${r.consumoTotalRecria.toFixed(2)},${r.consumoTotalCrescimento.toFixed(2)},${r.consumoTotalProducao.toFixed(2)},${r.consumoGeral.toFixed(2)},${r.consumoPorAve.toFixed(3)}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-consumo-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calcular totais gerais
  const totais = relatorios.reduce(
    (acc, rel) => ({
      totalAves: acc.totalAves + rel.lote.numeroAves,
      totalConsumo: acc.totalConsumo + rel.consumoGeral,
      totalLotes: acc.totalLotes + 1,
    }),
    { totalAves: 0, totalConsumo: 0, totalLotes: 0 }
  );

  const consumoMedioPorAve = totais.totalAves > 0 ? totais.totalConsumo / totais.totalAves : 0;

  if (lotes.length === 0) {
    return (
      <div className="page-transition">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <Card className="text-center py-12">
            <CardHeader>
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle>Nenhum Lote Cadastrado</CardTitle>
              <CardDescription>
                Cadastre lotes para visualizar relatórios de consumo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/cadastro-lote">Cadastrar Primeiro Lote</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                Relatórios de Consumo
              </h1>
              <p className="text-muted-foreground mt-2">
                Análises detalhadas de consumo e produtividade por lote
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <Button onClick={exportarRelatorio} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Selecione o lote para análise específica ou todos para visão geral
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={loteSelecionado} onValueChange={setLoteSelecionado}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Selecionar lote" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os lotes</SelectItem>
                {lotes.map((lote) => (
                  <SelectItem key={lote.id} value={lote.id}>
                    {lote.nomeLote}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover-glow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Lotes
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {totais.totalLotes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Egg className="h-8 w-8 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Aves
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {totais.totalAves.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-success" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Consumo Total
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {totais.totalConsumo.toFixed(0)} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-accent" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Média por Ave
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {consumoMedioPorAve.toFixed(2)} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela Detalhada */}
        <Card>
          <CardHeader>
            <CardTitle>Consumo Detalhado por Lote</CardTitle>
            <CardDescription>
              Análise completa do consumo de ração por fase de produção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lote</TableHead>
                    <TableHead>Raça</TableHead>
                    <TableHead className="text-right">Aves</TableHead>
                    <TableHead className="text-right">Recria (kg)</TableHead>
                    <TableHead className="text-right">Crescimento (kg)</TableHead>
                    <TableHead className="text-right">Produção (kg)</TableHead>
                    <TableHead className="text-right">Total (kg)</TableHead>
                    <TableHead className="text-right">kg/Ave</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorios.map((relatorio) => (
                    <TableRow key={relatorio.lote.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{relatorio.lote.nomeLote}</p>
                          <p className="text-xs text-muted-foreground">
                            Entrada: {format(relatorio.lote.dataEntrada, 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{relatorio.lote.raca}</TableCell>
                      <TableCell className="text-right">
                        {relatorio.lote.numeroAves.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {relatorio.consumoTotalRecria.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {relatorio.consumoTotalCrescimento.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {relatorio.consumoTotalProducao.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {relatorio.consumoGeral.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {relatorio.consumoPorAve.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown por Fase */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <Card className="phase-recria">
            <CardHeader>
              <CardTitle className="text-lg">Fase de Recria</CardTitle>
              <CardDescription>
                0-18 semanas de desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Consumo Total:</span>
                  <span className="font-medium">
                    {relatorios.reduce((acc, r) => acc + r.consumoTotalRecria, 0).toFixed(0)} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">% do Total:</span>
                  <span className="font-medium">
                    {totais.totalConsumo > 0 
                      ? ((relatorios.reduce((acc, r) => acc + r.consumoTotalRecria, 0) / totais.totalConsumo) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duração:</span>
                  <span className="font-medium">{fasesProducao.recria.semanas} semanas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="phase-crescimento">
            <CardHeader>
              <CardTitle className="text-lg">Fase de Crescimento</CardTitle>
              <CardDescription>
                18-22 semanas de transição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Consumo Total:</span>
                  <span className="font-medium">
                    {relatorios.reduce((acc, r) => acc + r.consumoTotalCrescimento, 0).toFixed(0)} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">% do Total:</span>
                  <span className="font-medium">
                    {totais.totalConsumo > 0 
                      ? ((relatorios.reduce((acc, r) => acc + r.consumoTotalCrescimento, 0) / totais.totalConsumo) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duração:</span>
                  <span className="font-medium">{fasesProducao.crescimento.semanas} semanas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="phase-producao">
            <CardHeader>
              <CardTitle className="text-lg">Fase de Produção</CardTitle>
              <CardDescription>
                22-76 semanas de postura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Consumo Total:</span>
                  <span className="font-medium">
                    {relatorios.reduce((acc, r) => acc + r.consumoTotalProducao, 0).toFixed(0)} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">% do Total:</span>
                  <span className="font-medium">
                    {totais.totalConsumo > 0 
                      ? ((relatorios.reduce((acc, r) => acc + r.consumoTotalProducao, 0) / totais.totalConsumo) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duração:</span>
                  <span className="font-medium">{fasesProducao.producao.semanas} semanas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}