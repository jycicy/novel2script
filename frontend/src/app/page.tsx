"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NovelInput from "@/components/NovelInput";
import ChapterSelector from "@/components/ChapterSelector";
import { detectChapters } from "@/lib/api";
import { saveProject } from "@/lib/storage";
import type { ChapterInfo } from "@/types/screenplay";

export default function Home() {
  const [novelText, setNovelText] = useState("");
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

  const handleStartConvert = () => {
    saveProject({
      novelText,
      chapters: chapters.map((c) => ({ index: c.index, title: c.title, content: c.content, start_line: c.start_line, end_line: c.end_line, char_count: c.char_count })),
      screenplays: {},
      activeChapterIndex: 0,
    });
    router.push("/convert");
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      {/* Hero */}
      {!hasChapters && (
        <section className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-[fadeIn_0.6s_ease-out]">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full border border-blue-100">
              七牛云 XEngineer 暑期实训营
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Novel2Scripts
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            AI 驱动的小说转剧本工具
          </p>
          <p className="text-gray-500 mb-8 max-w-md">
            粘贴小说文本，自动识别章节，一键转换为结构化 YAML 剧本。
          </p>
        </section>
      )}

      {/* Input Area */}
      <section className={`py-8 px-4 sm:px-8 max-w-3xl mx-auto w-full ${hasChapters ? "pt-6" : ""}`}>
        {!hasChapters && <h2 className="text-xl font-semibold mb-4">输入小说文本</h2>}
        <NovelInput onSubmit={handleDetect} isLoading={isLoading} />
        {error && (
          <p className="mt-3 text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-100">
            {error}
          </p>
        )}
      </section>

      {/* Chapter List */}
      {hasChapters && (
        <section className="py-4 px-4 sm:px-8 max-w-3xl mx-auto w-full animate-[slideUp_0.3s_ease-out]">
          <ChapterSelector
            chapters={chapters}
            activeIndex={0}
            onSelect={() => {}}
          />
          <button
            onClick={handleStartConvert}
            className="mt-4 w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md font-medium"
          >
            开始转换 →
          </button>
        </section>
      )}

      {/* Features */}
      {!hasChapters && (
        <section className="py-16 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: "&#128221;", title: "智能章节检测", desc: "自动识别小说章节结构，支持多种格式" },
              { icon: "&#127916;", title: "结构化剧本", desc: "场景、角色、对白、舞台指示" },
              { icon: "&#128190;", title: "在线编辑导出", desc: "Monaco 编辑器，YAML / JSON 导出" },
            ].map((f, i) => (
              <div
                key={i}
                className="text-center p-6 rounded-xl bg-white border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="text-3xl mb-3" dangerouslySetInnerHTML={{ __html: f.icon }} />
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="py-6 text-center text-sm text-gray-400">
        Novel2Scripts — 七牛云 XEngineer 暑期实训营
      </footer>
    </main>
  );
}
