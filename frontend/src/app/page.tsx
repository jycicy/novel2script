export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Novel2Scripts</h1>
      <p className="text-lg text-gray-600 mb-8">
        AI 小说转剧本工具
      </p>
      <a
        href="/convert"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        开始转换
      </a>
    </main>
  );
}
