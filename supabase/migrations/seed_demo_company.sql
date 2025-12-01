-- SEED DATA: Demo Company Profile
-- Instrucciones:
-- 1. Reemplaza 'USER_ID_HERE' con el ID real de tu usuario de Supabase (puedes verlo en Authentication > Users).
-- 2. Ejecuta este script en el SQL Editor de Supabase.

DO $$
DECLARE
    target_email text := 'dev-company@hunter.local'; -- <--- EMAIL DEL USUARIO
    target_user_id uuid;
    new_profile_id uuid;
    new_company_id uuid;
BEGIN
    -- 1. Obtener ID del usuario por email
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el usuario con email %', target_email;
    END IF;

    -- 2. Asegurar que existe el perfil para el usuario
    SELECT id INTO new_profile_id FROM public.profiles WHERE user_id = target_user_id LIMIT 1;

    IF new_profile_id IS NULL THEN
        INSERT INTO public.profiles (user_id, full_name, email, role)
        VALUES (target_user_id, 'Admin User', target_email, 'user')
        RETURNING id INTO new_profile_id;
    ELSE
        UPDATE public.profiles 
        SET full_name = 'Admin User' 
        WHERE id = new_profile_id;
    END IF;

    -- 2. Crear o Actualizar la Empresa (Datos Hardcodeados Completos)
    INSERT INTO public.companies (
        profile_id,
        company_name,
        nit,
        legal_representative,
        economic_sector,
        phone,
        address,
        city,
        department,
        country,
        unspsc_codes,
        financial_indicators,
        experience_summary
    )
    VALUES (
        new_profile_id,
        'CONSTRUCTORA ANDINA S.A.S.',
        '900.123.456-7',
        'Carlos Alberto Rodríguez',
        'Infraestructura y Obra Civil',
        '+57 300 123 4567',
        'Calle 100 # 15-23 Of. 501',
        'Bogotá D.C.',
        'Cundinamarca',
        'Colombia',
        '["72101500", "72102900", "72103300", "95111600"]'::jsonb, -- Mantenimiento de vías, Construcción de carreteras
        '{
            "year": 2023,
            "total_assets": 5400000000,
            "total_liabilities": 1200000000,
            "total_equity": 4200000000,
            "current_assets": 2100000000,
            "current_liabilities": 800000000,
            "operating_income": 3500000000,
            "net_income": 850000000,
            "liquidity_index": 2.62,
            "indebtedness_index": 0.22,
            "k_contratacion": 4200
        }'::jsonb,
        '{
            "total_contracts": 15,
            "total_amount_smmlv": 45000,
            "max_single_contract_smmlv": 12000,
            "main_sectors": ["Vías Urbanas", "Mantenimiento Vial", "Espacio Público"]
        }'::jsonb
    )
    ON CONFLICT (profile_id) DO UPDATE
    SET 
        company_name = EXCLUDED.company_name,
        financial_indicators = EXCLUDED.financial_indicators,
        experience_summary = EXCLUDED.experience_summary
    RETURNING id INTO new_company_id;

    -- 3. Insertar Contratos de Experiencia (Hardcodeados)
    -- Limpiar contratos anteriores para evitar duplicados en demo
    DELETE FROM public.company_contracts WHERE company_id = new_company_id;

    INSERT INTO public.company_contracts (
        company_id,
        contract_number,
        client_name,
        contract_value,
        contract_value_smmlv,
        execution_date,
        unspsc_codes,
        description
    ) VALUES
    (
        new_company_id,
        'CT-2023-045',
        'Instituto de Desarrollo Urbano - IDU',
        2500000000,
        2155.17, -- Aprox SMMLV 2023
        '2023-03-15',
        '["72101500", "72102900"]'::jsonb,
        'Mantenimiento y rehabilitación de la malla vial local en la localidad de Usaquén.'
    ),
    (
        new_company_id,
        'LP-002-2022',
        'Alcaldía de Medellín',
        1800000000,
        1800.00,
        '2022-06-20',
        '["72103300"]'::jsonb,
        'Construcción de parques y zonas verdes en el sector nororiental.'
    ),
    (
        new_company_id,
        'OB-105-2024',
        'Gobernación de Cundinamarca',
        4200000000,
        3230.76,
        '2024-01-10',
        '["95111600", "72101500"]'::jsonb,
        'Mejoramiento de vías terciarias mediante placa huella en municipios de la provincia.'
    );

END $$;
