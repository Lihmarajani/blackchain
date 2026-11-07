const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function main() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';
  
  const { data: regData, error: regError } = await supabase.auth.signUp({
    email,
    password
  });
  console.log('Register:', regError ? regError.message : 'Success');

  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  console.log('Login:', loginError ? loginError.message : 'Success');
}

main();
