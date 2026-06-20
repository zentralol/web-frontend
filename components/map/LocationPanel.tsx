import LocationBottomSheet from "@/components/map/LocationBottomSheet";
import { LocationPanelContent } from "@/components/map/LocationPanelContent";
import type { LocationSelectionState } from "@/lib/map/types";

type LocationPanelProps = {
  selection: LocationSelectionState;
  onDismiss?: () => void;
};

export default function LocationPanel({
  selection,
  onDismiss,
}: LocationPanelProps) {
  return (
    <>
      <aside className="hidden w-96 shrink-0 flex-col border-l border-white/10 bg-surface p-6 lg:flex">
        <LocationPanelContent selection={selection} />
      </aside>
      <LocationBottomSheet selection={selection} onDismiss={onDismiss} />
    </>
  );
}
