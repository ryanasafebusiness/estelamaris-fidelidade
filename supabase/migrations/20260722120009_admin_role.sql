-- =============================================================================
-- Estelamaris — 09 · Papel admin + RLS de leitura ampla para admin
-- Adiciona coluna 'papel' ao profiles (cliente|admin). Admin vê tudo.
-- Promoção a admin é manual via SQL no Dashboard do Supabase.
-- =============================================================================

-- 1) Coluna de papel no profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS papel text NOT NULL DEFAULT 'cliente'
  CHECK (papel IN ('cliente', 'admin'));

-- 2) Admin lê TODOS os profiles
CREATE POLICY "admin: lê todos os profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND papel = 'admin')
  );

-- 3) Admin lê TODAS as receipts
CREATE POLICY "admin: lê todas as receipts" ON public.receipts
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND papel = 'admin')
  );

-- 4) Admin lê TODAS as redemptions
CREATE POLICY "admin: lê todas as redemptions" ON public.redemptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND papel = 'admin')
  );

-- 5) Admin lê TODO o ledger
CREATE POLICY "admin: lê todo o ledger" ON public.points_ledger
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND papel = 'admin')
  );

-- 6) Admin lê TODAS as rewards (inclusive inativas)
CREATE POLICY "admin: lê todas as rewards" ON public.rewards
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND papel = 'admin')
  );

-- 7) Admin pode ler TODAS as imagens no bucket notas
CREATE POLICY "notas: admin lê tudo" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'notas'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND papel = 'admin')
  );
