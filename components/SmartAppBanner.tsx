"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { getStoreUrl } from "@/lib/app/storeLinks";

const DISMISS_KEY = "zentra-app-banner-dismissed";
const BANNER_HEIGHT = "52px";
const LG_BREAKPOINT = 1024;

function setBannerHeight(height: string) {
  document.documentElement.style.setProperty("--app-banner-height", height);
}

export default function SmartAppBanner() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  const visible = mounted && !dismissed && !isDesktop;

  useEffect(() => {
    setMounted(true);
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");

    const media = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    const syncViewport = () => {
      const desktop = media.matches;
      setIsDesktop(desktop);
      if (desktop) {
        setBannerHeight("0px");
      }
    };

    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (!mounted || isDesktop) {
      setBannerHeight("0px");
      return;
    }

    setBannerHeight(dismissed ? "0px" : BANNER_HEIGHT);
  }, [mounted, dismissed, isDesktop]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    setBannerHeight("0px");
  }, []);

  const handleGetClick = useCallback(() => {
    const storeUrl = getStoreUrl(navigator.userAgent);
    if (storeUrl) {
      window.open(storeUrl, "_blank", "noopener,noreferrer");
    }
  }, []);

  if (!visible) {
    return null;
  }

  const storeUrl = typeof navigator !== "undefined" ? getStoreUrl(navigator.userAgent) : null;

  return (
    <div
      className="fixed inset-x-0 top-header z-40 flex h-[52px] items-center gap-3 border-b border-white/10 bg-surface/95 px-4 backdrop-blur sm:px-6 lg:hidden"
      role="region"
      aria-label="App download suggestion"
    >
      <div
        className={`${spaceGrotesk.className} flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-sm font-light tracking-widest text-accent`}
        aria-hidden="true"
      >
        Z
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          Get the Zentra app
        </p>
        <p className="truncate text-xs text-white/50">
          Coming soon · Better on mobile
        </p>
      </div>

      {storeUrl ? (
        <button
          type="button"
          onClick={handleGetClick}
          className={`${spaceGrotesk.className} shrink-0 rounded-full bg-accent px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-surface transition-opacity hover:opacity-90`}
        >
          Get
        </button>
      ) : (
        <span
          className={`${spaceGrotesk.className} shrink-0 cursor-not-allowed rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40`}
          aria-disabled="true"
        >
          Soon
        </span>
      )}

      <button
        type="button"
        onClick={dismiss}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        aria-label="Dismiss app banner"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
