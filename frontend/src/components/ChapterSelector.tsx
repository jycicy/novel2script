"use client";

import type { ChapterInfo } from "@/types/screenplay";

type ChapterStatus = "pending" | "waiting" | "converting" | "done" | "error";

interface ChapterSelectorProps {
  chapters: ChapterInfo[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onConvertAll?: () => void;
  statusMap?: Record<number, ChapterStatus>;
}

export default function ChapterSelector({
  chapters,
  activeIndex,
  onSelect,
  onConvertAll,
  statusMap,
}: ChapterSelectorProps) {
  const statusIcon: Record<ChapterStatus, string> = {
    pending: "○",
    waiting: "◷",
    converting: "⏳",
    done: "✅",
    error: "❌",
  };

  const statusColor: Record<ChapterStatus, string> = {
    pending: "text-gray-400",
    waiting: "text-gray-400",
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
        {onConvertAll && (
          <button
            onClick={onConvertAll}
            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            全部转换
          </button>
        )}
      </div>

      {statusMap && (
        <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">
          已完成 {doneCount} / {chapters.length}
        </div>
      )}

      <ul className="divide-y max-h-[400px] overflow-y-auto">
        {chapters.map((ch) => {
          const status = statusMap?.[ch.index] ?? "pending";
          const isActive = ch.index === activeIndex;

          return (
            <li key={ch.index}>
              <button
                onClick={() => onSelect(ch.index)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition flex items-center gap-2 ${
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
