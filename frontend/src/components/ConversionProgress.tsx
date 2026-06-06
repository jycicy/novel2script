"use client";

interface ConversionProgressProps {
  isConverting: boolean;
  error?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

export default function ConversionProgress({
  isConverting,
  error,
  onRetry,
  onCancel,
}: ConversionProgressProps) {
  if (!isConverting && !error) return null;

  return (
    <div className="mb-4">
      {isConverting && (
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
          <p className="text-sm text-blue-700">正在转换中…可点击左侧章节切换查看</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-500">✕</span>
          <p className="text-sm text-red-600 flex-1">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              重试
            </button>
          )}
        </div>
      )}
    </div>
  );
}
