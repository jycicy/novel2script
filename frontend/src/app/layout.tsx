import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Novel2Scripts - AI 小说转剧本",
  description: "将小说文本转换为结构化 YAML 剧本",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
