import yaml from "js-yaml";
import type { Screenplay } from "@/types/screenplay";

const STORAGE_KEY = "novel2scripts_project";

export interface ProjectState {
  novelText: string;
  chapters: { index: number; title: string }[];
  screenplays: Record<number, Screenplay>;
  activeChapterIndex: number;
}

export function saveProject(state: ProjectState): void {
  try {
    const data = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, data);
  } catch (e) {
    console.error("保存项目失败:", e);
  }
}

export function loadProject(): ProjectState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error("加载项目失败:", e);
    return null;
  }
}

export function clearProject(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportAsYaml(screenplay: Screenplay): Blob {
  const text = yaml.dump(screenplay, { lineWidth: -1, noRefs: true });
  return new Blob([text], { type: "text/yaml" });
}

export function exportAsJson(screenplay: Screenplay): Blob {
  const text = JSON.stringify(screenplay, null, 2);
  return new Blob([text], { type: "application/json" });
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getStorageUsage(): { used: number; total: number; percent: number } {
  let used = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage.getItem(key)?.length || 0;
    }
  }
  const total = 5 * 1024 * 1024;
  return { used, total, percent: Math.round((used / total) * 100) };
}
