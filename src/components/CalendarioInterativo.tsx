import React, { useState, useEffect, useMemo } from 'react';
import { format, addWeeks, startOfWeek, endOfWeek, eachWeekOfInterval, isSameWeek, addDays, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  Syringe, 
  Scale, 
  TrendingUp, 
  AlertTriangle,
  Filter,
  Download,
  Settings,
  Eye,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  PieChart
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

import { 
  Lote, 
  EventoCalendario, 
  PesagemAves, 
  VacinaAplicada,
  AlertaCalendario 
} from '@/types';

import { 
  gerarCronogramaVacinacaoNovogen,
  gerarCronogramaPesagensNovogen, 
  gerarFasesProdutivasNovogen,
  getCorFase,
  getIconeVacina,
  PESOS_IDEAIS_NOVOGEN
} from '@/data/presetsNovogen';

import { calcularDesvioPercentualPeso, classificarStatusPeso } from '@/data/pesagensPresets';

interface CalendarioInterativoProps {
  lotes: Lote[];
  loteSelecionado?: string;
  onLoteChange?: (loteId: string) => void;
}

interface FiltroEvento {
  tipoEvento?: string[];
  status?: string[];
  periodo?: 'semana' | 'mes' | 'ano';
  mostrarAlertas?: boolean;
}

export default function CalendarioInterativo({ 
  lotes, 
  loteSelecionado, 
  onLoteChange 
}: CalendarioInterativoProps) {
  const { toast } = useToast();
  
  // Estados principais
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [pesagens, setPesagens] = useState<PesagemAves[]>([]);
  const [vacinasAplicadas, setVacinasAplicadas] = useState<VacinaAplicada[]>([]);
  const [alertas, setAlertas] = useState<AlertaCalendario[]>([]);
  
  // Estados de visualização
  const [visualizacao, setVisualizacao] = useState<'calendario' | 'dashboard' | 'timeline'>('calendario');
  const [filtros, setFiltros] = useState<FiltroEvento>({ mostrarAlertas: true });
  const [periodoVisualizado, setPeriodoVisualizado] = useState(() => {
    const hoje = new Date();
    return {
      inicio: startOfWeek(hoje, { locale: ptBR }),
      fim: endOfWeek(addWeeks(hoje, 11), { locale: ptBR })
    };
  });
  
  // Estados de interação
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoCalendario | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Carregar dados do localStorage
  useEffect(() => {
    carregarDados();
  }, []);

  // Gerar eventos para o lote selecionado
  useEffect(() => {
    if (loteSelecionado) {
      gerarEventosLote(loteSelecionado);
      gerarAlertas(loteSelecionado);
    }
  }, [loteSelecionado, lotes, pesagens, vacinasAplicadas]);

  const carregarDados = () => {
    try {
      const pesagensArmazenadas = localStorage.getItem('pesagens');
      const vacinasArmazenadas = localStorage.getItem('vacinasAplicadas');
      const alertasArmazenados = localStorage.getItem('alertas');

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

      if (alertasArmazenados) {
        const alertasParseados = JSON.parse(alertasArmazenados).map((a: any) => ({
          ...a,
          criadoEm: new Date(a.criadoEm)
        }));
        setAlertas(alertasParseados);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados salvos.",
        variant: "destructive"
      });
    }
  };

  const gerarEventosLote = (loteId: string) => {
    const lote = lotes.find(l => l.id === loteId);
    if (!lote) return;

    const eventosLote: EventoCalendario[] = [];

    try {
      // 1. Gerar eventos de fases produtivas NOVOgen
      const fasesNovogen = gerarFasesProdutivasNovogen(lote.id, lote.dataEntrada, lote.numeroAves);
      
      fasesNovogen.forEach(fase => {
        eventosLote.push({
          id: fase.id,
          loteId: fase.loteId,
          tipo: 'fase',
          data: fase.dataInicio,
          dataFim: fase.dataFim,
          titulo: `S${fase.semana} - ${fase.fase.replace('-', ' ').toUpperCase()}`,
          descricao: `${Math.round(fase.consumoPorAve)}g/ave • ${fase.consumoTotal}kg total`,
          status: isAfter(new Date(), fase.dataFim) ? 'realizada' : 'pendente',
          dados: fase,
          cor: fase.cor,
          icone: '📅',
          criadoEm: new Date()
        });
      });

      // 2. Gerar eventos de vacinação NOVOgen
      const cronogramaVacinas = gerarCronogramaVacinacaoNovogen(lote.dataEntrada, lote.id);
      
      cronogramaVacinas.forEach(cronograma => {
        const vacinaAplicada = vacinasAplicadas.find(v => 
          v.loteId === lote.id && v.vacinaId === cronograma.vacina.id
        );

        const status = vacinaAplicada ? 'aplicada' : 
                      isAfter(new Date(), cronograma.dataPrevista) ? 'atrasada' : 'pendente';

        eventosLote.push({
          id: `vacina-${lote.id}-${cronograma.vacina.id}`,
          loteId: lote.id,
          tipo: 'vacina',
          data: cronograma.dataPrevista,
          titulo: cronograma.vacina.nome,
          descricao: `${cronograma.vacina.viaAplicacao} • ${cronograma.vacina.doseML}ml • ${cronograma.idadeAves}d`,
          status,
          dados: { ...cronograma, vacinaAplicada },
          cor: getCorVacina(cronograma.vacina.viaAplicacao),
          icone: getIconeVacina(cronograma.vacina.viaAplicacao),
          criadoEm: new Date()
        });
      });

      // 3. Gerar eventos de pesagem NOVOgen
      let pesagensLote = pesagens.filter(p => p.loteId === lote.id);
      
      // Se não existem pesagens, gerar cronograma inicial
      if (pesagensLote.length === 0) {
        const novasPesagens = gerarCronogramaPesagensNovogen(lote.id, lote.dataEntrada);
        setPesagens(prev => {
          const updated = [...prev, ...novasPesagens];
          localStorage.setItem('pesagens', JSON.stringify(updated));
          return updated;
        });
        pesagensLote = novasPesagens;
      }

      pesagensLote.forEach(pesagem => {
        const status = pesagem.status === 'realizada' ? 'realizada' :
                      isAfter(new Date(), pesagem.dataPrevista) ? 'atrasada' : 'pendente';

        eventosLote.push({
          id: `pesagem-${lote.id}-${pesagem.semana}`,
          loteId: lote.id,
          tipo: 'pesagem',
          data: pesagem.dataPrevista,
          titulo: `Pesagem S${pesagem.semana}`,
          descricao: `Ideal: ${pesagem.pesoMedioIdeal}g • ${pesagem.idadeAves}d`,
          status,
          dados: pesagem,
          cor: getCorPesagem(pesagem),
          icone: '⚖️',
          criadoEm: new Date()
        });
      });

      setEventos(eventosLote);

    } catch (error) {
      console.error('Erro ao gerar eventos:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar cronograma. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const gerarAlertas = (loteId: string) => {
    const lote = lotes.find(l => l.id === loteId);
    if (!lote) return;

    const novosAlertas: AlertaCalendario[] = [];
    const hoje = new Date();

    // Alertas de vacinas atrasadas
    eventos.forEach(evento => {
      if (evento.tipo === 'vacina' && evento.status === 'atrasada') {
        novosAlertas.push({
          id: `alerta-${evento.id}`,
          loteId,
          eventoId: evento.id,
          tipo: 'vacina_atrasada',
          prioridade: 'alta',
          titulo: `Vacina ${evento.titulo} atrasada`,
          descricao: `Prevista para ${format(evento.data, 'dd/MM/yyyy')} - ${Math.ceil((hoje.getTime() - evento.data.getTime()) / (1000 * 60 * 60 * 24))} dias de atraso`,
          visualizado: false,
          resolvido: false,
          criadoEm: new Date()
        });
      }
    });

    // Alertas de pesagens atrasadas
    eventos.forEach(evento => {
      if (evento.tipo === 'pesagem' && evento.status === 'atrasada') {
        novosAlertas.push({
          id: `alerta-pesagem-${evento.id}`,
          loteId,
          eventoId: evento.id,
          tipo: 'pesagem_atrasada', 
          prioridade: 'media',
          titulo: `Pesagem semana ${evento.dados.semana} atrasada`,
          descricao: `Prevista para ${format(evento.data, 'dd/MM/yyyy')}`,
          visualizado: false,
          resolvido: false,
          criadoEm: new Date()
        });
      }
    });

    // Alertas de peso fora do ideal
    pesagens.forEach(pesagem => {
      if (pesagem.loteId === loteId && pesagem.pesoMedioReal) {
        const desvio = Math.abs(calcularDesvioPercentualPeso(pesagem.pesoMedioReal, pesagem.pesoMedioIdeal));
        if (desvio > 10) {
          const prioridade = desvio > 20 ? 'critica' : 'alta';
          novosAlertas.push({
            id: `alerta-peso-${pesagem.id}`,
            loteId,
            eventoId: pesagem.id,
            tipo: 'peso_fora_ideal',
            prioridade,
            titulo: `Peso fora do ideal - Semana ${pesagem.semana}`,
            descricao: `Desvio de ${desvio.toFixed(1)}% (Real: ${pesagem.pesoMedioReal}g, Ideal: ${pesagem.pesoMedioIdeal}g)`,
            visualizado: false,
            resolvido: false,
            criadoEm: new Date()
          });
        }
      }
    });

    setAlertas(prevAlertas => {
      const alertasFiltrados = prevAlertas.filter(a => a.loteId !== loteId);
      const updated = [...alertasFiltrados, ...novosAlertas];
      localStorage.setItem('alertas', JSON.stringify(updated));
      return updated;
    });
  };

  // Funções auxiliares
  const getCorVacina = (via: string) => {
    const cores = {
      ocular: '#06B6D4',      // cyan
      oral: '#3B82F6',        // blue
      spray: '#8B5CF6',       // violet
      subcutanea: '#10B981',  // emerald
      intramuscular: '#F59E0B', // amber
      nasal: '#EC4899'        // pink
    };
    return cores[via as keyof typeof cores] || '#6B7280';
  };

  const getCorPesagem = (pesagem: PesagemAves) => {
    if (pesagem.status === 'atrasada') return '#EF4444'; // red
    if (pesagem.status === 'realizada' && pesagem.pesoMedioReal) {
      const desvio = calcularDesvioPercentualPeso(pesagem.pesoMedioReal, pesagem.pesoMedioIdeal);
      const status = classificarStatusPeso(desvio);
      return status.cor;
    }
    return '#6B7280'; // gray
  };

  // Filtrar eventos
  const eventosFiltrados = useMemo(() => {
    return eventos.filter(evento => {
      // Filtro por período
      if (evento.data < periodoVisualizado.inicio || evento.data > periodoVisualizado.fim) {
        return false;
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
  }, [eventos, filtros, periodoVisualizado]);

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
        eventos: eventosSemanais,
        temAlerta: eventosSemanais.some(e => ['atrasada'].includes(e.status || ''))
      };
    });
  }, [eventosFiltrados]);

  // Estatísticas do lote
  const estatisticasLote = useMemo(() => {
    if (!loteSelecionado) return null;

    const eventosPendentes = eventos.filter(e => e.status === 'pendente').length;
    const eventosAtrasados = eventos.filter(e => e.status === 'atrasada').length;
    const eventosConcluidos = eventos.filter(e => ['aplicada', 'realizada'].includes(e.status || '')).length;
    const totalEventos = eventos.length;
    const taxaConclusao = totalEventos > 0 ? Math.round((eventosConcluidos / totalEventos) * 100) : 0;

    const alertasAtivos = alertas.filter(a => a.loteId === loteSelecionado && !a.resolvido);
    const alertasCriticos = alertasAtivos.filter(a => a.prioridade === 'critica').length;

    const vacinasPendentes = eventos.filter(e => e.tipo === 'vacina' && e.status === 'pendente').length;
    const vacinasAtrasadas = eventos.filter(e => e.tipo === 'vacina' && e.status === 'atrasada').length;
    const vacinasAplicadas = eventos.filter(e => e.tipo === 'vacina' && e.status === 'aplicada').length;
    const totalVacinas = eventos.filter(e => e.tipo === 'vacina').length;
    const percentualVacinacao = totalVacinas > 0 ? Math.round((vacinasAplicadas / totalVacinas) * 100) : 0;

    return {
      eventosPendentes,
      eventosAtrasados,
      eventosConcluidos,
      taxaConclusao,
      alertasAtivos: alertasAtivos.length,
      alertasCriticos,
      percentualVacinacao,
      vacinasPendentes,
      vacinasAtrasadas
    };
  }, [eventos, alertas, loteSelecionado]);

  // Navegação
  const navegarPeriodo = (direcao: 'anterior' | 'proximo') => {
    const semanas = direcao === 'anterior' ? -12 : 12;
    setPeriodoVisualizado(prev => ({
      inicio: addWeeks(prev.inicio, semanas),
      fim: addWeeks(prev.fim, semanas)
    }));
  };

  const definirPeriodo = (tipo: 'semana' | 'mes' | 'trimestre' | 'ano') => {
    const hoje = new Date();
    let inicio: Date, fim: Date;

    switch (tipo) {
      case 'semana':
        inicio = startOfWeek(hoje, { locale: ptBR });
        fim = endOfWeek(addWeeks(hoje, 3), { locale: ptBR });
        break;
      case 'mes':
        inicio = startOfWeek(hoje, { locale: ptBR });
        fim = endOfWeek(addWeeks(hoje, 8), { locale: ptBR });
        break;
      case 'trimestre':
        inicio = startOfWeek(hoje, { locale: ptBR });
        fim = endOfWeek(addWeeks(hoje, 12), { locale: ptBR });
        break;
      case 'ano':
        inicio = startOfWeek(hoje, { locale: ptBR });
        fim = endOfWeek(addWeeks(hoje, 52), { locale: ptBR });
        break;
      default:
        return;
    }

    setPeriodoVisualizado({ inicio, fim });
  };

  // Exportação
  const exportarCalendario = async (formato: 'csv' | 'pdf') => {
    setExportando(true);
    try {
      if (formato === 'csv') {
        const csvContent = [
          'Data,Tipo,Título,Descrição,Status,Lote,Fase',
          ...eventosFiltrados.map(e => 
            `${format(e.data, 'dd/MM/yyyy')},${e.tipo},${e.titulo},"${e.descricao}",${e.status},${e.loteId},${e.dados?.fase || ''}`
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendario-integrado-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Exportação concluída",
          description: "Arquivo CSV baixado com sucesso."
        });
      }

      // TODO: Implementar exportação PDF
      if (formato === 'pdf') {
        toast({
          title: "Em desenvolvimento",
          description: "Exportação PDF será implementada em breve."
        });
      }
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Falha ao gerar arquivo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setExportando(false);
    }
  };

  if (!loteSelecionado || lotes.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <CardTitle>Calendário Integrado NOVOgen</CardTitle>
          <CardDescription>
            Selecione um lote para visualizar o cronograma completo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.location.href = '/cadastro-lote'}
            className="mt-4"
          >
            Cadastrar Primeiro Lote
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendário Integrado NOVOgen
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Cronograma completo: fases, vacinação e pesagens
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Seletor de visualização */}
              <Tabs value={visualizacao} onValueChange={(v: any) => setVisualizacao(v)}>
                <TabsList className="hidden sm:flex">
                  <TabsTrigger value="calendario">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Calendário
                  </TabsTrigger>
                  <TabsTrigger value="dashboard">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="timeline">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Timeline
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Modo edição */}
              <div className="flex items-center gap-2">
                <Switch 
                  checked={modoEdicao}
                  onCheckedChange={setModoEdicao}
                  id="modo-edicao"
                />
                <Label htmlFor="modo-edicao" className="text-sm">Editar</Label>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Seletor de Lote */}
            <Select value={loteSelecionado} onValueChange={onLoteChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar lote" />
              </SelectTrigger>
              <SelectContent>
                {lotes.map(lote => (
                  <SelectItem key={lote.id} value={lote.id}>
                    <div>
                      <p className="font-medium">{lote.nomeLote}</p>
                      <p className="text-xs text-muted-foreground">{lote.numeroAves} aves • {lote.raca}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtros */}
            <Select 
              value={filtros.tipoEvento?.join(',') || 'todos'} 
              onValueChange={(value) => setFiltros(prev => ({
                ...prev,
                tipoEvento: value === 'todos' ? undefined : value.split(',') as any
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipos de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="fase">📅 Fases produtivas</SelectItem>
                <SelectItem value="vacina">💉 Vacinas</SelectItem>
                <SelectItem value="pesagem">⚖️ Pesagens</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filtros.status?.join(',') || 'todos'} 
              onValueChange={(value) => setFiltros(prev => ({
                ...prev,
                status: value === 'todos' ? undefined : value.split(',') as any
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">⏳ Pendente</SelectItem>
                <SelectItem value="aplicada,realizada">✅ Concluído</SelectItem>
                <SelectItem value="atrasada">⚠️ Atrasado</SelectItem>
              </SelectContent>
            </Select>

            {/* Navegação de período */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => navegarPeriodo('anterior')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navegarPeriodo('proximo')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportarCalendario('csv')}
                disabled={exportando}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configurações do Calendário</DialogTitle>
                    <DialogDescription>
                      Personalize a visualização e filtros
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Período de visualização</Label>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => definirPeriodo('semana')}>
                          Semana
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => definirPeriodo('mes')}>
                          Mês
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => definirPeriodo('trimestre')}>
                          Trimestre
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => definirPeriodo('ano')}>
                          Ano
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <Label>Mostrar alertas críticos</Label>
                      <Switch 
                        checked={filtros.mostrarAlertas}
                        onCheckedChange={(checked) => setFiltros(prev => ({
                          ...prev,
                          mostrarAlertas: checked
                        }))}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => exportarCalendario('csv')}
                        disabled={exportando}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                      </Button>
                      <Button 
                        onClick={() => exportarCalendario('pdf')}
                        disabled={exportando}
                        variant="outline"
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar PDF
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Indicador do período */}
          <div className="flex items-center justify-between mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium">
              {format(periodoVisualizado.inicio, 'dd MMM', { locale: ptBR })} - {format(periodoVisualizado.fim, 'dd MMM yyyy', { locale: ptBR })}
            </div>
            <div className="text-sm text-muted-foreground">
              {eventosFiltrados.length} eventos encontrados
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {filtros.mostrarAlertas && alertas.filter(a => a.loteId === loteSelecionado && !a.resolvido).length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                {alertas.filter(a => a.loteId === loteSelecionado && !a.resolvido).length} alerta(s) ativo(s) para este lote
              </span>
              <Button variant="outline" size="sm">
                Ver todos
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {visualizacao === 'calendario' && (
        <>
          {/* Grade de semanas - Calendário principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {eventosPorSemana.map(({ inicioSemana, fimSemana, eventos, temAlerta }, index) => (
              <Card key={index} className={`relative transition-all duration-200 ${temAlerta ? 'ring-2 ring-destructive/20' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Semana {format(inicioSemana, 'dd/MM', { locale: ptBR })} - {format(fimSemana, 'dd/MM', { locale: ptBR })}
                    </CardTitle>
                    {temAlerta && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Alerta
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {eventos.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nenhum evento programado</p>
                  ) : (
                    eventos.map(evento => (
                      <Dialog key={evento.id}>
                        <DialogTrigger asChild>
                          <div 
                            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 cursor-pointer transition-all duration-200 border-l-4 ${
                              evento.status === 'atrasada' ? 'bg-destructive/10' : ''
                            }`}
                            style={{ borderLeftColor: evento.cor }}
                          >
                            <span className="text-xl">{evento.icone}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{evento.titulo}</p>
                              <p className="text-xs text-muted-foreground truncate">{evento.descricao}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge 
                                variant={
                                  evento.status === 'atrasada' ? 'destructive' : 
                                  evento.status === 'aplicada' || evento.status === 'realizada' ? 'default' : 'secondary'
                                }
                                className="text-xs"
                              >
                                {evento.status === 'pendente' && '⏳'}
                                {evento.status === 'atrasada' && '⚠️'}
                                {(evento.status === 'aplicada' || evento.status === 'realizada') && '✅'}
                                {' '}{evento.status}
                              </Badge>
                              {evento.tipo === 'fase' && (
                                <span className="text-xs text-muted-foreground">
                                  S{evento.dados?.semana}
                                </span>
                              )}
                            </div>
                          </div>
                        </DialogTrigger>
                        
                        {/* Modal com detalhes do evento */}
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <span className="text-xl">{evento.icone}</span>
                              {evento.titulo}
                              <Badge variant="outline">{evento.tipo}</Badge>
                            </DialogTitle>
                            <DialogDescription>
                              {format(evento.data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              {evento.dataFim && ` - ${format(evento.dataFim, "dd 'de' MMMM", { locale: ptBR })}`}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Tabs defaultValue="detalhes" className="w-full">
                            <TabsList>
                              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                              {modoEdicao && evento.tipo !== 'fase' && (
                                <TabsTrigger value="registrar">Registrar</TabsTrigger>
                              )}
                            </TabsList>
                            
                            <TabsContent value="detalhes" className="space-y-4">
                              {/* Detalhes específicos por tipo */}
                              {evento.tipo === 'fase' && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Fase Produtiva</Label>
                                    <p className="text-sm">{evento.dados.fase?.replace('-', ' ').toUpperCase()}</p>
                                  </div>
                                  <div>
                                    <Label>Semana do Lote</Label>
                                    <p className="text-sm">{evento.dados.semana}</p>
                                  </div>
                                  <div>
                                    <Label>Consumo por Ave</Label>
                                    <p className="text-sm">{Math.round(evento.dados.consumoPorAve)}g/semana</p>
                                  </div>
                                  <div>
                                    <Label>Consumo Total</Label>
                                    <p className="text-sm">{evento.dados.consumoTotal}kg</p>
                                  </div>
                                  {evento.dados.pesoAlvo && (
                                    <div>
                                      <Label>Peso Alvo</Label>
                                      <p className="text-sm">{evento.dados.pesoAlvo}g</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label>Descrição</Label>
                                    <p className="text-sm">{evento.dados.descricao}</p>
                                  </div>
                                </div>
                              )}
                              
                              {evento.tipo === 'vacina' && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Via de Aplicação</Label>
                                      <div className="flex items-center gap-2">
                                        <span>{getIconeVacina(evento.dados.vacina.viaAplicacao)}</span>
                                        <p className="text-sm capitalize">{evento.dados.vacina.viaAplicacao}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Dosagem</Label>
                                      <p className="text-sm">{evento.dados.vacina.doseML}ml por ave</p>
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
                                  {evento.dados.vacinaAplicada && (
                                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                        ✅ Vacina aplicada em {format(evento.dados.vacinaAplicada.dataAplicacao, 'dd/MM/yyyy')}
                                      </p>
                                      <p className="text-xs text-green-600 dark:text-green-400">
                                        Responsável: {evento.dados.vacinaAplicada.responsavel}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {evento.tipo === 'pesagem' && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Peso Ideal NOVOgen</Label>
                                      <p className="text-sm font-medium">{evento.dados.pesoMedioIdeal}g</p>
                                    </div>
                                    <div>
                                      <Label>Peso Realizado</Label>
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
                                      <Label>Semana do Lote</Label>
                                      <p className="text-sm">{evento.dados.semana}</p>
                                    </div>
                                  </div>
                                  
                                  {evento.dados.pesoMedioReal && (
                                    <div className="p-3 rounded-lg border">
                                      <Label>Análise de Performance</Label>
                                      <div className="mt-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm">Desvio do ideal:</span>
                                          <Badge 
                                            variant={Math.abs(calcularDesvioPercentualPeso(
                                              evento.dados.pesoMedioReal, 
                                              evento.dados.pesoMedioIdeal
                                            )) <= 10 ? 'default' : 'destructive'}
                                          >
                                            {calcularDesvioPercentualPeso(
                                              evento.dados.pesoMedioReal, 
                                              evento.dados.pesoMedioIdeal
                                            ).toFixed(1)}%
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {classificarStatusPeso(
                                            calcularDesvioPercentualPeso(
                                              evento.dados.pesoMedioReal, 
                                              evento.dados.pesoMedioIdeal
                                            )
                                          ).descricao}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </TabsContent>
                            
                            {modoEdicao && evento.tipo !== 'fase' && (
                              <TabsContent value="registrar" className="space-y-4">
                                <Alert>
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>
                                    Esta funcionalidade será implementada na próxima versão. 
                                    Por enquanto, os registros podem ser feitos manualmente.
                                  </AlertDescription>
                                </Alert>
                                
                                {/* Formulário de registro será implementado aqui */}
                                <Button disabled className="w-full">
                                  Registrar {evento.tipo === 'vacina' ? 'Aplicação' : 'Pesagem'}
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
        </>
      )}

      {visualizacao === 'dashboard' && estatisticasLote && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cards de estatísticas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticasLote.taxaConclusao}%</div>
              <p className="text-xs text-muted-foreground">
                {estatisticasLote.eventosConcluidos} de {eventos.length} eventos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vacinação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{estatisticasLote.percentualVacinacao}%</div>
              <p className="text-xs text-muted-foreground">
                {estatisticasLote.vacinasPendentes} pendentes, {estatisticasLote.vacinasAtrasadas} atrasadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Eventos Atrasados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{estatisticasLote.eventosAtrasados}</div>
              <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{estatisticasLote.alertasAtivos}</div>
              <p className="text-xs text-muted-foreground">
                {estatisticasLote.alertasCriticos} críticos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer com resumo */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {eventos.filter(e => e.status === 'pendente').length}
              </p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {eventos.filter(e => e.status === 'atrasada').length}
              </p>
              <p className="text-sm text-muted-foreground">Atrasados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {eventos.filter(e => ['aplicada', 'realizada'].includes(e.status || '')).length}
              </p>
              <p className="text-sm text-muted-foreground">Concluídos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {estatisticasLote?.taxaConclusao || 0}%
              </p>
              <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}