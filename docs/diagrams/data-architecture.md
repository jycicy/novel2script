# 数据架构图

```mermaid
graph TB
    subgraph InputData["输入数据"]
        NovelText["小说文本 string"]
        ChapterMeta["章节元数据 index, title, lines"]
    end

    subgraph ProcessData["处理中间数据"]
        Prompt["LLM Prompt string"]
        RawYAML["LLM 输出 YAML string"]
        FixedYAML["修复后 YAML string"]
    end

    subgraph OutputData["输出数据 - Screenplay"]
        Meta["meta title, genre, duration"]
        Characters["characters id, name, role, aliases"]
        Scenes["scenes location, time, content"]
        ContentBlock["ContentBlock type, text, character, dialogue"]
    end

    subgraph StorageData["存储"]
        LocalStorage["localStorage chapters, scripts"]
        FileExport["文件导出 YAML/JSON"]
    end

    NovelText --> Prompt
    ChapterMeta --> Prompt
    Prompt --> RawYAML
    RawYAML --> FixedYAML
    FixedYAML --> Meta
    FixedYAML --> Characters
    FixedYAML --> Scenes
    Scenes --> ContentBlock

    Meta --> LocalStorage
    Characters --> LocalStorage
    Scenes --> LocalStorage
    Meta --> FileExport
    Characters --> FileExport
    Scenes --> FileExport

    style InputData fill:#e1f5fe,stroke:#0288d1
    style ProcessData fill:#fff3e0,stroke:#f57c00
    style OutputData fill:#e8f5e9,stroke:#388e3c
    style StorageData fill:#f3e5f5,stroke:#7b1fa2
```

## 数据模型 - Screenplay

```mermaid
graph LR
    Screenplay["Screenplay"] --> Meta2["Meta"]
    Screenplay --> Characters2["Characters"]
    Screenplay --> Scenes2["Scenes"]

    Meta2 --> Title["title string"]
    Meta2 --> Genre["genre enum"]
    Meta2 --> Duration["duration string"]

    Characters2 --> CharId["id string snake_case"]
    Characters2 --> CharName["name string"]
    Characters2 --> CharRole["role enum"]
    Characters2 --> CharAliases["aliases string array"]

    Scenes2 --> SceneNum["scene_number int"]
    Scenes2 --> Location["location string"]
    Scenes2 --> Time["time enum"]
    Scenes2 --> Content["content ContentBlock array"]

    Content --> ActionType["type: action"]
    Content --> DialogueType["type: dialogue"]
    Content --> ParenType["type: parenthetical"]
    Content --> TransType["type: transition"]

    style Screenplay fill:#fff9c4,stroke:#f9a825
    style Meta2 fill:#e3f2fd,stroke:#1565c0
    style Characters2 fill:#fce4ec,stroke:#c62828
    style Scenes2 fill:#e8f5e9,stroke:#388e3c
```

## 数据流转路径

| 阶段 | 数据格式 | 处理方式 |
|------|----------|----------|
| 用户输入 | 纯文本 | textarea 采集 |
| 章节检测 | JSON | regex 模式匹配 |
| LLM 调用 | Prompt string | OpenAI SDK |
| LLM 输出 | YAML string | 流式返回 |
| YAML 修复 | YAML string | regex 替换 |
| 数据校验 | Pydantic Model | 类型验证 |
| 前端存储 | JSON string | localStorage |
| 文件导出 | YAML/JSON | Blob 下载 |

## 枚举值定义

| 字段 | 可选值 |
|------|--------|
| genre | drama, comedy, thriller, romance, horror, action, scifi, fantasy, literary, other |
| role | protagonist, antagonist, supporting, minor, narrator |
| type | action, dialogue, parenthetical, transition, scene_heading |
| time | 黎明, 白天, 黄昏, 夜晚, 连续 |
