const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars manually since we can't rely on nextjs loading them for a standalone script easily without 'dotenv'
// We will try to read .env.local if it exists, otherwise .env
const loadEnv = (file) => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        content.split('\n').forEach(line => {
            const [key, ...val] = line.split('=');
            if (key && val) {
                process.env[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
            }
        });
    }
};

loadEnv('.env');
loadEnv('.env.local');

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // We need this one!

if (!SB_URL || !SB_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env/.env.local");
    process.exit(1);
}

const supabase = createClient(SB_URL, SB_KEY);

const run = async () => {
    try {
        // 1. Apply 'exec_sql' function migration
        const sqlPath = path.join(__dirname, 'supabase/migrations/20251127000001_exec_sql.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // There is no direct "exec" in supabase-js storage/auth client.
        // BUT, we can use the REST API 'sql' endpoint if enabled, or...
        // Wait, Supabase JS client DOES NOT support raw SQL execution even with service role key 
        // UNLESS we use the pg driver or if we have a function to do it (which we are trying to create!).

        // CATCH-22: We need to create the function to execute SQL, but we need to execute SQL to create the function.

        // However, if the user has the 'postgres' connection string, we can use 'pg'.
        // Let's check if DATABASE_URL is present.

        if (process.env.DATABASE_URL) {
            console.log("Found DATABASE_URL, using 'pg' driver (if available) or pure node-postgres...");
            // We don't have 'pg' in package.json. We can't use it.
            console.error("Cannot use 'pg' driver because it is not installed.");
        }

        // Alternative: Use the Supabase Management API? No, that requires an access token, not service key.

        console.error("CRITICAL: Cannot apply migration via supabase-js without an existing 'exec_sql' function.");
        console.error("Please run the SQL in supabase/migrations/20251127000001_exec_sql.sql manually in the Supabase Dashboard SQL Editor.");
        process.exit(1);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
