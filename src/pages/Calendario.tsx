import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CalendarioInterativo from '@/components/CalendarioInterativo';
import { Lote } from '@/types';


export default function Calendario() {
  const navigate = useNavigate();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteSelecionado, setLoteSelecionado] = useState<string>('');

  useEffect(() => {
    // Carregar lotes do localStorage
    const lotesArmazenados = localStorage.getItem('lotes');
    if (lotesArmazenados) {
      const lotesParseados = JSON.parse(lotesArmazenados).map((lote: any) => ({
        ...lote,
        dataNascimento: new Date(lote.dataNascimento),
        dataEntrada: new Date(lote.dataEntrada),
        criadoEm: new Date(lote.criadoEm),
        atualizadoEm: new Date(lote.atualizadoEm),
      }));
      setLotes(lotesParseados);
      
      if (lotesParseados.length > 0) {
        setLoteSelecionado(lotesParseados[0].id);
      }
    }
  }, []);

  if (lotes.length === 0) {
    return (
      <div className="page-transition">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>Nenhum Lote Cadastrado</CardTitle>
              <CardDescription>
                Cadastre o primeiro lote para visualizar o calendário integrado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/cadastro-lote">Cadastrar Primeiro Lote</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Calendário Integrado
            </h1>
            <p className="text-muted-foreground mt-2">
              Fases produtivas, vacinação e pesagens em um só lugar
            </p>
          </div>
        </div>

        {/* Calendário Interativo NOVOgen */}
        <CalendarioInterativo 
          lotes={lotes}
          loteSelecionado={loteSelecionado}
          onLoteChange={setLoteSelecionado}
        />
      </div>
    </div>
  );
}