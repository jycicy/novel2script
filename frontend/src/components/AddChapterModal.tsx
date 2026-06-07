"use client";

import { useState } from "react";
import { detectChapters } from "@/lib/api";
import type { ChapterInfo } from "@/types/screenplay";

interface Props {
  onAdd: (chapters: ChapterInfo[], novelText: string) => void;
  onClose: () => void;
}

export default function AddChapterModal({ onAdd, onClose }: Props) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ChapterInfo[] | null>(null);

  const handleDetect = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const chapters = await detectChapters(text.trim());
      if (chapters.length === 0) {
        setError("未检测到章节，请检查文本格式");
        return;
      }
      setPreview(chapters);
    } catch (e) {
      setError(e instanceof Error ? e.message : "检测失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    onAdd(preview, text.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">粘贴小说文本</h3>
        </div>

        <div className="p-6 space-y-4">
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setPreview(null); }}
            placeholder="粘贴小说文本，点击下方按钮检测章节..."
            className="w-full h-48 p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>
          )}

          {preview && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-700 mb-2">
                检测到 {preview.length} 个章节：
              </p>
              <ul className="text-sm text-green-600 space-y-1 max-h-32 overflow-y-auto">
                {preview.map((ch) => (
                  <li key={ch.index}>• {ch.title}（{ch.char_count} 字）</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            取消
          </button>
          {!preview ? (
            <button
              onClick={handleDetect}
              disabled={isLoading || !text.trim()}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? "检测中..." : "检测章节"}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
            >
              添加 {preview.length} 个章节
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
