# 业务架构图

```mermaid
graph TB
    subgraph User["用户角色"]
        Author["小说作者"]
        Editor["编剧/编辑"]
    end

    subgraph CoreBusiness["核心业务"]
        Upload["文本输入"]
        Detect["章节检测"]
        Convert["AI 转换"]
        Edit["剧本编辑"]
        Export["导出交付"]
    end

    subgraph BusinessValue["业务价值"]
        SaveTime["节省人工改编时间"]
        Consistency["保持角色一致性"]
        Standard["标准化剧本格式"]
    end

    Author --> Upload
    Author --> Edit
    Editor --> Edit
    Editor --> Export

    Upload --> Detect
    Detect --> Convert
    Convert --> Edit
    Edit --> Export

    Export --> SaveTime
    Convert --> Consistency
    Edit --> Standard

    style User fill:#e3f2fd,stroke:#1565c0
    style CoreBusiness fill:#fff3e0,stroke:#f57c00
    style BusinessValue fill:#e8f5e9,stroke:#388e3c
```

## 业务流程说明

| 阶段 | 输入 | 输出 | 价值 |
|------|------|------|------|
| 文本输入 | 小说原文 | 结构化文本 | 降低使用门槛 |
| 章节检测 | 原始文本 | 章节列表 | 自动化分割 |
| AI 转换 | 章节文本 | YAML 剧本 | 智能改编 |
| 剧本编辑 | YAML 剧本 | 修改后剧本 | 人工精修 |
| 导出交付 | 最终剧本 | YAML/JSON 文件 | 标准化输出 |
