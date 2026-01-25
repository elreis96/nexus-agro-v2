-- Adicionar constraint UNIQUE em user_id na tabela user_roles
-- Isso garante que cada usuário só pode ter UMA role

-- Primeiro, limpar duplicatas se houver
DELETE FROM public.user_roles a USING public.user_roles b
WHERE a.id < b.id AND a.user_id = b.user_id;

-- Adicionar a constraint UNIQUE
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Agora atribuir role de admin ao usuário principal
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'eduardorobertolinares@hotmail.com'
    LIMIT 1;

    IF admin_user_id IS NOT NULL THEN
        -- Inserir ou atualizar (agora funciona com UNIQUE constraint)
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id)
        DO UPDATE SET role = 'admin';
        
        RAISE NOTICE 'Admin role atribuída com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário não encontrado';
    END IF;
END $$;
