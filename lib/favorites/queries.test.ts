import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, test } from "vitest";
import {
  deleteFavoritePlace,
  listFavoritePlaceKeys,
  updateFavoritePlaceNote,
  upsertFavoritePlace,
} from "./queries";
import type { FavoritePlaceRow, ParsedFavoritePlaceInput } from "./types";

class FakeQuery {
  table = "";
  operation = "";
  filters: [string, unknown][] = [];
  payload: unknown;
  options: unknown;

  constructor(private readonly result: { data: unknown; error: unknown }) {}

  from(table: string) {
    this.table = table;
    return this;
  }

  select() {
    this.operation ||= "select";
    return this;
  }

  upsert(payload: unknown, options: unknown) {
    this.operation = "upsert";
    this.payload = payload;
    this.options = options;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  update(payload: unknown) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  eq(field: string, value: unknown) {
    this.filters.push([field, value]);
    return this;
  }

  order() {
    return this;
  }

  single() {
    return Promise.resolve(this.result);
  }

  then<TResult1 = { data: unknown; error: unknown }>(
    onfulfilled?:
      | ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
  ): Promise<TResult1 | { data: unknown; error: unknown }> {
    return Promise.resolve(this.result).then(onfulfilled ?? undefined);
  }
}

function asSupabase(query: FakeQuery): SupabaseClient {
  return query as unknown as SupabaseClient;
}

const parsedPlace: ParsedFavoritePlaceInput = {
  name: "Bryant Park",
  lat: 40.7536,
  lng: -73.9832,
  address: "New York, NY",
  placeId: "ChIJ123",
  source: "google",
  sourcePlaceId: "ChIJ123",
  placeKey: "google:ChIJ123",
};

const row: FavoritePlaceRow = {
  id: "favorite-1",
  user_id: "user_123",
  place_key: "google:ChIJ123",
  source: "google",
  source_place_id: "ChIJ123",
  name: "Bryant Park",
  address: "New York, NY",
  latitude: 40.7536,
  longitude: -73.9832,
  category: null,
  neighborhood: null,
  note: null,
  created_at: "2026-07-15T12:00:00.000Z",
};

describe("favorite place queries", () => {
  test("scopes favorite key reads to the current user", async () => {
    const query = new FakeQuery({
      data: [{ place_key: "google:ChIJ123" }],
      error: null,
    });

    await expect(listFavoritePlaceKeys(asSupabase(query), "user_123")).resolves.toEqual([
      "google:ChIJ123",
    ]);
    expect(query.table).toBe("favorite_places");
    expect(query.filters).toContainEqual(["user_id", "user_123"]);
  });

  test("upserts on the per-user place identity", async () => {
    const query = new FakeQuery({ data: row, error: null });

    await upsertFavoritePlace(asSupabase(query), "user_123", parsedPlace);

    expect(query.operation).toBe("upsert");
    expect(query.options).toEqual({ onConflict: "user_id,place_key" });
    expect(query.payload).toMatchObject({
      user_id: "user_123",
      place_key: "google:ChIJ123",
      source: "google",
    });
  });

  test("scopes deletion by both user and place key", async () => {
    const query = new FakeQuery({ data: null, error: null });

    await deleteFavoritePlace(asSupabase(query), "user_123", "google:ChIJ123");

    expect(query.operation).toBe("delete");
    expect(query.filters).toEqual([
      ["user_id", "user_123"],
      ["place_key", "google:ChIJ123"],
    ]);
  });

  test("updates a note only for the current user's place", async () => {
    const query = new FakeQuery({ data: null, error: null });

    await updateFavoritePlaceNote(
      asSupabase(query),
      "user_123",
      "google:ChIJ123",
      "Visit near sunset",
    );

    expect(query.operation).toBe("update");
    expect(query.payload).toEqual({ note: "Visit near sunset" });
    expect(query.filters).toEqual([
      ["user_id", "user_123"],
      ["place_key", "google:ChIJ123"],
    ]);
  });

  test("stores an empty note as null", async () => {
    const query = new FakeQuery({ data: null, error: null });

    await updateFavoritePlaceNote(
      asSupabase(query),
      "user_123",
      "google:ChIJ123",
      "",
    );

    expect(query.payload).toEqual({ note: null });
  });
});
