const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

async function main() {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${env.SUPABASE_SECRET_KEY}`);
  const spec = await res.json();
  console.log(Object.keys(spec.definitions.land_applications.properties));
}
main();
