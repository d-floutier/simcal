"use client";

import { Button } from "@/components/ui/button";
import { textes } from "@/ui/textes";

export function BoutonReessayer() {
  return (
    <Button size="lg" onClick={() => window.location.reload()}>
      {textes.horsLigne.reessayer}
    </Button>
  );
}
