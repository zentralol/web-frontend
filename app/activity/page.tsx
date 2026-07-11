import { spaceGrotesk } from "@/app/ui/fonts";
import { SavedTrips } from "@/components/activity/SavedTrips";
import { listSavedItinerariesAction } from "@/lib/itineraries/actions";

export default async function ActivityPage() {
  const itineraries = await listSavedItinerariesAction();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
          Activity
        </p>
        <h1
          className={`${spaceGrotesk.className} mt-3 text-3xl font-light tracking-tight text-white`}
        >
          Your journey
        </h1>
        <p className="mt-4 max-w-xl text-sm text-white/55">
          Trips you saved from the assistant. Revisit a plan or head straight to
          any stop.
        </p>
      </div>

      <SavedTrips initialItineraries={itineraries} />
    </div>
  );
}
