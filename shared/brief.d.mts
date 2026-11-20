export type BriefFields = {
  name: string;
  brand: string;
  task: string;
  reply: string;
  reference: string;
};
export type BriefInput = BriefFields & { consent: boolean; website: string };
export type BriefField = keyof BriefFields | "form" | "consent";
export const briefLimits: Readonly<Record<keyof BriefFields, number>>;
export function checkBrief(
  raw: unknown,
): { ok: false; field: BriefField } | { ok: true; value: BriefFields };
export function briefText(v: BriefFields): string;
