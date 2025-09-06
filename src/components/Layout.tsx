import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Plus, Calendar, Settings, BarChart3, Menu, X, Egg, Package, Calculator, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { NotificationCenter } from './NotificationCenter';
import { CompanyStorageService } from '@/services/companyStorage';
import { cn } from '@/lib/utils';
const navigationItems = [{
  name: 'Início',
  href: '/',
  icon: Home
}, {
  name: 'Dashboard',
  href: '/dashboard',
  icon: BarChart3
}, {
  name: 'Cadastro de Lote',
  href: '/cadastro-lote',
  icon: Plus
}, {
  name: 'Calendário',
  href: '/calendario',
  icon: Calendar
}, {
  name: 'Produção de Ovos',
  href: '/producao-ovos',
  icon: Egg
}, {
  name: 'Gerenciamento',
  href: '/gerenciamento',
  icon: Package
}, {
  name: 'Fornecedores',
  href: '/fornecedores',
  icon: FileText
}, {
  name: 'Parâmetros',
  href: '/parametros',
  icon: Settings
}, {
  name: 'Relatórios',
  href: '/relatorios',
  icon: BarChart3
}];
export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string>('Controle de Produção de Ovos');

  useEffect(() => {
    // Carregar nome da empresa ao montar o componente
    const loadCompanyName = () => {
      const companyInfo = CompanyStorageService.getCompanyInfo();
      if (companyInfo?.name) {
        setCompanyName(companyInfo.name);
      }
    };

    loadCompanyName();

    // Escutar mudanças no localStorage para atualizar em tempo real
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'company-info') {
        loadCompanyName();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Listener customizado para mudanças no mesmo tab
    const handleLocalUpdate = () => loadCompanyName();
    window.addEventListener('companyInfoUpdated', handleLocalUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('companyInfoUpdated', handleLocalUpdate);
    };
  }, []);
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero border-b border-border/10 shadow-elegant">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl glass-effect">
                <Egg className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {companyName}
                </h1>
                
              </div>
            </div>

            {/* Desktop Navigation + Theme Toggle - Hidden on tablet */}
            <div className="hidden lg:flex items-center space-x-1">
              <nav className="flex space-x-1">
                {navigationItems.map(item => <NavLink key={item.name} to={item.href} className={({
                isActive
              }) => cn('flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200', 'text-white/80 hover:text-white hover:bg-white/10', isActive && 'bg-white/20 text-white shadow-lg')}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </NavLink>)}
              </nav>
              <div className="ml-4 pl-4 border-l border-white/20 flex items-center space-x-2">
                <NotificationCenter />
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile/Tablet menu button and theme toggle */}
            <div className="lg:hidden flex items-center space-x-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Navigation */}
        {mobileMenuOpen && <div className="lg:hidden border-t border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="px-4 py-2 space-y-1">
              {navigationItems.map(item => <NavLink key={item.name} to={item.href} className={({
            isActive
          }) => cn('flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200', 'text-white/80 hover:text-white hover:bg-white/10', isActive && 'bg-white/20 text-white')} onClick={() => setMobileMenuOpen(false)}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </NavLink>)}
            </div>
          </div>}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>;
}