export const DOMAIN_TAGS = [
  "coding",
  "research",
  "automation",
  "customer-support",
] as const;

export type DomainTag = (typeof DOMAIN_TAGS)[number];

export function parseDomainTags(tags: unknown): DomainTag[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter((tag): tag is DomainTag =>
    typeof tag === "string" && (DOMAIN_TAGS as readonly string[]).includes(tag),
  );
}

export function validateDomainTags(tags: string[]): DomainTag[] {
  const invalid = tags.filter((tag) => !(DOMAIN_TAGS as readonly string[]).includes(tag));
  if (invalid.length > 0) {
    throw new Error(`Invalid domain tags: ${invalid.join(", ")}`);
  }
  if (tags.length === 0) {
    throw new Error("At least one domain tag is required");
  }
  return tags as DomainTag[];
}
