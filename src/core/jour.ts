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
