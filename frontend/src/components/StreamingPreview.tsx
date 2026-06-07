"use client";

import { useMemo } from "react";
import jsYaml from "js-yaml";
import ScriptPreview from "./ScriptPreview";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import type { Screenplay } from "@/types/screenplay";

function cleanArray<T>(arr: T[]): T[] {
  return (arr || []).filter(Boolean);
}

function tryParsePartial(yamlText: string): Screenplay | null {
  if (!yamlText.trim()) return null;

  const attempts = [
    yamlText,
    yamlText.replace(/\n[^\n]*$/, ""),
    yamlText + "\n",
    (() => {
      const i = yamlText.lastIndexOf("  - scene_number:");
      return i > 0 ? yamlText.substring(0, i) : null;
    })(),
    (() => {
      const c = yamlText.indexOf("characters:");
      const s = yamlText.indexOf("scenes:");
      return c >= 0 && s > c ? yamlText.substring(0, s) : null;
    })(),
  ];

  for (const text of attempts) {
    if (!text) continue;
    try {
      const parsed = jsYaml.load(text);
      if (!parsed || typeof parsed !== "object") continue;
      const obj = parsed as Record<string, unknown>;
      if (!obj.meta && !obj.characters) continue;

      if (!obj.meta) obj.meta = { title: "…", source_chapter: "", genre: "other", estimated_duration: "" };
      if (!obj.characters) obj.characters = [];
      if (!obj.scenes) obj.scenes = [];

      obj.characters = cleanArray(obj.characters as unknown[]);
      obj.scenes = cleanArray(obj.scenes as unknown[]).map((s) => {
        const scene = s as Record<string, unknown>;
        if (Array.isArray(scene.content)) scene.content = cleanArray(scene.content);
        return scene;
      });

      return obj as unknown as Screenplay;
    } catch {
      continue;
    }
  }
  return null;
}

interface StreamingPreviewProps {
  yaml: string;
}

export default function StreamingPreview({ yaml }: StreamingPreviewProps) {
  const partial = useMemo(() => tryParsePartial(yaml), [yaml]);
  const { containerRef, isAtBottom, scrollToBottom, handleScroll } = useAutoScroll([yaml]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-auto max-h-[calc(100vh-200px)]"
      >
        {partial ? (
          <div className="relative">
            <div className="absolute top-0 right-0 px-2 py-1 text-xs text-blue-500 bg-blue-50 rounded-bl z-10">
              实时预览
            </div>
            <ScriptPreview screenplay={partial} noScroll />
          </div>
        ) : (
          <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg font-mono whitespace-pre-wrap break-words">
            {yaml}
            <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5" />
          </pre>
        )}
      </div>

      {/* 回到底部按钮 */}
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-full shadow-md hover:bg-gray-50 transition flex items-center gap-1"
        >
          <span>↓</span> 回到底部
        </button>
      )}
    </div>
  );
}
