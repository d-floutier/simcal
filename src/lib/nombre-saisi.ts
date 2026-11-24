/** Lit un nombre saisi en français (virgule ou point décimal). Vide ou illisible : NaN. */
export function lireNombreSaisi(brut: string): number {
  const texte = brut.trim().replace(",", ".");
  return texte === "" ? Number.NaN : Number(texte);
}

/** Le nombre saisi dans le champ donné d'un formulaire envoyé (voir `lireNombreSaisi`). */
export function nombreDuFormulaire(formData: FormData, champ: string): number {
  return lireNombreSaisi(String(formData.get(champ) ?? ""));
}
