"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ChapterSelector from "@/components/ChapterSelector";
import ScriptPreview from "@/components/ScriptPreview";
import ScriptEditor from "@/components/ScriptEditor";
import CharacterPanel from "@/components/CharacterPanel";
import ExportMenu from "@/components/ExportMenu";
import SchemaViewer from "@/components/SchemaViewer";
import StreamingPreview from "@/components/StreamingPreview";
import { loadProject, saveProject } from "@/lib/storage";
import { convertChapterStream } from "@/lib/api";
import type { ChapterInfo, Screenplay } from "@/types/screenplay";

export default function ConvertPage() {
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [screenplays, setScreenplays] = useState<Record<number, Screenplay>>({});
  const [viewMode, setViewMode] = useState<"preview" | "editor" | "schema">("preview");
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");
  const [statusMap, setStatusMap] = useState<Record<number, "pending" | "waiting" | "queued" | "converting" | "done" | "error">>({});
  const [streamingYaml, setStreamingYaml] = useState("");
  const cancelAllRef = useRef(false);    // 取消全部
  const cancelCurrentRef = useRef(false); // 只取消当前章
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

  // 取消当前正在转换的章节（不中断批量流程）
  const handleCancelCurrent = () => {
    cancelCurrentRef.current = true;
    abortRef.current?.abort();
  };

  // 取消全部：中断批量流程，清空队列
  const handleCancelAll = () => {
    cancelAllRef.current = true;
    cancelCurrentRef.current = true;
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
    cancelCurrentRef.current = false;

    setStatusMap((prev) => ({ ...prev, [index]: "converting" }));
    setIsConverting(true);
    setError("");
    setStreamingYaml("");
    setActiveIndex(index);

    try {
      const prevChars = index > 0 ? screenplays[index - 1]?.characters : undefined;
      let result: Screenplay | null = null;
      let errorMsg = "";

      await convertChapterStream(
        {
          chapter_text: chapter.content,
          chapter_index: index,
          title: chapter.title,
          previous_characters: prevChars?.map((c) => ({
            id: c.id,
            name: c.name,
            role: c.role,
          })),
        },
        {
          onChunk: (yaml) => setStreamingYaml((prev) => prev + yaml),
          onDone: (screenplay) => { result = screenplay; },
          onError: (msg) => { errorMsg = msg; },
        },
        controller.signal,
      );

      if (cancelCurrentRef.current) {
        setStatusMap((prev) => ({ ...prev, [index]: "pending" }));
        return;
      }

      if (result) {
        setScreenplays((prev) => ({ ...prev, [index]: result! }));
        setStatusMap((prev) => ({ ...prev, [index]: "done" }));
      } else if (errorMsg) {
        setError(errorMsg);
        setStatusMap((prev) => ({ ...prev, [index]: "error" }));
      }
    } catch (e) {
      if (cancelCurrentRef.current) {
        setStatusMap((prev) => ({ ...prev, [index]: "pending" }));
        return;
      }
      setError(e instanceof Error ? e.message : "转换失败");
      setStatusMap((prev) => ({ ...prev, [index]: "error" }));
    } finally {
      setStreamingYaml("");
      setIsConverting(false);
      abortRef.current = null;
    }
  };

  const handleConvertAll = async () => {
    const pending = chapters.filter((c) => statusMap[c.index] !== "done");
    if (pending.length === 0) return;

    cancelAllRef.current = false;
    setIsConverting(true);
    setError("");

    // 标记所有待转换章节为"等待中"
    const waitingStatus: Record<number, "waiting"> = {};
    pending.forEach((c) => (waitingStatus[c.index] = "waiting"));
    setStatusMap((prev) => ({ ...prev, ...waitingStatus }));

    // 用本地变量追踪已完成的剧本，确保角色传递正确
    const results: Record<number, Screenplay> = { ...screenplays };

    try {
      for (let i = 0; i < pending.length; i++) {
        if (cancelAllRef.current) break;

        const chapter = pending[i];
        const controller = new AbortController();
        abortRef.current = controller;
        cancelCurrentRef.current = false;

        setStatusMap((prev) => ({ ...prev, [chapter.index]: "converting" }));
        setStreamingYaml("");

        try {
          // 找到最近一个成功转换的章节的角色列表（跳过失败章节）
          let prevChars: Screenplay["characters"] | undefined;
          for (let j = chapter.index - 1; j >= 0; j--) {
            if (results[j]?.characters?.length) {
              prevChars = results[j].characters;
              break;
            }
          }

          let result: Screenplay | null = null;
          let chapterError = "";
          await convertChapterStream(
            {
              chapter_text: chapter.content,
              chapter_index: chapter.index,
              title: chapter.title,
              previous_characters: prevChars?.map((c) => ({
                id: c.id,
                name: c.name,
                role: c.role,
              })),
            },
            {
              onChunk: (yaml) => setStreamingYaml((prev) => prev + yaml),
              onDone: (screenplay) => { result = screenplay; },
              onError: (msg) => { chapterError = msg; },
            },
            controller.signal,
          );

          if (cancelAllRef.current) {
            setStatusMap((prev) => ({ ...prev, [chapter.index]: "pending" }));
            break;
          }
          if (cancelCurrentRef.current) {
            // 只取消当前章，标记为 pending，继续下一章
            setStatusMap((prev) => ({ ...prev, [chapter.index]: "pending" }));
            continue;
          }

          if (result) {
            results[chapter.index] = result;
            setScreenplays((prev) => ({ ...prev, [chapter.index]: result! }));
            setStatusMap((prev) => ({ ...prev, [chapter.index]: "done" }));
          } else if (chapterError) {
            setStatusMap((prev) => ({ ...prev, [chapter.index]: "error" }));
            console.error(`章节 ${chapter.title} 转换失败: ${chapterError}`);
          }
        } catch (e) {
          if (cancelAllRef.current) {
            setStatusMap((prev) => ({ ...prev, [chapter.index]: "pending" }));
            break;
          }
          if (cancelCurrentRef.current) {
            setStatusMap((prev) => ({ ...prev, [chapter.index]: "pending" }));
            continue;
          }
          setStatusMap((prev) => ({ ...prev, [chapter.index]: "error" }));
          console.error(`章节 ${chapter.title} 转换失败:`, e);
        } finally {
          setStreamingYaml("");
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
            onCancel={handleCancelAll}
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
                onClick={handleCancelCurrent}
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
          ) : currentScreenplay && statusMap[activeIndex] !== "converting" ? (
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
          ) : statusMap[activeIndex] === "converting" ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-sm text-gray-600">正在生成剧本…</span>
                <button
                  onClick={handleCancelCurrent}
                  className="ml-auto text-xs px-3 py-1 border border-red-300 text-red-500 rounded hover:bg-red-50 transition"
                >
                  取消转换
                </button>
              </div>
              {viewMode === "editor" ? (
                <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-auto max-h-[600px] font-mono whitespace-pre-wrap break-words">
                  {streamingYaml}
                  <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5" />
                </pre>
              ) : (
                <StreamingPreview yaml={streamingYaml} />
              )}
            </div>
          ) : statusMap[activeIndex] === "waiting" || statusMap[activeIndex] === "queued" ? (
            <div className="text-center text-gray-400 py-20">
              <div className="inline-block w-8 h-8 border-3 border-gray-200 border-t-gray-400 rounded-full animate-spin mb-3" />
              <p className="text-lg mb-1 text-gray-500">排队等待中…</p>
              <p className="text-sm text-gray-400">前面的章节转换完成后将自动开始</p>
            </div>
          ) : !error ? (
            <div className="text-center text-gray-400 py-20">
              <p className="text-lg mb-2">暂无剧本内容</p>
              <p className="text-sm">请先选择章节并点击"转换此章"</p>
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
