// Условия видимости / ветвления ЕППБ — чистый ESM, без JSX.

function getValue(answers, field) {
  if (!answers) return undefined;
  if (field in answers) return answers[field];
  const parts = field.split(".");
  let cur = answers;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function evalLeaf(condition, answers) {
  const { field, op, value } = condition;
  const actual = getValue(answers, field);

  switch (op) {
    case "eq":
      // checklist-поле: «равно» = «содержит значение»
      if (Array.isArray(actual)) return actual.includes(value);
      return actual === value;
    case "neq":
      if (Array.isArray(actual)) return !actual.includes(value);
      return actual !== value;
    case "gt":
      return toNum(actual) > toNum(value);
    case "gte":
      return toNum(actual) >= toNum(value);
    case "lt":
      return toNum(actual) < toNum(value);
    case "lte":
      return toNum(actual) <= toNum(value);
    case "in": {
      if (!Array.isArray(value)) return false;
      // checklist-поле: пересечение множеств
      if (Array.isArray(actual)) return actual.some((v) => value.includes(v));
      return value.includes(actual);
    }
    case "truthy":
      return !!actual;
    case "falsy":
      return !actual;
    default:
      return true;
  }
}

function toNum(v) {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function isVisible(condition, answers) {
  if (!condition) return true;

  if (Array.isArray(condition.all)) {
    return condition.all.every((c) => isVisible(c, answers));
  }
  if (Array.isArray(condition.any)) {
    return condition.any.some((c) => isVisible(c, answers));
  }
  if (condition.not) {
    return !isVisible(condition.not, answers);
  }
  if (condition.field && condition.op) {
    return evalLeaf(condition, answers);
  }
  return true;
}
