"use client";

import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { LocateFixed, Loader2 } from "lucide-react";
import { requestCurrentPosition } from "@/lib/geo/requestCurrentPosition";
import type { RouteLocation } from "@/lib/routes/types";

const CURRENT_LOCATION_LABEL = "Current location";

type PlaceAutocompleteInputProps = {
  variant: "origin" | "destination";
  value: RouteLocation;
  active?: boolean;
  disabled?: boolean;
  onChange: (location: RouteLocation) => void;
  onFocus?: () => void;
};

export default function PlaceAutocompleteInput({
  variant,
  value,
  active = false,
  disabled = false,
  onChange,
  onFocus,
}: PlaceAutocompleteInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef =
    useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const placesLib = useMapsLibrary("places");
  const onChangeRef = useRef(onChange);
  const onFocusRef = useRef(onFocus);
  const disabledRef = useRef(disabled);
  const valueLabelRef = useRef(value.label);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleUseCurrentLocation = async () => {
    if (disabled || locating) return;
    setLocating(true);
    setLocationError(null);
    try {
      const coords = await requestCurrentPosition();
      onChangeRef.current({
        lat: coords.lat,
        lng: coords.lng,
        label: CURRENT_LOCATION_LABEL,
      });
    } catch {
      setLocationError("Couldn't get your location. Check location permissions.");
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    valueLabelRef.current = value.label;
  }, [value.label]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onFocusRef.current = onFocus;
  }, [onFocus]);

  useEffect(() => {
    if (!placesLib || !containerRef.current) return;

    const autocomplete = new placesLib.PlaceAutocompleteElement({
      value: valueLabelRef.current,
      disabled: disabledRef.current,
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
      if (disabledRef.current) return;

      const prediction = event.placePrediction;
      if (!prediction) return;

      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["location", "displayName", "formattedAddress"],
      });

      const location = place.location;
      if (!location || disabledRef.current) return;

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

  useEffect(() => {
    const autocomplete = autocompleteRef.current;
    if (!autocomplete) return;
    autocomplete.disabled = disabled;
  }, [disabled]);

  const borderClass = active
    ? variant === "origin"
      ? "border-[#34C759]/50"
      : "border-[#FF3B30]/50"
    : "border-white/10";

  return (
    <div className="space-y-1">
      <div
        aria-disabled={disabled}
        className={`flex items-center gap-3 rounded-xl border bg-white/[0.04] px-3 py-2 transition-colors ${borderClass} ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        }`}
        onFocusCapture={() => {
          if (!disabled) {
            onFocusRef.current?.();
          }
        }}
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
        <div
          ref={containerRef}
          className={`min-w-0 flex-1 ${disabled ? "pointer-events-none" : ""}`}
        />
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={disabled || locating}
          aria-label={`Use current location for ${variant}`}
          title="Use current location"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <LocateFixed className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
      {locationError && (
        <p className="pl-8 text-[11px] text-[#ff3b30]">{locationError}</p>
      )}
    </div>
  );
}
