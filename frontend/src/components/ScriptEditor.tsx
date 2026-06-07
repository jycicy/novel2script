"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import yaml from "js-yaml";
import type { Screenplay } from "@/types/screenplay";

interface ScriptEditorProps {
  screenplay: Screenplay;
  onChange: (yamlText: string) => void;
  onValidate?: (screenplay: Screenplay) => void;
  onSave?: (screenplay: Screenplay) => void;
}

export default function ScriptEditor({
  screenplay,
  onChange,
  onValidate,
  onSave,
}: ScriptEditorProps) {
  const [yamlText, setYamlText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const text = yaml.dump(screenplay, { lineWidth: -1, noRefs: true });
    setYamlText(text);
  }, [screenplay]);

  const handleChange = (value: string | undefined) => {
    const text = value || "";
    setYamlText(text);
    setSaved(false);
    onChange(text);

    // Validate
    try {
      const data = yaml.load(text);
      if (data && typeof data === "object") {
        setErrors([]);
        onValidate?.(data as Screenplay);
      }
    } catch (e) {
      const err = e as { message?: string };
      setErrors([err.message || "YAML 语法错误"]);
    }
  };

  const handleSave = () => {
    if (!onSave) return;
    try {
      const data = yaml.load(yamlText);
      if (data && typeof data === "object") {
        onSave(data as Screenplay);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // 有语法错误时不允许保存
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
        <span className="text-sm font-medium">YAML 编辑器</span>
        <div className="flex items-center gap-2">
          {errors.length > 0 && (
            <span className="text-xs text-red-500">{errors[0]}</span>
          )}
          {onSave && (
            <button
              onClick={handleSave}
              disabled={errors.length > 0}
              className={`px-3 py-1 text-xs rounded transition ${
                saved
                  ? "bg-green-100 text-green-700"
                  : errors.length > 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {saved ? "✓ 已保存" : "保存修改"}
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <Editor
        height="500px"
        defaultLanguage="yaml"
        value={yamlText}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
        }}
      />
    </div>
  );
}
