import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [shell, fields, form, base] = await Promise.all([
  readFile(new URL("../src/shell/PortalShell.jsx", import.meta.url), "utf8"),
  readFile(new URL("../src/engine/fields.jsx", import.meta.url), "utf8"),
  readFile(new URL("../src/engine/FormRunner.jsx", import.meta.url), "utf8"),
  readFile(new URL("../src/styles/base.css", import.meta.url), "utf8"),
]);

assert.match(shell, /href="#main-content"/, "shared shell must expose a skip link");
assert.match(shell, /aria-controls="primary-navigation"/, "menu trigger must identify its navigation");
assert.match(shell, /aria-live="polite"/, "notifications must be announced");
assert.match(fields, /aria-errormessage/, "form controls must reference their errors");
assert.match(form, /fr-error-summary[\s\S]*role="alert"/, "invalid steps must render an error summary");
assert.match(base, /prefers-reduced-motion:\s*reduce/, "motion must respect the user preference");

console.log("Accessibility smoke checks passed (6 invariants).");
