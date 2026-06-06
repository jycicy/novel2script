import type { ChapterInfo, Screenplay } from "@/types/screenplay";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail?.message || error.detail || `请求失败: ${res.status}`);
  }

  return res.json();
}

export async function detectChapters(text: string): Promise<ChapterInfo[]> {
  const res = await request<{ chapters: ChapterInfo[] }>("/api/detect-chapters", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return res.chapters;
}

export interface ConvertRequest {
  chapter_text: string;
  chapter_index: number;
  title: string;
  previous_characters?: { id: string; name: string; role: string }[];
}

export async function convertChapter(req: ConvertRequest): Promise<Screenplay> {
  const res = await request<{ screenplay: Screenplay }>("/api/convert", {
    method: "POST",
    body: JSON.stringify(req),
  });
  return res.screenplay;
}

export interface ValidateResponse {
  valid: boolean;
  errors: { line?: number; message: string }[];
  screenplay?: Screenplay;
}

export async function validateYaml(yamlText: string): Promise<ValidateResponse> {
  return request<ValidateResponse>("/api/validate", {
    method: "POST",
    body: JSON.stringify({ yaml_text: yamlText }),
  });
}
