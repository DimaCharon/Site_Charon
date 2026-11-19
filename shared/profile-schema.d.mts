export type ContactKey = "telegram" | "email" | "github" | "social";
export type Profile = { name: string; contacts: Record<ContactKey, string> };
export const contactNames: Readonly<Record<ContactKey, string>>;
export const defaultProfile: Profile;
export function safeContact(key: ContactKey, value: string): string | null;
export function normalizeProfile(value: unknown): Profile;
export function canonicalProfile(value: unknown): string;
