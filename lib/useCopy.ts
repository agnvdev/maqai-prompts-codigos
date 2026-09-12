"use client";

import { useCallback, useRef, useState } from "react";

export function useCopy(resetDelay = 1800) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), resetDelay);
      } catch {
        // clipboard indisponível (permissão negada, contexto não seguro etc.)
      }
    },
    [resetDelay]
  );

  return { copied, copy };
}
