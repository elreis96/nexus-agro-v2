import { Logo } from '@/components/Logo';
import { CSVImport } from '@/components/CSVImport';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Admin() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo size="md" />
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Área Administrativa</span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold text-gradient-gold">
            Gerenciamento de Dados
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo, {profile?.nome || profile?.email}. Use esta área para importar dados de mercado e clima.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <CSVImport type="mercado" />
          <CSVImport type="clima" />
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
          <h3 className="font-medium mb-2">Instruções de Importação</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Os arquivos devem estar no formato CSV (separado por vírgula ou ponto-e-vírgula)</li>
            <li>A primeira linha deve conter os nomes das colunas</li>
            <li>Datas podem estar no formato YYYY-MM-DD ou DD/MM/YYYY</li>
            <li>Valores numéricos podem usar vírgula como separador decimal</li>
            <li>Registros com a mesma data serão atualizados automaticamente</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
