// Fecha única para las tres páginas legales de Dale.
export const LEGAL_VERSION = "2026-10-10";
export const LEGAL_LAST_UPDATED = new Intl.DateTimeFormat("es", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${LEGAL_VERSION}T12:00:00Z`));
