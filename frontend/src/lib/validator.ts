import yaml from "js-yaml";
import type { Screenplay } from "@/types/screenplay";

export interface ValidationError {
  line?: number;
  message: string;
}

export interface ValidationResult {
  screenplay: Screenplay | null;
  errors: ValidationError[];
}

const REQUIRED_META = ["title", "source_chapter", "genre", "estimated_duration"];
const VALID_GENRES = ["drama", "comedy", "thriller", "romance", "horror", "action", "scifi", "fantasy", "literary", "other"];
const VALID_ROLES = ["protagonist", "antagonist", "supporting", "minor", "narrator"];
const VALID_CONTENT_TYPES = ["action", "dialogue", "parenthetical", "transition", "scene_heading"];

export function parseAndValidateYaml(yamlText: string): ValidationResult {
  const errors: ValidationError[] = [];

  let data: unknown;
  try {
    data = yaml.load(yamlText);
  } catch (e) {
    const err = e as yaml.YAMLException;
    errors.push({ line: err.mark?.line ? err.mark.line + 1 : undefined, message: `YAML 解析错误: ${err.message}` });
    return { screenplay: null, errors };
  }

  if (!data || typeof data !== "object") {
    errors.push({ message: "YAML 根元素必须是对象" });
    return { screenplay: null, errors };
  }

  const obj = data as Record<string, unknown>;

  // meta
  if (!obj.meta || typeof obj.meta !== "object") {
    errors.push({ message: "缺少 meta 字段" });
  } else {
    const meta = obj.meta as Record<string, unknown>;
    for (const key of REQUIRED_META) {
      if (!meta[key]) errors.push({ message: `meta.${key} 是必填字段` });
    }
    if (meta.genre && !VALID_GENRES.includes(meta.genre as string)) {
      errors.push({ message: `meta.genre 值无效: ${meta.genre}` });
    }
  }

  // characters
  if (!Array.isArray(obj.characters)) {
    errors.push({ message: "缺少 characters 字段" });
  } else {
    obj.characters.forEach((c, i) => {
      const char = c as Record<string, unknown>;
      if (!char.id) errors.push({ message: `characters[${i}].id 是必填字段` });
      if (!char.name) errors.push({ message: `characters[${i}].name 是必填字段` });
      if (char.role && !VALID_ROLES.includes(char.role as string)) {
        errors.push({ message: `characters[${i}].role 值无效: ${char.role}` });
      }
    });
  }

  // scenes
  if (!Array.isArray(obj.scenes)) {
    errors.push({ message: "缺少 scenes 字段" });
  } else {
    obj.scenes.forEach((s, i) => {
      const scene = s as Record<string, unknown>;
      if (!scene.heading) errors.push({ message: `scenes[${i}].heading 是必填字段` });
      if (!scene.location) errors.push({ message: `scenes[${i}].location 是必填字段` });
      if (!Array.isArray(scene.content)) {
        errors.push({ message: `scenes[${i}].content 必须是数组` });
      } else {
        scene.content.forEach((c, j) => {
          const block = c as Record<string, unknown>;
          if (!block.type) errors.push({ message: `scenes[${i}].content[${j}].type 是必填字段` });
          if (block.type && !VALID_CONTENT_TYPES.includes(block.type as string)) {
            errors.push({ message: `scenes[${i}].content[${j}].type 值无效: ${block.type}` });
          }
        });
      }
    });
  }

  return {
    screenplay: errors.length === 0 ? (obj as unknown as Screenplay) : null,
    errors,
  };
}
