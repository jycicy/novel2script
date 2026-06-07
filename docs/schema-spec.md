# YAML Schema 规范文档

## 概述

本 Schema 定义了小说转剧本工具的输出格式。所有 LLM 转换结果必须符合此规范。

---

## 设计原因

### 为什么选择 YAML

小说转剧本的核心挑战是让 LLM 输出结构化数据。相比 JSON，YAML 有三个关键优势：

1. **人类可读性强**：无引号、无逗号的语法让作者可以直接阅读和手动编辑剧本，无需处理 JSON 的转义字符噪音
2. **LLM 输出更稳定**：JSON 要求每个字符串值都加引号，LLM 容易遗漏或嵌套错误；YAML 的缩进语法减少了出错概率
3. **层级结构天然匹配剧本**：剧本本身就是"场景→内容块→对白/动作"的嵌套结构，YAML 的缩进层级与之一一对应

### 为什么采用三层结构（meta / characters / scenes）

```
Screenplay
├── meta        → 元信息层
├── characters  → 角色层
└── scenes      → 叙事层
```

- **meta 独立**：标题、类型、时长等元信息用于项目管理和检索，与内容解耦后可以批量处理（如按类型筛选、按时长排序）
- **characters 独立提取**：角色是跨章节的持久实体。独立存储允许后续章节通过 `id` 复用已有角色定义，保持一致性
- **scenes 承载叙事**：场景是剧本的基本叙事单元，每个场景包含地点、时间、氛围和内容块，符合行业标准的场景分解方式

### 为什么 ContentBlock 用 type + 多字段

标准剧本包含 5 种内容类型（动作、对白、表演指示、转场、场景标题），每种携带不同字段。设计选择：

- **统一 `type` 字段**而非为每种类型建独立列表：让场景内的内容块保持**时间顺序**，渲染器按顺序读取即可，无需合并排序
- **字段平铺而非嵌套**：`character` 和 `dialogue` 直接在 ContentBlock 上，而非嵌套在 `speaker: { id, line }` 中，减少层级深度，LLM 输出更简洁

### 为什么角色用 `id` 而非 `name`

小说中同一角色可能有多个称呼（真名、昵称、外号），且跨章节称呼可能变化。使用机器可读的 `id`（如 `li_ming`）确保：

- 跨章节引用一致，不因称呼变化导致角色分裂
- 对白中的 `character` 字段可以精确匹配角色定义
- `aliases` 字段记录所有称呼，供渲染和搜索使用

### 为什么枚举值用英文

`genre`、`role`、`type` 等枚举值使用英文（如 `drama`、`protagonist`、`dialogue`），原因：

- 避免 LLM 中英文混用导致校验失败（"剧情" vs "drama" vs "剧情片"）
- 英文枚举值无歧义，程序处理更可靠
- 角色类型等概念在中英文中都有明确对应，不存在翻译损失

### 为什么内容字段用中文

`text`、`dialogue`、`description` 等内容字段使用中文，因为：

- 原文是中文小说，转换后的剧本应保持语言一致性
- 作者阅读和编辑时无需中英切换
- 枚举值用英文 + 内容用中文的组合，在人机可读性之间取得平衡

---

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
| time         | string         | 是   | 时间（白天/夜晚/黎明/黄昏/连续） |
| atmosphere   | string         | 否   | 氛围描述                      |
| content      | ContentBlock[] | 是   | 内容块列表                    |

---

## ContentBlock — 内容块

每个内容块必须包含 `type` 字段，根据类型携带不同字段。

### 类型与必填字段

| type | 必须携带的字段 | 说明 |
|------|---------------|------|
| action | `text` | 动作/舞台指示 |
| dialogue | `character`, `dialogue` | 角色对白 |
| parenthetical | `character`, `parenthetical` | 表演指示（语气、动作提示） |
| transition | `transition` | 场景转场（如 CUT TO:） |
| scene_heading | `text` | 场景标题行 |

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
  text: "INT. 山中小屋 - 夜晚"
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
    heading: "EXT. 山间小路 - 黎明"
    location: "山间小路"
    time: 黎明
    atmosphere: "薄雾笼罩，宁静祥和"
    content:
      - type: action
        text: "清晨的薄雾笼罩着山谷，一条蜿蜒的小路通向山腰上的木屋。"
      - type: action
        text: "李明推开木门，深吸一口清冷的空气。"

  - scene_number: 2
    heading: "INT. 山中小屋 - 黎明"
    location: "山中小屋"
    time: 黎明
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
