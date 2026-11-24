/**
 * Une saisie refusée : `champs` liste les champs invalides, dans l'ordre du formulaire.
 * Chaque service en dérive sa propre erreur (`SaisieEntreeInvalide`…) pour que les actions
 * puissent la reconnaître avec `instanceof`.
 */
export class SaisieInvalide<Champ extends string> extends Error {
  constructor(
    sujet: string,
    readonly champs: Champ[],
  ) {
    super(`${sujet} invalide : ${champs.join(", ")}`);
    this.name = new.target.name;
  }
}
