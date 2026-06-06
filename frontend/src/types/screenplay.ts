export type Genre =
  | "drama"
  | "comedy"
  | "thriller"
  | "romance"
  | "horror"
  | "action"
  | "scifi"
  | "fantasy"
  | "literary"
  | "other";

export type CharacterRole =
  | "protagonist"
  | "antagonist"
  | "supporting"
  | "minor"
  | "narrator";

export type ContentType =
  | "action"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "scene_heading";

export interface Meta {
  title: string;
  source_chapter: string;
  genre: Genre;
  estimated_duration: string;
  author?: string;
  version?: string;
  created_at?: string;
}

export interface Character {
  id: string;
  name: string;
  aliases?: string[];
  role: CharacterRole;
  description?: string;
  appearance?: string;
  voice_notes?: string;
}

export interface ContentBlock {
  type: ContentType;
  text?: string;
  character?: string;
  dialogue?: string;
  parenthetical?: string;
  transition?: string;
}

export interface Scene {
  scene_number: number;
  heading: string;
  location: string;
  time: string;
  atmosphere?: string;
  content: ContentBlock[];
}

export interface Screenplay {
  meta: Meta;
  characters: Character[];
  scenes: Scene[];
}

export interface ChapterInfo {
  index: number;
  title: string;
  content: string;
  start_line: number;
  end_line: number;
  char_count: number;
}
