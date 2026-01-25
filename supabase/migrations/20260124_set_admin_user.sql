-- Atribuir role de admin ao usuário principal
-- Email: eduardorobertolinares@hotmail.com

-- Primeiro, buscar o user_id do auth.users baseado no email
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Buscar o UUID do usuário pelo email
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'eduardorobertolinares@hotmail.com'
    LIMIT 1;

    -- Se encontrou o usuário, atribuir role de admin
    IF admin_user_id IS NOT NULL THEN
        -- Inserir ou atualizar a role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id)
        DO UPDATE SET role = 'admin';

        -- Criar profile se não existir
        INSERT INTO public.profiles (user_id, email, nome)
        VALUES (admin_user_id, 'eduardorobertolinares@hotmail.com', 'Eduardo Linares')
        ON CONFLICT (user_id)
        DO UPDATE SET email = 'eduardorobertolinares@hotmail.com';

        RAISE NOTICE 'Admin role atribuída ao usuário: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Usuário com email eduardorobertolinares@hotmail.com não encontrado';
    END IF;
END $$;
