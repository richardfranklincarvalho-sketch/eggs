import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Edit2, Trash2, Package, Truck, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const insumoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.enum(['racao', 'medicamento', 'suplemento', 'material', 'outro']),
  fornecedor: z.string().min(1, 'Fornecedor é obrigatório'),
  precoPorKg: z.coerce.number().min(0, 'Preço deve ser maior que 0'),
  estoqueAtual: z.coerce.number().min(0, 'Estoque deve ser maior ou igual a 0'),
  estoqueMinimo: z.coerce.number().min(0, 'Estoque mínimo deve ser maior ou igual a 0'),
  unidade: z.enum(['kg', 'g', 'l', 'ml', 'unidade']),
  descricao: z.string().optional(),
});

type InsumoData = z.infer<typeof insumoSchema>;

interface Insumo {
  id: string;
  nome: string;
  categoria: 'racao' | 'medicamento' | 'suplemento' | 'material' | 'outro';
  fornecedor: string;
  precoPorKg: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  unidade: 'kg' | 'g' | 'l' | 'ml' | 'unidade';
  descricao?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

const categorias = {
  racao: { nome: 'Ração', cor: 'bg-amber-100 text-amber-800' },
  medicamento: { nome: 'Medicamento', cor: 'bg-red-100 text-red-800' },
  suplemento: { nome: 'Suplemento', cor: 'bg-green-100 text-green-800' },
  material: { nome: 'Material', cor: 'bg-blue-100 text-blue-800' },
  outro: { nome: 'Outro', cor: 'bg-gray-100 text-gray-800' },
};

export default function ControleInsumos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [busca, setBusca] = useState('');

  const form = useForm<InsumoData>({
    resolver: zodResolver(insumoSchema),
    defaultValues: {
      nome: '',
      categoria: 'racao',
      fornecedor: '',
      precoPorKg: 0,
      estoqueAtual: 0,
      estoqueMinimo: 0,
      unidade: 'kg',
      descricao: '',
    },
  });

  useEffect(() => {
    carregarInsumos();
  }, []);

  const carregarInsumos = () => {
    const insumosArmazenados = localStorage.getItem('insumos');
    if (insumosArmazenados) {
      const insumosParseados = JSON.parse(insumosArmazenados).map((i: any) => ({
        ...i,
        criadoEm: new Date(i.criadoEm),
        atualizadoEm: new Date(i.atualizadoEm),
      }));
      setInsumos(insumosParseados);
    }
  };

  const salvarInsumos = (novosInsumos: Insumo[]) => {
    setInsumos(novosInsumos);
    localStorage.setItem('insumos', JSON.stringify(novosInsumos));
  };

  const onSubmit = (data: InsumoData) => {
    const novoInsumo: Insumo = {
      id: insumoEditando?.id || Date.now().toString(),
      nome: data.nome,
      categoria: data.categoria,
      fornecedor: data.fornecedor,
      precoPorKg: data.precoPorKg,
      estoqueAtual: data.estoqueAtual,
      estoqueMinimo: data.estoqueMinimo,
      unidade: data.unidade,
      descricao: data.descricao,
      criadoEm: insumoEditando?.criadoEm || new Date(),
      atualizadoEm: new Date(),
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

    salvarInsumos(novosInsumos);
    setDialogAberto(false);
    setInsumoEditando(null);
    form.reset();
  };

  const editarInsumo = (insumo: Insumo) => {
    setInsumoEditando(insumo);
    form.reset({
      nome: insumo.nome,
      categoria: insumo.categoria,
      fornecedor: insumo.fornecedor,
      precoPorKg: insumo.precoPorKg,
      estoqueAtual: insumo.estoqueAtual,
      estoqueMinimo: insumo.estoqueMinimo,
      unidade: insumo.unidade,
      descricao: insumo.descricao || '',
    });
    setDialogAberto(true);
  };

  const excluirInsumo = (id: string) => {
    const insumo = insumos.find(i => i.id === id);
    if (!insumo) return;

    const novosInsumos = insumos.filter(i => i.id !== id);
    salvarInsumos(novosInsumos);
    
    toast({
      title: 'Insumo excluído',
      description: `"${insumo.nome}" foi removido do estoque.`,
    });
  };

  const novoInsumo = () => {
    setInsumoEditando(null);
    form.reset();
    setDialogAberto(true);
  };

  const insumosFiltrados = insumos.filter(insumo => {
    const matchCategoria = filtroCategoria === 'todas' || insumo.categoria === filtroCategoria;
    const matchBusca = !busca || 
      insumo.nome.toLowerCase().includes(busca.toLowerCase()) ||
      insumo.fornecedor.toLowerCase().includes(busca.toLowerCase());
    return matchCategoria && matchBusca;
  });

  const insumosComEstoqueBaixo = insumos.filter(i => i.estoqueAtual <= i.estoqueMinimo);

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
                Controle de Insumos
              </h1>
              <p className="text-muted-foreground mt-2">
                Gerencie ração, medicamentos e materiais do aviário
              </p>
            </div>
            
            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger asChild>
                <Button onClick={novoInsumo}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Insumo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {insumoEditando ? 'Editar Insumo' : 'Novo Insumo'}
                  </DialogTitle>
                  <DialogDescription>
                    Cadastre ou edite informações do insumo
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
                            <FormLabel>Nome do Insumo</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Ração Inicial" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="categoria"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar categoria" />
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
                        control={form.control}
                        name="fornecedor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fornecedor</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do fornecedor" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="unidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidade</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="kg">Quilograma (kg)</SelectItem>
                                <SelectItem value="g">Grama (g)</SelectItem>
                                <SelectItem value="l">Litro (l)</SelectItem>
                                <SelectItem value="ml">Mililitro (ml)</SelectItem>
                                <SelectItem value="unidade">Unidade</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
                        name="estoqueAtual"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estoque Atual</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="estoqueMinimo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estoque Mínimo</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Observações sobre o insumo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setDialogAberto(false);
                          setInsumoEditando(null);
                          form.reset();
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {insumoEditando ? 'Atualizar' : 'Cadastrar'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Alertas de Estoque Baixo */}
        {insumosComEstoqueBaixo.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-800 dark:text-red-400 flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Alertas de Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {insumosComEstoqueBaixo.map(insumo => (
                  <div key={insumo.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded border">
                    <div>
                      <p className="font-medium">{insumo.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {insumo.estoqueAtual} {insumo.unidade} (mín: {insumo.estoqueMinimo})
                      </p>
                    </div>
                    <Badge variant="destructive">Baixo</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou fornecedor..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Todas as categorias" />
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
          </CardContent>
        </Card>

        {/* Tabela de Insumos */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Insumos</CardTitle>
            <CardDescription>
              {insumosFiltrados.length} insumo(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Preço/kg</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell>{insumo.fornecedor}</TableCell>
                    <TableCell>R$ {insumo.precoPorKg.toFixed(2)}</TableCell>
                    <TableCell>
                      {insumo.estoqueAtual} {insumo.unidade}
                    </TableCell>
                    <TableCell>
                      {insumo.estoqueAtual <= insumo.estoqueMinimo ? (
                        <Badge variant="destructive">Baixo</Badge>
                      ) : (
                        <Badge variant="default">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editarInsumo(insumo)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => excluirInsumo(insumo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}