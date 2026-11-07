-- 1. Add applicant_user_id column linked to auth.users
ALTER TABLE public.land_applications
ADD COLUMN IF NOT EXISTS applicant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Enable RLS on land_applications table
ALTER TABLE public.land_applications ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.land_applications;
DROP POLICY IF EXISTS "Applicants can update own pending applications" ON public.land_applications;
DROP POLICY IF EXISTS "Admins can view and edit all applications" ON public.land_applications;

-- 4. Create RLS policies for applicants
CREATE POLICY "Applicants can view own applications"
ON public.land_applications
FOR SELECT
TO authenticated
USING (applicant_user_id = auth.uid());

-- 5. Note: Service Role (used by getSupabaseAdminClient) bypasses RLS.
-- This is intentional because we perform edits and inserts server-side.
-- In production, if using anon keys, we would add insert/update policies here.
