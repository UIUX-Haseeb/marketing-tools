"use client";

/**
 * Tiny client-side store for the demo: requests and generated-post log live in
 * localStorage so the app needs no backend. Swap these functions for real
 * persistence when integrating.
 */
import { useSyncExternalStore } from "react";
import { DEMO_REQUESTS } from "./demo/requests";
import type { GeneratedPost, MarketingRequest, RequestStatus } from "./demo/types";

const KEYS = { requests: "provtoys.requests", posts: "provtoys.posts" } as const;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  window.addEventListener("storage", l);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", l);
  };
};

/* ── Requests ─────────────────────────────────────────────────────────────── */

let requestsCache: MarketingRequest[] | null = null;
function requestsSnapshot() {
  if (!requestsCache) requestsCache = read<MarketingRequest[]>(KEYS.requests, DEMO_REQUESTS);
  return requestsCache;
}
function setRequests(next: MarketingRequest[]) {
  requestsCache = next;
  write(KEYS.requests, next);
}

export function useRequests() {
  return useSyncExternalStore(subscribe, requestsSnapshot, () => DEMO_REQUESTS);
}

export function addRequest(input: Omit<MarketingRequest, "id" | "status" | "createdAt">) {
  const req: MarketingRequest = { ...input, id: `req-${Date.now().toString(36)}`, status: "NEW", createdAt: new Date().toISOString() };
  setRequests([req, ...requestsSnapshot()]);
  return req;
}

export function updateRequestStatus(id: string, status: RequestStatus) {
  setRequests(requestsSnapshot().map((r) => (r.id === id ? { ...r, status } : r)));
}

/* ── Generated posts log ──────────────────────────────────────────────────── */

let postsCache: GeneratedPost[] | null = null;
function postsSnapshot() {
  if (!postsCache) postsCache = read<GeneratedPost[]>(KEYS.posts, []);
  return postsCache;
}

export function usePosts() {
  return useSyncExternalStore(subscribe, postsSnapshot, () => []);
}

export function logGeneratedPost(input: Omit<GeneratedPost, "id" | "createdAt">) {
  try {
    postsCache = [{ ...input, id: `post-${Date.now().toString(36)}`, createdAt: new Date().toISOString() }, ...postsSnapshot()].slice(0, 500);
    write(KEYS.posts, postsCache);
  } catch {}
}
