"use client";

import { useState } from "react";
import type { Character } from "@/types/screenplay";

interface CharacterPanelProps {
  characters: Character[];
}

export default function CharacterPanel({ characters }: CharacterPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const roleLabel: Record<string, string> = {
    protagonist: "主角",
    antagonist: "反派",
    supporting: "配角",
    minor: "龙套",
    narrator: "旁白",
  };

  const roleColor: Record<string, string> = {
    protagonist: "bg-blue-100 text-blue-700",
    antagonist: "bg-red-100 text-red-700",
    supporting: "bg-green-100 text-green-700",
    minor: "bg-gray-100 text-gray-600",
    narrator: "bg-purple-100 text-purple-700",
  };

  if (characters.length === 0) {
    return (
      <div className="border rounded-lg p-4 text-sm text-gray-400 text-center">
        暂无角色信息
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <span className="text-sm font-medium">
          角色列表 ({characters.length})
        </span>
      </div>
      <ul className="divide-y">
        {characters.map((char) => {
          const isExpanded = expandedId === char.id;
          return (
            <li key={char.id}>
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : char.id)
                }
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{char.name}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      roleColor[char.role] || "bg-gray-100"
                    }`}
                  >
                    {roleLabel[char.role] || char.role}
                  </span>
                </div>
                {char.description && !isExpanded && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {char.description}
                  </p>
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 text-xs text-gray-600 space-y-1">
                  <div>
                    <span className="text-gray-400">ID: </span>
                    {char.id}
                  </div>
                  {char.aliases && char.aliases.length > 0 && (
                    <div>
                      <span className="text-gray-400">别名: </span>
                      {char.aliases.join(", ")}
                    </div>
                  )}
                  {char.description && (
                    <div>
                      <span className="text-gray-400">描述: </span>
                      {char.description}
                    </div>
                  )}
                  {char.appearance && (
                    <div>
                      <span className="text-gray-400">外貌: </span>
                      {char.appearance}
                    </div>
                  )}
                  {char.voice_notes && (
                    <div>
                      <span className="text-gray-400">语气: </span>
                      {char.voice_notes}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
