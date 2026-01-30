import { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

const emailSchema = z.string().trim().email('Email inválido').max(255, 'Email muito longo');

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      const description = err instanceof Error ? err.message : 'Tente novamente mais tarde.';
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar email',
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">Verifique seu email</h3>
        <p className="text-muted-foreground text-sm">
          Enviamos um link de recuperação para <strong>{email}</strong>. 
          Clique no link para criar uma nova senha.
        </p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-semibold text-lg">Esqueceu sua senha?</h3>
        <p className="text-muted-foreground text-sm">
          Digite seu email e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={error ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar link de recuperação'
        )}
      </Button>

      <Button 
        type="button" 
        variant="ghost" 
        onClick={onBack} 
        className="w-full"
        disabled={isSubmitting}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar ao login
      </Button>
    </form>
  );
}
