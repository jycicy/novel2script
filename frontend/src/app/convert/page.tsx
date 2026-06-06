"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ChapterSelector from "@/components/ChapterSelector";
import ScriptPreview from "@/components/ScriptPreview";
import ScriptEditor from "@/components/ScriptEditor";
import CharacterPanel from "@/components/CharacterPanel";
import ExportMenu from "@/components/ExportMenu";
import ConversionProgress from "@/components/ConversionProgress";
import SchemaViewer from "@/components/SchemaViewer";
import { loadProject, saveProject } from "@/lib/storage";
import { convertChapter, convertStream } from "@/lib/api";
import type { ChapterInfo, Screenplay } from "@/types/screenplay";

export default function ConvertPage() {
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [screenplays, setScreenplays] = useState<Record<number, Screenplay>>({});
  const [viewMode, setViewMode] = useState<"preview" | "editor">("preview");
  const [showSchema, setShowSchema] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");
  const [statusMap, setStatusMap] = useState<Record<number, "pending" | "converting" | "done" | "error">>({});

  // Load from localStorage on mount
  useEffect(() => {
    const project = loadProject();
    if (project) {
      setChapters(project.chapters as ChapterInfo[]);
      setScreenplays(project.screenplays);
      setActiveIndex(project.activeChapterIndex);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (chapters.length > 0) {
      saveProject({
        novelText: "",
        chapters: chapters.map((c) => ({ index: c.index, title: c.title, content: c.content, start_line: c.start_line, end_line: c.end_line, char_count: c.char_count })),
        screenplays,
        activeChapterIndex: activeIndex,
      });
    }
  }, [chapters, screenplays, activeIndex]);

  const currentScreenplay = screenplays[activeIndex];

  const handleConvert = async (index: number) => {
    const chapter = chapters[index];
    if (!chapter) return;

    setStatusMap((prev) => ({ ...prev, [index]: "converting" }));
    setIsConverting(true);
    setError("");

    try {
      // Get previous chapter's characters for consistency
      const prevChars = index > 0 ? screenplays[index - 1]?.characters : undefined;

      const result = await convertChapter({
        chapter_text: chapter.content,
        chapter_index: index,
        title: chapter.title,
        previous_characters: prevChars?.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role,
        })),
      });

      setScreenplays((prev) => ({ ...prev, [index]: result }));
      setStatusMap((prev) => ({ ...prev, [index]: "done" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "转换失败");
      setStatusMap((prev) => ({ ...prev, [index]: "error" }));
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvertAll = async () => {
    const pending = chapters.filter((c) => statusMap[c.index] !== "done");
    if (pending.length === 0) return;

    setIsConverting(true);
    setError("");

    // 标记所有待转换章节为 converting
    const newStatus: Record<number, "converting"> = {};
    pending.forEach((c) => (newStatus[c.index] = "converting"));
    setStatusMap((prev) => ({ ...prev, ...newStatus }));

    try {
      await convertStream(
        pending.map((c) => ({
          chapter_text: c.content,
          chapter_index: c.index,
          title: c.title,
        })),
        (event) => {
          if (event.type === "chapter_done" && event.index !== undefined && event.screenplay) {
            setScreenplays((prev) => ({ ...prev, [event.index!]: event.screenplay! }));
            setStatusMap((prev) => ({ ...prev, [event.index!]: "done" }));
          } else if (event.type === "error" && event.index !== undefined) {
            setStatusMap((prev) => ({ ...prev, [event.index!]: "error" }));
          }
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "批量转换失败");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Novel2Scripts
        </Link>
        <div className="flex items-center gap-3">
          {currentScreenplay && <ExportMenu screenplay={currentScreenplay} />}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left: Chapter Selector */}
        <aside className="w-64 border-r p-4 overflow-y-auto">
          <ChapterSelector
            chapters={chapters}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            onConvertAll={handleConvertAll}
            statusMap={statusMap}
          />
        </aside>

        {/* Center: Preview / Editor */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* View Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 text-sm rounded ${
                viewMode === "preview"
                  ? "bg-blue-600 text-white"
                  : "border hover:bg-gray-50"
              }`}
            >
              预览
            </button>
            <button
              onClick={() => setViewMode("editor")}
              className={`px-3 py-1.5 text-sm rounded ${
                viewMode === "editor"
                  ? "bg-blue-600 text-white"
                  : "border hover:bg-gray-50"
              }`}
            >
              编辑
            </button>
            <button
              onClick={() => setShowSchema(!showSchema)}
              className={`px-3 py-1.5 text-sm rounded ${
                showSchema
                  ? "bg-purple-600 text-white"
                  : "border hover:bg-gray-50"
              }`}
            >
              Schema
            </button>
            {!currentScreenplay && !isConverting && (
              <button
                onClick={() => handleConvert(activeIndex)}
                className="ml-auto px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                转换此章
              </button>
            )}
          </div>

          {/* Progress */}
          <ConversionProgress
            isConverting={isConverting}
            error={error}
            onRetry={() => handleConvert(activeIndex)}
          />

          {/* Content */}
          {currentScreenplay && !isConverting && (
            <>
              {viewMode === "preview" ? (
                <ScriptPreview screenplay={currentScreenplay} />
              ) : (
                <ScriptEditor
                  screenplay={currentScreenplay}
                  onChange={(text) => console.log("edited", text.length)}
                />
              )}
            </>
          )}

          {!currentScreenplay && !isConverting && !error && (
            <div className="text-center text-gray-400 py-20">
              <p className="text-lg mb-2">暂无剧本内容</p>
              <p className="text-sm">请先选择章节并点击"转换此章"</p>
            </div>
          )}

          {/* Schema Viewer */}
          {showSchema && (
            <div className="mt-4">
              <SchemaViewer onClose={() => setShowSchema(false)} />
            </div>
          )}
        </div>

        {/* Right: Character Panel */}
        <aside className="w-72 border-l p-4 overflow-y-auto">
          <CharacterPanel characters={currentScreenplay?.characters || []} />
        </aside>
      </div>
    </main>
  );
}
