"use client";

import type { ChapterInfo } from "@/types/screenplay";

type ChapterStatus = "pending" | "waiting" | "queued" | "converting" | "done" | "error";

interface ChapterSelectorProps {
  chapters: ChapterInfo[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onConvertAll?: () => void;
  onCancel?: () => void;
  onDelete?: (index: number) => void;
  isConverting?: boolean;
  statusMap?: Record<number, ChapterStatus>;
}

export default function ChapterSelector({
  chapters,
  activeIndex,
  onSelect,
  onConvertAll,
  onCancel,
  onDelete,
  isConverting,
  statusMap,
}: ChapterSelectorProps) {
  const statusIcon: Record<ChapterStatus, string> = {
    pending: "○",
    waiting: "◷",
    queued: "🕐",
    converting: "⏳",
    done: "✅",
    error: "❌",
  };

  const statusColor: Record<ChapterStatus, string> = {
    pending: "text-gray-400",
    waiting: "text-gray-400",
    queued: "text-yellow-500",
    converting: "text-blue-500 animate-pulse",
    done: "text-green-600",
    error: "text-red-500",
  };

  const doneCount = statusMap
    ? Object.values(statusMap).filter((s) => s === "done").length
    : 0;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <span className="text-sm font-medium">章节列表</span>
        {isConverting && onCancel ? (
          <button
            onClick={onCancel}
            className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition cursor-pointer"
          >
            取消全部
          </button>
        ) : onConvertAll ? (
          <button
            onClick={onConvertAll}
            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition cursor-pointer"
          >
            全部转换
          </button>
        ) : null}
      </div>

      {statusMap && (
        <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">
          已完成 {doneCount} / {chapters.length}
        </div>
      )}

      <ul className="divide-y max-h-[600px] overflow-y-auto">
        {chapters.map((ch) => {
          const status = statusMap?.[ch.index] ?? "pending";
          const isActive = ch.index === activeIndex;

          return (
            <li key={ch.index} className="group relative">
              <button
                onClick={() => onSelect(ch.index)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition flex items-center gap-2 cursor-pointer ${
                  isActive ? "bg-blue-50 border-l-2 border-blue-600" : ""
                }`}
              >
                {statusMap && (
                  <span className={statusColor[status]}>
                    {statusIcon[status]}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{ch.title}</div>
                  <div className="text-xs text-gray-400">
                    {ch.char_count.toLocaleString()} 字
                  </div>
                </div>
              </button>
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(ch.index); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="删除此章"
                >
                  ×
                </button>
              )}
            </li>
          );
        })}
        {chapters.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-gray-400">
            暂无章节，请上传文件或粘贴文本
          </li>
        )}
      </ul>
    </div>
  );
}
