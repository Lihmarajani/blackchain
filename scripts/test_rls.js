const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, // anon key
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data, error } = await supabase.storage.from('land-documents').upload('test/test.txt', 'hello');
  console.log('Upload:', { data, error });
  
  const { data: dbData, error: dbError } = await supabase.from('land_applications').insert({
    applicant_name: 'Test',
    applicant_email: 'test@example.com',
    applicant_contact: '123',
    property_title_number: '123',
    property_location: '123',
    property_type: '123',
    land_area: 123,
    property_description: '123',
    document_storage_path: 'test/test.txt',
    document_sha256: '123'
  }).select();
  console.log('DB Insert:', { dbData, dbError });
}
main();
