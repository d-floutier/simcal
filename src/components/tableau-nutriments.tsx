import { NUTRIMENTS_FACULTATIFS, type ValeursNutritionnelles } from "@/core";
import { formaterKcal, formaterNutriment, textes } from "@/ui/textes";

const MACROS = ["proteines", "glucides", "lipides"] as const;

/**
 * Les valeurs nutritionnelles : kcal, Macros, puis les nutriments facultatifs connus
 * (un nutriment inconnu n'est pas affiché).
 */
export function TableauNutriments({ valeurs, titre }: { valeurs: ValeursNutritionnelles; titre: string }) {
  const facultatifs = NUTRIMENTS_FACULTATIFS.filter((n) => valeurs[n] !== null);
  return (
    <table className="w-full text-sm">
      <caption className="pb-2 text-left font-medium">{titre}</caption>
      <tbody className="divide-y">
        <tr>
          <th scope="row" className="py-1.5 text-left font-normal">
            {textes.nutriments.kcal}
          </th>
          <td className="py-1.5 text-right font-medium tabular-nums">{formaterKcal(valeurs.kcal)}</td>
        </tr>
        {[...MACROS, ...facultatifs].map((n) => (
          <tr key={n}>
            <th
              scope="row"
              className={`py-1.5 text-left font-normal ${n === "sucres" || n === "satures" ? "pl-4 text-muted-foreground" : ""}`}
            >
              {textes.nutriments[n]}
            </th>
            <td className="py-1.5 text-right tabular-nums">{formaterNutriment(valeurs[n])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
