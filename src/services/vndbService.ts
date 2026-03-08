import { VN, VNDBResponse, AuthInfo, UlistEntry, VNCharacter } from "../types";

// Vite proxies /api/kana -> https://api.vndb.org/kana in dev (vite.config.ts).
// In production configure your reverse-proxy the same way.
const BASE_URL = "/api/kana";

export interface QueryOptions {
  page?: number;
  sort?: string;
  reverse?: boolean;
  search?: string;
  filters?: any[];
  results?: number;
}

export const queryVNs = async (
  options: QueryOptions,
): Promise<VNDBResponse<VN>> => {
  const {
    page = 1,
    sort = "rating",
    reverse = true,
    search,
    filters,
    results = 20,
  } = options;

  let finalFilters: any;

  if (search && filters && filters.length > 0) {
    finalFilters = ["and", ["search", "=", search], ...filters];
  } else if (search) {
    finalFilters = ["search", "=", search];
  } else if (filters && filters.length > 0) {
    finalFilters = filters.length === 1 ? filters[0] : ["and", ...filters];
  } else {
    finalFilters = ["id", ">=", "v1"];
  }

  const response = await fetch(`${BASE_URL}/vn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filters: finalFilters,
      fields:
        "id, title, alttitle, image.url, image.sexual, image.violence, description, rating, votecount, length_minutes, released, platforms, languages, developers.id, developers.name",
      sort: search && sort === "rating" ? "searchrank" : sort,
      reverse: search && sort === "rating" ? false : reverse,
      results,
      page,
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Failed to fetch VNs: ${response.status} ${txt}`);
  }
  return response.json();
};

export const getVN = async (id: string): Promise<VN | null> => {
  const response = await fetch(`${BASE_URL}/vn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filters: ["id", "=", id],
      fields: [
        "id",
        "title",
        "alttitle",
        "aliases",
        "olang",
        "languages",
        "platforms",
        "image.id",
        "image.url",
        "image.sexual",
        "image.violence",
        "description",
        "rating",
        "votecount",
        "length_minutes",
        "released",
        "screenshots.url",
        "screenshots.sexual",
        "screenshots.violence",
        "developers.id",
        "developers.name",
        "developers.original",
        "staff.name",
        "staff.role",
        "relations.relation",
        "relations.relation_official",
        "relations.id",
        "relations.title",
        "tags.id",
        "tags.name",
        "tags.rating",
        "tags.spoiler",
        "tags.lie",
        "tags.category",
      ].join(", "),
      results: 1,
    }),
  });

  if (!response.ok) throw new Error("Failed to fetch VN details");
  const data: VNDBResponse<VN> = await response.json();
  return data.results.length > 0 ? data.results[0] : null;
};

// Fetch publishers separately via /release
export const getVNPublishers = async (
  vnId: string,
): Promise<{ id: string; name: string; original: string | null }[]> => {
  try {
    const response = await fetch(`${BASE_URL}/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filters: ["and", ["vn", "=", ["id", "=", vnId]], ["official", "=", 1]],
        fields:
          "producers.id, producers.name, producers.original, producers.publisher",
        results: 10,
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    const publishers: { id: string; name: string; original: string | null }[] =
      [];
    const seen = new Set<string>();
    for (const rel of data.results || []) {
      for (const p of rel.producers || []) {
        if (p.publisher && !seen.has(p.id)) {
          seen.add(p.id);
          publishers.push({ id: p.id, name: p.name, original: p.original });
        }
      }
    }
    return publishers;
  } catch {
    return [];
  }
};

export const getVNCharacters = async (vnId: string): Promise<VNCharacter[]> => {
  try {
    const response = await fetch(`${BASE_URL}/character`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filters: ["vn", "=", ["id", "=", vnId]],
        fields:
          "id, name, original, aliases, description, image.url, image.sexual, image.violence, age, sex, height, weight, blood_type, traits.id, traits.name, traits.spoiler, vns.id, vns.role, vns.spoiler",
        results: 25,
        sort: "id",
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map((c: any) => ({
      ...c,
      // role is per-VN, find the one for our VN
      role:
        c.vns?.find((v: any) => v.id === vnId)?.role ??
        c.vns?.[0]?.role ??
        "appears",
    }));
  } catch (e) {
    console.error("getVNCharacters failed", e);
    return [];
  }
};

export const fetchAuthInfo = async (token: string): Promise<AuthInfo> => {
  const response = await fetch(`${BASE_URL}/authinfo`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!response.ok) throw new Error("Invalid token");
  return response.json();
};

export const fetchUlist = async (
  token: string,
  userId: string,
  page: number = 1,
): Promise<VNDBResponse<UlistEntry>> => {
  const response = await fetch(`${BASE_URL}/ulist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      user: userId,
      fields:
        "id, added, vote, vn.id, vn.title, vn.alttitle, vn.image.url, vn.image.sexual, vn.image.violence, vn.rating, vn.votecount, vn.released, vn.length_minutes, labels.id, labels.label",
      results: 50,
      page,
    }),
  });
  if (!response.ok) throw new Error("Failed to fetch ulist");
  return response.json();
};

// vote must be 10–100 or null to clear
export const updateUlist = async (
  token: string,
  vnId: string,
  labels: number[],
  vote?: number | null,
): Promise<void> => {
  const body: any = { labels_set: labels };
  if (vote !== undefined) body.vote = vote; // null is valid (clears vote)
  await removeFromUlist(token, vnId);
  const response = await fetch(`${BASE_URL}/ulist/${vnId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Failed to update library: ${txt}`);
  }
};

export const removeFromUlist = async (
  token: string,
  vnId: string,
): Promise<void> => {
  const response = await fetch(`${BASE_URL}/ulist/${vnId}`, {
    method: "DELETE",
    headers: { Authorization: `Token ${token}` },
  });
  if (!response.ok) throw new Error("Failed to remove from library");
};

export const getVNReleases = async (
  vnId: string,
): Promise<import("../types").Release[]> => {
  try {
    const response = await fetch(`${BASE_URL}/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filters: ["vn", "=", ["id", "=", vnId]],
        fields: [
          "id",
          "title",
          "alttitle",
          "languages.lang",
          "languages.title",
          "languages.latin",
          "languages.mtl",
          "languages.main",
          "platforms",
          "released",
          "minage",
          "patch",
          "freeware",
          "uncensored",
          "official",
          "has_ero",
          "resolution",
          "engine",
          "voiced",
          "notes",
          "producers.id",
          "producers.name",
          "producers.original",
          "producers.developer",
          "producers.publisher",
          "extlinks.url",
          "extlinks.label",
          "extlinks.name",
          "extlinks.id",
          "vns.id",
          "vns.rtype",
        ].join(", "),
        sort: "released",
        reverse: false,
        results: 100,
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (e) {
    console.error("getVNReleases failed", e);
    return [];
  }
};

export interface ReleaseQueryOptions {
  search?: string;
  page?: number;
  results?: number;
  sort?: string;
  reverse?: boolean;
  filters?: any[];
}

export const queryReleases = async (
  opts: ReleaseQueryOptions,
): Promise<import("../types").VNDBResponse<import("../types").Release>> => {
  const {
    search,
    page = 1,
    results = 25,
    sort = "released",
    reverse = true,
    filters = [],
  } = opts;

  const allFilters: any[] = [...filters];
  if (search) allFilters.push(["search", "=", search]);

  const finalFilter =
    allFilters.length === 0
      ? ["id", ">=", "r1"]
      : allFilters.length === 1
        ? allFilters[0]
        : ["and", ...allFilters];

  const response = await fetch(`${BASE_URL}/release`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filters: finalFilter,
      fields: [
        "id",
        "title",
        "alttitle",
        "languages.lang",
        "languages.title",
        "languages.latin",
        "languages.mtl",
        "languages.main",
        "platforms",
        "released",
        "minage",
        "patch",
        "freeware",
        "uncensored",
        "official",
        "has_ero",
        "engine",
        "voiced",
        "resolution",
        "producers.id",
        "producers.name",
        "producers.developer",
        "producers.publisher",
        "extlinks.url",
        "extlinks.label",
        "extlinks.name",
        "vns.id",
        "vns.title",
        "vns.alttitle",
        "vns.image.url",
        "vns.image.sexual",
        "vns.image.violence",
        "vns.rtype",
      ].join(", "),
      sort: search ? "searchrank" : sort,
      reverse: search ? false : reverse,
      results,
      page,
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Release query failed: ${response.status} ${txt}`);
  }
  return response.json();
};
