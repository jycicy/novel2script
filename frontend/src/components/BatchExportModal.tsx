"use client";

import { useState, useMemo } from "react";
import type { Screenplay, ChapterInfo } from "@/types/screenplay";
import { exportAsYaml, downloadFile } from "@/lib/storage";

type Format = "pdf" | "yaml";

interface BatchExportModalProps {
  chapters: ChapterInfo[];
  screenplays: Record<number, Screenplay>;
  onClose: () => void;
}

export default function BatchExportModal({ chapters, screenplays, onClose }: BatchExportModalProps) {
  // 只展示已转换的章节
  const converted = useMemo(
    () => chapters.filter((c) => screenplays[c.index]),
    [chapters, screenplays],
  );

  // 选中状态：`${index}-${format}` → boolean
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState("");

  const key = (index: number, fmt: Format) => `${index}-${fmt}`;

  const toggle = (index: number, fmt: Format) => {
    const k = key(index, fmt);
    setSelected((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const toggleAllForFormat = (fmt: Format) => {
    const allSelected = converted.every((c) => selected[key(c.index, fmt)]);
    const next = { ...selected };
    converted.forEach((c) => {
      next[key(c.index, fmt)] = !allSelected;
    });
    setSelected(next);
  };

  const toggleAllForChapter = (index: number) => {
    const allSelected = (["pdf", "yaml"] as Format[]).every((fmt) => selected[key(index, fmt)]);
    setSelected((prev) => ({
      ...prev,
      [key(index, "pdf")]: !allSelected,
      [key(index, "yaml")]: !allSelected,
    }));
  };

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected],
  );

  const handleExport = async () => {
    setExporting(true);
    const html2pdf = (await import("html2pdf.js")).default;

    // 收集所有选中的 (chapter, format) 对
    const tasks: { index: number; format: Format }[] = [];
    for (const c of converted) {
      for (const fmt of ["pdf", "yaml"] as Format[]) {
        if (selected[key(c.index, fmt)]) {
          tasks.push({ index: c.index, format: fmt });
        }
      }
    }

    for (let i = 0; i < tasks.length; i++) {
      const { index, format } = tasks[i];
      const sp = screenplays[index];
      const name = sp.meta.title || `chapter_${index}`;
      setProgress(`${i + 1}/${tasks.length} ${name}.${format}`);

      if (format === "yaml") {
        const blob = exportAsYaml(sp);
        downloadFile(blob, `${name}.yaml`);
      } else {
        const { buildPdfHtml } = await import("@/components/ExportMenu");
        const html = buildPdfHtml(sp);
        await html2pdf()
          .set({
            margin: 10,
            filename: `${name}.pdf`,
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .from(html)
          .save();
      }

      // 稍微延迟避免浏览器拦截批量下载
      if (i < tasks.length - 1) await new Promise((r) => setTimeout(r, 300));
    }

    setExporting(false);
    setProgress("");
    onClose();
  };

  if (converted.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="bg-white rounded-xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-gray-500">暂无已转换的章节可导出</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">关闭</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[560px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold">批量导出</h2>
          <p className="text-sm text-gray-500 mt-1">勾选需要导出的章节和格式</p>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-gray-500 w-8">
                  {/* 全选某行的列留空 */}
                </th>
                <th className="text-left py-2 font-medium text-gray-700">章节</th>
                <th className="text-center py-2 w-20">
                  <button
                    onClick={() => toggleAllForFormat("pdf")}
                    className="font-medium text-gray-700 hover:text-blue-600 transition"
                  >
                    PDF {converted.every((c) => selected[key(c.index, "pdf")]) ? "✓" : ""}
                  </button>
                </th>
                <th className="text-center py-2 w-20">
                  <button
                    onClick={() => toggleAllForFormat("yaml")}
                    className="font-medium text-gray-700 hover:text-blue-600 transition"
                  >
                    YAML {converted.every((c) => selected[key(c.index, "yaml")]) ? "✓" : ""}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {converted.map((ch) => {
                const sp = screenplays[ch.index];
                const rowAll = (["pdf", "yaml"] as Format[]).every((f) => selected[key(ch.index, f)]);
                return (
                  <tr key={ch.index} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={rowAll}
                        onChange={() => toggleAllForChapter(ch.index)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="py-2">
                      <div className="font-medium text-gray-800">{sp.meta.title}</div>
                      <div className="text-xs text-gray-400">{ch.title}</div>
                    </td>
                    <td className="text-center py-2">
                      <input
                        type="checkbox"
                        checked={!!selected[key(ch.index, "pdf")]}
                        onChange={() => toggle(ch.index, "pdf")}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="text-center py-2">
                      <input
                        type="checkbox"
                        checked={!!selected[key(ch.index, "yaml")]}
                        onChange={() => toggle(ch.index, "yaml")}
                        className="cursor-pointer"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {exporting ? progress : `已选 ${selectedCount} 项`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition"
            >
              取消
            </button>
            <button
              onClick={handleExport}
              disabled={selectedCount === 0 || exporting}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {exporting ? "导出中…" : `导出选中 (${selectedCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
