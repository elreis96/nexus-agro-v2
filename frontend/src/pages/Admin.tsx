import { DashboardLayout } from '@/components/DashboardLayout';
import { CSVImport } from '@/components/CSVImport';
import { UserManagement } from '@/components/UserManagement';
import { AuditLogViewer } from '@/components/AuditLogViewer';
import { RealtimeDataPanel } from '@/components/RealtimeDataPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
    <DashboardLayout>
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gradient-green">Centro de Administração</h1>
            <p className="text-xs text-muted-foreground">Gestão de Usuários, Auditoria e Dados</p>
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
        <ErrorBoundary
          fallback={
            <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
              <h3 className="font-medium mb-2">Seção de Usuários indisponível</h3>
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro ao carregar a gestão de usuários. Tente recarregar a página.
              </p>
            </div>
          }
        >
          <section>
            <UserManagement />
          </section>
        </ErrorBoundary>

        {/* SEÇÃO 1: DADOS EM TEMPO REAL (APIs Externas) */}
        <div className="border-t-4 border-primary/20 pt-8">
          <ErrorBoundary
            fallback={
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h3 className="font-medium mb-2">Dados em Tempo Real indisponíveis</h3>
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar os dados em tempo real agora.
                </p>
              </div>
            }
          >
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
          </ErrorBoundary>
        </div>

        {/* SEÇÃO 2: DADOS HISTÓRICOS (Importação CSV) */}
        <div className="border-t-4 border-primary/20 pt-8">
          <ErrorBoundary
            fallback={
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h3 className="font-medium mb-2">Importação de CSV indisponível</h3>
                <p className="text-sm text-muted-foreground">
                  O módulo de importação está temporariamente indisponível. Tente novamente mais tarde.
                </p>
              </div>
            }
          >
            <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <h2 className="text-xl font-display font-semibold text-gradient-gold">
                📊 Dados Históricos
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
          </ErrorBoundary>
        </div>

        {/* Audit Logs Section */}
        <ErrorBoundary
          fallback={
            <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
              <h3 className="font-medium mb-2">Logs de auditoria indisponíveis</h3>
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar os logs de auditoria.
              </p>
            </div>
          }
        >
          <section>
            <AuditLogViewer />
          </section>
        </ErrorBoundary>
      </main>
    </DashboardLayout>
  );
}
