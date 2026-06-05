# Novel2Scripts

AI 小说转剧本工具 — 将小说文本转换为结构化 YAML 剧本。

## 技术栈

- Frontend: Next.js + Tailwind CSS
- Backend: Python FastAPI
- Core: LLM API (OpenAI 兼容格式)

## 快速启动

**后端：**

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # 填入 LLM API Key
uvicorn main:app --reload
```

**前端：**

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000
