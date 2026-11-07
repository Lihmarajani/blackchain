const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data, error } = await supabase.from('land_applications').select('applicant_user_id').limit(1);
  if (error) {
    console.log("Column might not exist:", error);
  } else {
    console.log("Column exists!", data);
  }
}
main();
