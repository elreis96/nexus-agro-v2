import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Termos de Uso</h1>
              <p className="text-muted-foreground">
                Última atualização: Janeiro de 2026
              </p>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                1. Aceitação dos Termos
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e usar a plataforma AgroData Nexus, você concorda em
                cumprir e estar vinculado aos seguintes termos e condições de
                uso. Se você não concordar com qualquer parte destes termos, não
                deverá usar nossa plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                2. Descrição do Serviço
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                O AgroData Nexus é uma plataforma de análise de dados climáticos
                e de mercado agrícola, fornecendo inteligência de dados para
                fundos de investimento e gestores de portfólio. Nossos serviços
                incluem:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Análise de dados climáticos em tempo real</li>
                <li>Insights de mercado agrícola e commodities</li>
                <li>Dashboards executivos e relatórios personalizados</li>
                <li>Alertas inteligentes sobre eventos críticos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                3. Conta de Usuário
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Para acessar determinados recursos da plataforma, você precisará
                criar uma conta. Você é responsável por:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>
                  Manter a confidencialidade de suas credenciais de acesso
                </li>
                <li>Todas as atividades que ocorrem em sua conta</li>
                <li>
                  Notificar-nos imediatamente sobre qualquer uso não autorizado
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Uso Aceitável</h2>
              <p className="text-muted-foreground leading-relaxed">
                Você concorda em usar a plataforma apenas para fins legais e de
                acordo com estes Termos. É proibido:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>
                  Usar a plataforma de maneira que viole leis ou regulamentos
                </li>
                <li>Tentar obter acesso não autorizado a sistemas ou dados</li>
                <li>
                  Interferir ou interromper a integridade ou desempenho da
                  plataforma
                </li>
                <li>
                  Copiar, modificar ou distribuir conteúdo sem autorização
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                5. Propriedade Intelectual
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo o conteúdo, recursos e funcionalidades da plataforma são
                propriedade da AgroTrade Analytics e são protegidos por leis de
                direitos autorais, marcas registradas e outras leis de
                propriedade intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                6. Limitação de Responsabilidade
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                A plataforma é fornecida "como está" e "conforme disponível".
                Não garantimos que o serviço será ininterrupto, seguro ou livre
                de erros. Em nenhuma circunstância seremos responsáveis por
                danos indiretos, incidentais ou consequenciais.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                7. Modificações dos Termos
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer
                momento. Notificaremos os usuários sobre mudanças significativas
                por e-mail ou através da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para questões sobre estes Termos de Uso, entre em contato
                conosco através da página de{" "}
                <a href="/contact" className="text-primary hover:underline">
                  Contato
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
