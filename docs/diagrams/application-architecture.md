# 应用架构图

```mermaid
graph TB
    subgraph Presentation["表现层"]
        Landing["着陆页"]
        EditorPage["编辑页"]
        Preview["预览页"]
    end

    subgraph Components["组件层"]
        NovelInput["NovelInput"]
        ChapterList["ChapterList"]
        Monaco["MonacoEditor"]
        ScriptPreview["ScriptPreview"]
        ExportMenu["ExportMenu"]
    end

    subgraph Services["前端服务层"]
        APIClient["api.ts"]
        Storage["localStorage"]
        Router["Next.js Router"]
    end

    subgraph APILayer["API 路由层"]
        Health["/api/health"]
        Detect["/api/detect-chapters"]
        Convert["/api/convert"]
        Validate["/api/validate"]
        Schema["/api/schema"]
    end

    subgraph BusinessLayer["业务逻辑层"]
        Detector["chapter_detector"]
        LLMService["llm_service"]
        Validator["yaml_validator"]
        SchemaDef["schema_def"]
    end

    Landing --> NovelInput
    Landing --> ChapterList
    EditorPage --> Monaco
    EditorPage --> ScriptPreview
    EditorPage --> ExportMenu

    NovelInput --> APIClient
    ChapterList --> APIClient
    Monaco --> APIClient
    ExportMenu --> APIClient

    APIClient --> Health
    APIClient --> Detect
    APIClient --> Convert
    APIClient --> Validate
    APIClient --> Schema

    Health --> Detector
    Detect --> Detector
    Convert --> LLMService
    Validate --> Validator
    Schema --> SchemaDef

    Storage --> NovelInput
    Storage --> Monaco
    Router --> Landing
    Router --> EditorPage

    style Presentation fill:#e3f2fd,stroke:#1565c0
    style Components fill:#bbdefb,stroke:#1565c0
    style Services fill:#fff3e0,stroke:#f57c00
    style APILayer fill:#f3e5f5,stroke:#7b1fa2
    style BusinessLayer fill:#e8f5e9,stroke:#388e3c
```

## 分层职责

| 层次 | 职责 | 技术实现 |
|------|------|----------|
| 表现层 | 页面路由与布局 | Next.js App Router |
| 组件层 | UI 交互与展示 | React + Tailwind |
| 服务层 | 数据通信与存储 | fetch + localStorage |
| API 路由层 | 请求分发 | FastAPI Router |
| 业务逻辑层 | 核心处理 | Python 服务类 |
