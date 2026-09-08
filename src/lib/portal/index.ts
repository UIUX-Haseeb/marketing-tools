import "server-only";
import { createPortalClient } from "./client";
import { mockPortal } from "./mock";
import type { PortalClient } from "./types";

export * from "./types";

let client: PortalClient | null = null;

/** Real Portal when PORTAL_API_URL + PORTAL_API_KEY are set, otherwise the mock. */
export function portal(): PortalClient {
  if (client) return client;
  const url = process.env.PORTAL_API_URL;
  const key = process.env.PORTAL_API_KEY;
  client = url && key ? createPortalClient(url, key) : mockPortal;
  return client;
}

export const portalIsMock = () => !(process.env.PORTAL_API_URL && process.env.PORTAL_API_KEY);
