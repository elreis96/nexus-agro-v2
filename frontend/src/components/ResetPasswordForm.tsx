import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check } from 'lucide-react';

const passwordSchema = z.string()
  .min(6, 'Senha deve ter pelo menos 6 caracteres')
  .max(100, 'Senha muito longa');

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (password !== confirmPassword) {
      newErrors.confirm = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);

    // Backend validation (security) - validate password before updating
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      if (API_BASE_URL) {
        const validateResponse = await fetch(`${API_BASE_URL}/api/auth/validate-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        
        if (validateResponse.ok) {
          const validation = await validateResponse.json();
          if (!validation.valid) {
            setErrors({ password: validation.error });
            setIsSubmitting(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Password validation endpoint not available, using Supabase validation only:', err);
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast({
        title: 'Senha atualizada!',
        description: 'Sua senha foi alterada com sucesso.',
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (err: unknown) {
      console.error('Password update error:', err);
      const description = err instanceof Error ? err.message : 'Tente novamente mais tarde.';
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar senha',
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-semibold text-lg">Criar nova senha</h3>
        <p className="text-muted-foreground text-sm">
          Digite sua nova senha abaixo.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">Nova Senha</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={errors.password ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar Senha</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Repita a nova senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={errors.confirm ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.confirm && (
          <p className="text-sm text-destructive">{errors.confirm}</p>
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
            Salvando...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Salvar nova senha
          </>
        )}
      </Button>
    </form>
  );
}
