import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Leaf, BarChart3, Zap, ArrowRight, Sparkles } from "lucide-react";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900/20 via-slate-900/15 to-emerald-700/10">
      <header className="border-b border-border/30 bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shadow-inner">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg text-gradient-green hidden sm:inline">AgroData</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate("/analytics")}>
                  Analytics
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Entrar
                </Button>
                <Button className="bg-primary text-primary-foreground" onClick={() => navigate("/auth")}>
                  Começar <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="grid items-center gap-8 lg:gap-12 lg:grid-cols-2">
            <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" /> IA para Agro inteligente
              </div>
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient-gold">
                  Inteligência de Mercado Agrícola
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                  Análises em tempo real, predições com IA e estratégias automáticas para o agronegócio — prático no desktop e confortável no mobile.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 sm:gap-4 pt-2 sm:pt-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary text-primary-foreground hover:shadow-[0_0_40px_rgba(16,185,129,0.35)]"
                  onClick={() => navigate("/auth")}
                >
                  Acessar Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                {!isAuthenticated && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => navigate("/auth")}
                  >
                    Criar Conta
                  </Button>
                )}
              </div>
            </div>

            <div className="relative w-full h-[240px] sm:h-[300px] lg:h-[360px] rounded-2xl overflow-hidden border border-border/40 bg-card/60 backdrop-blur-sm shadow-xl">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/60 via-slate-900/50 to-transparent" />
              <div className="relative h-full w-full flex flex-col justify-between p-4 sm:p-6 text-left text-foreground">
                <div>
                  <p className="text-xs text-emerald-100/80">Dados agro + clima</p>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white mt-1">Safras, clima e preços em um só painel</h3>
                </div>
                <div className="space-y-2 text-sm text-emerald-50">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" /> Atualizações em tempo real
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-blue-300" /> IA para previsões e alertas
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-300" /> Insights rápidos para desktop e mobile
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-5 sm:p-6 border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Análise em Tempo Real</h3>
            <p className="text-sm text-muted-foreground">Volatilidade, correlações e índices climáticos ao vivo.</p>
          </Card>

          <Card className="p-5 sm:p-6 border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <Leaf className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Inteligência Climática</h3>
            <p className="text-sm text-muted-foreground">Correlação entre dados climáticos e preços de commodities.</p>
          </Card>

          <Card className="p-5 sm:p-6 border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Backtesting</h3>
            <p className="text-sm text-muted-foreground">Teste estratégias com dados históricos e valide sinais.</p>
          </Card>

          <Card className="p-5 sm:p-6 border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Predições com IA</h3>
            <p className="text-sm text-muted-foreground">Modelos de machine learning para prever tendências.</p>
          </Card>

          <Card className="p-5 sm:p-6 border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-colors sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Análise de Risco</h3>
            <p className="text-sm text-muted-foreground">Meça e monitore riscos em suas posições com precisão.</p>
          </Card>
        </section>

        <section className="py-10 sm:py-14 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-primary">R$ 800M</div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Sob gestão</p>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-green-500">99.8%</div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Uptime</p>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-500">24/7</div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Monitoramento</p>
          </div>
        </section>

        <section className="py-12 sm:py-16 text-center">
          <div className="bg-gradient-to-r from-primary/10 via-transparent to-primary/10 border border-primary/15 rounded-lg p-6 sm:p-10 space-y-4 sm:space-y-6 shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-bold">Pronto para começar?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Acesse agora a plataforma e comece a otimizar suas estratégias de investimento
            </p>
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:shadow-[0_0_40px_rgba(16,185,129,0.35)]"
              onClick={() => navigate("/auth")}
            >
              Acessar Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 AgroData. Inteligência de Mercado. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
