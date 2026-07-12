import test from "node:test";
import assert from "node:assert/strict";
import { activeBranchReasons, explainVisibility } from "./branching.js";

const service = { stages: [{ steps: [{ fields: [
  { id: "purpose", label: "Цель", options: [{ value: "construction", label: "Строительство" }] },
  { id: "estimate", label: "Смета", when: { field: "purpose", op: "eq", value: "construction" } },
] }] }] };

test("explains a visible schema branch using the applicant-facing option label", () => {
  assert.deepEqual(
    explainVisibility(service.stages[0].steps[0].fields[1].when, { purpose: "construction" }, service),
    ["Цель: Строительство"]
  );
});

test("does not explain inactive branches and deduplicates a route", () => {
  const fields = service.stages[0].steps[0].fields;
  assert.deepEqual(explainVisibility(fields[1].when, { purpose: "other" }, service), []);
  assert.deepEqual(activeBranchReasons([fields[1], fields[1]], { purpose: "construction" }, service), ["Цель: Строительство"]);
});
