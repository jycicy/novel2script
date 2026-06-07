"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import ChapterSelector from "@/components/ChapterSelector";
import ScriptPreview from "@/components/ScriptPreview";
import ScriptEditor from "@/components/ScriptEditor";
import CharacterPanel from "@/components/CharacterPanel";
import ExportMenu from "@/components/ExportMenu";
import SchemaViewer from "@/components/SchemaViewer";
import StreamingPreview from "@/components/StreamingPreview";
import AddChapterModal from "@/components/AddChapterModal";
import { loadProject, saveProject } from "@/lib/storage";
import { convertChapterStream, detectChapters } from "@/lib/api";
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "info" | "error" } | null>(null);
  const yamlScroll = useAutoScroll([streamingYaml]);
  const cancelAllRef = useRef(false);
  const cancelCurrentRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const queueRef = useRef<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ===== 章节管理 =====

  const handleAddChapters = (newChapters: ChapterInfo[], novelText: string) => {
    const startIndex = chapters.length;
    const reindexed = newChapters.map((ch, i) => ({
      ...ch,
      index: startIndex + i,
    }));
    setChapters((prev) => [...prev, ...reindexed]);
    setActiveIndex(startIndex);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError("");

    try {
      const allNewChapters: ChapterInfo[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();
        const detected = await detectChapters(text);
        if (detected.length > 0) {
          const startIndex = chapters.length + allNewChapters.length;
          const reindexed = detected.map((ch, j) => ({
            ...ch,
            index: startIndex + j,
          }));
          allNewChapters.push(...reindexed);
        }
      }
      if (allNewChapters.length > 0) {
        setChapters((prev) => [...prev, ...allNewChapters]);
        setActiveIndex(chapters.length);
      } else {
        setError("未从上传文件中检测到章节");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "文件处理失败");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const showToast = (message: string, type: "info" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteChapter = (index: number) => {
    const status = statusMap[index];
    if (status === "converting" || status === "waiting" || status === "queued") {
      showToast("该章节正在转换或排队中，请先取消后再删除", "error");
      return;
    }
    setChapters((prev) => {
      const next = prev.filter((ch) => ch.index !== index).map((ch, i) => ({ ...ch, index: i }));
      return next;
    });
    setScreenplays((prev) => {
      const next: Record<number, Screenplay> = {};
      Object.entries(prev).forEach(([key, val]) => {
        const k = Number(key);
        if (k < index) next[k] = val;
        else if (k > index) next[k - 1] = val;
      });
      return next;
    });
    setStatusMap((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([key, val]) => {
        const k = Number(key);
        if (k < index) next[k] = val;
        else if (k > index) next[k - 1] = val;
      });
      return next as typeof statusMap;
    });
    setActiveIndex((prev) => {
      if (prev === index) return 0;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  // ===== 转换逻辑 =====

  const handleCancelCurrent = () => {
    cancelCurrentRef.current = true;
    abortRef.current?.abort();
  };

  const handleCancelAll = () => {
    cancelAllRef.current = true;
    cancelCurrentRef.current = true;
    abortRef.current?.abort();
    queueRef.current = [];
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

    const waitingStatus: Record<number, "waiting"> = {};
    pending.forEach((c) => (waitingStatus[c.index] = "waiting"));
    setStatusMap((prev) => ({ ...prev, ...waitingStatus }));

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
          {currentScreenplay && (
            <ExportMenu
              screenplay={currentScreenplay}
              chapters={chapters}
              screenplays={screenplays}
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left: Chapter Selector */}
        <aside className="w-64 border-r p-4 overflow-y-auto flex flex-col gap-3">
          {/* 添加章节按钮 */}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 px-3 py-2 text-xs bg-white border rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>📄</span> {isUploading ? "处理中..." : "上传文件"}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 px-3 py-2 text-xs bg-white border rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>📋</span> 粘贴文本
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />

          <ChapterSelector
            chapters={chapters}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            onConvertAll={chapters.length > 0 ? handleConvertAll : undefined}
            onCancel={handleCancelAll}
            onDelete={handleDeleteChapter}
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
              className={`px-3 py-1.5 text-sm rounded cursor-pointer ${
                viewMode === "preview"
                  ? "bg-blue-600 text-white"
                  : "border hover:bg-gray-50"
              }`}
            >
              预览
            </button>
            <button
              onClick={() => setViewMode("editor")}
              className={`px-3 py-1.5 text-sm rounded cursor-pointer ${
                viewMode === "editor"
                  ? "bg-blue-600 text-white"
                  : "border hover:bg-gray-50"
              }`}
            >
              编辑
            </button>
            <button
              onClick={() => setViewMode("schema")}
              className={`px-3 py-1.5 text-sm rounded cursor-pointer ${
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
                className="ml-auto px-4 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition cursor-pointer"
              >
                取消转换
              </button>
            ) : !currentScreenplay && statusMap[activeIndex] !== "waiting" && statusMap[activeIndex] !== "queued" ? (
              <button
                onClick={() => {
                  if (isConverting) {
                    queueRef.current.push(activeIndex);
                    setStatusMap((prev) => ({ ...prev, [activeIndex]: "queued" }));
                    setActiveIndex(activeIndex);
                  } else {
                    handleConvert(activeIndex);
                  }
                }}
                className="ml-auto px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition cursor-pointer"
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
                className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition cursor-pointer"
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
                  className="ml-auto text-xs px-3 py-1 border border-red-300 text-red-500 rounded hover:bg-red-50 transition cursor-pointer"
                >
                  取消转换
                </button>
              </div>
              {viewMode === "editor" ? (
                <div className="relative">
                  <div
                    ref={yamlScroll.containerRef}
                    onScroll={yamlScroll.handleScroll}
                    className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-auto max-h-[600px] font-mono whitespace-pre-wrap break-words"
                  >
                    {streamingYaml}
                    <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5" />
                  </div>
                  {!yamlScroll.isAtBottom && (
                    <button
                      onClick={yamlScroll.scrollToBottom}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-full shadow-md hover:bg-gray-50 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>↓</span> 回到底部
                    </button>
                  )}
                </div>
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
          ) : chapters.length === 0 ? (
            <div className="text-center text-gray-400 py-20">
              <p className="text-lg mb-2">暂无章节</p>
              <p className="text-sm">请上传文件或粘贴文本添加小说章节</p>
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

      {/* Add Chapter Modal */}
      {showAddModal && (
        <AddChapterModal
          onAdd={handleAddChapters}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white animate-[slideUp_0.3s_ease-out] ${
            toast.type === "error" ? "bg-red-500" : "bg-gray-800"
          }`}
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
