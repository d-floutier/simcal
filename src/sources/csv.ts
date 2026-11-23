/** Lit un CSV (RFC 4180 : guillemets doublés, retours à la ligne dans les champs entre guillemets). */
export function lireCsv(texte: string, separateur = ","): string[][] {
  const lignes: string[][] = [];
  let ligne: string[] = [];
  let champ = "";
  let entreGuillemets = false;
  const s = texte.charCodeAt(0) === 0xfeff ? texte.slice(1) : texte;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (entreGuillemets) {
      if (c === '"' && s[i + 1] === '"') {
        champ += '"';
        i++;
      } else if (c === '"') entreGuillemets = false;
      else champ += c;
    } else if (c === '"') entreGuillemets = true;
    else if (c === separateur) {
      ligne.push(champ);
      champ = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      ligne.push(champ);
      lignes.push(ligne);
      ligne = [];
      champ = "";
    } else champ += c;
  }
  if (champ !== "" || ligne.length > 0) {
    ligne.push(champ);
    lignes.push(ligne);
  }
  return lignes;
}

export function ecrireCsv(lignes: (string | number | null)[][]): string {
  const echapper = (v: string | number | null) => {
    const t = v === null ? "" : String(v);
    return /[",\n\r]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t;
  };
  return lignes.map((l) => l.map(echapper).join(",")).join("\n") + "\n";
}
