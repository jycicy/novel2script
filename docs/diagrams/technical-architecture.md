# 技术架构图

```mermaid
graph TB
    subgraph Client["客户端"]
        Browser["浏览器"]
        ES["EventSource SSE"]
        LS["localStorage"]
    end

    subgraph Frontend["前端技术栈"]
        NextJS["Next.js 14"]
        React["React 18"]
        Monaco["Monaco Editor"]
        Tailwind["Tailwind CSS"]
        TypeScript["TypeScript"]
    end

    subgraph Proxy["代理层"]
        Rewrite["next.config.ts rewrite"]
    end

    subgraph Backend["后端技术栈"]
        FastAPI["FastAPI"]
        Uvicorn["Uvicorn ASGI"]
        Pydantic["Pydantic v2"]
        OpenAI["OpenAI SDK"]
        PyYAML["PyYAML"]
        Regex["regex"]
    end

    subgraph External["外部服务"]
        DeepSeek["DeepSeek API"]
        Qwen["Qwen API"]
        GPT["GPT API"]
        MiMo["MiMo API"]
    end

    Browser --> NextJS
    Browser --> ES
    Browser --> LS
    NextJS --> React
    NextJS --> Monaco
    NextJS --> Tailwind
    NextJS --> TypeScript

    React --> Rewrite
    Rewrite --> Uvicorn
    Uvicorn --> FastAPI
    FastAPI --> Pydantic
    FastAPI --> OpenAI
    FastAPI --> PyYAML
    FastAPI --> Regex

    OpenAI --> DeepSeek
    OpenAI --> Qwen
    OpenAI --> GPT
    OpenAI --> MiMo

    style Client fill:#e3f2fd,stroke:#1565c0
    style Frontend fill:#bbdefb,stroke:#1565c0
    style Proxy fill:#fff9c4,stroke:#f9a825
    style Backend fill:#f3e5f5,stroke:#7b1fa2
    style External fill:#ffebee,stroke:#c62828
```

## 技术选型

| 层次 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 前端框架 | Next.js | 14 | App Router, SSR/CSR 灵活切换 |
| UI 框架 | React | 18 | 组件化开发，生态成熟 |
| 编辑器 | Monaco Editor | - | VS Code 同款，YAML 高亮 |
| 样式 | Tailwind CSS | 3 | 原子化 CSS，开发效率高 |
| 后端框架 | FastAPI | - | 异步支持好，自动 OpenAPI 文档 |
| 数据校验 | Pydantic | v2 | 类型安全，Schema 生成 |
| LLM 调用 | OpenAI SDK | - | 兼容多家 LLM API |
| YAML 处理 | PyYAML | - | 解析/生成 YAML |
| 通信协议 | HTTP + SSE | - | REST + 流式推送 |
