"use client";

import { useState } from "react";
import Link from "next/link";
import NovelInput from "@/components/NovelInput";
import ChapterSelector from "@/components/ChapterSelector";
import { detectChapters } from "@/lib/api";
import type { ChapterInfo } from "@/types/screenplay";

export default function Home() {
  const [novelText, setNovelText] = useState("");
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDetect = async (text: string) => {
    setNovelText(text);
    setIsLoading(true);
    setError("");
    try {
      const result = await detectChapters(text);
      setChapters(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "检测失败");
    } finally {
      setIsLoading(false);
    }
  };

  const hasChapters = chapters.length > 0;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      {!hasChapters && (
        <section className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Novel2Scripts</h1>
          <p className="text-xl text-gray-600 mb-2">
            AI 驱动的小说转剧本工具
          </p>
          <p className="text-gray-500 mb-8 max-w-md">
            粘贴小说文本，自动识别章节，一键转换为结构化 YAML 剧本。
          </p>
        </section>
      )}

      {/* Input Area */}
      <section className="py-8 px-8 max-w-3xl mx-auto w-full">
        {!hasChapters && <h2 className="text-xl font-semibold mb-4">输入小说文本</h2>}
        <NovelInput onSubmit={handleDetect} isLoading={isLoading} />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </section>

      {/* Chapter List */}
      {hasChapters && (
        <section className="py-4 px-8 max-w-3xl mx-auto w-full">
          <ChapterSelector
            chapters={chapters}
            activeIndex={0}
            onSelect={() => {}}
          />
          <Link
            href="/convert"
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            开始转换
          </Link>
        </section>
      )}

      {/* Features */}
      {!hasChapters && (
        <section className="py-16 px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-3">&#128221;</div>
              <h3 className="font-semibold mb-2">智能章节检测</h3>
              <p className="text-sm text-gray-600">
                自动识别小说章节结构，支持多种格式
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">&#127916;</div>
              <h3 className="font-semibold mb-2">结构化剧本</h3>
              <p className="text-sm text-gray-600">
                场景、角色、对白、舞台指示
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">&#128190;</div>
              <h3 className="font-semibold mb-2">在线编辑导出</h3>
              <p className="text-sm text-gray-600">
                Monaco 编辑器，YAML / JSON 导出
              </p>
            </div>
          </div>
        </section>
      )}

      <footer className="py-6 text-center text-sm text-gray-400">
        Novel2Scripts - 七牛云 XEngineer 暑期实训营
      </footer>
    </main>
  );
}
