import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-5xl font-bold mb-4">Novel2Scripts</h1>
        <p className="text-xl text-gray-600 mb-2">
          AI 驱动的小说转剧本工具
        </p>
        <p className="text-gray-500 mb-8 max-w-md">
          粘贴小说文本，自动识别章节，一键转换为结构化 YAML 剧本。支持在线编辑、导出下载。
        </p>
        <Link
          href="/convert"
          className="px-8 py-3 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition"
        >
          开始转换
        </Link>
      </section>

      {/* Features */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl mb-3">&#128221;</div>
            <h3 className="font-semibold mb-2">智能章节检测</h3>
            <p className="text-sm text-gray-600">
              自动识别小说章节结构，支持多种章节标记格式
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">&#127916;</div>
            <h3 className="font-semibold mb-2">结构化剧本</h3>
            <p className="text-sm text-gray-600">
              转换为标准剧本格式：场景、角色、对白、舞台指示
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">&#128190;</div>
            <h3 className="font-semibold mb-2">在线编辑导出</h3>
            <p className="text-sm text-gray-600">
              Monaco 编辑器实时编辑，支持 YAML / JSON 导出
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-400">
        Novel2Scripts - 七牛云 XEngineer 暑期实训营
      </footer>
    </main>
  );
}
