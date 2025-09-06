/**
 * Gestão de Fornecedores
 * CRUD completo de fornecedores com histórico de compras
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLoopProtection } from '@/utils/loopProtection';
import type { Fornecedor } from '@/types';

const fornecedorSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cnpj: z.string().optional(),
  contato: z.string().min(2, 'Nome do contato é obrigatório'),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean()
});

type FornecedorData = z.infer<typeof fornecedorSchema>;

export default function Fornecedores() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { executeWithProtection } = useLoopProtection();

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorEditando, setFornecedorEditando] = useState<Fornecedor | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativos' | 'inativos'>('todos');

  const form = useForm<FornecedorData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      contato: '',
      telefone: '',
      email: '',
      endereco: '',
      observacoes: '',
      ativo: true
    }
  });

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const carregarFornecedores = async () => {
    try {
      const data = localStorage.getItem('fornecedores');
      if (data) {
        const fornecedoresArray = JSON.parse(data).map((fornecedor: any) => ({
          ...fornecedor,
          criadoEm: new Date(fornecedor.criadoEm),
          atualizadoEm: new Date(fornecedor.atualizadoEm)
        }));
        setFornecedores(fornecedoresArray);
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast({
        title: "Erro ao Carregar",
        description: "Não foi possível carregar os fornecedores.",
        variant: "destructive",
      });
    }
  };

  const salvarFornecedores = async (novosFornecedores: Fornecedor[]) => {
    const result = await executeWithProtection(
      'BATCH_SAVE',
      async () => {
        localStorage.setItem('fornecedores', JSON.stringify(novosFornecedores));
        return novosFornecedores;
      }
    );

    if (result.success) {
      setFornecedores(novosFornecedores);
    } else {
      throw new Error(result.error || 'Erro ao salvar fornecedores');
    }
  };

  const onSubmit = async (data: FornecedorData) => {
    try {
      let novosFornecedores: Fornecedor[];
      
      if (fornecedorEditando) {
        // Editando fornecedor existente
        const fornecedorAtualizado: Fornecedor = {
          ...fornecedorEditando,
          ...data,
          atualizadoEm: new Date()
        };
        
        novosFornecedores = fornecedores.map(f => 
          f.id === fornecedorEditando.id ? fornecedorAtualizado : f
        );
      } else {
        // Criando novo fornecedor
        const novoFornecedor: Fornecedor = {
          id: `fornecedor-${Date.now()}`,
          nome: data.nome,
          cnpj: data.cnpj,
          contato: data.contato,
          telefone: data.telefone,
          email: data.email,
          endereco: data.endereco,
          observacoes: data.observacoes,
          ativo: data.ativo,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        };
        
        novosFornecedores = [...fornecedores, novoFornecedor];
      }

      await salvarFornecedores(novosFornecedores);

      toast({
        title: fornecedorEditando ? "Fornecedor Atualizado" : "Fornecedor Cadastrado",
        description: `${data.nome} foi ${fornecedorEditando ? 'atualizado' : 'cadastrado'} com sucesso.`,
      });

      setDialogAberto(false);
      setFornecedorEditando(null);
      form.reset();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast({
        title: "Erro ao Salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const editarFornecedor = (fornecedor: Fornecedor) => {
    setFornecedorEditando(fornecedor);
    form.reset({
      nome: fornecedor.nome,
      cnpj: fornecedor.cnpj || '',
      contato: fornecedor.contato,
      telefone: fornecedor.telefone || '',
      email: fornecedor.email || '',
      endereco: fornecedor.endereco || '',
      observacoes: fornecedor.observacoes || '',
      ativo: fornecedor.ativo
    });
    setDialogAberto(true);
  };

  const excluirFornecedor = async (id: string) => {
    try {
      const novosFornecedores = fornecedores.filter(f => f.id !== id);
      await salvarFornecedores(novosFornecedores);
      
      toast({
        title: "Fornecedor Excluído",
        description: "Fornecedor foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir o fornecedor.",
        variant: "destructive",
      });
    }
  };

  const novoFornecedor = () => {
    setFornecedorEditando(null);
    form.reset();
    setDialogAberto(true);
  };

  const formatarCNPJ = (cnpj: string) => {
    if (cnpj.length !== 14) return cnpj;
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const fornecedoresFiltrados = fornecedores.filter(fornecedor => {
    const matchBusca = !busca || 
      fornecedor.nome.toLowerCase().includes(busca.toLowerCase()) ||
      fornecedor.contato.toLowerCase().includes(busca.toLowerCase()) ||
      (fornecedor.cnpj && fornecedor.cnpj.includes(busca));

    const matchFiltro = filtroAtivo === 'todos' || 
      (filtroAtivo === 'ativos' && fornecedor.ativo) ||
      (filtroAtivo === 'inativos' && !fornecedor.ativo);

    return matchBusca && matchFiltro;
  });

  const totalAtivos = fornecedores.filter(f => f.ativo).length;
  const totalInativos = fornecedores.filter(f => !f.ativo).length;

  return (
    <div className="page-transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/controle-insumos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
            <p className="text-muted-foreground">
              Gestão completa de fornecedores e contatos
            </p>
          </div>
        </div>
        
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button onClick={novoFornecedor}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {fornecedorEditando ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
              <DialogDescription>
                {fornecedorEditando 
                  ? 'Atualize as informações do fornecedor' 
                  : 'Cadastre um novo fornecedor no sistema'
                }
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do fornecedor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="00.000.000/0000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contato"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Contato *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da pessoa de contato" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 0000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@fornecedor.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço completo" {...field} />
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
                        <Textarea 
                          placeholder="Observações gerais sobre o fornecedor..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Fornecedor Ativo</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogAberto(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {fornecedorEditando ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Total de Fornecedores</p>
                <p className="text-2xl font-bold">{fornecedores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium">Fornecedores Ativos</p>
                <p className="text-2xl font-bold">{totalAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Fornecedores Inativos</p>
                <p className="text-2xl font-bold">{totalInativos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, contato ou CNPJ..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filtroAtivo === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroAtivo('todos')}
              >
                Todos
              </Button>
              <Button
                variant={filtroAtivo === 'ativos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroAtivo('ativos')}
              >
                Ativos
              </Button>
              <Button
                variant={filtroAtivo === 'inativos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroAtivo('inativos')}
              >
                Inativos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Fornecedores */}
      <div className="grid gap-4">
        {fornecedoresFiltrados.map((fornecedor) => (
          <Card key={fornecedor.id} className="hover-glow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold">{fornecedor.nome}</h3>
                    <Badge variant={fornecedor.ativo ? 'default' : 'secondary'}>
                      {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {fornecedor.cnpj && (
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">CNPJ</p>
                          <p className="font-medium">{formatarCNPJ(fornecedor.cnpj)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Contato</p>
                        <p className="font-medium">{fornecedor.contato}</p>
                      </div>
                    </div>

                    {fornecedor.telefone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Telefone</p>
                          <p className="font-medium">{fornecedor.telefone}</p>
                        </div>
                      </div>
                    )}

                    {fornecedor.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{fornecedor.email}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {fornecedor.endereco && (
                    <div className="flex items-center space-x-2 mt-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-muted-foreground">{fornecedor.endereco}</p>
                    </div>
                  )}

                  {fornecedor.observacoes && (
                    <div className="mt-3 text-sm">
                      <p className="text-muted-foreground">{fornecedor.observacoes}</p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => editarFornecedor(fornecedor)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => excluirFornecedor(fornecedor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado vazio */}
      {fornecedoresFiltrados.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {fornecedores.length === 0 
                ? 'Nenhum Fornecedor Cadastrado'
                : 'Nenhum Fornecedor Encontrado'
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {fornecedores.length === 0 
                ? 'Comece cadastrando seu primeiro fornecedor.'
                : 'Tente ajustar os filtros de busca.'
              }
            </p>
            {fornecedores.length === 0 && (
              <Button onClick={novoFornecedor}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Fornecedor
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}