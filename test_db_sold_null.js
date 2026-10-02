import { createClient } from "@supabase/supabase-js";
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from("entries").select("*").eq("venduto", true).is("tipo_abbonamento_id", null);
  if (error) console.error(error);
  else console.log("Sold without sub id count:", data.length);
}
run();
