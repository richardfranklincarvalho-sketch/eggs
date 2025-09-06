import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Building, Camera, X, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

import { MeasurementGuide } from '@/components/MeasurementGuide';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { GalpaoService, type GalpaoData } from '@/services/galpaoService';
import { ImageService, type ProcessedImage } from '@/services/imageService';

const galpaoSchema = z.object({
  nome: z.string().min(1, 'Nome do galpão é obrigatório'),
  largura: z.coerce.number().min(0.1, 'Largura deve ser maior que 0,1m').max(500, 'Largura máxima: 500m'),
  comprimento: z.coerce.number().min(0.1, 'Comprimento deve ser maior que 0,1m').max(500, 'Comprimento máximo: 500m'),
  altura: z.coerce.number().min(0.1, 'Altura deve ser maior que 0,1m').max(500, 'Altura máxima: 500m'),
  densidade: z.coerce.number().min(5, 'Mínimo 5 aves/m²').max(7, 'Máximo 7 aves/m²'),
  lotacaoManual: z.coerce.number().optional(),
  observacoes: z.string().optional(),
  responsaveis: z.array(z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    funcao: z.string().min(1, 'Função é obrigatória'),
  })).min(1, 'Adicione pelo menos um responsável'),
});

type GalpaoFormData = z.infer<typeof galpaoSchema>;

export function GalpaoManagement() {
  const { toast } = useToast();
  
  // Estados principais
  const [galpoes, setGalpoes] = useState<GalpaoData[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGalpao, setEditingGalpao] = useState<GalpaoData | null>(null);
  
  // Estados do formulário
  const [responsaveis, setResponsaveis] = useState<Array<{nome: string, funcao: string}>>([{nome: '', funcao: ''}]);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [fotoProcessing, setFotoProcessing] = useState(false);
  
  // Estados para cálculos
  const [larguraInput, setLarguraInput] = useState(0);
  const [comprimentoInput, setComprimentoInput] = useState(0);
  const [areaCalculada, setAreaCalculada] = useState(0);
  const [densidadeInput, setDensidadeInput] = useState([6]);
  const [lotacaoCalculada, setLotacaoCalculada] = useState(0);
  const [lotacaoOverride, setLotacaoOverride] = useState(false);
  
  // Estados para lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  
  const form = useForm<GalpaoFormData>({
    resolver: zodResolver(galpaoSchema),
    defaultValues: {
      nome: '',
      largura: 0,
      comprimento: 0,
      altura: 0,
      densidade: 6,
      observacoes: '',
      responsaveis: [{nome: '', funcao: ''}]
    }
  });

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadGalpoes();
  }, []);

  // Debounce para cálculos automáticos
  useEffect(() => {
    const timer = setTimeout(() => {
      const area = GalpaoService.computeArea(larguraInput, comprimentoInput);
      setAreaCalculada(area);
      
      const capacity = GalpaoService.computeCapacity(area, densidadeInput[0]);
      setLotacaoCalculada(capacity);
    }, 250);

    return () => clearTimeout(timer);
  }, [larguraInput, comprimentoInput, densidadeInput]);

  const loadGalpoes = useCallback(() => {
    try {
      const data = GalpaoService.loadGalpoes();
      setGalpoes(data);
    } catch (error) {
      console.error('Erro ao carregar galpões:', error);
      toast({
        title: '❌ Erro ao carregar',
        description: 'Não foi possível carregar os galpões.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const resetForm = () => {
    setEditingGalpao(null);
    setResponsaveis([{nome: '', funcao: ''}]);
    setProcessedImage(null);
    setLarguraInput(0);
    setComprimentoInput(0);
    setAreaCalculada(0);
    setDensidadeInput([6]);
    setLotacaoCalculada(0);
    setLotacaoOverride(false);
    form.reset();
  };

  const openDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const editGalpao = (galpao: GalpaoData) => {
    setEditingGalpao(galpao);
    setResponsaveis(galpao.responsaveis);
    setLarguraInput(galpao.largura);
    setComprimentoInput(galpao.comprimento);
    setAreaCalculada(galpao.area);
    setDensidadeInput([galpao.densidade]);
    setLotacaoCalculada(galpao.lotacaoMaxima);
    setLotacaoOverride(galpao.lotacaoOverride);
    
    if (galpao.fotoFull && galpao.fotoThumb) {
      setProcessedImage({
        fullUrl: galpao.fotoFull,
        thumbUrl: galpao.fotoThumb,
        originalSize: 0,
        fullSize: 0,
        thumbSize: 0
      });
    }
    
    form.reset({
      nome: galpao.nome,
      largura: galpao.largura,
      comprimento: galpao.comprimento,
      altura: galpao.altura,
      densidade: galpao.densidade,
      lotacaoManual: galpao.lotacaoManual,
      observacoes: galpao.observacoes || '',
      responsaveis: galpao.responsaveis
    });
    
    setDialogOpen(true);
  };

  const deleteGalpao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este galpão?')) return;
    
    try {
      GalpaoService.deleteGalpao(id);
      loadGalpoes();
      toast({
        title: '✅ Galpão removido',
        description: 'Galpão excluído com sucesso.'
      });
    } catch (error) {
      toast({
        title: '❌ Erro ao excluir',
        description: 'Não foi possível excluir o galpão.',
        variant: 'destructive'
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = ImageService.validateFile(file);
    if (!validation.valid) {
      toast({
        title: '❌ Arquivo inválido',
        description: validation.error,
        variant: 'destructive'
      });
      return;
    }

    setFotoProcessing(true);
    try {
      const processed = await ImageService.processImage(file);
      setProcessedImage(processed);
      toast({
        title: '✅ Foto processada',
        description: 'Foto carregada e otimizada com sucesso.'
      });
    } catch (error) {
      toast({
        title: '❌ Erro no upload',
        description: error instanceof Error ? error.message : 'Erro ao processar imagem.',
        variant: 'destructive'
      });
    } finally {
      setFotoProcessing(false);
    }
  };

  const removePhoto = () => {
    setProcessedImage(null);
    toast({
      title: '⚠️ Foto removida',
      description: 'A foto foi removida do formulário.'
    });
  };

  const openLightbox = (url: string, title: string) => {
    setLightboxImage({ url, title });
    setLightboxOpen(true);
  };

  const addResponsavel = () => {
    setResponsaveis([...responsaveis, {nome: '', funcao: ''}]);
  };

  const updateResponsavel = (index: number, field: 'nome' | 'funcao', value: string) => {
    const updated = [...responsaveis];
    updated[index][field] = value;
    setResponsaveis(updated);
  };

  const removeResponsavel = (index: number) => {
    if (responsaveis.length > 1) {
      setResponsaveis(responsaveis.filter((_, i) => i !== index));
    }
  };

  const onSubmit = async (data: GalpaoFormData) => {
    try {
      // Validar dados com o serviço
      const validation = GalpaoService.validateGalpao({
        ...data,
        area: areaCalculada,
        lotacaoMaxima: lotacaoOverride ? (data.lotacaoManual || lotacaoCalculada) : lotacaoCalculada,
        responsaveis
      });

      if (!validation.valid) {
        toast({
          title: '❌ Corrija os campos destacados',
          description: validation.errors.join(', '),
          variant: 'destructive'
        });
        return;
      }

      // Criar objeto do galpão
      const galpaoData: GalpaoData = {
        id: editingGalpao?.id || GalpaoService.generateId(),
        nome: GalpaoService.sanitizeText(data.nome),
        largura: data.largura,
        comprimento: data.comprimento,
        altura: data.altura,
        area: areaCalculada,
        densidade: data.densidade,
        lotacaoMaxima: lotacaoOverride ? (data.lotacaoManual || lotacaoCalculada) : lotacaoCalculada,
        lotacaoManual: data.lotacaoManual,
        lotacaoOverride,
        fotoFull: processedImage?.fullUrl,
        fotoThumb: processedImage?.thumbUrl,
        responsaveis: responsaveis.map(r => ({
          nome: GalpaoService.sanitizeText(r.nome),
          funcao: GalpaoService.sanitizeText(r.funcao)
        })),
        observacoes: data.observacoes ? GalpaoService.sanitizeText(data.observacoes) : undefined,
        criadoEm: editingGalpao?.criadoEm || new Date(),
        atualizadoEm: new Date()
      };

      // Salvar
      await GalpaoService.saveGalpao(galpaoData);
      
      // Atualizar lista e fechar dialog
      loadGalpoes();
      setDialogOpen(false);
      resetForm();

      toast({
        title: '✅ Galpão salvo com sucesso',
        description: `${galpaoData.nome} foi ${editingGalpao ? 'atualizado' : 'criado'} com sucesso.`
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: '❌ Não foi possível salvar',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const densityConfig = GalpaoService.getDensityConfig();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Controle de Galpões</h3>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Galpão
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingGalpao ? 'Editar Galpão' : 'Cadastrar Novo Galpão'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Dados Básicos */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Dados Básicos</h4>
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Galpão *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: Galpão A, Aviário 1..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Dimensões */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="largura"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Largura (m) *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  step="0.1"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    setLarguraInput(Number(e.target.value));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="comprimento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Comprimento (m) *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  step="0.1"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    setComprimentoInput(Number(e.target.value));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="altura"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Altura (m) *</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Área calculada */}
                      <div>
                        <FormLabel>Área Total (m²)</FormLabel>
                        <div className="mt-1 p-3 bg-muted rounded-md">
                          <div className="text-lg font-mono text-center">
                            {areaCalculada > 0 ? `${areaCalculada} m²` : '0 m²'}
                          </div>
                          <div className="text-xs text-muted-foreground text-center mt-1">
                            Calculado automaticamente
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guia de Medidas */}
                    <div>
                      <MeasurementGuide 
                        largura={larguraInput} 
                        comprimento={comprimentoInput} 
                        area={areaCalculada} 
                      />
                    </div>

                    {/* Lotação */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Lotação Máxima (Caipira)</h4>
                      
                      <div>
                        <FormLabel className="flex items-center gap-2">
                          Densidade (aves/m²)
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{densityConfig.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <div className="mt-2 space-y-3">
                          <Slider
                            value={densidadeInput}
                            onValueChange={setDensidadeInput}
                            min={densityConfig.min}
                            max={densityConfig.max}
                            step={densityConfig.step}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{densityConfig.min} aves/m²</span>
                            <span className="font-semibold">{densidadeInput[0]} aves/m²</span>
                            <span>{densityConfig.max} aves/m²</span>
                          </div>
                        </div>
                      </div>

                      {/* Lotação calculada */}
                      <div>
                        <FormLabel>Lotação Máxima</FormLabel>
                        <div className="mt-1 p-3 bg-primary/5 border border-primary/20 rounded-md">
                          <div className="text-lg font-mono text-center text-primary">
                            {lotacaoCalculada} aves
                          </div>
                          <div className="text-xs text-muted-foreground text-center mt-1">
                            {areaCalculada} m² × {densidadeInput[0]} aves/m²
                          </div>
                        </div>
                      </div>

                      {/* Override manual */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="lotacao-override" 
                            checked={lotacaoOverride}
                            onCheckedChange={(checked) => setLotacaoOverride(checked === true)}
                          />
                          <label htmlFor="lotacao-override" className="text-sm font-medium">
                            Permitir ajustar manualmente
                          </label>
                        </div>
                        
                        {lotacaoOverride && (
                          <FormField
                            control={form.control}
                            name="lotacaoManual"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Lotação Manual</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    placeholder={`Sugerido: ${lotacaoCalculada} aves`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Foto */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Foto do Galpão</h4>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handlePhotoUpload}
                        disabled={fotoProcessing}
                        className="flex-1"
                      />
                      {processedImage && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={removePhoto}
                          disabled={fotoProcessing}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remover
                        </Button>
                      )}
                    </div>
                    
                    {processedImage && (
                      <div className="flex gap-4 items-start">
                        <div 
                          className="cursor-pointer group"
                          onClick={() => openLightbox(processedImage.fullUrl, form.getValues('nome'))}
                        >
                          <img 
                            src={processedImage.thumbUrl} 
                            alt="Preview" 
                            className="w-32 h-24 object-cover rounded border group-hover:opacity-80 transition-opacity"
                          />
                          <div className="text-xs text-muted-foreground text-center mt-1">
                            Clique para ampliar
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Tamanho original: {Math.round(processedImage.originalSize / 1024)} KB</div>
                          <div>Tamanho otimizado: {Math.round(processedImage.fullSize / 1024)} KB</div>
                          <div>Thumbnail: {Math.round(processedImage.thumbSize / 1024)} KB</div>
                        </div>
                      </div>
                    )}
                    
                    {fotoProcessing && (
                      <div className="text-sm text-muted-foreground">
                        Processando imagem...
                      </div>
                    )}
                  </div>

                  {/* Responsáveis */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Responsáveis</h4>
                      <Button type="button" variant="outline" size="sm" onClick={addResponsavel}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                    {responsaveis.map((responsavel, index) => (
                      <div key={index} className="flex gap-4 items-end">
                        <div className="flex-1">
                          <Input
                            placeholder="Nome do responsável"
                            value={responsavel.nome}
                            onChange={(e) => updateResponsavel(index, 'nome', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="Função"
                            value={responsavel.funcao}
                            onChange={(e) => updateResponsavel(index, 'funcao', e.target.value)}
                          />
                        </div>
                        {responsaveis.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeResponsavel(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Observações */}
                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Observações adicionais..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={fotoProcessing}>
                      {editingGalpao ? 'Atualizar' : 'Salvar'} Galpão
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Galpões */}
        {galpoes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">Nenhum galpão cadastrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece cadastrando seu primeiro galpão.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {galpoes.map((galpao) => (
              <Card key={galpao.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{galpao.nome}</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => editGalpao(galpao)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGalpao(galpao.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  {galpao.fotoThumb && (
                    <div className="w-full h-32 bg-muted rounded overflow-hidden cursor-pointer"
                         onClick={() => galpao.fotoFull && openLightbox(galpao.fotoFull, galpao.nome)}>
                      <img 
                        src={galpao.fotoThumb} 
                        alt={galpao.nome}
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Área:</span>
                      <span>{galpao.area} m²</span>
                      <span className="text-muted-foreground">Dimensões:</span>
                      <span>{galpao.comprimento}×{galpao.largura}×{galpao.altura} m</span>
                      <span className="text-muted-foreground">Densidade:</span>
                      <span>{galpao.densidade} aves/m²</span>
                      <span className="text-muted-foreground">Lotação máx.:</span>
                      <span className="font-semibold text-primary">
                        {galpao.lotacaoMaxima} aves
                        {galpao.lotacaoOverride && (
                          <Badge variant="outline" className="ml-1 text-xs">manual</Badge>
                        )}
                      </span>
                    </div>
                    
                    <div className="border-t pt-2">
                      <p className="text-xs text-muted-foreground mb-1">Responsáveis:</p>
                      <div className="flex flex-wrap gap-1">
                        {galpao.responsaveis.map((resp, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {resp.nome} ({resp.funcao})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {galpao.observacoes && (
                      <div className="border-t pt-2">
                        <p className="text-xs text-muted-foreground">Observações:</p>
                        <p className="text-sm mt-1 text-muted-foreground italic">
                          {galpao.observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightboxImage && (
          <PhotoLightbox
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            imageUrl={lightboxImage.url}
            title={lightboxImage.title}
          />
        )}
      </div>
    </TooltipProvider>
  );
}