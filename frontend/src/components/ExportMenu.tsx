"use client";

import { useState } from "react";
import type { Screenplay } from "@/types/screenplay";
import { exportAsYaml, exportAsJson, downloadFile } from "@/lib/storage";

interface ExportMenuProps {
  screenplay: Screenplay;
}

export default function ExportMenu({ screenplay }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
        className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition"
      >
        导出 ▾
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-44 bg-white border rounded-lg shadow-lg z-20 py-1">
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
