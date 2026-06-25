"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import type { RouteLocation } from "@/lib/routes/types";

type PlaceAutocompleteInputProps = {
  variant: "origin" | "destination";
  value: RouteLocation;
  active?: boolean;
  onChange: (location: RouteLocation) => void;
  onFocus?: () => void;
};

export default function PlaceAutocompleteInput({
  variant,
  value,
  active = false,
  onChange,
  onFocus,
}: PlaceAutocompleteInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef =
    useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const placesLib = useMapsLibrary("places");
  const onChangeRef = useRef(onChange);
  const onFocusRef = useRef(onFocus);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onFocusRef.current = onFocus;
  }, [onFocus]);

  useEffect(() => {
    if (!placesLib || !containerRef.current) return;

    const autocomplete = new placesLib.PlaceAutocompleteElement({
      value: value.label,
      includedRegionCodes: ["us"],
      locationBias: {
        center: { lat: 40.758, lng: -73.9855 },
        radius: 15000,
      },
    });

    autocomplete.classList.add("route-place-autocomplete");
    autocompleteRef.current = autocomplete;

    const handleSelect = async (
      event: google.maps.places.PlacePredictionSelectEvent,
    ) => {
      const prediction = event.placePrediction;
      if (!prediction) return;

      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["location", "displayName", "formattedAddress"],
      });

      const location = place.location;
      if (!location) return;

      onChangeRef.current({
        lat: location.lat(),
        lng: location.lng(),
        label:
          place.formattedAddress ??
          place.displayName ??
          "Selected location",
      });
    };

    autocomplete.addEventListener(
      "gmp-select",
      handleSelect as unknown as EventListener,
    );
    containerRef.current.appendChild(autocomplete);

    return () => {
      autocomplete.removeEventListener(
        "gmp-select",
        handleSelect as unknown as EventListener,
      );
      autocomplete.remove();
      autocompleteRef.current = null;
    };
  }, [placesLib]);

  useEffect(() => {
    const autocomplete = autocompleteRef.current;
    if (!autocomplete || autocomplete.value === value.label) return;
    autocomplete.value = value.label;
  }, [value.label]);

  const borderClass = active
    ? variant === "origin"
      ? "border-[#34C759]/50"
      : "border-[#FF3B30]/50"
    : "border-white/10";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-white/[0.04] px-3 py-2 transition-colors ${borderClass}`}
      onFocusCapture={() => onFocusRef.current?.()}
    >
      {variant === "origin" ? (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: "#34C759", border: "2px solid #ffffff" }}
          aria-hidden
        >
          A
        </span>
      ) : (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: "#FF3B30", border: "2px solid #ffffff" }}
          aria-hidden
        >
          B
        </span>
      )}
      <div ref={containerRef} className="min-w-0 flex-1" />
    </div>
  );
}
