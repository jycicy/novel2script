"use client";

import { useMemo } from "react";
import jsYaml from "js-yaml";
import ScriptPreview from "./ScriptPreview";
import type { Screenplay } from "@/types/screenplay";

/** 过滤数组中的 null/undefined 元素 */
function cleanArray<T>(arr: T[]): T[] {
  return (arr || []).filter(Boolean);
}

/**
 * 尝试将不完整的 YAML 解析为可用的 Screenplay。
 * 按激进程度逐级尝试，返回第一个成功的结果。
 */
function tryParsePartial(yamlText: string): Screenplay | null {
  if (!yamlText.trim()) return null;

  const attempts = [
    yamlText,                         // 原样
    yamlText.replace(/\n[^\n]*$/, ""), // 去掉尾部残行
    yamlText + "\n",                   // 补换行
    (() => {                           // 截到最后完整 scene
      const i = yamlText.lastIndexOf("  - scene_number:");
      return i > 0 ? yamlText.substring(0, i) : null;
    })(),
    (() => {                           // 只取 characters 部分
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

      // 补全缺失字段
      if (!obj.meta) obj.meta = { title: "…", source_chapter: "", genre: "other", estimated_duration: "" };
      if (!obj.characters) obj.characters = [];
      if (!obj.scenes) obj.scenes = [];

      // 过滤 null 元素
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

  if (partial) {
    return (
      <div className="relative">
        <div className="absolute top-0 right-0 px-2 py-1 text-xs text-blue-500 bg-blue-50 rounded-bl">
          实时预览
        </div>
        <ScriptPreview screenplay={partial} />
      </div>
    );
  }

  return (
    <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-auto max-h-[600px] font-mono whitespace-pre-wrap break-words">
      {yaml}
      <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5" />
    </pre>
  );
}
