/** Parses SIMCAL_ALLOWED_EMAILS ("a@x.fr, b@y.fr") into normalised emails. */
export function parseListeAutorisee(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[,\s]+/)
    .map(normaliserEmail)
    .filter(Boolean);
}

export function normaliserEmail(email: string): string {
  return email.trim().toLowerCase();
}
