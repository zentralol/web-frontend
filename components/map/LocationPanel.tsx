import LocationBottomSheet from "@/components/map/LocationBottomSheet";
import AttractionBrowsePanel, {
  type AttractionBrowsePanelProps,
} from "@/components/map/AttractionBrowsePanel";
import { LocationPanelContent } from "@/components/map/LocationPanelContent";
import type { LocationSelectionState } from "@/lib/map/types";

type LocationPanelProps = {
  selection: LocationSelectionState;
  onDismiss?: () => void;
  onBack?: () => void;
  browsePanelProps: AttractionBrowsePanelProps;
};

export default function LocationPanel({
  selection,
  onDismiss,
  onBack,
  browsePanelProps,
}: LocationPanelProps) {
  const isIdle = selection.status === "idle";

  return (
    <>
      <aside className="hidden w-96 shrink-0 flex-col border-l border-white/10 bg-surface p-6 lg:flex">
        {isIdle ? (
          <AttractionBrowsePanel {...browsePanelProps} />
        ) : (
          <LocationPanelContent selection={selection} onBack={onBack} />
        )}
      </aside>
      <LocationBottomSheet
        selection={selection}
        onDismiss={onDismiss}
        onBack={onBack}
      />
    </>
  );
}
