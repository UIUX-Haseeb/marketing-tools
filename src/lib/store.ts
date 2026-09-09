"use client";

/**
 * Tiny client-side log of generated posts (localStorage) so the demo needs no backend.
 * Swap `logGeneratedPost` for a real call when integrating.
 */
import { useSyncExternalStore } from "react";
import type { GeneratedPost } from "./demo/types";

const KEY = "provtoys.posts";
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

let cache: GeneratedPost[] | null = null;
function snapshot() {
  if (cache) return cache;
  try {
    cache = typeof window === "undefined" ? [] : (JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as GeneratedPost[]);
  } catch {
    cache = [];
  }
  return cache;
}

export function usePosts() {
  return useSyncExternalStore(subscribe, snapshot, () => []);
}

export function logGeneratedPost(input: Omit<GeneratedPost, "id" | "createdAt">) {
  try {
    cache = [{ ...input, id: `post-${Date.now().toString(36)}`, createdAt: new Date().toISOString() }, ...snapshot()].slice(0, 500);
    window.localStorage.setItem(KEY, JSON.stringify(cache));
    listeners.forEach((l) => l());
  } catch {}
}
