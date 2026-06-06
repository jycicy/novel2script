# API 接口文档

## 基础信息

- Base URL: `http://localhost:8000`
- Content-Type: `application/json`

---

## GET /api/health

健康检查。

**响应：**
```json
{ "status": "ok" }
```

---

## POST /api/detect-chapters

检测小说文本中的章节结构。

**请求：**
```json
{
  "text": "第一章 开始\n这是内容。\n第二章 结束\n更多内容。"
}
```

**响应：**
```json
{
  "chapters": [
    {
      "index": 0,
      "title": "第一章 开始",
      "start_line": 0,
      "end_line": 1,
      "char_count": 12
    },
    {
      "index": 1,
      "title": "第二章 结束",
      "start_line": 2,
      "end_line": 3,
      "char_count": 12
    }
  ],
  "total_chars": 24
}
```

**支持的章节格式：**
- `第X章/节/回/卷`
- `Chapter X`
- `数字编号`（如 `1. xxx`）
- 无标记时按 2000 字自动分段

---

## POST /api/convert

将小说章节文本转换为结构化剧本。

**请求：**
```json
{
  "chapter_text": "第一章 山中小屋\n\n清晨的薄雾笼罩着山谷...",
  "chapter_index": 0,
  "title": "山中小屋",
  "previous_characters": null
}
```

| 字段               | 类型     | 必填 | 说明                     |
| ------------------ | -------- | ---- | ------------------------ |
| chapter_text       | string   | 是   | 章节原文                 |
| chapter_index      | integer  | 是   | 章节索引（从 0 开始）    |
| title              | string   | 是   | 章节标题                 |
| previous_characters| array    | 否   | 前章角色列表（保持一致性）|

**响应：**
```json
{
  "screenplay": {
    "meta": {
      "title": "山中小屋",
      "source_chapter": "第一章",
      "genre": "literary",
      "estimated_duration": "15 minutes"
    },
    "characters": [
      {
        "id": "li_ming",
        "name": "李明",
        "role": "protagonist"
      }
    ],
    "scenes": [
      {
        "scene_number": 1,
        "heading": "EXT. 山间小路 - DAWN",
        "location": "山间小路",
        "time": "DAWN",
        "content": [
          { "type": "action", "text": "..." }
        ]
      }
    ]
  },
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0
  }
}
```

**错误响应（422）：**
```json
{
  "detail": {
    "message": "LLM 输出不符合 Schema",
    "errors": [{ "line": null, "message": "meta.title: field required" }],
    "raw_yaml": "..."
  }
}
```

---

## POST /api/validate

校验 YAML 是否符合剧本 Schema。

**请求：**
```json
{
  "yaml_text": "meta:\n  title: test\n  ..."
}
```

**响应：**
```json
{
  "valid": true,
  "errors": [],
  "screenplay": { ... }
}
```

校验失败时：
```json
{
  "valid": false,
  "errors": [{ "line": null, "message": "meta.title: field required" }],
  "screenplay": null
}
```

---

## GET /api/schema

获取机器可读的 YAML Schema 定义。

**响应：** YAML 格式的 Schema 文件

---

## 错误码

| 状态码 | 说明                     |
| ------ | ------------------------ |
| 200    | 成功                     |
| 422    | LLM 输出不符合 Schema    |
| 502    | LLM API 调用失败         |
| 500    | 服务器内部错误           |
