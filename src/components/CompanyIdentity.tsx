import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, Edit, Building2, Camera } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CompanyStorageService, CompanyInfo } from '@/services/companyStorage';

const companySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Máximo 100 caracteres'),
  cnpjCpf: z.string().min(1, 'CNPJ/CPF é obrigatório').max(20, 'Máximo 20 caracteres'),
  address: z.string().min(1, 'Endereço é obrigatório').max(200, 'Máximo 200 caracteres'),
  phone: z.string().min(1, 'Telefone é obrigatório').max(20, 'Máximo 20 caracteres'),
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  responsible: z.string().min(1, 'Responsável é obrigatório').max(100, 'Máximo 100 caracteres'),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyIdentityProps {
  onCompanyUpdate?: (company: CompanyInfo) => void;
}

export default function CompanyIdentity({ onCompanyUpdate }: CompanyIdentityProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState<string | null>(CompanyStorageService.getLogo());
  const [uploading, setUploading] = useState(false);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: (() => {
      const companyInfo = CompanyStorageService.getCompanyInfo();
      return {
        name: companyInfo?.name || '',
        cnpjCpf: companyInfo?.cnpjCpf || '',
        address: companyInfo?.address || '',
        phone: companyInfo?.phone || '',
        email: companyInfo?.email || '',
        responsible: companyInfo?.responsible || '',
      };
    })(),
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const logoBase64 = await CompanyStorageService.saveLogo(file);
      setLogo(logoBase64);
      toast({
        title: '✅ Logo atualizada com sucesso!',
        description: 'A logo da empresa foi salva.',
      });
    } catch (error) {
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : '❌ Erro ao processar imagem.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    CompanyStorageService.removeLogo();
    setLogo(null);
    toast({
      title: '✅ Logo removida',
      description: 'A logo da empresa foi removida.',
    });
  };

  const onSubmit = (data: CompanyFormData) => {
    try {
      // Sanitizar dados
      const sanitizedData = {
        name: CompanyStorageService.sanitizeInput(data.name),
        cnpjCpf: CompanyStorageService.sanitizeInput(data.cnpjCpf),
        address: CompanyStorageService.sanitizeInput(data.address),
        phone: CompanyStorageService.sanitizeInput(data.phone),
        email: CompanyStorageService.sanitizeInput(data.email),
        responsible: CompanyStorageService.sanitizeInput(data.responsible),
      };

      // Validar
      const errors = CompanyStorageService.validateCompanyInfo(sanitizedData);
      if (errors.length > 0) {
        toast({
          title: '❌ Preencha todos os campos.',
          description: errors.join(', '),
          variant: 'destructive',
        });
        return;
      }

      // Salvar
      const savedCompany = CompanyStorageService.saveCompanyInfo({
        ...sanitizedData,
        logo,
      });

      toast({
        title: '✅ Atualizado com sucesso.',
        description: 'As informações da empresa foram salvas.',
      });

      // Disparar evento customizado para atualizar o header em tempo real
      window.dispatchEvent(new CustomEvent('companyInfoUpdated'));

      onCompanyUpdate?.(savedCompany);
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: '❌ Erro interno, tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Card do Logo */}
      <Card className="hover-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Logo da Empresa
          </CardTitle>
          <CardDescription>
            Upload de imagem PNG/JPG, máximo 2MB (200x200px recomendado)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            {logo ? (
              <div className="relative">
                <img
                  src={logo}
                  alt="Logo da empresa"
                  className="w-32 h-32 object-contain border-2 border-border rounded-lg bg-background"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50">
                <div className="text-center">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma logo cadastrada</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                {logo ? 'Substituir' : 'Upload'}
              </Button>
              {logo && (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  size="sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleLogoUpload}
              className="hidden"
            />

            {uploading && (
              <p className="text-sm text-muted-foreground">Processando imagem...</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card das Informações */}
      <Card className="hover-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações da Empresa
          </CardTitle>
          <CardDescription>
            Dados utilizados em relatórios e documentos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa/Granja</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cnpjCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ/CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Endereço completo" 
                        className="min-h-[60px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@empresa.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full">
                Salvar Informações
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}