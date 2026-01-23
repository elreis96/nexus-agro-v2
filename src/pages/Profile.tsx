import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Mail, Shield, Save, Loader2, Crown, UserCheck } from 'lucide-react';

const nomeSchema = z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo');

export default function Profile() {
  const { user, profile, role, isLoading: authLoading } = useAuth();
  const [nome, setNome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.nome) {
      setNome(profile.nome);
    }
  }, [profile]);

  useEffect(() => {
    setHasChanges(nome !== (profile?.nome || ''));
  }, [nome, profile?.nome]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = nomeSchema.safeParse(nome);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ nome: nome.trim() })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });

      setHasChanges(false);
    } catch (err: any) {
      console.error('Profile update error:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar perfil',
        description: err.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">Meu Perfil</span>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold text-gradient-gold">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais
          </p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize seu nome e veja suas informações de conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={error ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="pl-10 bg-muted/30"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label>Papel no Sistema</Label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {role === 'admin' ? (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      <Crown className="h-3 w-3 mr-1" />
                      Administrador
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Gestor
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {role === 'admin' 
                    ? 'Você tem acesso total ao sistema, incluindo gestão de usuários e importação de dados.'
                    : 'Você tem acesso ao dashboard e visualização de dados.'}
                </p>
              </div>

              <div className="pt-4 border-t border-border/50">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isSubmitting || !hasChanges}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID do Usuário</span>
              <span className="font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Membro desde</span>
              <span>{profile?.created_at 
                ? new Date(profile.created_at).toLocaleDateString('pt-BR')
                : '—'}</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
