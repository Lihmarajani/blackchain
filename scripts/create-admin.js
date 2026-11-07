
const { loadEnvConfig } = require("@next/env");
const { createClient } = require("@supabase/supabase-js");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

loadEnvConfig(process.cwd());

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local."
    );
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    const email = (await rl.question("Administrator email: ")).trim();
    const password = await rl.question(
      "Administrator password (12+ characters): "
    );

    if (!email || !email.includes("@")) {
      throw new Error("Enter a valid email address.");
    }

    if (password.length < 12) {
      throw new Error("Use a password with at least 12 characters.");
    }

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role: "admin",
      },
    });

    if (error) {
      throw new Error(`Administrator creation failed: ${error.message}`);
    }

    console.log("\nAdministrator account created successfully.");
    console.log(`Email: ${data.user.email}`);
    console.log(`User ID: ${data.user.id}`);
    console.log("Role: admin");
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
