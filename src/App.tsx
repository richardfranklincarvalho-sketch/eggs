import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CadastroLote from './pages/CadastroLote';
import Calendario from './pages/Calendario';
import Parametros from './pages/Parametros';
import ProducaoOvos from '@/pages/ProducaoOvos';
import Gerenciamento from './pages/Gerenciamento';
import Fornecedores from './pages/Fornecedores';
import Relatorios from './pages/Relatorios';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cadastro-lote" element={<CadastroLote />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="parametros" element={<Parametros />} />
            <Route path="producao-ovos" element={<ProducaoOvos />} />
            <Route path="gerenciamento" element={<Gerenciamento />} />
            <Route path="fornecedores" element={<Fornecedores />} />
            <Route path="relatorios" element={<Relatorios />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;