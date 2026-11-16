import { useEffect, useState } from "react";

type Undo = { label: string; until: number; restore: () => Promise<boolean> };

/** The operation is already saved. Undo performs a separate write if still offered. */
export function useUndoAction() {
  const [undo, setUndo] = useState<Undo | null>(null);
  useEffect(() => {
    if (!undo) return;
    const timeout = setTimeout(() => setUndo(null), Math.max(0, undo.until - Date.now()));
    return () => clearTimeout(timeout);
  }, [undo]);
  return {
    undo,
    offer: (label: string, restore: Undo["restore"]) => setUndo({ label, restore, until: Date.now() + 5000 }),
    restore: () => {
      if (!undo || Date.now() > undo.until) return;
      setUndo(null);
      void undo.restore();
    },
  };
}
