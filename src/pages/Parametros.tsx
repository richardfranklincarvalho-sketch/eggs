import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Plus, Trash2, Edit2, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import CompanyIdentity from '@/components/CompanyIdentity';

const faseSchema = z.object({
  nome: z.string().min(1, 'Nome da fase é obrigatório'),
  semanas: z.coerce.number().min(1, 'Deve ser maior que 0').max(100, 'Máximo 100 semanas'),
  consumoPorSemana: z.coerce.number().min(0, 'Mínimo 0g').max(500, 'Máximo 500g'),
  cor: z.string().min(7, 'Cor deve ser um código hexadecimal válido').max(7, 'Cor deve ser um código hexadecimal válido'),
});

const parametroSchema = z.object({
  raca: z.string().min(1, 'Nome da raça é obrigatório'),
  fases: z.array(faseSchema).min(1, 'Deve ter pelo menos uma fase'),
});

type ParametroData = z.infer<typeof parametroSchema>;

interface Fase {
  nome: string;
  semanas: number;
  consumoPorSemana: number;
  cor: string;
}

interface ParametroRaca {
  id: string;
  raca: string;
  fases: Fase[];
  criadoEm: Date;
}

const parametrosPadrao: ParametroRaca[] = [
  {
    id: 'novogen-tinted',
    raca: 'NOVOgen Tinted',
    fases: [
      { nome: 'Recria', semanas: 18, consumoPorSemana: 7, cor: '#66B2FF' },
      { nome: 'Crescimento', semanas: 4, consumoPorSemana: 140, cor: '#2ECC71' },
      { nome: 'Produção', semanas: 54, consumoPorSemana: 126, cor: '#FFB86B' },
    ],
    criadoEm: new Date(),
  },
];

export default function Parametros() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [parametros, setParametros] = useState<ParametroRaca[]>([]);
  const [parametroEditando, setParametroEditando] = useState<ParametroRaca | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);

  const defaultFases: Fase[] = [
    { nome: 'Recria', semanas: 18, consumoPorSemana: 7, cor: '#66B2FF' },
    { nome: 'Crescimento', semanas: 4, consumoPorSemana: 140, cor: '#2ECC71' },
    { nome: 'Produção', semanas: 54, consumoPorSemana: 126, cor: '#FFB86B' },
  ];

  const form = useForm<ParametroData>({
    resolver: zodResolver(parametroSchema),
    defaultValues: {
      raca: '',
      fases: defaultFases,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fases"
  });

  useEffect(() => {
    carregarParametros();
  }, []);

  const carregarParametros = () => {
    console.log('Carregando parâmetros do localStorage...');
    const parametrosArmazenados = localStorage.getItem('parametros-racas');
    
    if (parametrosArmazenados) {
      console.log('Dados encontrados no localStorage:', parametrosArmazenados);
      try {
        const parametrosParseados = JSON.parse(parametrosArmazenados).map((p: any) => {
          console.log('Processando parâmetro:', p);
          
          // Migração de dados do formato antigo para o novo
          if (p.semanasRecria !== undefined && !p.fases) {
            console.log('Migrando dados do formato antigo para novo');
            return {
              id: p.id,
              raca: p.raca,
              fases: [
                { 
                  nome: 'Recria', 
                  semanas: p.semanasRecria || 18, 
                  consumoPorSemana: (p.consumoRecria || 126) / (p.semanasRecria || 18), 
                  cor: '#66B2FF' 
                },
                { 
                  nome: 'Crescimento', 
                  semanas: p.semanasCrescimento || 4, 
                  consumoPorSemana: p.consumoCrescimento || 140, 
                  cor: '#2ECC71' 
                },
                { 
                  nome: 'Produção', 
                  semanas: p.semanasProducao || 54, 
                  consumoPorSemana: p.consumoProducao || 126, 
                  cor: '#FFB86B' 
                },
              ],
              criadoEm: new Date(p.criadoEm),
            };
          }
          
          // Se já está no formato novo, apenas converte a data
          return {
            ...p,
            fases: p.fases || [],
            criadoEm: new Date(p.criadoEm),
          };
        });
        
        console.log('Parâmetros processados:', parametrosParseados);
        setParametros(parametrosParseados);
        
        // Salvar dados migrados no formato novo
        localStorage.setItem('parametros-racas', JSON.stringify(parametrosParseados));
      } catch (error) {
        console.error('Erro ao processar parâmetros:', error);
        // Em caso de erro, use os padrões
        setParametros(parametrosPadrao);
        localStorage.setItem('parametros-racas', JSON.stringify(parametrosPadrao));
      }
    } else {
      console.log('Nenhum dado encontrado, usando padrões');
      setParametros(parametrosPadrao);
      localStorage.setItem('parametros-racas', JSON.stringify(parametrosPadrao));
    }
  };

  const salvarParametros = (novosParametros: ParametroRaca[]) => {
    setParametros(novosParametros);
    localStorage.setItem('parametros-racas', JSON.stringify(novosParametros));
  };

  const onSubmit = (data: ParametroData) => {
    const novoParametro: ParametroRaca = {
      id: parametroEditando?.id || Date.now().toString(),
      raca: data.raca,
      fases: data.fases as Fase[],
      criadoEm: parametroEditando?.criadoEm || new Date(),
    };

    let novosParametros;
    if (parametroEditando) {
      novosParametros = parametros.map(p => 
        p.id === parametroEditando.id ? novoParametro : p
      );
      toast({
        title: 'Parâmetros atualizados!',
        description: `Os parâmetros da raça "${data.raca}" foram atualizados.`,
      });
    } else {
      novosParametros = [...parametros, novoParametro];
      toast({
        title: 'Parâmetros adicionados!',
        description: `Os parâmetros da raça "${data.raca}" foram cadastrados.`,
      });
    }

    salvarParametros(novosParametros);
    setDialogAberto(false);
    setParametroEditando(null);
    form.reset();
  };

  const editarParametro = (parametro: ParametroRaca) => {
    setParametroEditando(parametro);
    form.reset({
      raca: parametro.raca,
      fases: parametro.fases,
    });
    setDialogAberto(true);
  };

  const excluirParametro = (id: string) => {
    const parametro = parametros.find(p => p.id === id);
    if (!parametro) return;

    const novosParametros = parametros.filter(p => p.id !== id);
    salvarParametros(novosParametros);
    
    toast({
      title: 'Parâmetros excluídos',
      description: `Os parâmetros da raça "${parametro.raca}" foram removidos.`,
    });
  };

  const novoParametro = () => {
    setParametroEditando(null);
    form.reset();
    setDialogAberto(true);
  };

  return (
    <div className="page-transition">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Configurações do Sistema</h1>
              <p className="text-muted-foreground mt-2">Gerencie parâmetros e identidade da empresa</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Identidade da Empresa
            </TabsTrigger>
            <TabsTrigger value="production" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Parâmetros de Produção
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="mt-6">
            <CompanyIdentity />
          </TabsContent>

          <TabsContent value="production" className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Parâmetros de Produção</h2>
                <p className="text-muted-foreground mt-1">Configure fases personalizadas por raça</p>
              </div>
              <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                <DialogTrigger asChild>
                  <Button onClick={novoParametro}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Raça
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{parametroEditando ? 'Editar Parâmetros' : 'Nova Raça'}</DialogTitle>
                  <DialogDescription>Configure fases e parâmetros da raça</DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="raca"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Raça</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: NOVOgen Brown" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Fases de Produção</h3>
                        <Button type="button" onClick={() => append({ nome: '', semanas: 1, consumoPorSemana: 0, cor: '#66B2FF' } as Fase)} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Fase
                        </Button>
                      </div>

                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-3 p-3 border rounded mb-3">
                          <FormField
                            control={form.control}
                            name={`fases.${index}.nome`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Nome</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Recria" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`fases.${index}.semanas`}
                            render={({ field }) => (
                              <FormItem className="w-24">
                                <FormLabel>Semanas</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`fases.${index}.consumoPorSemana`}
                            render={({ field }) => (
                              <FormItem className="w-32">
                                <FormLabel>Consumo (g)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`fases.${index}.cor`}
                            render={({ field }) => (
                              <FormItem className="w-20">
                                <FormLabel>Cor</FormLabel>
                                <FormControl>
                                  <Input type="color" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button type="button" variant="outline" size="sm" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button type="button" variant="outline" onClick={() => setDialogAberto(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        {parametroEditando ? 'Atualizar' : 'Salvar'}
                      </Button>
                    </div>
                  </form>
                </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {parametros.map((parametro) => (
                <Card key={parametro.id} className="hover-glow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{parametro.raca}</CardTitle>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => editarParametro(parametro)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => excluirParametro(parametro.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {parametro.fases && Array.isArray(parametro.fases) ? (
                        parametro.fases.map((fase, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: fase.cor }}></div>
                              <span className="font-medium">{fase.nome}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {fase.semanas} sem · {fase.consumoPorSemana}g
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground p-2">
                          Configuração de fases não disponível
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}