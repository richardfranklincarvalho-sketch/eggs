import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Save, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  nomeLote: z.string().min(1, 'Nome do lote é obrigatório'),
  numeroAves: z.coerce.number().min(1, 'Número de aves deve ser maior que 0'),
  dataNascimento: z.date({
    required_error: 'Data de nascimento é obrigatória',
  }),
  dataEntrada: z.date({
    required_error: 'Data de entrada é obrigatória',
  }),
  raca: z.string().min(1, 'Raça/Linhagem é obrigatória'),
  galpaoId: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const racasDisponiveis = [
  'NOVOgen Tinted',
  'Isa Brown',
  'Lohmann Brown',
  'Hy-Line Brown',
  'Dekalb Brown',
  'Bovans Brown',
];

export default function CadastroLote() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar galpões do localStorage
  const [galpoes, setGalpoes] = useState<Array<{id: string, nome: string}>>([]);

  useState(() => {
    const galpoesStr = localStorage.getItem('galpoes');
    if (galpoesStr) {
      const galpoesParseados = JSON.parse(galpoesStr);
      setGalpoes(galpoesParseados.map((g: any) => ({ id: g.id, nome: g.nome })));
    }
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeLote: '',
      numeroAves: 0,
      observacoes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulação de salvamento
      const loteData = {
        ...data,
        id: Date.now().toString(),
        criadoEm: new Date(),
      };

      // Salvar no localStorage
      const lotesExistentes = JSON.parse(localStorage.getItem('lotes') || '[]');
      lotesExistentes.push(loteData);
      localStorage.setItem('lotes', JSON.stringify(lotesExistentes));

      toast({
        title: 'Lote cadastrado com sucesso!',
        description: `O lote "${data.nomeLote}" foi registrado no sistema.`,
      });

      // Redirecionar para calendário
      setTimeout(() => {
        navigate('/calendario');
      }, 1500);

    } catch (error) {
      toast({
        title: 'Erro ao cadastrar lote',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-transition">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
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
          <h1 className="text-3xl font-bold text-foreground">
            Cadastro de Novo Lote
          </h1>
          <p className="text-muted-foreground mt-2">
            Registre um novo lote de aves no sistema de produção
          </p>
        </div>

        {/* Form */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Informações do Lote</CardTitle>
            <CardDescription>
              Preencha todos os campos obrigatórios para criar um novo lote
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome do Lote */}
                  <FormField
                    control={form.control}
                    name="nomeLote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Lote *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Lote A1 - Janeiro 2024" {...field} />
                        </FormControl>
                        <FormDescription>
                          Identifique o lote com um nome único
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Número de Aves */}
                  <FormField
                    control={form.control}
                    name="numeroAves"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Aves *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1000" {...field} />
                        </FormControl>
                        <FormDescription>
                          Quantidade total de aves no lote
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data de Nascimento */}
                  <FormField
                    control={form.control}
                    name="dataNascimento"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Nascimento *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP', { locale: ptBR })
                                ) : (
                                  <span>Selecionar data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date('1900-01-01')
                              }
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Data de nascimento das aves
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data de Entrada */}
                  <FormField
                    control={form.control}
                    name="dataEntrada"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Entrada no Galpão *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP', { locale: ptBR })
                                ) : (
                                  <span>Selecionar data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date('1900-01-01')
                              }
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Data em que as aves entraram no galpão
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Raça/Linhagem */}
                <FormField
                  control={form.control}
                  name="raca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raça/Linhagem *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar raça/linhagem" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {racasDisponiveis.map((raca) => (
                            <SelectItem key={raca} value={raca}>
                              {raca}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Raça ou linhagem das aves do lote
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Vinculação com Galpão */}
                {galpoes.length > 0 && (
                  <FormField
                    control={form.control}
                    name="galpaoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vincular Galpão</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar galpão (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhum galpão</SelectItem>
                            {galpoes.map((galpao) => (
                              <SelectItem key={galpao.id} value={galpao.id}>
                                {galpao.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Vincule o lote a um galpão específico
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Observações */}
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais sobre o lote..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Informações complementares (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Botões */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Lote
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}