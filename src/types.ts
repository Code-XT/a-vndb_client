export interface VNImage {
  id?: string;
  url: string;
  sexual: number;
  violence: number;
}

export interface VNScreenshot {
  url: string;
  sexual: number;
  violence: number;
}

export interface VNDeveloper {
  id: string;
  name: string;
  original: string | null;
}

export interface VNStaff {
  name: string;
  role: string;
}

export interface VNRelation {
  id: string;
  relation: string;
  relation_official: boolean;
  title: string;
}

export interface VNTag {
  id: string;
  name: string;
  rating: number;
  spoiler: number;
  lie: boolean;
  category: string;
}

export interface VNCharacterTrait {
  id: string;
  name: string;
  spoiler: number;
}

export interface VNCharacter {
  id: string;
  name: string;
  original: string | null;
  aliases: string[];
  description: string | null;
  image: VNImage | null;
  role: string; // normalized from vns[].role
  age: number | null;
  sex: [string | null, string | null] | null;
  height: number | null;
  weight: number | null;
  blood_type: string | null;
  traits: VNCharacterTrait[];
  vns: { id: string; role: string; spoiler: number }[];
}

export interface VN {
  id: string;
  title: string;
  alttitle: string | null;
  aliases?: string[];
  olang?: string;
  languages?: string[];
  platforms?: string[];
  image: VNImage | null;
  description: string | null;
  rating: number | null;
  votecount: number | null;
  length_minutes: number | null;
  released: string | null;
  screenshots?: VNScreenshot[];
  developers?: VNDeveloper[];
  publishers?: { id: string; name: string; original: string | null }[];
  staff?: VNStaff[];
  relations?: VNRelation[];
  tags?: VNTag[];
  characters?: VNCharacter[];
}

export interface VNDBResponse<T> {
  results: T[];
  more: boolean;
  count?: number;
}

export type LibraryStatus = 'playing' | 'finished' | 'stalled' | 'dropped' | 'wishlist';

export interface LibraryEntry {
  vn: VN;
  status: LibraryStatus;
  addedAt: number;
}

export interface AuthInfo {
  id: string;
  username: string;
  permissions: string[];
}

export interface UlistLabel {
  id: number;
  label: string;
}

export interface UlistEntry {
  id: string;
  vn: VN;
  labels: UlistLabel[];
  vote: number | null;
  added?: number;
}

// ─── Release types ────────────────────────────────────────────────────────────

export interface ReleaseLanguage {
  lang: string;
  title: string | null;
  latin: string | null;
  mtl: boolean;
  main: boolean;
}

export interface ReleaseProducer {
  id: string;
  name: string;
  original: string | null;
  developer: boolean;
  publisher: boolean;
}

export interface ReleaseExtLink {
  url: string;
  label: string;
  name: string;
  id: string;
}

export interface Release {
  id: string;
  title: string;
  alttitle: string | null;
  languages: ReleaseLanguage[];
  platforms: string[];
  released: string | null;
  minage: number | null;
  patch: boolean;
  freeware: boolean;
  uncensored: boolean | null;
  official: boolean;
  has_ero: boolean;
  resolution: [number, number] | 'non-standard' | null;
  engine: string | null;
  voiced: number | null;
  notes: string | null;
  producers: ReleaseProducer[];
  extlinks: ReleaseExtLink[];
  vns: { id: string; rtype: 'trial' | 'partial' | 'complete' }[];
}
