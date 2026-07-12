import { isVisible } from "./conditions.js";

function fieldsOf(service) {
  return (service?.stages || []).flatMap((stage) =>
    (stage.steps || []).flatMap((step) => step.fields || [])
  );
}

function optionLabel(field, value, dictionaries = {}) {
  const options = field?.dictionary ? dictionaries[field.dictionary] || [] : field?.options || [];
  return options.find((option) => option.value === value || option.id === value)?.label ?? String(value);
}

function leaves(condition) {
  if (!condition) return [];
  if (condition.field) return [condition];
  if (condition.not) return leaves(condition.not);
  return [...(condition.all || []), ...(condition.any || [])].flatMap(leaves);
}

function answerText(field, value, dictionaries) {
  if (Array.isArray(value)) return value.map((item) => optionLabel(field, item, dictionaries)).join(", ");
  if (typeof value === "boolean") return value ? "Да" : "Нет";
  return optionLabel(field, value, dictionaries);
}

export function explainVisibility(condition, answers, service, dictionaries = {}) {
  if (!condition || !isVisible(condition, answers)) return [];
  const fieldMap = new Map(fieldsOf(service).map((field) => [field.id, field]));
  const seen = new Set();

  return leaves(condition).flatMap((leaf) => {
    const source = fieldMap.get(leaf.field);
    const actual = answers?.[leaf.field];
    if (!source || actual === undefined || actual === null || actual === "") return [];
    const text = `${source.label}: ${answerText(source, actual, dictionaries)}`;
    if (seen.has(text)) return [];
    seen.add(text);
    return [text];
  });
}

export function activeBranchReasons(items, answers, service, dictionaries = {}) {
  const seen = new Set();
  return (items || []).flatMap((item) =>
    explainVisibility(item.when, answers, service, dictionaries).filter((reason) => {
      if (seen.has(reason)) return false;
      seen.add(reason);
      return true;
    })
  );
}
