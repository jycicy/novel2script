"use client";

import { useState } from "react";

interface SchemaField {
  type: string;
  description?: string;
  enum?: string[];
  pattern?: string;
  properties?: Record<string, SchemaField>;
  items?: SchemaField;
  required?: string[];
}

const SCHEMA_FIELDS: Record<string, { label: string; desc: string; fields: string[] }> = {
  meta: {
    label: "meta — 元信息",
    desc: "剧本基本信息：标题、类型、时长等",
    fields: ["title", "source_chapter", "genre", "estimated_duration"],
  },
  characters: {
    label: "characters — 角色列表",
    desc: "角色 ID、名称、类型、描述等",
    fields: ["id", "name", "role", "description", "appearance"],
  },
  scenes: {
    label: "scenes — 场景列表",
    desc: "场景标题、地点、时间、氛围、内容块",
    fields: ["scene_number", "heading", "location", "time", "content"],
  },
};

const GENRES = ["drama", "comedy", "thriller", "romance", "horror", "action", "scifi", "fantasy", "literary", "other"];
const ROLES = ["protagonist", "antagonist", "supporting", "minor", "narrator"];
const CONTENT_TYPES = ["action", "dialogue", "parenthetical", "transition", "scene_heading"];

interface SchemaViewerProps {
  onClose?: () => void;
}

export default function SchemaViewer({ onClose }: SchemaViewerProps) {
  const [expanded, setExpanded] = useState<string | null>("meta");

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <span className="text-sm font-medium">YAML Schema 规范</span>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        )}
      </div>

      <div className="p-4 space-y-3 text-sm">
        <p className="text-gray-500 text-xs">剧本必须包含以下三个顶级字段：</p>

        {Object.entries(SCHEMA_FIELDS).map(([key, info]) => (
          <div key={key} className="border rounded">
            <button
              onClick={() => setExpanded(expanded === key ? null : key)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="font-mono font-medium text-blue-700">{info.label}</span>
              <span className="text-gray-400">{expanded === key ? "▾" : "▸"}</span>
            </button>

            {expanded === key && (
              <div className="px-3 pb-3 border-t">
                <p className="text-gray-500 text-xs mt-2 mb-2">{info.desc}</p>
                <div className="space-y-1">
                  {info.fields.map((f) => (
                    <div key={f} className="flex gap-2">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{f}</code>
                    </div>
                  ))}
                </div>

                {key === "meta" && (
                  <div className="mt-2 text-xs text-gray-400">
                    genre 枚举: {GENRES.join(", ")}
                  </div>
                )}
                {key === "characters" && (
                  <div className="mt-2 text-xs text-gray-400">
                    role 枚举: {ROLES.join(", ")}
                  </div>
                )}
                {key === "scenes" && (
                  <div className="mt-2 text-xs text-gray-400">
                    content.type 枚举: {CONTENT_TYPES.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="pt-2 border-t text-xs text-gray-400">
          <p>示例结构：</p>
          <pre className="mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
{`meta:
  title: "剧本标题"
  genre: "drama"
  source_chapter: "第一章"
  estimated_duration: "30min"
characters:
  - id: "protagonist"
    name: "主角名"
    role: "protagonist"
scenes:
  - scene_number: 1
    heading: "场景标题"
    location: "地点"
    time: "时间"
    content:
      - type: "action"
        text: "动作描述"
      - type: "dialogue"
        character: "protagonist"
        dialogue: "对白内容"`}
          </pre>
        </div>
      </div>
    </div>
  );
}
