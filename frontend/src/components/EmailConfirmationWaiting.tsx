import { useState } from "react";
import { Mail, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailConfirmationWaitingProps {
  email: string;
  onBack?: () => void;
}

export function EmailConfirmationWaiting({
  email,
  onBack,
}: EmailConfirmationWaitingProps) {
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleResendEmail = async () => {
    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) throw error;

      toast({
        title: "Email reenviado!",
        description:
          "Verifique sua caixa de entrada. O link expira em 10 minutos.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Tente novamente mais tarde.";
      toast({
        variant: "destructive",
        title: "Erro ao reenviar email",
        description: errorMessage,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-gradient-gold">Confirme seu Email</CardTitle>
        <CardDescription>
          Enviamos um email de confirmação para:
        </CardDescription>
        <p className="text-sm font-medium text-foreground">{email}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Link válido por 10 minutos
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Por questões de segurança, o link de confirmação expira em 10
                minutos.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Não recebeu o email?
          </p>

          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reenviar Email
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1 pt-2">
            <p>• Verifique sua caixa de spam</p>
            <p>• Aguarde alguns minutos para o email chegar</p>
            <p>• Certifique-se de que o email está correto</p>
          </div>
        </div>

        {onBack && (
          <Button onClick={onBack} variant="ghost" className="w-full text-sm">
            Voltar para login
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
