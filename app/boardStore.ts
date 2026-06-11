"use client";
import { useSyncExternalStore } from "react";

// The target board the user picked in the "支持的硬件" list. It's synced onto
// the active thread's target_board at message-send time (MyRuntimeProvider), so
// the requirement validator checks the requested resolution against THIS board.
let _selected = "FD_F1_R88R30_ADB_SPINOR";
const _subs = new Set<() => void>();

export function getSelectedBoard(): string {
  return _selected;
}

export function setSelectedBoard(id: string): void {
  if (id && id !== _selected) {
    _selected = id;
    _subs.forEach((f) => f());
  }
}

function subscribe(fn: () => void): () => void {
  _subs.add(fn);
  return () => { _subs.delete(fn); };
}

export function useSelectedBoard(): string {
  return useSyncExternalStore(subscribe, getSelectedBoard, getSelectedBoard);
}
