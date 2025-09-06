import { Link } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  Settings, 
  BarChart3,
  TrendingUp,
  Egg,
  Users,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import heroImage from '@/assets/hero-farm.jpg';

const quickActions = [
  {
    title: 'Cadastrar Novo Lote',
    description: 'Registre um novo lote de aves no sistema',
    icon: Plus,
    href: '/cadastro-lote',
    color: 'phase-recria',
  },
  {
    title: 'Ver Calendário',
    description: 'Acompanhe o cronograma de produção',
    icon: Calendar,
    href: '/calendario',
    color: 'phase-crescimento',
  },
  {
    title: 'Configurar Parâmetros',
    description: 'Ajuste parâmetros por raça e linhagem',
    icon: Settings,
    href: '/parametros',
    color: 'phase-producao',
  },
  {
    title: 'Visualizar Relatórios',
    description: 'Análises de consumo e produtividade',
    icon: BarChart3,
    href: '/relatorios',
    color: 'accent',
  },
];

const stats = [
  {
    name: 'Lotes Ativos',
    value: '0',
    icon: Users,
    change: '+0%',
    changeType: 'increase',
  },
  {
    name: 'Aves em Produção',
    value: '0',
    icon: Egg,
    change: '+0%',
    changeType: 'increase',
  },
  {
    name: 'Consumo Semanal',
    value: '0 kg',
    icon: TrendingUp,
    change: '+0%',
    changeType: 'increase',
  },
];

export default function Home() {
  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="bg-gradient-hero py-16 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"7\" cy=\"7\" r=\"7\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
        }}></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
              Gerencie sua Produção
              <span className="block text-white">com Inteligência</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/90">
              Sistema completo para acompanhamento e controle da produção avícola. 
              Monitore lotes, calendários de produção e relatórios de desempenho.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl w-full sm:w-auto">
                <Link to="/cadastro-lote">
                  <Plus className="mr-2 h-5 w-5" />
                  + Adicionar lote
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm w-full sm:w-auto"
                asChild
              >
                <Link to="/calendario">
                  Ver Calendário
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Visão Geral do Sistema
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.name} className="hover-glow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <stat.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-muted-foreground truncate">
                          {stat.name}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-foreground">
                            {stat.value}
                          </div>
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'increase' ? 'text-success' : 'text-destructive'
                          }`}>
                            {stat.change}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Card key={action.title} className="hover-glow transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-3">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${action.color}/10 mb-4`}>
                    <action.icon className={`h-6 w-6 text-${action.color}`} />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full" variant="outline">
                    <Link to={action.href}>
                      Acessar
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-16">
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Primeiros Passos</CardTitle>
              <CardDescription className="text-base">
                Configure seu sistema em poucos minutos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <span className="text-lg font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Configurar Parâmetros</h3>
                  <p className="text-sm text-muted-foreground">
                    Defina raças, fases e consumo de ração
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <span className="text-lg font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Cadastrar Lote</h3>
                  <p className="text-sm text-muted-foreground">
                    Registre seu primeiro lote de aves
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <span className="text-lg font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Acompanhar Produção</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitore calendário e relatórios
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}