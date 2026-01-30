import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineSpinner } from '@/components/Spinner';
import { Users, Crown, UserCheck, RefreshCw } from 'lucide-react';
import type { AppRole } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  nome: string | null;
  role: AppRole;
  created_at: string;
}

// Skeleton loader for user table row
function UserRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-10 w-24" /></TableCell>
    </TableRow>
  );
}

export function UserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      console.log('🔍 Buscando usuários (API admin)...');
      setIsLoading(true);
      const data = await apiClient.getAdminUsers();
      const list = Array.isArray(data) ? data : [];
      const normalized: UserWithRole[] = list.map(user => ({
        id: user.user_id,
        user_id: user.user_id,
        email: user.email ?? '',
        nome: user.nome ?? null,
        role: (user.role as AppRole) || 'gestor',
        created_at: user.created_at ?? ''
      }));
      setUsers(normalized);
      console.log('✅ Usuários carregados:', normalized.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar usuários',
        description: error instanceof Error && error.message.includes('maintenance') 
          ? 'Supabase está em manutenção. Tente novamente em alguns minutos.'
          : 'Não foi possível carregar a lista de usuários. Tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    const user = users.find(u => u.user_id === userId);
    const oldRole = user?.role;
    
    setUpdatingUserId(userId);
    
    try {
      await apiClient.updateUserRole(userId, newRole);

      // Update local state
      setUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: 'Papel atualizado',
        description: `Usuário agora é ${newRole === 'admin' ? 'Administrador' : 'Gestor'}.`
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar papel',
        description: 'Não foi possível alterar o papel do usuário.'
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadge = (role: AppRole) => {
    if (role === 'admin') {
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          <Crown className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <UserCheck className="h-3 w-3 mr-1" />
        User
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gestão de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gestão de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-center py-4">
              <InlineSpinner message="Carregando usuários..." />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map(i => <UserRowSkeleton key={i} />)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Gestão de Usuários
            </CardTitle>
            <CardDescription>
              Gerencie os papéis dos usuários do sistema. Admins podem importar dados e gerenciar outros usuários.
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchUsers()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum usuário cadastrado ainda.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel Atual</TableHead>
                <TableHead>Alterar Papel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.nome || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {updatingUserId === user.user_id && (
                        <InlineSpinner message="" />
                      )}
                      <Select
                        value={user.role}
                        onValueChange={(value: AppRole) => handleRoleChange(user.user_id, value)}
                        disabled={updatingUserId === user.user_id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gestor">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
