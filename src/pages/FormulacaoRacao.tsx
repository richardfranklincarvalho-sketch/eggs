import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Edit2, Trash2, Calculator, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface Insumo {
  id: string;
  nome: string;
  categoria: 'racao' | 'medicamento' | 'suplemento' | 'material' | 'outro';
  precoPorKg: number;
  unidade: string;
}

interface IngredienteFormula {
  insumoId: string;
  nome: string;
  percentual: number;
  precoPorKg: number;
}

const formulaSchema = z.object({
  nome: z.string().min(1, 'Nome da fórmula é obrigatório'),
  tipo: z.enum(['inicial', 'crescimento', 'postura', 'terminacao']),
  ingredientes: z.array(z.object({
    insumoId: z.string(),
    percentual: z.coerce.number().min(0.1, 'Mínimo 0.1%').max(100, 'Máximo 100%'),
  })).min(1, 'Adicione pelo menos um ingrediente'),
});

type FormulaData = z.infer<typeof formulaSchema>;

interface Formula {
  id: string;
  nome: string;
  tipo: 'inicial' | 'crescimento' | 'postura' | 'terminacao';
  ingredientes: IngredienteFormula[];
  custoTotal: number;
  criadoEm: Date;
  atualizadoEm: Date;
}

const tiposFormula = {
  inicial: { nome: 'Inicial', cor: 'bg-blue-100 text-blue-800' },
  crescimento: { nome: 'Crescimento', cor: 'bg-green-100 text-green-800' },
  postura: { nome: 'Postura', cor: 'bg-orange-100 text-orange-800' },
  terminacao: { nome: 'Terminação', cor: 'bg-purple-100 text-purple-800' },
};

export default function FormulacaoRacao() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [formulaEditando, setFormulaEditando] = useState<Formula | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [ingredientesSelecionados, setIngredientesSelecionados] = useState<IngredienteFormula[]>([]);

  const form = useForm<FormulaData>({
    resolver: zodResolver(formulaSchema),
    defaultValues: {
      nome: '',
      tipo: 'inicial',
      ingredientes: [],
    },
  });

  useEffect(() => {
    carregarFormulas();
    carregarInsumos();
  }, []);

  const carregarFormulas = () => {
    const formulasArmazenadas = localStorage.getItem('formulas-racao');
    if (formulasArmazenadas) {
      const formulasParseadas = JSON.parse(formulasArmazenadas).map((f: any) => ({
        ...f,
        criadoEm: new Date(f.criadoEm),
        atualizadoEm: new Date(f.atualizadoEm),
      }));
      setFormulas(formulasParseadas);
    }
  };

  const carregarInsumos = () => {
    const insumosArmazenados = localStorage.getItem('insumos');
    if (insumosArmazenados) {
      const insumosParseados = JSON.parse(insumosArmazenados)
        .filter((i: any) => i.categoria === 'racao')
        .map((i: any) => ({
          id: i.id,
          nome: i.nome,
          categoria: i.categoria,
          precoPorKg: i.precoPorKg,
          unidade: i.unidade,
        }));
      setInsumos(insumosParseados);
    }
  };

  const salvarFormulas = (novasFormulas: Formula[]) => {
    setFormulas(novasFormulas);
    localStorage.setItem('formulas-racao', JSON.stringify(novasFormulas));
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

  const onSubmit = (data: FormulaData) => {
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

    salvarFormulas(novasFormulas);
    setDialogAberto(false);
    setFormulaEditando(null);
    setIngredientesSelecionados([]);
    form.reset();
  };

  const editarFormula = (formula: Formula) => {
    setFormulaEditando(formula);
    setIngredientesSelecionados(formula.ingredientes);
    form.reset({
      nome: formula.nome,
      tipo: formula.tipo,
      ingredientes: formula.ingredientes.map(i => ({
        insumoId: i.insumoId,
        percentual: i.percentual,
      })),
    });
    setDialogAberto(true);
  };

  const excluirFormula = (id: string) => {
    const formula = formulas.find(f => f.id === id);
    if (!formula) return;

    const novasFormulas = formulas.filter(f => f.id !== id);
    salvarFormulas(novasFormulas);
    
    toast({
      title: 'Fórmula excluída',
      description: `"${formula.nome}" foi removida.`,
    });
  };

  const novaFormula = () => {
    setFormulaEditando(null);
    setIngredientesSelecionados([]);
    form.reset();
    setDialogAberto(true);
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
                Formulação de Ração
              </h1>
              <p className="text-muted-foreground mt-2">
                Crie e gerencie fórmulas de ração com cálculo automático de custos
              </p>
            </div>
            
            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger asChild>
                <Button onClick={novaFormula}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Fórmula
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {formulaEditando ? 'Editar Fórmula' : 'Nova Fórmula'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure os ingredientes e percentuais da fórmula
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Fórmula</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Ração Inicial Premium" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tipo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar tipo" />
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
                                  {insumos.map((insumo) => (
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
                          setDialogAberto(false);
                          setFormulaEditando(null);
                          setIngredientesSelecionados([]);
                          form.reset();
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        {formulaEditando ? 'Atualizar' : 'Salvar'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Lista de Fórmulas */}
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
                        <span className="font-medium">{ingrediente.percentual}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {formulas.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Calculator className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma fórmula criada</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando sua primeira fórmula de ração
              </p>
              <Button onClick={novaFormula}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Fórmula
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}