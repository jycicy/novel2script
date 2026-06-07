# Novel2Scripts

> 七牛云 XEngineer 暑期实训营 — AI 小说转剧本工具

将小说文本粘贴进编辑器，自动识别章节，一键转换为结构化 YAML 剧本（场景、角色、对白、舞台指示），支持在线编辑和导出。

# - [视频演示](https://b23.tv/LQTDRe7)<br>

## 功能特性

- 🔍 **智能章节检测** — 自动识别 `第X章`、`Chapter X` 等多种格式
- 🎬 **AI 剧本转换** — 调用 LLM 将小说文本转为结构化 YAML 剧本
- 👥 **角色一致性** — 跨章节自动传递角色 ID，保持人物一致
- 📝 **在线编辑** — Monaco Editor YAML 语法高亮，实时校验
- 📥 **一键导出** — YAML / JSON 下载，复制到剪贴板
- 🔄 **批量转换** — 流式 SSE 逐章转换，实时进度反馈

## 技术架构

```
┌──────────────┐     HTTP      ┌──────────────┐     OpenAI API    ┌──────────┐
│   Next.js    │ ───────────── │   FastAPI     │ ──────────────── │   LLM    │
│   Frontend   │  /api/*       │   Backend     │  chat/completions │  Service │
└──────────────┘               └──────────────┘                   └──────────┘
     │                              │
     │ localStorage                 │ Pydantic 校验
     │ + 文件导出                   │ YAML 解析
     ▼                              ▼
  用户浏览器                    结构化 Screenplay
```

**数据流：** 小说文本 → 章节检测 → LLM 转换 → YAML 校验 → 预览/编辑 → 导出

## 快速启动

### 1. 后端

```bash
cd backend
pip install -r requirements.txt
```

创建 `.env` 文件：

```env
N2S_LLM_API_KEY=你的API密钥
N2S_LLM_BASE_URL=https://api.openai.com/v1
N2S_LLM_MODEL=gpt-4o-mini
N2S_LLM_MAX_TOKENS=8192
N2S_LLM_TEMPERATURE=0.3
```

启动：

```bash
uvicorn main:app --reload
```

### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `N2S_LLM_API_KEY` | LLM API 密钥 | 必填 |
| `N2S_LLM_BASE_URL` | API 地址（支持 DeepSeek/Qwen/GPT/MiMo） | `https://api.openai.com/v1` |
| `N2S_LLM_MODEL` | 模型名称 | `gpt-4o-mini` |
| `N2S_LLM_MAX_TOKENS` | 最大输出 token | `8192` |
| `N2S_LLM_TEMPERATURE` | 生成温度 | `0.3` |

## API 接口

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/detect-chapters` | POST | 检测章节 |
| `/api/convert` | POST | 单章节转换 |
| `/api/convert/batch` | POST | 批量转换 |
| `/api/convert/stream` | POST | SSE 流式转换 |
| `/api/validate` | POST | YAML 校验 |
| `/api/schema` | GET | 获取 Schema |

## 项目结构

```
novel2scripts/
├── backend/
│   ├── main.py                 # FastAPI 入口
│   ├── config.py               # 环境变量配置
│   ├── schemas/
│   │   ├── screenplay.py       # 剧本 Pydantic 模型
│   │   ├── requests.py         # API 请求/响应模型
│   │   └── screenplay_schema.yaml
│   ├── services/
│   │   ├── chapter_detector.py # 章节检测
│   │   ├── llm_service.py      # LLM 调用（含重试）
│   │   ├── prompt_builder.py   # Prompt 构建
│   │   └── yaml_validator.py   # YAML 校验 + 自动修复
│   ├── routers/
│   │   ├── chapters.py         # 章节检测路由
│   │   ├── convert.py          # 转换路由（单章/批量/流式）
│   │   └── export.py           # 导出路由
│   └── prompts/
│       └── convert_chapter.txt # 转换 Prompt 模板
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # 首页（输入 + 检测）
│   │   │   └── convert/page.tsx # 编辑页（预览/编辑/导出）
│   │   ├── components/         # UI 组件
│   │   ├── lib/                # API/校验/存储工具
│   │   └── types/              # TypeScript 类型
│   └── public/
│       └── sample-novel.txt    # 示例小说
└── docs/
    ├── schema-spec.md          # Schema 说明
    └── api-spec.md             # API 文档
```

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | Next.js 15 + Tailwind CSS + Monaco Editor |
| 后端 | Python FastAPI + Pydantic |
| LLM | OpenAI 兼容 API（可切换 DeepSeek/Qwen/GPT/MiMo） |
| 存储 | localStorage + 文件下载（无数据库） |

## License

MIT
