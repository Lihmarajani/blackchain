const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

async function confirmEmails() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error);
    return;
  }

  for (const user of users.users) {
    if (!user.email_confirmed_at) {
      console.log(`Confirming email for ${user.email}...`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true
      });
      if (updateError) {
        console.error(`Error confirming ${user.email}:`, updateError);
      } else {
        console.log(`Successfully confirmed ${user.email}.`);
      }
    }
  }
  console.log("Done.");
}

confirmEmails();
