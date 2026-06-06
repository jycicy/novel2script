"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import yaml from "js-yaml";
import type { Screenplay } from "@/types/screenplay";

interface ScriptEditorProps {
  screenplay: Screenplay;
  onChange: (yamlText: string) => void;
  onValidate?: (screenplay: Screenplay) => void;
}

export default function ScriptEditor({
  screenplay,
  onChange,
  onValidate,
}: ScriptEditorProps) {
  const [yamlText, setYamlText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const text = yaml.dump(screenplay, { lineWidth: -1, noRefs: true });
    setYamlText(text);
  }, [screenplay]);

  const handleChange = (value: string | undefined) => {
    const text = value || "";
    setYamlText(text);
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

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
        <span className="text-sm font-medium">YAML 编辑器</span>
        {errors.length > 0 && (
          <span className="text-xs text-red-500">{errors[0]}</span>
        )}
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
