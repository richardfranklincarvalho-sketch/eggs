// Service para gerenciar dados da empresa/granja
// Preparado para migração futura para Supabase

export interface CompanyInfo {
  id?: string;
  name: string;
  cnpjCpf: string;
  address: string;
  phone: string;
  email: string;
  responsible: string;
  logo?: string; // base64 string da imagem
  createdAt?: Date;
  updatedAt?: Date;
}

const COMPANY_STORAGE_KEY = 'company-info';
const COMPANY_LOGO_KEY = 'company-logo';

export class CompanyStorageService {
  // Salvar informações da empresa
  static saveCompanyInfo(info: CompanyInfo): CompanyInfo {
    const companyData: CompanyInfo = {
      ...info,
      id: info.id || Date.now().toString(),
      updatedAt: new Date(),
      createdAt: info.createdAt || new Date(),
    };

    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(companyData));
    return companyData;
  }

  // Carregar informações da empresa
  static getCompanyInfo(): CompanyInfo | null {
    try {
      const stored = localStorage.getItem(COMPANY_STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
        updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
      };
    } catch (error) {
      console.error('Erro ao carregar informações da empresa:', error);
      return null;
    }
  }

  // Salvar logo da empresa
  static saveLogo(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validar arquivo
      if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
        reject(new Error('❌ Arquivo inválido, use PNG/JPG.'));
        return;
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB
        reject(new Error('❌ Arquivo muito grande, máximo 2MB.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const base64 = e.target?.result as string;
          
          // Criar imagem para redimensionar
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('❌ Erro ao processar imagem.'));
              return;
            }

            // Calcular dimensões mantendo proporção (máx 200x200)
            let { width, height } = img;
            const maxSize = 200;

            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const resizedBase64 = canvas.toDataURL('image/png', 0.9);
            localStorage.setItem(COMPANY_LOGO_KEY, resizedBase64);
            
            // Atualizar informações da empresa com logo
            const companyInfo = this.getCompanyInfo();
            if (companyInfo) {
              this.saveCompanyInfo({ ...companyInfo, logo: resizedBase64 });
            }

            resolve(resizedBase64);
          };

          img.onerror = () => reject(new Error('❌ Erro ao carregar imagem.'));
          img.src = base64;
        } catch (error) {
          reject(new Error('❌ Erro ao processar arquivo.'));
        }
      };

      reader.onerror = () => reject(new Error('❌ Erro ao ler arquivo.'));
      reader.readAsDataURL(file);
    });
  }

  // Carregar logo da empresa
  static getLogo(): string | null {
    try {
      return localStorage.getItem(COMPANY_LOGO_KEY);
    } catch (error) {
      console.error('Erro ao carregar logo:', error);
      return null;
    }
  }

  // Remover logo
  static removeLogo(): void {
    localStorage.removeItem(COMPANY_LOGO_KEY);
    
    // Atualizar informações da empresa removendo logo
    const companyInfo = this.getCompanyInfo();
    if (companyInfo) {
      const { logo, ...infoWithoutLogo } = companyInfo;
      this.saveCompanyInfo(infoWithoutLogo);
    }
  }

  // Validar campos obrigatórios
  static validateCompanyInfo(info: Partial<CompanyInfo>): string[] {
    const errors: string[] = [];
    
    if (!info.name?.trim()) errors.push('Nome é obrigatório');
    if (!info.cnpjCpf?.trim()) errors.push('CNPJ/CPF é obrigatório');
    if (!info.address?.trim()) errors.push('Endereço é obrigatório');
    if (!info.phone?.trim()) errors.push('Telefone é obrigatório');
    if (!info.email?.trim()) errors.push('E-mail é obrigatório');
    if (!info.responsible?.trim()) errors.push('Responsável é obrigatório');

    // Validar formato do email
    if (info.email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(info.email)) {
      errors.push('E-mail inválido');
    }

    return errors;
  }

  // Sanitizar dados de entrada
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '');
  }

  // Preparado para migração Supabase
  static async migrateToSupabase(): Promise<void> {
    // TODO: Implementar quando Supabase estiver ativo
    console.log('Migração para Supabase será implementada');
  }
}