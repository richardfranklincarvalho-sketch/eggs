/**
 * Calendário de Vacinação por Lote
 * Gerencia cronograma de vacinas com alertas e controle de aplicação
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  Plus,
  Check,
  AlertTriangle,
  FileDown,
  Syringe,
  Clock,
  User,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useLoopProtection } from '@/utils/loopProtection';
import { cn } from '@/lib/utils';
import type { 
  Lote, 
  Vacina, 
  VacinaAplicada, 
  CronogramaVacinacao 
} from '@/types';
import { 
  VACINAS_PRESETS, 
  gerarCronogramaVacinacao, 
  getVacinaById 
} from '@/data/vacinasPresets';

interface VacinaAgendada {
  id: string;
  vacina: Vacina;
  dataPrevista: Date;
  idadeAves: number;
  status: 'pendente' | 'aplicada' | 'atrasada';
  dataAplicacao?: Date;
  responsavel?: string;
  observacoes?: string;
}

export default function CalendarioVacinacao() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { executeWithProtection } = useLoopProtection();

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [lotesSelecionado, setLoteSelecionado] = useState<string>('');
  const [vacinasAgendadas, setVacinasAgendadas] = useState<VacinaAgendada[]>([]);
  const [vacinasAplicadas, setVacinasAplicadas] = useState<VacinaAplicada[]>([]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [vacinaSelecionada, setVacinaSelecionada] = useState<VacinaAgendada | null>(null);
  const [dataAplicacao, setDataAplicacao] = useState<Date | undefined>(new Date());
  const [responsavel, setResponsavel] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (lotesSelecionado) {
      gerarCronograma();
    }
  }, [lotesSelecionado]);

  const carregarDados = async () => {
    try {
      const lotesData = localStorage.getItem('lotes');
      if (lotesData) {
        const lotesArray = JSON.parse(lotesData).map((lote: any) => ({
          ...lote,
          dataNascimento: new Date(lote.dataNascimento),
          dataEntrada: new Date(lote.dataEntrada),
          criadoEm: new Date(lote.criadoEm),
          atualizadoEm: lote.atualizadoEm ? new Date(lote.atualizadoEm) : new Date()
        }));
        setLotes(lotesArray);
      }

      const vacinasData = localStorage.getItem('vacinas-aplicadas');
      if (vacinasData) {
        const vacinasArray = JSON.parse(vacinasData).map((vacina: any) => ({
          ...vacina,
          dataAplicacao: new Date(vacina.dataAplicacao),
          proximaAplicacao: vacina.proximaAplicacao ? new Date(vacina.proximaAplicacao) : undefined,
          criadoEm: new Date(vacina.criadoEm)
        }));
        setVacinasAplicadas(vacinasArray);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao Carregar",
        description: "Não foi possível carregar os dados das vacinações.",
        variant: "destructive",
      });
    }
  };

  const gerarCronograma = async () => {
    const lote = lotes.find(l => l.id === lotesSelecionado);
    if (!lote) return;

    const result = await executeWithProtection(
      'VACCINATION_SCHEDULE',
      async () => {
        const cronograma = gerarCronogramaVacinacao(lote.dataEntrada);
        
        const agendadas: VacinaAgendada[] = cronograma.map(item => {
          const hoje = new Date();
          const status = item.dataPrevista < hoje ? 'atrasada' : 'pendente';
          
          // Verificar se já foi aplicada
          const jaAplicada = vacinasAplicadas.some(va => 
            va.loteId === lote.id && 
            va.vacinaId === item.vacina.id &&
            Math.abs(va.idadeAves - item.idadeAves) <= 3 // tolerância de 3 dias
          );

          return {
            id: `${lote.id}-${item.vacina.id}-${item.idadeAves}`,
            vacina: item.vacina,
            dataPrevista: item.dataPrevista,
            idadeAves: item.idadeAves,
            status: jaAplicada ? 'aplicada' : status
          };
        });

        return agendadas;
      }
    );

    if (result.success && result.data) {
      setVacinasAgendadas(result.data);
    } else {
      toast({
        title: "Erro ao Gerar Cronograma",
        description: result.error || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const aplicarVacina = async () => {
    if (!vacinaSelecionada || !dataAplicacao || !responsavel) {
      toast({
        title: "Dados Incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const lote = lotes.find(l => l.id === lotesSelecionado);
    if (!lote) return;

    const vacinaAplicada: VacinaAplicada = {
      id: `va-${Date.now()}`,
      loteId: lote.id,
      vacinaId: vacinaSelecionada.vacina.id,
      dataAplicacao: dataAplicacao,
      idadeAves: vacinaSelecionada.idadeAves,
      numeroAvesVacinadas: lote.numeroAves,
      loteVacina: `LV-${Date.now()}`,
      responsavel: responsavel,
      observacoes: observacoes,
      criadoEm: new Date()
    };

    const novasVacinas = [...vacinasAplicadas, vacinaAplicada];
    setVacinasAplicadas(novasVacinas);
    localStorage.setItem('vacinas-aplicadas', JSON.stringify(novasVacinas));

    // Atualizar status da vacina agendada
    const novasAgendadas = vacinasAgendadas.map(va => 
      va.id === vacinaSelecionada.id 
        ? { ...va, status: 'aplicada' as const, dataAplicacao: dataAplicacao, responsavel, observacoes }
        : va
    );
    setVacinasAgendadas(novasAgendadas);

    toast({
      title: "Vacina Aplicada",
      description: `${vacinaSelecionada.vacina.nome} registrada com sucesso.`,
    });

    setDialogAberto(false);
    setVacinaSelecionada(null);
    setDataAplicacao(new Date());
    setResponsavel('');
    setObservacoes('');
  };

  const exportarCalendario = async () => {
    if (!lotesSelecionado) return;

    const lote = lotes.find(l => l.id === lotesSelecionado);
    if (!lote) return;

    const result = await executeWithProtection(
      'CSV_EXPORT',
      async () => {
        const csvContent = [
          'Lote,Vacina,Fabricante,Idade (dias),Data Prevista,Status,Via de Aplicação,Dose (mL),Observações',
          ...vacinasAgendadas.map(va => [
            lote.nomeLote,
            va.vacina.nome,
            va.vacina.fabricante,
            va.idadeAves,
            format(va.dataPrevista, 'dd/MM/yyyy'),
            va.status === 'aplicada' ? 'Aplicada' : 
            va.status === 'atrasada' ? 'Atrasada' : 'Pendente',
            va.vacina.viaAplicacao,
            va.vacina.doseML,
            va.observacoes || va.vacina.observacoes || ''
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `calendario-vacinacao-${lote.nomeLote}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();

        return 'success';
      }
    );

    if (result.success) {
      toast({
        title: "Calendário Exportado",
        description: "O arquivo CSV foi baixado com sucesso.",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aplicada': return 'bg-success text-success-foreground';
      case 'atrasada': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-warning text-warning-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aplicada': return Check;
      case 'atrasada': return AlertTriangle;
      default: return Clock;
    }
  };

  const loteAtivo = lotes.find(l => l.id === lotesSelecionado);
  const vacinasPendentes = vacinasAgendadas.filter(va => va.status !== 'aplicada').length;
  const vacinasAtrasadas = vacinasAgendadas.filter(va => va.status === 'atrasada').length;

  return (
    <div className="page-transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/calendario')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendário de Vacinação</h1>
            <p className="text-muted-foreground">
              Cronograma e controle de vacinas por lote
            </p>
          </div>
        </div>
        
        {lotesSelecionado && (
          <Button onClick={exportarCalendario} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        )}
      </div>

      {/* Seleção de Lote */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Selecionar Lote</CardTitle>
          <CardDescription>
            Escolha o lote para visualizar o cronograma de vacinação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={lotesSelecionado} onValueChange={setLoteSelecionado}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um lote" />
            </SelectTrigger>
            <SelectContent>
              {lotes.map((lote) => (
                <SelectItem key={lote.id} value={lote.id}>
                  {lote.nomeLote} - {lote.numeroAves} aves ({lote.raca})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {loteAtivo && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Syringe className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Total de Vacinas</p>
                      <p className="text-2xl font-bold">{vacinasAgendadas.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-warning" />
                    <div>
                      <p className="text-sm font-medium">Pendentes</p>
                      <p className="text-2xl font-bold">{vacinasPendentes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-sm font-medium">Atrasadas</p>
                      <p className="text-2xl font-bold">{vacinasAtrasadas}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-sm font-medium">Aplicadas</p>
                      <p className="text-2xl font-bold">{vacinasAgendadas.length - vacinasPendentes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cronograma de Vacinas */}
      {vacinasAgendadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cronograma de Vacinação - {loteAtivo?.nomeLote}</CardTitle>
            <CardDescription>
              Vacinas programadas e aplicadas para o lote selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {vacinasAgendadas
                .sort((a, b) => a.dataPrevista.getTime() - b.dataPrevista.getTime())
                .map((vacinaAgendada) => {
                  const StatusIcon = getStatusIcon(vacinaAgendada.status);
                  
                  return (
                    <Card key={vacinaAgendada.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <StatusIcon className="h-5 w-5" />
                              <h3 className="font-semibold text-lg">
                                {vacinaAgendada.vacina.nome}
                              </h3>
                              <Badge className={cn("text-xs", getStatusColor(vacinaAgendada.status))}>
                                {vacinaAgendada.status === 'aplicada' ? 'Aplicada' : 
                                 vacinaAgendada.status === 'atrasada' ? 'Atrasada' : 'Pendente'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Data Prevista</p>
                                <p className="font-medium">
                                  {format(vacinaAgendada.dataPrevista, 'dd/MM/yyyy', { locale: ptBR })}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Idade das Aves</p>
                                <p className="font-medium">{vacinaAgendada.idadeAves} dias</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Via de Aplicação</p>
                                <p className="font-medium">{vacinaAgendada.vacina.viaAplicacao}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Dose</p>
                                <p className="font-medium">{vacinaAgendada.vacina.doseML} mL</p>
                              </div>
                            </div>

                            <div className="mt-2 text-sm">
                              <p className="text-muted-foreground">Fabricante: {vacinaAgendada.vacina.fabricante}</p>
                              {vacinaAgendada.vacina.observacoes && (
                                <p className="text-muted-foreground mt-1">{vacinaAgendada.vacina.observacoes}</p>
                              )}
                              {vacinaAgendada.responsavel && (
                                <p className="text-muted-foreground mt-1">
                                  Aplicada por: {vacinaAgendada.responsavel}
                                  {vacinaAgendada.dataAplicacao && 
                                    ` em ${format(vacinaAgendada.dataAplicacao, 'dd/MM/yyyy')}`
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            {vacinaAgendada.status !== 'aplicada' && (
                              <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    onClick={() => setVacinaSelecionada(vacinaAgendada)}
                                  >
                                    <Syringe className="h-4 w-4 mr-2" />
                                    Aplicar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Registrar Aplicação de Vacina</DialogTitle>
                                    <DialogDescription>
                                      {vacinaSelecionada?.vacina.nome} - {loteAtivo?.nomeLote}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="grid gap-4">
                                    <div>
                                      <Label htmlFor="data-aplicacao">Data da Aplicação *</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className={cn(
                                              "w-full justify-start text-left font-normal",
                                              !dataAplicacao && "text-muted-foreground"
                                            )}
                                          >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dataAplicacao ? (
                                              format(dataAplicacao, "dd/MM/yyyy", { locale: ptBR })
                                            ) : (
                                              <span>Selecione uma data</span>
                                            )}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                            mode="single"
                                            selected={dataAplicacao}
                                            onSelect={setDataAplicacao}
                                            initialFocus
                                            className="pointer-events-auto"
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>

                                    <div>
                                      <Label htmlFor="responsavel">Responsável pela Aplicação *</Label>
                                      <Input
                                        id="responsavel"
                                        value={responsavel}
                                        onChange={(e) => setResponsavel(e.target.value)}
                                        placeholder="Nome do responsável"
                                      />
                                    </div>

                                    <div>
                                      <Label htmlFor="observacoes">Observações</Label>
                                      <Textarea
                                        id="observacoes"
                                        value={observacoes}
                                        onChange={(e) => setObservacoes(e.target.value)}
                                        placeholder="Observações sobre a aplicação..."
                                        rows={3}
                                      />
                                    </div>

                                    <div className="flex justify-end space-x-2">
                                      <Button variant="outline" onClick={() => setDialogAberto(false)}>
                                        Cancelar
                                      </Button>
                                      <Button onClick={aplicarVacina}>
                                        Confirmar Aplicação
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {lotes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Syringe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum Lote Encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Cadastre um lote para começar a usar o calendário de vacinação.
            </p>
            <Button onClick={() => navigate('/cadastro-lote')}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Lote
            </Button>
          </CardContent>
        </Card>
      )}

      {lotesSelecionado && vacinasAgendadas.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cronograma não Disponível</h3>
            <p className="text-muted-foreground">
              Não foi possível gerar o cronograma de vacinação para este lote.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}