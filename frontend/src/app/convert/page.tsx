"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ChapterSelector from "@/components/ChapterSelector";
import ScriptPreview from "@/components/ScriptPreview";
import ScriptEditor from "@/components/ScriptEditor";
import CharacterPanel from "@/components/CharacterPanel";
import ExportMenu from "@/components/ExportMenu";
import SchemaViewer from "@/components/SchemaViewer";
import { loadProject, saveProject } from "@/lib/storage";
import { convertChapter } from "@/lib/api";
import type { ChapterInfo, Screenplay } from "@/types/screenplay";

export default function ConvertPage() {
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [screenplays, setScreenplays] = useState<Record<number, Screenplay>>({});
  const [viewMode, setViewMode] = useState<"preview" | "editor" | "schema">("preview");
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");
  const [statusMap, setStatusMap] = useState<Record<number, "pending" | "waiting" | "queued" | "converting" | "done" | "error">>({});
  const cancelRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const queueRef = useRef<number[]>([]);

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

  // 转换队列：当前转换完成后自动处理下一个
  useEffect(() => {
    if (!isConverting && queueRef.current.length > 0) {
      const nextIndex = queueRef.current.shift()!;
      handleConvert(nextIndex);
    }
  }, [isConverting]);

  const handleCancel = () => {
    cancelRef.current = true;
    abortRef.current?.abort();
    queueRef.current = [];
    // 重置所有非完成状态为 pending
    setStatusMap((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[Number(key)] !== "done") {
          next[Number(key)] = "pending";
        }
      }
      return next;
    });
  };

  const handleConvert = async (index: number) => {
    const chapter = chapters[index];
    if (!chapter) return;

    const controller = new AbortController();
    abortRef.current = controller;
    cancelRef.current = false;

    setStatusMap((prev) => ({ ...prev, [index]: "converting" }));
    setIsConverting(true);
    setError("");
    setActiveIndex(index);

    try {
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
      }, controller.signal);

      if (cancelRef.current) {
        setStatusMap((prev) => ({ ...prev, [index]: "pending" }));
        return;
      }

      setScreenplays((prev) => ({ ...prev, [index]: result }));
      setStatusMap((prev) => ({ ...prev, [index]: "done" }));
    } catch (e) {
      if (cancelRef.current) {
        setStatusMap((prev) => ({ ...prev, [index]: "pending" }));
        return;
      }
      setError(e instanceof Error ? e.message : "转换失败");
      setStatusMap((prev) => ({ ...prev, [index]: "error" }));
    } finally {
      setIsConverting(false);
      abortRef.current = null;
    }
  };

  const handleConvertAll = async () => {
    const pending = chapters.filter((c) => statusMap[c.index] !== "done");
    if (pending.length === 0) return;

    cancelRef.current = false;
    setIsConverting(true);
    setError("");

    // 标记所有待转换章节为"等待中"
    const waitingStatus: Record<number, "waiting"> = {};
    pending.forEach((c) => (waitingStatus[c.index] = "waiting"));
    setStatusMap((prev) => ({ ...prev, ...waitingStatus }));

    // 自动跳到第一个待转换章节
    setActiveIndex(pending[0].index);

    // 用本地变量追踪已完成的剧本，确保角色传递正确
    const results: Record<number, Screenplay> = { ...screenplays };

    try {
      for (let i = 0; i < pending.length; i++) {
        if (cancelRef.current) break;

        const chapter = pending[i];
        const controller = new AbortController();
        abortRef.current = controller;

        setStatusMap((prev) => ({ ...prev, [chapter.index]: "converting" }));
        setActiveIndex(chapter.index);

        try {
          const prevChars = chapter.index > 0 ? results[chapter.index - 1]?.characters : undefined;
          const result = await convertChapter({
            chapter_text: chapter.content,
            chapter_index: chapter.index,
            title: chapter.title,
            previous_characters: prevChars?.map((c) => ({
              id: c.id,
              name: c.name,
              role: c.role,
            })),
          }, controller.signal);

          if (cancelRef.current) {
            setStatusMap((prev) => ({ ...prev, [chapter.index]: "pending" }));
            break;
          }

          results[chapter.index] = result;
          setScreenplays((prev) => ({ ...prev, [chapter.index]: result }));
          setStatusMap((prev) => ({ ...prev, [chapter.index]: "done" }));
        } catch (e) {
          if (cancelRef.current) {
            setStatusMap((prev) => ({ ...prev, [chapter.index]: "pending" }));
            break;
          }
          setStatusMap((prev) => ({ ...prev, [chapter.index]: "error" }));
          console.error(`章节 ${chapter.title} 转换失败:`, e);
        }
      }
    } finally {
      setIsConverting(false);
      abortRef.current = null;
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
            onCancel={handleCancel}
            isConverting={isConverting}
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
              onClick={() => setViewMode("schema")}
              className={`px-3 py-1.5 text-sm rounded ${
                viewMode === "schema"
                  ? "bg-purple-600 text-white"
                  : "border hover:bg-gray-50"
              }`}
            >
              Schema
            </button>
            {statusMap[activeIndex] === "converting" ? (
              <button
                onClick={handleCancel}
                className="ml-auto px-4 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                取消转换
              </button>
            ) : !currentScreenplay && statusMap[activeIndex] !== "waiting" && statusMap[activeIndex] !== "queued" ? (
              <button
                onClick={() => {
                  if (isConverting) {
                    // 正在转换中，加入队列
                    queueRef.current.push(activeIndex);
                    setStatusMap((prev) => ({ ...prev, [activeIndex]: "queued" }));
                    setActiveIndex(activeIndex);
                  } else {
                    handleConvert(activeIndex);
                  }
                }}
                className="ml-auto px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                {isConverting ? "加入队列" : "转换此章"}
              </button>
            ) : null}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-2 mb-4 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-500">✕</span>
              <p className="text-sm text-red-600 flex-1">{error}</p>
              <button
                onClick={() => handleConvert(activeIndex)}
                className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                重试
              </button>
            </div>
          )}

          {/* Content */}
          {viewMode === "schema" ? (
            <SchemaViewer />
          ) : currentScreenplay ? (
            <>
              {viewMode === "preview" ? (
                <ScriptPreview screenplay={currentScreenplay} />
              ) : (
                <ScriptEditor
                  screenplay={currentScreenplay}
                  onChange={() => {}}
                  onSave={(updated) => {
                    setScreenplays((prev) => ({ ...prev, [activeIndex]: updated }));
                  }}
                />
              )}
            </>
          ) : !error ? (
            <div className="text-center text-gray-400 py-20">
              {statusMap[activeIndex] === "converting" ? (
                <>
                  <div className="inline-block w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                  <p className="text-lg mb-1 text-gray-600">正在转换当前章节…</p>
                  <p className="text-sm text-gray-400 mb-3">转换完成后将自动显示</p>
                  <button
                    onClick={handleCancel}
                    className="text-xs px-4 py-1.5 border border-red-300 text-red-500 rounded hover:bg-red-50 transition"
                  >
                    取消转换
                  </button>
                </>
              ) : statusMap[activeIndex] === "waiting" || statusMap[activeIndex] === "queued" ? (
                <>
                  <div className="inline-block w-8 h-8 border-3 border-gray-200 border-t-gray-400 rounded-full animate-spin mb-3" />
                  <p className="text-lg mb-1 text-gray-500">排队等待中…</p>
                  <p className="text-sm text-gray-400">前面的章节转换完成后将自动开始</p>
                </>
              ) : (
                <>
                  <p className="text-lg mb-2">暂无剧本内容</p>
                  <p className="text-sm">请先选择章节并点击"转换此章"</p>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Right: Character Panel */}
        <aside className="w-72 border-l p-4 overflow-y-auto">
          <CharacterPanel characters={currentScreenplay?.characters || []} />
        </aside>
      </div>
    </main>
  );
}
