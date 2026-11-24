/** Un jour du Journal : une date de calendrier locale au format AAAA-MM-JJ. */
export type Jour = string;

/** La date de calendrier, dans le fuseau donné, de l'instant donné. */
export function jourCalendaire(instant: Date, fuseau: string): Jour {
  // en-CA formate les dates en AAAA-MM-JJ
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: fuseau,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Minuit UTC le jour donné : pour calculer ou formater un jour sans dépendre d'un fuseau. */
export function dateUTC(jour: Jour): Date {
  return new Date(`${jour}T00:00:00Z`);
}

/** Le jour situé `n` jours après (ou avant, si `n` est négatif) le jour donné. */
export function jourDecale(jour: Jour, n: number): Jour {
  const date = dateUTC(jour);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

/** Vrai pour une date de calendrier réelle au format AAAA-MM-JJ. */
export function estJourValide(jour: string): jour is Jour {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) return false;
  const d = dateUTC(jour);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(jour);
}
