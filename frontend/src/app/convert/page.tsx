"use client";

import { useState } from "react";
import Link from "next/link";

export default function ConvertPage() {
  const [novelText, setNovelText] = useState("");
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNovelText(text);
    setCharCount(text.length);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setNovelText(text);
      setCharCount(text.length);
    };
    reader.readAsText(file);
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Novel2Scripts
        </Link>
        <span className="text-sm text-gray-500">剧本编辑器</span>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full">
        <h2 className="text-xl font-semibold mb-4">输入小说文本</h2>

        {/* File upload */}
        <div className="mb-4">
          <label className="inline-block px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm">
            上传文件 (.txt)
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <span className="ml-3 text-sm text-gray-500">
            或直接粘贴文本到下方
          </span>
        </div>

        {/* Textarea */}
        <textarea
          className="flex-1 min-h-[400px] w-full border rounded-lg p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="在此粘贴小说文本...&#10;&#10;支持的章节格式：&#10;第一章 xxx&#10;Chapter 1 xxx&#10;1. xxx"
          value={novelText}
          onChange={handleChange}
        />

        {/* Footer bar */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {charCount > 0 ? `共 ${charCount} 字` : "等待输入..."}
          </span>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={charCount === 0}
          >
            检测章节
          </button>
        </div>
      </div>
    </main>
  );
}
