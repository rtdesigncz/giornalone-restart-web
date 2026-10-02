import { createClient } from "@supabase/supabase-js";
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from("entries").select("*").eq("venduto", true).limit(1);
  if (error) console.error(error);
  else console.log(JSON.stringify(data[0], null, 2));
}
run();
