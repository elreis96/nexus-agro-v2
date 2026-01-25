import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeroCarousel } from "@/components/HeroCarousel";
import { RotatingBadge } from "@/components/RotatingBadge";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Cloud,
  Database,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const carouselImages = [
    {
      src: "/agro_field_1.png",
      alt: "Campo de soja moderno",
      title: "Agricultura de Precisão",
      description:
        "Tecnologia avançada para maximizar produtividade e sustentabilidade",
    },
    {
      src: "/agro_tech_2.png",
      alt: "Tecnologia agrícola com drone",
      title: "Monitoramento Inteligente",
      description: "Drones e sensores para análise em tempo real das lavouras",
    },
    {
      src: "/agro_harvest_3.png",
      alt: "Colheita de trigo ao pôr do sol",
      title: "Otimização de Colheita",
      description: "Dados precisos para decisões estratégicas no momento certo",
    },
  ];

  const features = [
    {
      icon: Cloud,
      title: "Dados Climáticos em Tempo Real",
      description:
        "Monitoramento contínuo de condições meteorológicas e previsões precisas",
    },
    {
      icon: TrendingUp,
      title: "Análise de Mercado",
      description:
        "Insights estratégicos sobre tendências e oportunidades no agronegócio",
    },
    {
      icon: BarChart3,
      title: "Dashboards Executivos",
      description:
        "Visualizações premium com métricas-chave para tomada de decisão",
    },
    {
      icon: Database,
      title: "Data Engineering",
      description: "Pipelines robustos de dados para análises complexas",
    },
    {
      icon: Zap,
      title: "Alertas Inteligentes",
      description:
        "Notificações automáticas sobre eventos críticos e oportunidades",
    },
    {
      icon: Shield,
      title: "Segurança Enterprise",
      description:
        "Proteção de dados com criptografia e controle de acesso avançado",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => navigate("/auth")}
            >
              Começar Agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Carousel */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-6 animate-slide-up">
            <RotatingBadge />

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="text-gradient-green">Inteligência de Dados</span>
              <br />
              para o Agronegócio
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Plataforma de análise climática e mercado agrícola para fundos de
              investimento e gestores de portfólio
            </p>
          </div>

          {/* Carousel */}
          <div className="animate-fade-in-delayed">
            <HeroCarousel images={carouselImages} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up-delayed">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-lg px-8 hover:scale-105 transition-transform"
              onClick={() => navigate("/auth")}
            >
              Acessar Plataforma
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 hover:scale-105 transition-transform"
              onClick={() => navigate("/auth")}
            >
              Criar Conta
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gradient-gold">Funcionalidades</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Análise de dados agrícolas e mercado financeiro
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="executive-card p-6 space-y-4 group hover:scale-105 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para <span className="text-gradient-gold">Transformar</span>{" "}
            seus Dados?
          </h2>
          <p className="text-lg text-muted-foreground">
            Junte-se aos fundos de investimento que já utilizam nossa plataforma
          </p>
          <Button
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 hover:scale-105 transition-transform"
            onClick={() => navigate("/auth")}
          >
            Começar Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                © 2026{" "}
                <strong className="text-foreground">AgroData Nexus</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Inteligência Climática e de Mercado para Fundos - Todos os
                direitos reservados
              </p>
            </div>
            <div className="flex gap-6">
              <a
                href="/terms"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Termos de Uso
              </a>
              <a
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Privacidade
              </a>
              <a
                href="/contact"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
