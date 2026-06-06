"use client";

import type { Screenplay, ContentBlock } from "@/types/screenplay";

interface ScriptPreviewProps {
  screenplay: Screenplay;
}

export default function ScriptPreview({ screenplay }: ScriptPreviewProps) {
  const getCharacterName = (id: string): string => {
    const char = screenplay.characters.find((c) => c.id === id);
    return char?.name || id;
  };

  const renderBlock = (block: ContentBlock, idx: number) => {
    switch (block.type) {
      case "action":
        return (
          <p key={idx} className="my-2 text-sm leading-relaxed">
            {block.text}
          </p>
        );

      case "dialogue":
        return (
          <div key={idx} className="my-2">
            <div className="text-center font-bold text-sm tracking-wide">
              {getCharacterName(block.character || "").toUpperCase()}
            </div>
            <div className="mx-auto max-w-md text-center text-sm leading-relaxed">
              {block.dialogue}
            </div>
          </div>
        );

      case "parenthetical":
        return (
          <div key={idx} className="text-center text-xs text-gray-500 italic my-1">
            ({block.parenthetical})
          </div>
        );

      case "transition":
        return (
          <div key={idx} className="text-right text-sm font-medium my-2">
            {block.transition}
          </div>
        );

      case "scene_heading":
        return (
          <div key={idx} className="font-bold text-sm my-4 border-b pb-1">
            {block.text}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h2 className="text-lg font-bold">{screenplay.meta.title}</h2>
        <div className="text-xs text-gray-500 mt-1 flex gap-4">
          <span>类型: {screenplay.meta.genre}</span>
          <span>时长: {screenplay.meta.estimated_duration}</span>
          <span>来源: {screenplay.meta.source_chapter}</span>
        </div>
      </div>

      {/* Characters */}
      {screenplay.characters.length > 0 && (
        <div className="px-6 py-3 border-b bg-gray-50/50">
          <div className="text-xs text-gray-500 mb-1">角色</div>
          <div className="flex flex-wrap gap-2">
            {screenplay.characters.map((c) => (
              <span
                key={c.id}
                className="text-xs px-2 py-1 bg-white border rounded"
              >
                {c.name}
                <span className="text-gray-400 ml-1">({c.role})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scenes */}
      <div className="p-6 font-mono">
        {screenplay.scenes.map((scene) => (
          <div key={scene.scene_number} className="mb-8">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xs text-gray-400">
                SCENE {scene.scene_number}
              </span>
              <span className="font-bold text-sm">
                {scene.heading}
              </span>
            </div>
            {scene.atmosphere && (
              <p className="text-xs text-gray-500 italic mb-2">
                {scene.atmosphere}
              </p>
            )}
            {scene.content.map((block, idx) => renderBlock(block, idx))}
          </div>
        ))}
      </div>
    </div>
  );
}
