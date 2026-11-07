const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && key.trim()) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const query = `
    ALTER TABLE public.land_applications
    ADD COLUMN IF NOT EXISTS applicant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

    -- Enable RLS (if not already enabled)
    ALTER TABLE public.land_applications ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies to avoid conflicts if they exist
    DROP POLICY IF EXISTS "Applicants can view own applications" ON public.land_applications;
    DROP POLICY IF EXISTS "Applicants can insert own applications" ON public.land_applications;

    -- Create RLS policies for applicants
    CREATE POLICY "Applicants can view own applications"
    ON public.land_applications
    FOR SELECT
    TO authenticated
    USING (applicant_user_id = auth.uid());
  `;

  console.log("To execute SQL on Supabase, it usually requires sending it via postgres connection or an RPC if we had one. However, the Supabase JS client doesn't support raw DDL statements via REST API directly without an RPC function.");
  
  // Since we can't easily run DDL through REST API, we can output the SQL for the user.
  fs.writeFileSync('migration.sql', query);
  console.log("Migration saved to migration.sql");
}

main();
