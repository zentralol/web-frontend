import { attachCrowdToAttractions } from "@/lib/attractions/mappers";
import {
  listAttractions,
  listRecentAttractionPredictions,
} from "@/lib/attractions/queries";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const [attractions, predictions] = await Promise.all([
      listAttractions(supabase),
      // Crowd data is an enhancement: attractions must still load if the
      // predictions query fails.
      listRecentAttractionPredictions(supabase).catch((error: unknown) => {
        logger.error("Could not load attraction predictions", { error });
        return null;
      }),
    ]);

    const payload = predictions
      ? attachCrowdToAttractions(attractions, predictions)
      : attractions;

    return NextResponse.json({ attractions: payload });
  } catch (error) {
    logger.error("Could not load attractions", { error });
    return NextResponse.json(
      { error: "Could not load attractions." },
      { status: 500 },
    );
  }
}
