# YAML Schema 规范文档

## 概述

本 Schema 定义了小说转剧本工具的输出格式。所有 LLM 转换结果必须符合此规范。

## 顶层结构

```yaml
meta:        # 元信息（必填）
characters:  # 角色列表（必填）
scenes:      # 场景列表（必填）
```

---

## meta — 元信息

| 字段               | 类型   | 必填 | 说明                         |
| ------------------ | ------ | ---- | ---------------------------- |
| title              | string | 是   | 剧本标题                     |
| source_chapter     | string | 是   | 原文章节引用                 |
| genre              | enum   | 是   | 类型                         |
| estimated_duration | string | 是   | 预估时长，如 "25 minutes"    |
| author             | string | 否   | 作者                         |
| version            | string | 否   | Schema 版本，默认 "1.0"      |
| created_at         | string | 否   | 创建时间（ISO 8601）         |

### genre 枚举值

| 值      | 说明   |
| ------- | ------ |
| drama   | 剧情   |
| comedy  | 喜剧   |
| thriller| 悬疑   |
| romance | 爱情   |
| horror  | 恐怖   |
| action  | 动作   |
| scifi   | 科幻   |
| fantasy | 奇幻   |
| literary| 文艺   |
| other   | 其他   |

---

## characters — 角色列表

每个角色对象：

| 字段        | 类型     | 必填 | 说明                          |
| ----------- | -------- | ---- | ----------------------------- |
| id          | string   | 是   | 机器可读标识符（snake_case）  |
| name        | string   | 是   | 显示名称                      |
| aliases     | string[] | 否   | 文中使用的其他称呼            |
| role        | enum     | 是   | 角色类型                      |
| description | string   | 否   | 简要描述                      |
| appearance  | string   | 否   | 外貌描述                      |
| voice_notes | string   | 否   | 语气/说话风格提示             |

### role 枚举值

| 值         | 说明   |
| ---------- | ------ |
| protagonist| 主角   |
| antagonist | 反派   |
| supporting | 配角   |
| minor      | 龙套   |
| narrator   | 旁白   |

---

## scenes — 场景列表

每个场景对象：

| 字段         | 类型           | 必填 | 说明                          |
| ------------ | -------------- | ---- | ----------------------------- |
| scene_number | integer        | 是   | 场景序号（≥1）                |
| heading      | string         | 是   | 场景标题（INT./EXT. 格式）    |
| location     | string         | 是   | 地点                          |
| time         | string         | 是   | 时间（DAY/NIGHT/DAWN/DUSK）   |
| atmosphere   | string         | 否   | 氛围描述                      |
| content      | ContentBlock[] | 是   | 内容块列表                    |

---

## ContentBlock — 内容块

每个内容块必须包含 `type` 字段，根据类型携带不同字段：

### action（动作/舞台指示）

```yaml
- type: "action"
  text: "他慢慢走向门口，停下脚步。"
```

### dialogue（对白）

```yaml
- type: "dialogue"
  character: "li_ming"
  dialogue: "你好，请进。"
```

### parenthetical（表演指示）

```yaml
- type: "parenthetical"
  character: "li_ming"
  parenthetical: "犹豫了一下"
```

### transition（转场）

```yaml
- type: "transition"
  transition: "CUT TO:"
```

### scene_heading（场景标题）

```yaml
- type: "scene_heading"
  text: "INT. 山中小屋 - NIGHT"
```

---

## 完整示例

```yaml
meta:
  title: "山中小屋"
  source_chapter: "第一章"
  genre: literary
  estimated_duration: "15 minutes"
  version: "1.0"

characters:
  - id: li_ming
    name: 李明
    aliases: ["明子"]
    role: protagonist
    description: "独居山中的作家，正在创作长篇小说"
    appearance: "三十多岁，略显消瘦"
    voice_notes: "沉稳，偶尔自言自语"

  - id: wang_hua
    name: 王华
    role: supporting
    description: "李明的老朋友"
    voice_notes: "爽朗，爱开玩笑"

scenes:
  - scene_number: 1
    heading: "EXT. 山间小路 - DAWN"
    location: "山间小路"
    time: DAWN
    atmosphere: "薄雾笼罩，宁静祥和"
    content:
      - type: action
        text: "清晨的薄雾笼罩着山谷，一条蜿蜒的小路通向山腰上的木屋。"
      - type: action
        text: "李明推开木门，深吸一口清冷的空气。"

  - scene_number: 2
    heading: "INT. 山中小屋 - DAWN"
    location: "山中小屋"
    time: DAWN
    content:
      - type: action
        text: "李明走到窗边，一只松鼠跳过枝头，停在窗台上。"
      - type: dialogue
        character: li_ming
        dialogue: "你又来了。"
      - type: action
        text: "手机突然响了。"
      - type: dialogue
        character: wang_hua
        dialogue: "喂，明子，你还窝在那山上呢？"
      - type: parenthetical
        character: li_ming
        parenthetical: "端起茶杯，望向窗外"
      - type: dialogue
        character: li_ming
        dialogue: "山里挺好的，清净。"
```
