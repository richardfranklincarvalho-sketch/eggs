import React, { useState, useEffect, useMemo } from 'react';
import { format, addWeeks, startOfWeek, endOfWeek, eachWeekOfInterval, isSameWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  Syringe, 
  Scale, 
  TrendingUp, 
  AlertTriangle,
  Filter,
  Download,
  Info,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import { 
  Lote, 
  EventoCalendario, 
  PesagemAves, 
  VacinaAplicada,
  SemanaProducao,
  FiltroCalendario,
  DadosEstatisticasLote 
} from '@/types';
import { gerarCronogramaVacinacao } from '@/data/vacinasPresets';
import { gerarCronogramaPesagens, calcularDesvioPercentualPeso, classificarStatusPeso } from '@/data/pesagensPresets';

interface CalendarioIntegradoProps {
  lotes: Lote[];
  loteSelecionado?: string;
  onLoteChange?: (loteId: string) => void;
}

export default function CalendarioIntegrado({ 
  lotes, 
  loteSelecionado, 
  onLoteChange 
}: CalendarioIntegradoProps) {
  const { toast } = useToast();
  
  // Estados
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [pesagens, setPesagens] = useState<PesagemAves[]>([]);
  const [vacinasAplicadas, setVacinasAplicadas] = useState<VacinaAplicada[]>([]);
  const [filtros, setFiltros] = useState<FiltroCalendario>({});
  const [periodoVisualizado, setPeriodoVisualizado] = useState(() => {
    const hoje = new Date();
    return {
      inicio: startOfWeek(hoje, { locale: ptBR }),
      fim: endOfWeek(addWeeks(hoje, 11), { locale: ptBR })
    };
  });
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoCalendario | null>(null);

  // Carregar dados do localStorage
  useEffect(() => {
    const pesagensArmazenadas = localStorage.getItem('pesagens');
    const vacinasArmazenadas = localStorage.getItem('vacinasAplicadas');

    if (pesagensArmazenadas) {
      const pesagensParseadas = JSON.parse(pesagensArmazenadas).map((p: any) => ({
        ...p,
        dataPrevista: new Date(p.dataPrevista),
        dataRealizada: p.dataRealizada ? new Date(p.dataRealizada) : undefined,
        criadoEm: new Date(p.criadoEm)
      }));
      setPesagens(pesagensParseadas);
    }

    if (vacinasArmazenadas) {
      const vacinasParseadas = JSON.parse(vacinasArmazenadas).map((v: any) => ({
        ...v,
        dataAplicacao: new Date(v.dataAplicacao),
        proximaAplicacao: v.proximaAplicacao ? new Date(v.proximaAplicacao) : undefined,
        criadoEm: new Date(v.criadoEm)
      }));
      setVacinasAplicadas(vacinasParseadas);
    }
  }, []);

  // Gerar eventos para o lote selecionado
  useEffect(() => {
    if (!loteSelecionado) {
      setEventos([]);
      return;
    }

    const lote = lotes.find(l => l.id === loteSelecionado);
    if (!lote) return;

    gerarEventosLote(lote);
  }, [loteSelecionado, lotes, pesagens, vacinasAplicadas]);

  const gerarEventosLote = (lote: Lote) => {
    const eventosLote: EventoCalendario[] = [];

    // Gerar eventos de fases produtivas
    const semanasProd = gerarSemanasProducao(lote);
    semanasProd.forEach(semana => {
      eventosLote.push({
        id: `fase-${lote.id}-${semana.semana}`,
        loteId: lote.id,
        tipo: 'fase',
        data: semana.dataInicio,
        dataFim: semana.dataFim,
        titulo: `Semana ${semana.semana} - ${getFaseNome(semana.fase)}`,
        descricao: `${semana.consumoPorAve}g/ave • ${semana.consumoTotal}kg total`,
        status: 'realizada',
        dados: semana,
        cor: getFaseCor(semana.fase),
        icone: '📅',
        criadoEm: new Date()
      });
    });

    // Gerar eventos de vacinação
    const cronogramaVacinas = gerarCronogramaVacinacao(lote.dataEntrada);
    cronogramaVacinas.forEach(cronograma => {
      const vacinaAplicada = vacinasAplicadas.find(v => 
        v.loteId === lote.id && v.vacinaId === cronograma.vacina.id
      );

      eventosLote.push({
        id: `vacina-${lote.id}-${cronograma.vacina.id}`,
        loteId: lote.id,
        tipo: 'vacina',
        data: cronograma.dataPrevista,
        titulo: cronograma.vacina.nome,
        descricao: `${cronograma.vacina.viaAplicacao} • ${cronograma.vacina.doseML}ml • ${cronograma.idadeAves} dias`,
        status: vacinaAplicada ? 'aplicada' : getStatusVacina(cronograma.dataPrevista),
        dados: { ...cronograma, vacinaAplicada },
        cor: getVacinaCor(cronograma.vacina.viaAplicacao),
        icone: getVacinaIcone(cronograma.vacina.viaAplicacao),
        criadoEm: new Date()
      });
    });

    // Gerar eventos de pesagem
    const pesagensLote = pesagens.filter(p => p.loteId === lote.id);
    if (pesagensLote.length === 0) {
      // Gerar cronograma inicial de pesagens
      const novasPesagens = gerarCronogramaPesagens(lote.id, lote.dataEntrada, lote.raca);
      setPesagens(prev => [...prev, ...novasPesagens]);
      
      // Salvar no localStorage
      localStorage.setItem('pesagens', JSON.stringify([...pesagens, ...novasPesagens]));
    }

    pesagensLote.forEach(pesagem => {
      eventosLote.push({
        id: `pesagem-${lote.id}-${pesagem.semana}`,
        loteId: lote.id,
        tipo: 'pesagem',
        data: pesagem.dataPrevista,
        titulo: `Pesagem - Semana ${pesagem.semana}`,
        descricao: `Peso ideal: ${pesagem.pesoMedioIdeal}g • ${pesagem.idadeAves} dias`,
        status: pesagem.status,
        dados: pesagem,
        cor: getPesagemCor(pesagem),
        icone: '⚖️',
        criadoEm: new Date()
      });
    });

    setEventos(eventosLote);
  };

  // Funções auxiliares
  const gerarSemanasProducao = (lote: Lote): SemanaProducao[] => {
    const semanas: SemanaProducao[] = [];
    let semanaAtual = 1;

    // Recria (18 semanas)
    for (let i = 0; i < 18; i++) {
      const dataInicio = addWeeks(lote.dataEntrada, i);
      semanas.push({
        semana: semanaAtual++,
        dataInicio,
        dataFim: addDays(dataInicio, 6),
        fase: 'recria',
        consumoPorAve: 7, // 126g/18 semanas = ~7g/semana
        consumoTotal: Math.round((7 * lote.numeroAves) / 1000),
        descricao: 'Fase de desenvolvimento inicial'
      });
    }

    // Crescimento (4 semanas)
    for (let i = 0; i < 4; i++) {
      const dataInicio = addWeeks(lote.dataEntrada, 18 + i);
      semanas.push({
        semana: semanaAtual++,
        dataInicio,
        dataFim: addDays(dataInicio, 6),
        fase: 'crescimento',
        consumoPorAve: 140,
        consumoTotal: Math.round((140 * lote.numeroAves) / 1000),
        descricao: 'Transição para fase produtiva'
      });
    }

    // Produção (54 semanas)
    for (let i = 0; i < 54; i++) {
      const dataInicio = addWeeks(lote.dataEntrada, 22 + i);
      semanas.push({
        semana: semanaAtual++,
        dataInicio,
        dataFim: addDays(dataInicio, 6),
        fase: 'producao',
        consumoPorAve: 126,
        consumoTotal: Math.round((126 * lote.numeroAves) / 1000),
        descricao: 'Fase de postura e produção'
      });
    }

    return semanas;
  };

  const getFaseNome = (fase: string) => {
    const nomes = {
      recria: 'Recria',
      crescimento: 'Crescimento', 
      producao: 'Produção'
    };
    return nomes[fase as keyof typeof nomes] || fase;
  };

  const getFaseCor = (fase: string) => {
    const cores = {
      recria: 'hsl(var(--chart-1))',
      crescimento: 'hsl(var(--chart-2))',
      producao: 'hsl(var(--chart-3))'
    };
    return cores[fase as keyof typeof cores] || 'hsl(var(--muted))';
  };

  const getVacinaCor = (via: string) => {
    const cores = {
      oral: '#3B82F6',        // blue
      ocular: '#06B6D4',      // cyan
      nasal: '#8B5CF6',       // violet
      subcutanea: '#10B981',  // emerald
      intramuscular: '#F59E0B', // amber
      spray: '#EC4899'        // pink
    };
    return cores[via as keyof typeof cores] || '#6B7280';
  };

  const getVacinaIcone = (via: string) => {
    const icones = {
      oral: '💧',
      ocular: '👁️',
      nasal: '🌫️',
      subcutanea: '💉',
      intramuscular: '💉',
      spray: '🌫️'
    };
    return icones[via as keyof typeof icones] || '💉';
  };

  const getPesagemCor = (pesagem: PesagemAves) => {
    if (pesagem.status === 'atrasada') return '#EF4444';
    if (pesagem.status === 'realizada' && pesagem.pesoMedioReal) {
      const desvio = calcularDesvioPercentualPeso(pesagem.pesoMedioReal, pesagem.pesoMedioIdeal);
      const status = classificarStatusPeso(desvio);
      return status.cor;
    }
    return '#6B7280';
  };

  const getStatusVacina = (dataPrevista: Date) => {
    const hoje = new Date();
    return dataPrevista < hoje ? 'atrasada' : 'pendente';
  };

  // Filtrar eventos
  const eventosFiltrados = useMemo(() => {
    return eventos.filter(evento => {
      // Filtro por período
      if (filtros.periodo) {
        if (evento.data < filtros.periodo.inicio || evento.data > filtros.periodo.fim) {
          return false;
        }
      }

      // Filtro por tipo
      if (filtros.tipoEvento && filtros.tipoEvento.length > 0) {
        if (!filtros.tipoEvento.includes(evento.tipo)) {
          return false;
        }
      }

      // Filtro por status
      if (filtros.status && filtros.status.length > 0) {
        if (!filtros.status.includes(evento.status as any)) {
          return false;
        }
      }

      return true;
    });
  }, [eventos, filtros]);

  // Agrupar eventos por semana
  const eventosPorSemana = useMemo(() => {
    const semanas = eachWeekOfInterval({
      start: periodoVisualizado.inicio,
      end: periodoVisualizado.fim
    }, { locale: ptBR });
    
    return semanas.map(inicioSemana => {
      const fimSemana = endOfWeek(inicioSemana, { locale: ptBR });
      const eventosSemanais = eventosFiltrados.filter(evento => 
        isSameWeek(evento.data, inicioSemana, { locale: ptBR })
      );

      return {
        inicioSemana,
        fimSemana,
        eventos: eventosSemanais
      };
    });
  }, [eventosFiltrados, periodoVisualizado]);

  const navegarPeriodo = (direcao: 'anterior' | 'proximo') => {
    const semanas = direcao === 'anterior' ? -12 : 12;
    setPeriodoVisualizado(prev => ({
      inicio: addWeeks(prev.inicio, semanas),
      fim: addWeeks(prev.fim, semanas)
    }));
  };

  const exportarCalendario = () => {
    const csvContent = [
      'Data,Tipo,Título,Descrição,Status,Lote',
      ...eventosFiltrados.map(e => 
        `${format(e.data, 'dd/MM/yyyy')},${e.tipo},${e.titulo},"${e.descricao}",${e.status},${e.loteId}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendario-integrado-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Calendário exportado",
      description: "O arquivo CSV foi baixado com sucesso."
    });
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Calendário Integrado</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navegarPeriodo('anterior')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navegarPeriodo('proximo')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={exportarCalendario}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Seletor de Lote */}
            <Select value={loteSelecionado} onValueChange={onLoteChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar lote" />
              </SelectTrigger>
              <SelectContent>
                {lotes.map(lote => (
                  <SelectItem key={lote.id} value={lote.id}>
                    {lote.nomeLote}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Tipo */}
            <Select 
              value={filtros.tipoEvento?.join(',') || 'todos'} 
              onValueChange={(value) => setFiltros(prev => ({
                ...prev,
                tipoEvento: value === 'todos' ? undefined : value.split(',') as any
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="fase">Fases</SelectItem>
                <SelectItem value="vacina">Vacinas</SelectItem>
                <SelectItem value="pesagem">Pesagens</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por Status */}
            <Select 
              value={filtros.status?.join(',') || 'todos'} 
              onValueChange={(value) => setFiltros(prev => ({
                ...prev,
                status: value === 'todos' ? undefined : value.split(',') as any
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aplicada,realizada">Concluído</SelectItem>
                <SelectItem value="atrasada">Atrasado</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {format(periodoVisualizado.inicio, 'MMM yyyy', { locale: ptBR })} - {format(periodoVisualizado.fim, 'MMM yyyy', { locale: ptBR })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade de Semanas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {eventosPorSemana.map(({ inicioSemana, fimSemana, eventos }, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Semana {format(inicioSemana, 'dd/MM', { locale: ptBR })} - {format(fimSemana, 'dd/MM', { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {eventos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento</p>
              ) : (
                eventos.map(evento => (
                  <Dialog key={evento.id}>
                    <DialogTrigger asChild>
                      <div 
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        style={{ borderLeft: `4px solid ${evento.cor}` }}
                      >
                        <span className="text-lg">{evento.icone}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{evento.titulo}</p>
                          <p className="text-xs text-muted-foreground truncate">{evento.descricao}</p>
                        </div>
                        <Badge 
                          variant={evento.status === 'atrasada' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {evento.status}
                        </Badge>
                      </div>
                    </DialogTrigger>
                    
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <span className="text-xl">{evento.icone}</span>
                          {evento.titulo}
                        </DialogTitle>
                        <DialogDescription>
                          {format(evento.data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Tabs defaultValue="detalhes" className="w-full">
                        <TabsList>
                          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                          {evento.tipo !== 'fase' && (
                            <TabsTrigger value="acao">Registrar</TabsTrigger>
                          )}
                        </TabsList>
                        
                        <TabsContent value="detalhes" className="space-y-4">
                          {/* Conteúdo específico por tipo de evento */}
                          {evento.tipo === 'fase' && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Fase</Label>
                                <p className="text-sm">{getFaseNome(evento.dados.fase)}</p>
                              </div>
                              <div>
                                <Label>Semana</Label>
                                <p className="text-sm">{evento.dados.semana}</p>
                              </div>
                              <div>
                                <Label>Consumo por Ave</Label>
                                <p className="text-sm">{evento.dados.consumoPorAve}g</p>
                              </div>
                              <div>
                                <Label>Consumo Total</Label>
                                <p className="text-sm">{evento.dados.consumoTotal}kg</p>
                              </div>
                            </div>
                          )}
                          
                          {evento.tipo === 'vacina' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Via de Aplicação</Label>
                                  <p className="text-sm capitalize">{evento.dados.vacina.viaAplicacao}</p>
                                </div>
                                <div>
                                  <Label>Dose</Label>
                                  <p className="text-sm">{evento.dados.vacina.doseML}ml</p>
                                </div>
                                <div>
                                  <Label>Idade das Aves</Label>
                                  <p className="text-sm">{evento.dados.idadeAves} dias</p>
                                </div>
                                <div>
                                  <Label>Fabricante</Label>
                                  <p className="text-sm">{evento.dados.vacina.fabricante}</p>
                                </div>
                              </div>
                              {evento.dados.vacina.observacoes && (
                                <div>
                                  <Label>Observações</Label>
                                  <p className="text-sm">{evento.dados.vacina.observacoes}</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {evento.tipo === 'pesagem' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Peso Ideal</Label>
                                  <p className="text-sm">{evento.dados.pesoMedioIdeal}g</p>
                                </div>
                                <div>
                                  <Label>Peso Real</Label>
                                  <p className="text-sm">
                                    {evento.dados.pesoMedioReal 
                                      ? `${evento.dados.pesoMedioReal}g` 
                                      : 'Não registrado'
                                    }
                                  </p>
                                </div>
                                <div>
                                  <Label>Idade das Aves</Label>
                                  <p className="text-sm">{evento.dados.idadeAves} dias</p>
                                </div>
                                <div>
                                  <Label>Semana</Label>
                                  <p className="text-sm">{evento.dados.semana}</p>
                                </div>
                              </div>
                              
                              {evento.dados.pesoMedioReal && (
                                <div>
                                  <Label>Desvio Percentual</Label>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm">
                                      {calcularDesvioPercentualPeso(
                                        evento.dados.pesoMedioReal, 
                                        evento.dados.pesoMedioIdeal
                                      ).toFixed(1)}%
                                    </p>
                                    <Badge 
                                      variant={Math.abs(calcularDesvioPercentualPeso(
                                        evento.dados.pesoMedioReal, 
                                        evento.dados.pesoMedioIdeal
                                      )) <= 10 ? 'secondary' : 'destructive'}
                                    >
                                      {classificarStatusPeso(
                                        calcularDesvioPercentualPeso(
                                          evento.dados.pesoMedioReal, 
                                          evento.dados.pesoMedioIdeal
                                        )
                                      ).descricao}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </TabsContent>
                        
                        {evento.tipo !== 'fase' && (
                          <TabsContent value="acao">
                            <p className="text-sm text-muted-foreground mb-4">
                              Registre a aplicação da vacina ou realização da pesagem
                            </p>
                            {/* Formulário de registro seria implementado aqui */}
                            <Button disabled>
                              Em desenvolvimento
                            </Button>
                          </TabsContent>
                        )}
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estatísticas Rápidas */}
      {loteSelecionado && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Lote</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {eventos.filter(e => e.status === 'pendente').length}
                </p>
                <p className="text-sm text-muted-foreground">Eventos Pendentes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">
                  {eventos.filter(e => e.status === 'atrasada').length}
                </p>
                <p className="text-sm text-muted-foreground">Eventos Atrasados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {eventos.filter(e => ['aplicada', 'realizada'].includes(e.status || '')).length}
                </p>
                <p className="text-sm text-muted-foreground">Eventos Concluídos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Math.round((eventos.filter(e => ['aplicada', 'realizada'].includes(e.status || '')).length / eventos.length) * 100) || 0}%
                </p>
                <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}