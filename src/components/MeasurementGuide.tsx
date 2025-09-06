import { Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MeasurementGuideProps {
  largura: number;
  comprimento: number;
  area: number;
}

export function MeasurementGuide({ largura, comprimento, area }: MeasurementGuideProps) {
  return (
    <Card className="bg-muted/30 border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="h-4 w-4" />
          Guia de Medidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ilustração */}
        <div className="relative bg-background border rounded-lg p-4 mx-auto max-w-[200px]">
          <svg viewBox="0 0 160 100" className="w-full h-auto">
            {/* Retângulo do galpão */}
            <rect
              x="20"
              y="25"
              width="120"
              height="50"
              fill="hsl(var(--primary))"
              fillOpacity="0.1"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="4,2"
            />
            
            {/* Seta e medida - Largura (horizontal) */}
            <g>
              <line x1="20" y1="15" x2="140" y2="15" stroke="hsl(var(--foreground))" strokeWidth="1" />
              <line x1="20" y1="12" x2="20" y2="18" stroke="hsl(var(--foreground))" strokeWidth="1" />
              <line x1="140" y1="12" x2="140" y2="18" stroke="hsl(var(--foreground))" strokeWidth="1" />
              <text x="80" y="12" textAnchor="middle" className="fill-foreground text-xs">
                Largura
              </text>
            </g>
            
            {/* Seta e medida - Comprimento (vertical) */}
            <g>
              <line x1="10" y1="25" x2="10" y2="75" stroke="hsl(var(--foreground))" strokeWidth="1" />
              <line x1="7" y1="25" x2="13" y2="25" stroke="hsl(var(--foreground))" strokeWidth="1" />
              <line x1="7" y1="75" x2="13" y2="75" stroke="hsl(var(--foreground))" strokeWidth="1" />
              <text x="5" y="52" textAnchor="middle" className="fill-foreground text-xs" 
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                Comprimento
              </text>
            </g>
          </svg>
        </div>

        {/* Valores atuais */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <div className="text-muted-foreground">Largura</div>
            <Badge variant="outline" className="font-mono">
              {largura > 0 ? `${largura} m` : '-- m'}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Comprimento</div>
            <Badge variant="outline" className="font-mono">
              {comprimento > 0 ? `${comprimento} m` : '-- m'}
            </Badge>
          </div>
        </div>

        {/* Área calculada */}
        <div className="text-center pt-2 border-t border-dashed">
          <div className="text-muted-foreground text-xs">Área Total</div>
          <Badge className="bg-primary/10 text-primary border-primary font-mono text-sm">
            {area > 0 ? `${area} m²` : '0 m²'}
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Meça de parede a parede interna
        </div>
      </CardContent>
    </Card>
  );
}