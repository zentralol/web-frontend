import { listAttractions } from "@/lib/attractions/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const attractions = await listAttractions(supabase);

    return NextResponse.json({ attractions });
  } catch {
    return NextResponse.json(
      { error: "Could not load attractions." },
      { status: 500 },
    );
  }
}
