# 架构文档

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器                                │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐  │
│  │NovelInput│  │ChapterSelector│  │ScriptEditor│ │ExportMenu  │  │
│  └──────────┘  └──────────────┘  └────────────┘  └────────────┘  │
│       │              │                 │               │          │
│       └──────────────┴────────┬────────┴───────────────┘          │
│                               │                                  │
│                        localStorage                              │
└──────────────────────────────────────┬───────────────────────────┘
                                       │ HTTP /api/*
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  chapters.py │  │ convert.py  │  │      export.py          │  │
│  │  章节检测    │  │ 单章/批量   │  │  校验 / Schema          │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
│         │                │                                       │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌─────────────────────────┐  │
│  │chapter_     │  │ llm_service │  │   yaml_validator        │  │
│  │detector     │  │ (3次重试)   │  │   (自动修复)            │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────────┘  │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │ OpenAI Compatible API
                           ▼
                    ┌──────────────┐
                    │  LLM Service │
                    │ DeepSeek/Qwen│
                    │ GPT/MiMo     │
                    └──────────────┘
```

## 数据流

```
1. 用户粘贴小说文本
2. POST /api/detect-chapters → 返回章节列表（含 content）
3. 用户点击「开始转换」→ 保存到 localStorage → 跳转编辑页
4. POST /api/convert/stream（SSE）→ 逐章调用 LLM → 实时返回结果
5. LLM 输出 → 自动修复 → YAML 解析 → Pydantic 校验 → 返回 Screenplay
6. 前端渲染预览 / Monaco 编辑器编辑
7. 导出 YAML / JSON 文件
```

## 技术选型理由

### 为什么用 Next.js？

- React 生态成熟，组件化开发效率高
- App Router 支持客户端组件，适合 SPA 场景
- 内置 API rewrites 解决开发环境跨域

### 为什么用 FastAPI？

- Python 生态对 LLM SDK 支持最好（OpenAI SDK 原生 Python）
- Pydantic 同时做数据模型 + 校验 + API Schema，一处定义多处使用
- async 支持好，适合 LLM 这种 IO 密集型调用
- 自动生成 OpenAPI 文档

### 为什么用 YAML 而不是 JSON 作为剧本格式？

- YAML 可读性更好，适合人工编辑
- 支持注释，方便在剧本中标注说明
- Monaco Editor 有 YAML 语法高亮
- 结构化程度足够表达场景/角色/对白

### 为什么用 localStorage？

- 题目要求无数据库
- 浏览器原生支持，无需后端存储
- 5MB 容量足够存多章剧本
- 支持文件导出备份

### 为什么用 SSE 而不是 WebSocket？

- 单向推送（服务端→客户端）就够了
- SSE 基于 HTTP，无需额外协议升级
- 浏览器原生 EventSource 支持（虽然我们用 fetch 手动解析更灵活）
- FastAPI StreamingResponse 原生支持

### 为什么顺序转换而不是并行？

- 角色一致性依赖上一章的 characters 列表
- 第 N 章的角色 ID 需要传给第 N+1 章
- 并行会导致角色 ID 不一致

## 核心设计决策

### 角色 ID 线程化

```
第1章: LLM 输出 characters: [alice: protagonist, bob: supporting]
        ↓ 传递
第2章: prompt 包含 "PREVIOUS CHARACTERS: alice, bob"
        → LLM 倾向复用相同 ID
        → 输出 characters: [alice: protagonist, bob: antagonist, charlie: new]
```

### YAML 自动修复策略

1. 去掉 markdown 代码块包裹（LLM 常见输出格式）
2. 修复冒号后缺空格（`key:value` → `key: value`）
3. Tab 转 2 空格
4. 修复后仍失败则用原始内容报错

### LLM 重试策略

- 最多 3 次
- 指数退避：1s → 2s → 4s
- 记录 warning 日志
- 全部失败抛出最后一个异常
