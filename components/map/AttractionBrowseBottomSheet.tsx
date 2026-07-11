"use client";

import AttractionBrowsePanel, {
  type AttractionBrowsePanelProps,
} from "@/components/map/AttractionBrowsePanel";

type AttractionBrowseBottomSheetProps = AttractionBrowsePanelProps;

export default function AttractionBrowseBottomSheet(
  props: AttractionBrowseBottomSheetProps,
) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 lg:hidden"
      role="complementary"
      aria-label="Browse attractions"
    >
      <div
        className="flex flex-col overflow-hidden rounded-t-2xl border-t border-white/10 bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(0,0,0,0.35)]"
        style={{ height: "42vh" }}
      >
        <div className="flex shrink-0 flex-col items-center px-6 pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden px-6 pb-4">
          <AttractionBrowsePanel {...props} />
        </div>
      </div>
    </div>
  );
}
