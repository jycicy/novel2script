"use client";

import { useRef, useState, useEffect, useCallback } from "react";

/**
 * 自动滚动 hook：
 * - 新内容到来时自动滚到底部
 * - 用户手动往上滚时暂停自动滚动
 * - 提供 scrollToBottom 方法和 isAtBottom 状态
 */
export function useAutoScroll(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const userScrolledRef = useRef(false);

  // 检测用户是否手动滚动
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setIsAtBottom(atBottom);
    if (!atBottom) {
      userScrolledRef.current = true;
    }
  }, []);

  // 手动滚到底部
  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    userScrolledRef.current = false;
    el.scrollTop = el.scrollHeight;
    setIsAtBottom(true);
  }, []);

  // 内容变化时自动滚到底部（除非用户手动滚上去了）
  useEffect(() => {
    if (!userScrolledRef.current) {
      const el = containerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, deps);

  return { containerRef, isAtBottom, scrollToBottom, handleScroll };
}
