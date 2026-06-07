import re
import yaml
from pydantic import ValidationError as PydanticValidationError

from schemas.screenplay import Screenplay
from schemas.requests import ValidationError


def repair_common_yaml_errors(raw: str) -> str:
    text = raw.strip()

    # 1. 去掉 markdown 代码块包裹
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    # 2. 修复冒号后缺少空格 (key:value → key: value)
    text = re.sub(r"(\w):(\S)", r"\1: \2", text)

    # 3. 去掉行尾多余空格
    lines = text.split("\n")
    lines = [line.rstrip() for line in lines]

    # 4. 修复常见缩进问题（tab → 2 空格）
    lines = [line.replace("\t", "  ") for line in lines]

    # 5. 修复未闭合的双引号（key: "value 没有闭合引号）
    fixed_lines = []
    for line in lines:
        m = re.match(r'^(\s*[\w_]+:\s*)"(.+)$', line)
        if m and not line.rstrip().endswith('"'):
            indent, content = m.group(1), m.group(2)
            content = content.rstrip('"').rstrip()
            line = f'{indent}"{content}"'

        # 6. 修复值以 [ 开头但不是 YAML 数组的情况
        #    例如 text: [V.O.] 内容 → text: "[V.O.] 内容"
        #    判断依据：[ 和 ] 之间没有逗号，且 ] 后面还有内容
        m2 = re.match(r'^(\s*[\w_]+:\s*)\[(.+)$', line)
        if m2 and not re.match(r'^\s*[\w_]+:\s*\[.*?,.*?\]', line):
            indent, content = m2.group(1), m2.group(2)
            # 补上开头丢失的 [
            line = f'{indent}"[{content}"'
            # 如果行尾没有闭合引号，补上
            if not line.rstrip().endswith('"'):
                line = line.rstrip() + '"'

        fixed_lines.append(line)

    return "\n".join(fixed_lines)


def validate_screenplay_yaml(raw_yaml: str) -> tuple[Screenplay | None, list[ValidationError]]:
    errors: list[ValidationError] = []

    # 先尝试自动修复
    repaired = repair_common_yaml_errors(raw_yaml)

    try:
        data = yaml.safe_load(repaired)
    except yaml.YAMLError:
        # 修复后仍失败，用原始内容再试一次并报错
        try:
            data = yaml.safe_load(raw_yaml)
        except yaml.YAMLError as e:
            line = getattr(e, "problem_mark", None)
            line_num = line.line + 1 if line else None
            errors.append(ValidationError(line=line_num, message=f"YAML 解析错误: {e}"))
            return None, errors

    if not isinstance(data, dict):
        errors.append(ValidationError(message="YAML 根元素必须是对象"))
        return None, errors

    try:
        screenplay = Screenplay(**data)
    except PydanticValidationError as e:
        for err in e.errors():
            loc = " → ".join(str(x) for x in err["loc"])
            errors.append(ValidationError(message=f"{loc}: {err['msg']}"))
        return None, errors

    return screenplay, []
