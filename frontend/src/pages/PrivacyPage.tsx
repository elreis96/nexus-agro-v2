import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
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
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Política de Privacidade</h1>
              <p className="text-muted-foreground">
                Última atualização: Janeiro de 2026
              </p>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
              <p className="text-muted-foreground leading-relaxed">
                A AgroTrade Analytics está comprometida em proteger sua
                privacidade. Esta Política de Privacidade explica como
                coletamos, usamos, divulgamos e protegemos suas informações
                quando você usa nossa plataforma AgroData Nexus.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                2. Informações que Coletamos
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Coletamos diferentes tipos de informações para fornecer e
                melhorar nossos serviços:
              </p>
              <h3 className="text-xl font-semibold mb-3">
                2.1 Informações Fornecidas por Você
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Nome, email e informações de contato</li>
                <li>Informações de perfil e preferências</li>
                <li>Dados de uso e interações com a plataforma</li>
              </ul>
              <h3 className="text-xl font-semibold mb-3 mt-4">
                2.2 Informações Coletadas Automaticamente
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Endereço IP e localização geográfica</li>
                <li>Tipo de navegador e dispositivo</li>
                <li>Páginas visitadas e tempo de permanência</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                3. Como Usamos Suas Informações
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Fornecer, manter e melhorar nossos serviços</li>
                <li>Personalizar sua experiência na plataforma</li>
                <li>Enviar notificações e alertas relevantes</li>
                <li>Analisar tendências e padrões de uso</li>
                <li>Proteger contra fraudes e atividades não autorizadas</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                4. Compartilhamento de Informações
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Não vendemos suas informações pessoais. Podemos compartilhar
                suas informações apenas nas seguintes circunstâncias:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Com seu consentimento explícito</li>
                <li>Com prestadores de serviços que nos auxiliam</li>
                <li>Para cumprir obrigações legais</li>
                <li>Para proteger direitos e segurança</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                5. Segurança dos Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas de segurança técnicas e organizacionais
                para proteger suas informações, incluindo:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Controles de acesso rigorosos</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Auditorias regulares de segurança</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Seus Direitos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Você tem os seguintes direitos em relação aos seus dados
                pessoais:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Acessar e obter cópias de seus dados</li>
                <li>Corrigir informações imprecisas</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Opor-se ao processamento de seus dados</li>
                <li>Portabilidade de dados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies e tecnologias similares para melhorar sua
                experiência. Você pode controlar o uso de cookies através das
                configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                8. Alterações nesta Política
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente.
                Notificaremos você sobre mudanças significativas por e-mail ou
                através de aviso em nossa plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para questões sobre esta Política de Privacidade ou para exercer
                seus direitos, entre em contato conosco através da página de{" "}
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
