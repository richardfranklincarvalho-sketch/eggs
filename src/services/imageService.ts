// Serviço para manipulação de imagens - resize e geração de thumbnails
export interface ProcessedImage {
  fullUrl: string;
  thumbUrl: string;
  originalSize: number;
  fullSize: number;
  thumbSize: number;
}

export class ImageService {
  private static readonly MAX_FULL_WIDTH = 1920;
  private static readonly MAX_THUMB_WIDTH = 400;
  private static readonly QUALITY = 0.8;
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  static async processImage(file: File): Promise<ProcessedImage> {
    // Validar arquivo
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      throw new Error('Arquivo inválido. Use apenas PNG ou JPG.');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('Arquivo muito grande. Máximo 5MB.');
    }

    // Carregar imagem
    const img = await this.loadImage(file);
    
    // Gerar versões
    const fullImage = await this.resizeImage(img, this.MAX_FULL_WIDTH);
    const thumbImage = await this.resizeImage(img, this.MAX_THUMB_WIDTH);

    return {
      fullUrl: fullImage.dataUrl,
      thumbUrl: thumbImage.dataUrl,
      originalSize: file.size,
      fullSize: fullImage.size,
      thumbSize: thumbImage.size
    };
  }

  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  }

  private static async resizeImage(img: HTMLImageElement, maxWidth: number): Promise<{ dataUrl: string; size: number }> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Erro ao processar imagem');
    }

    // Calcular dimensões mantendo proporção
    let { width, height } = this.calculateDimensions(img.naturalWidth, img.naturalHeight, maxWidth);
    
    canvas.width = width;
    canvas.height = height;

    // Desenhar imagem redimensionada
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Converter para base64
    const dataUrl = canvas.toDataURL('image/jpeg', this.QUALITY);
    const size = Math.round((dataUrl.length * 3) / 4); // Estimar tamanho em bytes

    return { dataUrl, size };
  }

  private static calculateDimensions(originalWidth: number, originalHeight: number, maxWidth: number) {
    if (originalWidth <= maxWidth) {
      return { width: originalWidth, height: originalHeight };
    }

    const ratio = maxWidth / originalWidth;
    return {
      width: maxWidth,
      height: Math.round(originalHeight * ratio)
    };
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      return { valid: false, error: 'Formato inválido. Use PNG ou JPG.' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'Arquivo muito grande. Máximo 5MB.' };
    }

    return { valid: true };
  }
}