import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Package, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notificacao {
  id: string;
  tipo: 'estoque-baixo' | 'vacinacao-pendente' | 'producao-baixa' | 'lote-novo';
  titulo: string;
  descricao: string;
  urgencia: 'alta' | 'media' | 'baixa';
  lida: boolean;
  criadaEm: Date;
}

const icones = {
  'estoque-baixo': Package,
  'vacinacao-pendente': Calendar,
  'producao-baixa': AlertTriangle,
  'lote-novo': Bell,
};

const cores = {
  alta: 'bg-red-100 text-red-800 border-red-200',
  media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  baixa: 'bg-blue-100 text-blue-800 border-blue-200',
};

export function NotificationCenter() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  const carregarNotificacoes = () => {
    // Simular notificações baseadas em dados reais
    const insumos = JSON.parse(localStorage.getItem('insumos') || '[]');
    const lotes = JSON.parse(localStorage.getItem('lotes') || '[]');
    
    const notifs: Notificacao[] = [];

    // Verificar estoque baixo
    const insumosComEstoqueBaixo = insumos.filter((i: any) => 
      i.estoqueAtual <= i.estoqueMinimo
    );
    
    insumosComEstoqueBaixo.forEach((insumo: any) => {
      notifs.push({
        id: `estoque-${insumo.id}`,
        tipo: 'estoque-baixo',
        titulo: 'Estoque Baixo',
        descricao: `${insumo.nome} está com estoque baixo (${insumo.estoqueAtual}/${insumo.estoqueMinimo})`,
        urgencia: insumo.estoqueAtual === 0 ? 'alta' : 'media',
        lida: false,
        criadaEm: new Date(),
      });
    });

    // Simular notificação de vacinação pendente
    if (lotes.length > 0) {
      notifs.push({
        id: 'vacinacao-pendente-1',
        tipo: 'vacinacao-pendente',
        titulo: 'Vacinação Pendente',
        descricao: 'Lote A-001 tem vacinação de Newcastle pendente para hoje',
        urgencia: 'alta',
        lida: false,
        criadaEm: new Date(),
      });
    }

    setNotificacoes(notifs);
  };

  const marcarComoLida = (id: string) => {
    setNotificacoes(prev => 
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    );
  };

  const removerNotificacao = (id: string) => {
    setNotificacoes(prev => prev.filter(n => n.id !== id));
  };

  const notificacoes不读 = notificacoes.filter(n => !n.lida);
  
  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {notificacoes不读.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notificacoes不读.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Notificações
              {notificacoes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm" 
                  onClick={() => setNotificacoes([])}
                  className="text-xs"
                >
                  Limpar todas
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          
          <ScrollArea className="h-96">
            <CardContent className="p-0">
              {notificacoes.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notificacoes.map((notificacao) => {
                    const Icon = icones[notificacao.tipo];
                    return (
                      <div
                        key={notificacao.id}
                        className={`p-3 border-l-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                          notificacao.lida ? 'opacity-60' : ''
                        } ${cores[notificacao.urgencia].replace('bg-', 'border-').split(' ')[0]}`}
                        onClick={() => marcarComoLida(notificacao.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {notificacao.titulo}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notificacao.descricao}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {notificacao.criadaEm.toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removerNotificacao(notificacao.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </PopoverContent>
    </Popover>
  );
}