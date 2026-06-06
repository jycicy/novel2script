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
    <div className="border rounded-lg p-6 text-center">
      {isConverting && (
        <>
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-600">正在转换，请稍候...</p>
          <p className="text-xs text-gray-400 mt-1">这可能需要 10-30 秒</p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
            >
              取消
            </button>
          )}
        </>
      )}

      {error && (
        <>
          <div className="text-red-500 text-2xl mb-2">✕</div>
          <p className="text-sm text-red-600 mb-3">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              重试
            </button>
          )}
        </>
      )}
    </div>
  );
}
