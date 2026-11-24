/** Le fuseau proposé par défaut à la première configuration. */
export const FUSEAU_PAR_DEFAUT = "Europe/Paris";

/** Les fuseaux IANA proposés dans le Profil. */
export function listeFuseaux(): string[] {
  return Intl.supportedValuesOf("timeZone");
}
