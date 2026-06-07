"use client";

import type { Screenplay, ContentBlock } from "@/types/screenplay";

interface ScriptPreviewProps {
  screenplay: Screenplay;
  /** 为 true 时不设内部滚动，由外层容器控制 */
  noScroll?: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  protagonist: "bg-blue-50 text-blue-700 border-blue-200",
  antagonist: "bg-red-50 text-red-700 border-red-200",
  supporting: "bg-green-50 text-green-700 border-green-200",
  minor: "bg-gray-50 text-gray-600 border-gray-200",
  narrator: "bg-purple-50 text-purple-700 border-purple-200",
};

const ROLE_LABELS: Record<string, string> = {
  protagonist: "主角",
  antagonist: "反派",
  supporting: "配角",
  minor: "龙套",
  narrator: "旁白",
};

export default function ScriptPreview({ screenplay, noScroll }: ScriptPreviewProps) {
  const getCharacterName = (id: string): string => {
    const char = screenplay.characters.find((c) => c.id === id);
    return char?.name || id;
  };

  const renderBlock = (block: ContentBlock, key: string | number) => {
    if (!block) return null;
    switch (block.type) {
      case "action":
        return (
          <p key={key} className="my-3 text-sm leading-relaxed text-gray-800">
            {block.text}
          </p>
        );

      case "dialogue":
        return (
          <div key={key} className="my-3">
            <div className="text-center font-bold text-sm text-gray-900">
              {getCharacterName(block.character || "")}
            </div>
            <div className="mx-auto max-w-sm text-center text-sm leading-relaxed text-gray-700 mt-1 px-4">
              {block.dialogue}
            </div>
          </div>
        );

      case "parenthetical":
        return (
          <div key={key} className="text-center text-xs text-gray-500 italic my-1">
            ({block.parenthetical})
          </div>
        );

      case "transition":
        return (
          <div key={key} className="text-right text-xs font-bold uppercase tracking-wider text-gray-500 my-4">
            {block.transition}
          </div>
        );

      case "scene_heading":
        return (
          <div key={key} className="mt-8 mb-3 pb-2 border-b-2 border-gray-800">
            <span className="font-bold text-sm uppercase tracking-wide text-gray-900">
              {block.text}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b">
        <h2 className="text-lg font-bold text-gray-900">{screenplay.meta.title}</h2>
        <div className="text-xs text-gray-500 mt-1.5 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            {screenplay.meta.genre}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            {screenplay.meta.estimated_duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            {screenplay.meta.source_chapter}
          </span>
        </div>
      </div>

      {/* Characters */}
      {screenplay.characters.length > 0 && (
        <div className="px-6 py-3 border-b bg-gray-50/50">
          <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">角色表</div>
          <div className="flex flex-wrap gap-2">
            {screenplay.characters.filter(Boolean).map((c, i) => (
              <span
                key={c.id || i}
                className={`text-xs px-2.5 py-1 rounded-full border ${ROLE_COLORS[c.role || ""] || ROLE_COLORS.minor}`}
              >
                {c.name}
                <span className="opacity-60 ml-1">· {ROLE_LABELS[c.role || ""] || c.role || ""}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scenes */}
      <div className={`p-6 font-mono${noScroll ? "" : " overflow-y-auto"}`} style={noScroll ? undefined : { maxHeight: "500px" }}>
        {screenplay.scenes.filter(Boolean).map((scene, sceneIdx) => (
          <div key={sceneIdx} className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-block px-2 py-0.5 text-xs font-bold bg-gray-800 text-white rounded">
                场景 {scene.scene_number ?? "?"}
              </span>
              <span className="font-bold text-sm text-gray-900">
                {scene.heading || ""}
              </span>
            </div>
            <div className="flex gap-3 text-xs text-gray-400 mb-3 pl-1">
              {scene.location && <span>📍 {scene.location}</span>}
              {scene.time && <span>🕐 {scene.time}</span>}
            </div>
            {scene.atmosphere && (
              <p className="text-xs text-gray-500 italic mb-3 pl-1 border-l-2 border-gray-200 ml-1">
                {scene.atmosphere}
              </p>
            )}
            <div className="pl-2">
              {(scene.content || []).filter(Boolean).map((block, idx) => renderBlock(block, `${sceneIdx}-${idx}`))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
