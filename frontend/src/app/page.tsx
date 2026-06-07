"use client";

import { useRouter } from "next/navigation";
import { clearProject } from "@/lib/storage";

const features = [
  {
    icon: "&#128221;",
    title: "智能章节检测",
    desc: "自动识别小说章节结构，支持多种格式",
  },
  {
    icon: "&#127916;",
    title: "结构化剧本",
    desc: "场景、角色、对白、舞台指示",
  },
  {
    icon: "&#128190;",
    title: "在线编辑导出",
    desc: "Monaco 编辑器，YAML / JSON 导出",
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center p-8 text-center">
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
          上传小说文本，自动识别章节，一键转换为结构化 YAML 剧本。
        </p>
        <button
          onClick={() => { clearProject(); router.push("/convert"); }}
          className="px-10 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 cursor-pointer"
        >
          Try it →
        </button>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="text-center p-6 rounded-xl bg-white border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="text-3xl mb-3"
                dangerouslySetInnerHTML={{ __html: f.icon }}
              />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-6 text-center text-sm text-gray-400">
        Novel2Scripts — 七牛云 XEngineer 暑期实训营
      </footer>
    </main>
  );
}
