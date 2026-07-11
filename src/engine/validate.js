// Валидация полей/шагов ЕППБ — чистый ESM, без JSX.

import { isVisible } from "./conditions.js";

const BIN_IIN_RE = /^\d{12}$/;
const PHONE_RE = /^\+?\d[\d\s()-]{9,}$/;

function isEmpty(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

const NUMERIC_TYPES = new Set(["number", "money", "percent"]);

export function validateField(field, value, answers) {
  const rules = field.validate || {};
  const isRequired = !!field.required;

  if (isRequired && isEmpty(value)) {
    return rules.message || "Обязательное поле";
  }

  if (isEmpty(value)) {
    // необязательное и пустое — дальше проверять нечего
    return null;
  }

  if (NUMERIC_TYPES.has(field.type)) {
    const num = typeof value === "number" ? value : parseFloat(value);
    if (!Number.isFinite(num)) {
      return rules.message || "Введите число";
    }
    if (rules.min !== undefined && num < rules.min) {
      return rules.message || `Минимум: ${rules.min}`;
    }
    if (rules.max !== undefined && num > rules.max) {
      return rules.message || `Максимум: ${rules.max}`;
    }
  }

  if (field.type === "bin" && !BIN_IIN_RE.test(String(value))) {
    return rules.message || "БИН должен содержать 12 цифр";
  }

  if (field.type === "iin" && !BIN_IIN_RE.test(String(value))) {
    return rules.message || "ИИН должен содержать 12 цифр";
  }

  if (field.type === "phone" && !PHONE_RE.test(String(value))) {
    return rules.message || "Введите корректный номер телефона";
  }

  if (rules.pattern) {
    try {
      const re = new RegExp(rules.pattern);
      if (!re.test(String(value))) {
        return rules.message || "Неверный формат";
      }
    } catch (e) {
      // некорректный pattern в схеме — игнорируем
    }
  }

  if (typeof value === "string" && rules.min !== undefined && !NUMERIC_TYPES.has(field.type)) {
    if (value.length < rules.min) return rules.message || `Минимальная длина: ${rules.min}`;
  }
  if (typeof value === "string" && rules.max !== undefined && !NUMERIC_TYPES.has(field.type)) {
    if (value.length > rules.max) return rules.message || `Максимальная длина: ${rules.max}`;
  }

  return null;
}

export function collectVisibleFields(step, answers) {
  const fields = (step && step.fields) || [];
  return fields.filter((f) => isVisible(f.when, answers));
}

export function validateStep(step, answers) {
  const errors = {};
  const visibleFields = collectVisibleFields(step, answers);

  for (const field of visibleFields) {
    if (field.type === "calc" || field.type === "info") continue;
    const msg = validateField(field, answers ? answers[field.id] : undefined, answers);
    if (msg) errors[field.id] = msg;
  }

  return { errors, valid: Object.keys(errors).length === 0 };
}
