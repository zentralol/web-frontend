"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";
import { authenticatedBackendFetch } from "./authenticatedFetch";

export function useAuthenticatedBackendFetch() {
  const { getToken } = useAuth();

  return useCallback(
    (input: RequestInfo | URL, init?: RequestInit) =>
      authenticatedBackendFetch(input, init, getToken),
    [getToken],
  );
}
