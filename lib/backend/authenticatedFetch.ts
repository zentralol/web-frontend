export type ClerkTokenProvider = () => Promise<string | null>;

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export async function authenticatedBackendFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  getToken: ClerkTokenProvider,
  fetchImpl: FetchLike = fetch,
): Promise<Response> {
  const token = await getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetchImpl(input, {
    ...init,
    headers,
  });
}
