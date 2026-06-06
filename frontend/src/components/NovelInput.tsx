"use client";

import { useState, useRef } from "react";

interface NovelInputProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
}

export default function NovelInput({ onSubmit, isLoading }: NovelInputProps) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* File upload */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition text-sm"
        >
          上传文件 (.txt)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <span className="text-sm text-gray-500">或直接粘贴文本到下方</span>
        {text.length > 0 && (
          <span className="text-sm text-gray-400 ml-auto">
            共 {text.length.toLocaleString()} 字
          </span>
        )}
      </div>

      {/* Textarea */}
      <textarea
        className="w-full min-h-[400px] border rounded-lg p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        placeholder={`在此粘贴小说文本...\n\n支持的章节格式：\n第一章 xxx\nChapter 1 xxx\n1. xxx`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {/* Submit */}
      <button
        onClick={() => onSubmit(text)}
        disabled={!text.trim() || isLoading}
        className="self-end px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "检测中..." : "检测章节"}
      </button>
    </div>
  );
}
