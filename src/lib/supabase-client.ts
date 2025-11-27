import { createClient } from "@supabase/supabase-js";

const supabaseUrl = `https://wbkzvuhzlaujdltvhjty.supabase.co`;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

if (!supabaseAnonKey) {
  throw new Error("Missing Supabase anon key");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("crops")
      .select("count")
      .limit(1);

    if (error) throw error;

    return { success: true, message: "Connected to Supabase" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
