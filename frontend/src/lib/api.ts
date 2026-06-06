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

export interface StreamEvent {
  type: "chapter_done" | "error" | "done";
  index?: number;
  title?: string;
  screenplay?: Screenplay;
  progress?: string;
  error?: string;
  success_count?: number;
  fail_count?: number;
}

export async function convertStream(
  chapters: { chapter_text: string; chapter_index: number; title: string }[],
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const BASE = process.env.NEXT_PUBLIC_API_URL || "";
  const res = await fetch(`${BASE}/api/convert/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chapters }),
  });

  if (!res.ok) {
    throw new Error(`流式转换失败: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("无法读取响应流");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const event = JSON.parse(trimmed) as StreamEvent;
        onEvent(event);
      } catch {
        // skip non-JSON lines
      }
    }
  }

  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer.trim()) as StreamEvent;
      onEvent(event);
    } catch {
      // ignore
    }
  }
}
