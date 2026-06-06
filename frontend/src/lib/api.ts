import type { ChapterInfo, Screenplay } from "@/types/screenplay";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getErrorMessage(status: number): string {
  const map: Record<number, string> = {
    400: "请求参数错误",
    404: "接口不存在，请检查后端服务",
    422: "LLM 输出格式不符合预期，请重试",
    500: "服务器内部错误",
    502: "LLM 服务暂时不可用，请稍后重试",
    503: "服务暂不可用，请稍后重试",
  };
  return map[status] || `请求失败 (${status})`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s 超时

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...options,
    });
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("请求超时，LLM 转换可能需要较长时间，请重试");
    }
    if (e instanceof TypeError && e.message.includes("fetch")) {
      throw new Error("网络连接失败，请检查网络或后端服务是否启动");
    }
    throw new Error(`网络错误: ${e instanceof Error ? e.message : "未知错误"}`);
  }

  clearTimeout(timeout);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = error.detail?.message || error.detail;
    throw new Error(detail || getErrorMessage(res.status));
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
