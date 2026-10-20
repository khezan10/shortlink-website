import { customAlphabet } from "nanoid";
import { RESERVED } from "./url";

const nanoid7 = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  7
);

const ALIAS_RE = /^[a-zA-Z0-9_-]{3,32}$/;

export function generateCode(): string {
  return nanoid7();
}

export function validateAlias(alias: string): { ok: boolean; error?: string } {
  if (!ALIAS_RE.test(alias)) return { ok: false, error: "INVALID_ALIAS" };
  if (RESERVED.has(alias.toLowerCase())) return { ok: false, error: "ALIAS_RESERVED" };
  return { ok: true };
}
