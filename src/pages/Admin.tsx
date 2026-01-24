import { Logo } from '@/components/Logo';
import { CSVImport } from '@/components/CSVImport';
import { UserManagement } from '@/components/UserManagement';
import { AuditLogViewer } from '@/components/AuditLogViewer';
import { RealtimeDataPanel } from '@/components/RealtimeDataPanel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Admin() {
  const { profile, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Get display name
  const displayName = profile?.nome || user?.email?.split('@')[0] || 'Administrador';

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
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Área Administrativa</span>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-sm font-medium">{displayName}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold text-gradient-gold">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo, <strong>{displayName}</strong>. Gerencie usuários e dados do sistema.
          </p>
        </div>

        {/* User Management Section */}
        <section>
          <UserManagement />
        </section>

        {/* SEÇÃO 1: DADOS EM TEMPO REAL (APIs Externas) */}
        <div className="border-t-4 border-primary/20 pt-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-xl font-display font-semibold text-gradient-gold">
                📡 Dados em Tempo Real
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Dados atualizados via APIs externas: OpenMeteo (clima), Yahoo Finance (JBS), Banco Central (Dólar)
            </p>
            <RealtimeDataPanel />
          </section>
        </div>

        {/* SEÇÃO 2: DADOS DO CASE (Importação CSV) */}
        <div className="border-t-4 border-primary/20 pt-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <h2 className="text-xl font-display font-semibold text-gradient-gold">
                📊 Dados Históricos do Case
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Importação de dados históricos (CSV) para análise e treinamento do modelo
            </p>
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
          </section>
        </div>

        {/* Audit Logs Section */}
        <section>
          <AuditLogViewer />
        </section>
      </main>
    </div>
  );
}
