"use client";

import { useMemo } from "react";
import ScriptPreview from "./ScriptPreview";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import type { Screenplay } from "@/types/screenplay";

interface StreamingPreviewProps {
  yaml: string;
}

/**
 * 尝试把不完整的 YAML 文本解析为 Screenplay 对象。
 * 通过逐步去掉尾部不完整行来兼容流式场景。
 */
function tryParsePartial(raw: string): Screenplay | null {
  if (!raw || raw.trim().length < 10) return null;

  // 简易 YAML 键值对解析（不依赖 yaml 库，处理不完整文本）
  const lines = raw.split("\n");
  const strategies = [
    lines,
    lines.slice(0, -1),
    lines.slice(0, -2),
    lines.slice(0, -3),
    lines.slice(0, Math.max(1, lines.length - 5)),
  ];

  for (const strategy of strategies) {
    try {
      const result = parseSimpleYaml(strategy.join("\n"));
      if (result && result.scenes && result.scenes.length > 0) {
        return result;
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * 极简 YAML 解析器，专门处理剧本结构。
 * 只处理我们关心的字段，不追求通用性。
 */
function parseSimpleYaml(text: string): Screenplay | null {
  const result: Record<string, unknown> = {};
  const characters: Record<string, unknown>[] = [];
  const scenes: Record<string, unknown>[] = [];

  let currentSection = "";
  let currentScene: Record<string, unknown> | null = null;
  let currentContent: Record<string, unknown>[] = [];
  let currentItem: Record<string, unknown> | null = null;
  let currentChar: Record<string, unknown> | null = null;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // 顶层键
    if (/^title:\s*(.+)/.test(trimmed)) { result.title = trimmed.split(":").slice(1).join(":").trim(); continue; }
    if (/^source_chapter:\s*(.+)/.test(trimmed)) { result.source_chapter = trimmed.split(":").slice(1).join(":").trim(); continue; }
    if (/^genre:\s*(.+)/.test(trimmed)) { result.genre = trimmed.split(":").slice(1).join(":").trim(); continue; }
    if (/^estimated_duration:\s*(.+)/.test(trimmed)) { result.estimated_duration = trimmed.split(":").slice(1).join(":").trim(); continue; }

    // sections
    if (trimmed === "meta:") { currentSection = "meta"; continue; }
    if (trimmed === "characters:") {
      currentSection = "characters";
      if (currentChar) { characters.push(currentChar); currentChar = null; }
      continue;
    }
    if (trimmed === "scenes:") {
      currentSection = "scenes";
      if (currentScene) {
        currentScene.content = currentContent;
        scenes.push(currentScene);
        currentScene = null;
        currentContent = [];
      }
      continue;
    }

    // characters
    if (currentSection === "characters") {
      if (trimmed.startsWith("- id:")) {
        if (currentChar) characters.push(currentChar);
        currentChar = { id: trimmed.split(":").slice(1).join(":").trim() };
      } else if (currentChar) {
        const m = trimmed.match(/^(\w+):\s*(.+)/);
        if (m) currentChar[m[1]] = m[2].trim();
      }
      continue;
    }

    // scenes
    if (currentSection === "scenes") {
      if (/^- scene_number:/.test(trimmed)) {
        if (currentScene) {
          currentScene.content = currentContent;
          scenes.push(currentScene);
          currentContent = [];
        }
        currentScene = { scene_number: parseInt(trimmed.split(":")[1].trim()) || scenes.length + 1 };
      } else if (currentScene) {
        if (trimmed === "content:") continue;
        if (trimmed.startsWith("- type:")) {
          if (currentItem) currentContent.push(currentItem);
          currentItem = { type: trimmed.split(":")[1].trim() };
        } else if (currentItem) {
          const m = trimmed.match(/^(\w+):\s*(.+)/);
          if (m) {
            const val = m[2].trim();
            currentItem[m[1]] = (m[1] === "scene_number") ? (parseInt(val) || val) : val;
          }
        } else {
          const m = trimmed.match(/^(\w+):\s*(.+)/);
          if (m) {
            const val = m[2].trim();
            currentScene[m[1]] = (m[1] === "scene_number") ? (parseInt(val) || val) : val;
          }
        }
      }
    }
  }

  // 收尾
  if (currentItem) currentContent.push(currentItem);
  if (currentScene) { currentScene.content = currentContent; scenes.push(currentScene); }
  if (currentChar) characters.push(currentChar);

  if (scenes.length === 0) return null;

  return {
    meta: {
      title: (result.title as string) || "未命名",
      source_chapter: (result.source_chapter as string) || "",
      genre: (result.genre as string) || "other",
      estimated_duration: (result.estimated_duration as string) || "",
    },
    characters: characters
      .filter(Boolean)
      .map((c, i) => ({
        id: (c.id as string) || `char_${i}`,
        name: (c.name as string) || (c.id as string) || "未知",
        aliases: c.aliases ? [c.aliases as string] : [],
        role: (c.role as string) || "minor",
        description: (c.description as string) || "",
        appearance: (c.appearance as string) || "",
        voice_notes: (c.voice_notes as string) || "",
      })),
    scenes: scenes
      .filter(Boolean)
      .map((s, i) => ({
        scene_number: (s.scene_number as number) || i + 1,
        heading: (s.heading as string) || "",
        location: (s.location as string) || "",
        time: (s.time as string) || "白天",
        atmosphere: (s.atmosphere as string) || "",
        content: ((s.content as Record<string, unknown>[]) || [])
          .filter(Boolean)
          .map((b) => ({
            type: (b.type as string) || "action",
            text: (b.text as string) || undefined,
            character: (b.character as string) || undefined,
            dialogue: (b.dialogue as string) || undefined,
            parenthetical: (b.parenthetical as string) || undefined,
          })),
      })),
  } as Screenplay;
}

export default function StreamingPreview({ yaml }: StreamingPreviewProps) {
  const data = useMemo(() => tryParsePartial(yaml), [yaml]);
  const scroll = useAutoScroll([yaml]);

  return (
    <div className="relative">
      <div
        ref={scroll.containerRef}
        onScroll={scroll.handleScroll}
        className="overflow-auto max-h-[600px]"
      >
        {data ? (
          <ScriptPreview screenplay={data as Screenplay} noScroll />
        ) : (
          <div className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg font-mono whitespace-pre-wrap break-words">
            {yaml}
            <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5" />
          </div>
        )}
      </div>
      {!scroll.isAtBottom && (
        <button
          onClick={scroll.scrollToBottom}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-full shadow-md hover:bg-gray-50 transition flex items-center gap-1 cursor-pointer"
        >
          <span>↓</span> 回到底部
        </button>
      )}
    </div>
  );
}
