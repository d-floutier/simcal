import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Le scan lit les codes avec zxing quand le navigateur n'a pas BarcodeDetector (Safari) : son
// WASM est servi par l'app (public/), et doit rester celui de la version installée.
describe("WASM de zxing servi par l'app", () => {
  it("est identique à celui du paquet zxing-wasm installé", () => {
    const depuisPonyfill = createRequire(createRequire(import.meta.url).resolve("barcode-detector/ponyfill"));
    const installe = readFileSync(depuisPonyfill.resolve("zxing-wasm/reader/zxing_reader.wasm"));
    const servi = readFileSync(join(process.cwd(), "public/zxing_reader.wasm"));
    expect(servi.equals(installe)).toBe(true);
  });
});
