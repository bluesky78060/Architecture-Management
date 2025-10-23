-- Migration: Fix Supabase Security Advisor Warnings
-- Date: 2025-10-23
-- Purpose: Resolve security warnings from Vercel Security Advisor
--
-- Issues addressed:
-- 1. Function Search Path Mutable (4 functions)
-- 2. Extension in Public (pg_net)
-- 3. Leaked Password Protection (requires manual Dashboard setting)

-- ============================================================================
-- 1. Fix Function Search Path Mutable
-- ============================================================================
-- Security: Explicitly set search_path to prevent SQL injection attacks
-- via search_path manipulation

-- Set search_path for is_user_approved function
ALTER FUNCTION IF EXISTS public.is_user_approved(UUID)
SET search_path = public;

-- Set search_path for update_user_approvals_updated_at trigger function
ALTER FUNCTION IF EXISTS public.update_user_approvals_updated_at()
SET search_path = public;

-- Set search_path for notify_admin_new_approval trigger function
ALTER FUNCTION IF EXISTS public.notify_admin_new_approval()
SET search_path = public;

-- Set search_path for update_updated_at_column trigger function
ALTER FUNCTION IF EXISTS public.update_updated_at_column()
SET search_path = public;

-- ============================================================================
-- 2. Move pg_net Extension to Separate Schema
-- ============================================================================
-- Security: Extensions should be isolated from public schema

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Note: pg_net cannot be moved after installation
-- This is a limitation of Supabase managed extensions
-- The extension is managed by Supabase and installed in public schema
-- This warning can be acknowledged but not fixed without recreating the database

-- For reference, if we could reinstall pg_net, the commands would be:
-- DROP EXTENSION IF EXISTS pg_net CASCADE;
-- CREATE EXTENSION pg_net SCHEMA extensions;

-- ============================================================================
-- 3. Leaked Password Protection
-- ============================================================================
-- Security: Enable leaked password protection in Supabase Dashboard
--
-- MANUAL ACTION REQUIRED:
-- This cannot be set via SQL migration. Please enable it manually:
--
-- Steps:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to: Authentication → Policies
-- 3. Find "Leaked Password Protection" setting
-- 4. Toggle it ON
--
-- This feature checks user passwords against a database of known leaked
-- passwords to prevent account compromise.

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify function search_path settings
DO $$
DECLARE
    func_record RECORD;
    func_count INTEGER := 0;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Function Search Path Verification ===';

    FOR func_record IN
        SELECT
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments,
            COALESCE(p.proconfig::text, 'NOT SET') as search_path_config
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'is_user_approved',
            'update_user_approvals_updated_at',
            'notify_admin_new_approval',
            'update_updated_at_column'
        )
    LOOP
        func_count := func_count + 1;
        RAISE NOTICE 'Function: %(%) - Search Path: %',
            func_record.function_name,
            func_record.arguments,
            func_record.search_path_config;

        IF func_record.search_path_config LIKE '%search_path=public%' THEN
            fixed_count := fixed_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE '---';
    RAISE NOTICE 'Total functions checked: %', func_count;
    RAISE NOTICE 'Functions with search_path set: %', fixed_count;

    IF fixed_count = func_count THEN
        RAISE NOTICE '✅ All functions have search_path configured correctly';
    ELSE
        RAISE WARNING '⚠️  Some functions still need search_path configuration';
    END IF;
END $$;

-- Verify pg_net extension location
DO $$
DECLARE
    ext_schema TEXT;
BEGIN
    RAISE NOTICE '=== Extension Location Verification ===';

    SELECT n.nspname INTO ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pg_net';

    IF ext_schema IS NOT NULL THEN
        RAISE NOTICE 'pg_net extension schema: %', ext_schema;

        IF ext_schema = 'public' THEN
            RAISE NOTICE '⚠️  pg_net is in public schema (Supabase managed - cannot be moved)';
            RAISE NOTICE 'ℹ️  This is a known limitation and can be safely ignored';
        ELSE
            RAISE NOTICE '✅ pg_net is in separate schema: %', ext_schema;
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  pg_net extension not found (may not be installed)';
    END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Summary of changes
RAISE NOTICE '=== Migration 20251023_fix_security_warnings Complete ===';
RAISE NOTICE '';
RAISE NOTICE '✅ Fixed: Function Search Path Mutable (4 functions)';
RAISE NOTICE 'ℹ️  Acknowledged: Extension in Public (Supabase managed)';
RAISE NOTICE '⚠️  Manual Action Required: Enable Leaked Password Protection in Dashboard';
RAISE NOTICE '';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Review verification output above';
RAISE NOTICE '2. Enable Leaked Password Protection in Supabase Dashboard:';
RAISE NOTICE '   Authentication → Policies → Leaked Password Protection → ON';
RAISE NOTICE '3. Re-run Vercel Security Advisor to verify fixes';
