"use client";

import { useState } from "react";
import type { Screenplay } from "@/types/screenplay";
import { exportAsYaml, exportAsJson, downloadFile } from "@/lib/storage";

interface ExportMenuProps {
  screenplay: Screenplay;
}

const ROLE_LABELS: Record<string, string> = {
  protagonist: "主角",
  antagonist: "反派",
  supporting: "配角",
  minor: "龙套",
  narrator: "旁白",
};

function buildPdfHtml(s: Screenplay): string {
  const characterMap = new Map(s.characters.map((c) => [c.id, c.name]));

  const renderContent = (s: Screenplay) =>
    s.scenes
      .map((scene) => {
        const blocks = scene.content
          .map((block) => {
            switch (block.type) {
              case "action":
                return `<p style="margin:8px 0;text-indent:2em;line-height:1.8">${block.text || ""}</p>`;
              case "dialogue": {
                const name = characterMap.get(block.character || "") || block.character || "";
                return `<div style="margin:10px 0;text-align:center"><div style="font-weight:bold;font-size:14px">${name}</div><div style="max-width:400px;margin:4px auto;line-height:1.8">${block.dialogue || ""}</div></div>`;
              }
              case "parenthetical":
                return `<div style="text-align:center;color:#666;font-size:12px;font-style:italic;margin:4px 0">(${block.parenthetical || ""})</div>`;
              case "transition":
                return `<div style="text-align:right;font-weight:bold;color:#666;font-size:12px;margin:16px 0">${block.transition || ""}</div>`;
              case "scene_heading":
                return `<div style="margin:24px 0 8px;padding-bottom:6px;border-bottom:2px solid #1a1a1a"><strong style="font-size:14px">${block.text || ""}</strong></div>`;
              default:
                return "";
            }
          })
          .join("\n");

        return `
        <div style="margin-bottom:32px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="background:#1a1a1a;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold">场景 ${scene.scene_number}</span>
            <strong style="font-size:14px">${scene.heading}</strong>
          </div>
          <div style="color:#999;font-size:12px;margin-bottom:8px">
            ${scene.location ? `📍 ${scene.location}` : ""} ${scene.time ? `🕐 ${scene.time}` : ""}
          </div>
          ${scene.atmosphere ? `<p style="color:#888;font-size:12px;font-style:italic;border-left:3px solid #ddd;padding-left:10px;margin:8px 0">${scene.atmosphere}</p>` : ""}
          ${blocks}
        </div>`;
      })
      .join("\n");

  const characterBadges = s.characters
    .map(
      (c) =>
        `<span style="display:inline-block;padding:3px 10px;border:1px solid #ddd;border-radius:20px;font-size:12px;margin:2px">${c.name} · ${ROLE_LABELS[c.role] || c.role}</span>`,
    )
    .join(" ");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @page { margin: 2cm; }
  body { font-family: "SimSun", "Songti SC", "Noto Serif CJK SC", serif; font-size: 13px; color: #1a1a1a; }
</style></head>
<body>
  <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1a1a1a">
    <h1 style="font-size:22px;margin:0 0 8px">${s.meta.title}</h1>
    <div style="color:#666;font-size:12px">
      ${s.meta.genre} · ${s.meta.estimated_duration} · ${s.meta.source_chapter}
    </div>
  </div>
  ${s.characters.length > 0 ? `<div style="margin-bottom:24px"><div style="color:#999;font-size:11px;font-weight:bold;margin-bottom:8px;letter-spacing:2px">角色表</div><div>${characterBadges}</div></div>` : ""}
  ${renderContent(s)}
</body></html>`;
}

export default function ExportMenu({ screenplay }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filename = screenplay.meta.title || "screenplay";

  const handleDownloadYaml = () => {
    const blob = exportAsYaml(screenplay);
    downloadFile(blob, `${filename}.yaml`);
    setOpen(false);
  };

  const handleDownloadJson = () => {
    const blob = exportAsJson(screenplay);
    downloadFile(blob, `${filename}.json`);
    setOpen(false);
  };

  const handleDownloadPdf = async () => {
    setExporting(true);
    setOpen(false);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const html = buildPdfHtml(screenplay);
      await html2pdf()
        .set({
          margin: 10,
          filename: `${filename}.pdf`,
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(html)
        .save();
    } catch (e) {
      console.error("PDF 导出失败:", e);
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = async () => {
    const text = JSON.stringify(screenplay, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
      >
        {exporting ? "导出中…" : "导出 ▾"}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-44 bg-white border rounded-lg shadow-lg z-20 py-1">
            <button
              onClick={handleDownloadPdf}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition"
            >
              下载 PDF
            </button>
            <button
              onClick={handleDownloadYaml}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition"
            >
              下载 YAML
            </button>
            <button
              onClick={handleDownloadJson}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition"
            >
              下载 JSON
            </button>
            <hr className="my-1" />
            <button
              onClick={handleCopy}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition"
            >
              {copied ? "已复制 ✓" : "复制 JSON"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
