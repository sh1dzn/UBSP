"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Sparkles,
  Save,
  UploadCloud,
  X,
  Layers,
  ListTree,
  FileText,
  AlertTriangle,
  Lightbulb,
  Eye,
  Wand2,
} from "lucide-react";
import api from "../../api.js";
import FormRunner from "../../engine/FormRunner.jsx";
import { evalFormula } from "../../engine/formula.js";
import { dictionaries } from "../../data/dictionaries.js";

/* ───────────────────────── справочники конструктора ───────────────────────── */

const ORG_OPTIONS = [
  { org: "АО «БРК»", orgShort: "БРК" },
  { org: "Фонд развития промышленности", orgShort: "ФРП" },
  { org: "АО «КазАгроФинанс»", orgShort: "КазАгроФинанс" },
  { org: "Аграрная кредитная корпорация", orgShort: "АКК" },
  { org: "АО «Даму»", orgShort: "Даму" },
  { org: "АО «KazakhExport»", orgShort: "KazakhExport" },
  { org: "QIC", orgShort: "QIC" },
  { org: "Отбасы банк", orgShort: "Отбасы банк" },
];

const KIND_OPTIONS = [
  "Лизинг",
  "Кредитование",
  "Гарантирование",
  "Субсидирование",
  "Страхование",
  "Инвестиции",
  "Экспорт",
];

const COMPLEXITY_OPTIONS = [
  { value: "simple", label: "Простая (один этап)" },
  { value: "complex", label: "Сложная (несколько этапов)" },
];

const FIELD_TYPES = [
  { value: "text", label: "Текст (строка)" },
  { value: "textarea", label: "Текст (многострочный)" },
  { value: "number", label: "Число" },
  { value: "money", label: "Сумма, ₸" },
  { value: "percent", label: "Процент" },
  { value: "select", label: "Список (выбор одного)" },
  { value: "radio", label: "Радиокнопки" },
  { value: "checkbox", label: "Флажок (да/нет)" },
  { value: "checklist", label: "Мультивыбор" },
  { value: "date", label: "Дата" },
  { value: "bin", label: "БИН (проверка в реестре)" },
  { value: "iin", label: "ИИН" },
  { value: "phone", label: "Телефон" },
  { value: "file", label: "Файл (документ)" },
  { value: "calc", label: "Расчётное поле (формула)" },
  { value: "info", label: "Информационный блок" },
];

const OPTION_SOURCE_TYPES = new Set(["select", "radio", "checklist"]);
const NUMERIC_FIELD_TYPES = new Set(["number", "money", "percent", "calc"]);
const NO_PREFILL_TYPES = new Set(["calc", "info", "file"]);
const COLS_OPTIONS = [12, 6, 4];

const PREFILL_OPTIONS = [
  { value: "", label: "— не использовать —" },
  { value: "company.name", label: "company.name — наименование компании" },
  { value: "company.region", label: "company.region — регион регистрации" },
  { value: "company.activity", label: "company.activity — вид деятельности" },
  { value: "company.bin", label: "company.bin — БИН" },
];

const OP_OPTIONS = [
  { value: "eq", label: "равно" },
  { value: "neq", label: "не равно" },
  { value: "gt", label: "больше" },
  { value: "lt", label: "меньше" },
  { value: "in", label: "входит в список" },
  { value: "truthy", label: "заполнено" },
];

const COMBINATOR_OPTIONS = [
  { value: "all", label: "И — все условия" },
  { value: "any", label: "ИЛИ — любое из условий" },
];

const RULE_LEVELS = [
  { value: "error", label: "Ошибка — блокирует подачу" },
  { value: "warning", label: "Предупреждение" },
];

const CATEGORY_OPTIONS = dictionaries.categories.map((c) => ({ value: c.id, label: c.label }));

/* ───────────────────────── утилиты ───────────────────────── */

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
};

function slugify(text) {
  const lower = String(text || "").toLowerCase();
  let out = "";
  for (const ch of lower) {
    out += TRANSLIT[ch] !== undefined ? TRANSLIT[ch] : ch;
  }
  out = out.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
  return out || "field";
}

function camelize(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part, i) => (i === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join("");
}

function uniqueId(base, taken) {
  let id = base || "field";
  let n = 2;
  while (taken.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function splitLines(text) {
  return String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/* ───────────────────────── деревья / статистика ───────────────────────── */

function countStats(draft) {
  const stages = draft.stages || [];
  let steps = 0;
  let fields = 0;
  for (const stage of stages) {
    const stageSteps = stage.steps || [];
    steps += stageSteps.length;
    for (const step of stageSteps) fields += (step.fields || []).length;
  }
  return { stages: stages.length, steps, fields };
}

function allFieldsFlat(draft) {
  const out = [];
  for (const stage of draft.stages || []) {
    for (const step of stage.steps || []) {
      for (const field of step.fields || []) {
        out.push({ field, stageId: stage.id, stepId: step.id });
      }
    }
  }
  return out;
}

function fieldsBefore(draft, stageId, stepId, fieldId) {
  const flat = allFieldsFlat(draft);
  const out = [];
  for (const entry of flat) {
    if (entry.stageId === stageId && entry.stepId === stepId && entry.field.id === fieldId) break;
    out.push(entry.field);
  }
  return out;
}

/* ───────────────────────── условия видимости (when) ───────────────────────── */

function emptyCondition() {
  return { field: "", op: "eq", value: "" };
}

function parseWhen(when) {
  if (!when) return { mode: "always", combinator: "all", negate: false, conditions: [emptyCondition()] };
  if (when.not && when.not.field) {
    return { mode: "condition", combinator: "all", negate: true, conditions: [{ ...when.not }] };
  }
  if (when.field && when.op) {
    return { mode: "condition", combinator: "all", negate: false, conditions: [{ field: when.field, op: when.op, value: when.value }] };
  }
  if (Array.isArray(when.all) && when.all.length) {
    return { mode: "condition", combinator: "all", negate: false, conditions: when.all.map((c) => ({ field: c.field, op: c.op, value: c.value })) };
  }
  if (Array.isArray(when.any) && when.any.length) {
    return { mode: "condition", combinator: "any", negate: false, conditions: when.any.map((c) => ({ field: c.field, op: c.op, value: c.value })) };
  }
  return { mode: "always", combinator: "all", negate: false, conditions: [emptyCondition()] };
}

function buildWhen(state) {
  if (state.mode === "always") return undefined;
  const conds = state.conditions
    .filter((c) => c.field && c.op)
    .map((c) => (c.op === "truthy" ? { field: c.field, op: c.op } : { field: c.field, op: c.op, value: c.value }));
  if (conds.length === 0) return undefined;
  if (conds.length === 1) return state.negate ? { not: conds[0] } : conds[0];
  return state.combinator === "any" ? { any: conds } : { all: conds };
}

/* ───────────────────────── подсказки по типам ───────────────────────── */

function hintTemplateFor(type) {
  switch (type) {
    case "bin":
      return "12 цифр, проверим по реестру ГБД ЮЛ";
    case "iin":
      return "12 цифр ИИН заявителя";
    case "money":
      return "Укажите сумму в тенге";
    case "percent":
      return "Укажите значение в процентах";
    case "number":
      return "Введите числовое значение";
    case "date":
      return "Выберите дату из календаря";
    case "select":
    case "radio":
      return "Выберите подходящий вариант";
    case "checklist":
      return "Можно выбрать несколько вариантов";
    case "file":
      return "Прикрепите документ (мок-загрузка, проверка на вирусы имитируется)";
    case "phone":
      return "Формат: +7 XXX XXX XX XX";
    case "checkbox":
      return "Отметьте, если применимо";
    case "calc":
      return "Рассчитывается автоматически по формуле";
    case "info":
      return "Поясните заявителю следующий блок";
    default:
      return "Заполните поле точно как в документах компании";
  }
}

/* ───────────────────────── пустые узлы ───────────────────────── */

function makeField(existingIds, label = "Новое поле") {
  const id = uniqueId(camelize(slugify(label)) || "field", existingIds);
  return {
    id,
    type: "text",
    label,
    hint: "",
    placeholder: "",
    required: false,
    cols: 12,
  };
}

function makeStep(n = 1) {
  return { id: uid("step"), title: `Новый шаг ${n}`, hint: "", fields: [] };
}

function makeStage(n = 1) {
  return { id: uid("stage"), title: `Новый этап ${n}`, description: "", steps: [makeStep(1)] };
}

/* ───────────────────────── ИИ-набросок (локальный, детерминированный) ───────────────────────── */

const KIND_KEYWORDS = [
  { kind: "Лизинг", words: ["лизинг"] },
  { kind: "Гарантирование", words: ["гаранти"] },
  { kind: "Субсидирование", words: ["субсиди"] },
  { kind: "Страхование", words: ["страхов"] },
  { kind: "Инвестиции", words: ["инвести"] },
  { kind: "Экспорт", words: ["экспорт"] },
  { kind: "Кредитование", words: ["кредит", "займ", "заём"] },
];

const ORG_KEYWORDS = [
  { org: "Фонд развития промышленности", words: ["лизинг", "вагон"] },
  { org: "АО «KazakhExport»", words: ["экспорт", "страхование экспорт"] },
  { org: "QIC", words: ["страхов"] },
  { org: "АО «КазАгроФинанс»", words: ["агро", "ферм", "скот", "сельск", "апк"] },
  { org: "Аграрная кредитная корпорация", words: ["аграрн", "фермер", "кх "] },
  { org: "АО «Даму»", words: ["мсб", "малый бизнес", "гаранти"] },
  { org: "Отбасы банк", words: ["жиль", "ипотек"] },
];

function detectKind(text) {
  for (const entry of KIND_KEYWORDS) {
    if (entry.words.some((w) => text.includes(w))) return entry.kind;
  }
  return "Кредитование";
}

function detectOrg(text) {
  for (const entry of ORG_KEYWORDS) {
    if (entry.words.some((w) => text.includes(w))) {
      const found = ORG_OPTIONS.find((o) => o.org === entry.org);
      if (found) return found;
    }
  }
  return ORG_OPTIONS[0];
}

function detectCategory(text, kind) {
  if (text.includes("вагон") || text.includes("транспорт") || text.includes("логист")) return "transport";
  if (text.includes("агро") || text.includes("ферм") || text.includes("скот") || text.includes("сельск")) return "agro";
  const byKind = {
    Лизинг: "leasing",
    Кредитование: "finance",
    Гарантирование: "guarantee",
    Субсидирование: "subsidy",
    Страхование: "insurance",
    Инвестиции: "invest",
    Экспорт: "export",
  };
  return byKind[kind] || "finance";
}

/* Схема от LLM: дозаполняем обязательные поля до формата конструктора */
function normalizeAiSchema(schema) {
  const slug = (schema.title || "новая услуга")
    .toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return {
    id: schema.id || slug,
    org: schema.org || "Фонд «Даму»",
    orgShort: schema.orgShort || schema.org || "Даму",
    kind: schema.kind || "Кредитование",
    category: schema.category || "finance",
    audience: schema.audience || ["ТОО", "ИП"],
    tags: schema.tags || [],
    status: "draft",
    complexity: schema.complexity || (schema.stages && schema.stages.length > 1 ? "complex" : "simple"),
    card: { benefits: [], conditions: [], documents: [], faq: [], ...(schema.card || {}) },
    rules: schema.rules || [],
    ...schema,
    title: schema.title || "Новая услуга",
    summary: schema.summary || "",
    stages: (schema.stages || []).map((st, i) => ({
      id: st.id || `stage-${i + 1}`,
      title: st.title || `Этап ${i + 1}`,
      description: st.description || "",
      steps: (st.steps || []).map((step, j) => ({
        id: step.id || `step-${i + 1}-${j + 1}`,
        title: step.title || `Шаг ${j + 1}`,
        hint: step.hint || "",
        fields: step.fields || [],
      })),
    })),
  };
}

function buildAiDraft(rawText) {
  const text = String(rawText || "").trim();
  const lower = text.toLowerCase();
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const kind = detectKind(lower);
  const orgEntry = detectOrg(lower);
  const category = detectCategory(lower, kind);

  const title = (sentences[0] || "Новая услуга").replace(/[.?!]+$/, "").trim();
  const summary = sentences.slice(0, 2).join(" ").slice(0, 240) || "Опишите услугу подробнее.";

  const usedIds = new Set(["bin", "companyName", "region", "consent", "confirm"]);
  const contentFields = [];
  let triggerFieldId = null;

  for (const raw of sentences.slice(1)) {
    const s = raw.toLowerCase();
    if (!s) continue;

    if (s.startsWith("если")) {
      const label = raw.replace(/^если\s*/i, "").split(",")[0].trim() || "Условие применимо";
      const id = uniqueId(camelize(slugify(label)) || "condition", usedIds);
      usedIds.add(id);
      triggerFieldId = id;
      contentFields.push({
        id,
        type: "checkbox",
        label: label.charAt(0).toUpperCase() + label.slice(1),
        hint: "Заготовка условия — уточните формулировку",
        required: false,
        cols: 12,
      });
      continue;
    }

    if (s.includes("сумма") || s.includes("стоимост") || s.includes("₸") || s.includes("тенге")) {
      const id = uniqueId("amount", usedIds);
      usedIds.add(id);
      contentFields.push({
        id,
        type: "money",
        label: "Сумма",
        hint: hintTemplateFor("money"),
        required: true,
        cols: 6,
        ...(triggerFieldId ? { when: { field: triggerFieldId, op: "truthy" } } : {}),
      });
      triggerFieldId = null;
      continue;
    }

    if (s.includes("срок") || s.includes("месяц") || s.includes(" лет")) {
      const id = uniqueId("term", usedIds);
      usedIds.add(id);
      contentFields.push({
        id,
        type: "select",
        label: "Срок",
        hint: hintTemplateFor("select"),
        required: true,
        cols: 6,
        options: [
          { value: "12", label: "до 1 года" },
          { value: "36", label: "1–3 года" },
          { value: "60", label: "3–5 лет" },
          { value: "120", label: "более 5 лет" },
        ],
        ...(triggerFieldId ? { when: { field: triggerFieldId, op: "truthy" } } : {}),
      });
      triggerFieldId = null;
      continue;
    }

    if (s.includes("документ") || s.includes("справк") || s.includes("выписк") || s.includes("договор")) {
      const id = uniqueId("document", usedIds);
      usedIds.add(id);
      contentFields.push({
        id,
        type: "file",
        label: raw.slice(0, 60),
        hint: hintTemplateFor("file"),
        required: false,
        cols: 12,
        ...(triggerFieldId ? { when: { field: triggerFieldId, op: "truthy" } } : {}),
      });
      triggerFieldId = null;
      continue;
    }

    if (raw.trim().endsWith("?")) {
      const label = raw.trim();
      const id = uniqueId(camelize(slugify(label)) || "question", usedIds);
      usedIds.add(id);
      contentFields.push({
        id,
        type: "radio",
        label,
        hint: hintTemplateFor("radio"),
        required: false,
        cols: 12,
        options: [
          { value: "yes", label: "Да" },
          { value: "no", label: "Нет" },
        ],
        ...(triggerFieldId ? { when: { field: triggerFieldId, op: "truthy" } } : {}),
      });
      triggerFieldId = null;
      continue;
    }
  }

  const stage = {
    id: "stage-1",
    title: "Заявка",
    description: "Единый этап подачи заявки",
    steps: [
      {
        id: "applicant",
        title: "О заявителе",
        hint: "Данные подтянем из реестра по БИН",
        fields: [
          {
            id: "bin",
            type: "bin",
            label: "БИН компании",
            hint: hintTemplateFor("bin"),
            required: true,
            cols: 6,
            validate: { pattern: "^\\d{12}$", message: "БИН должен содержать 12 цифр" },
          },
          {
            id: "companyName",
            type: "text",
            label: "Наименование компании",
            prefill: "company.name",
            required: true,
            cols: 6,
          },
          {
            id: "region",
            type: "select",
            label: "Регион регистрации",
            dictionary: "regions",
            prefill: "company.region",
            required: true,
            cols: 6,
          },
        ],
      },
      {
        id: "params",
        title: "Параметры услуги",
        hint: "",
        fields: contentFields.length
          ? contentFields
          : [
              {
                id: "notes",
                type: "textarea",
                label: "Комментарий к заявке",
                hint: hintTemplateFor("textarea"),
                required: false,
                cols: 12,
              },
            ],
      },
      {
        id: "confirm",
        title: "Подтверждение",
        hint: "",
        fields: [
          {
            id: "consent",
            type: "checkbox",
            label: "Согласие на обработку персональных данных",
            required: true,
            cols: 12,
          },
          {
            id: "confirm",
            type: "checkbox",
            label: "Подтверждаю достоверность указанных сведений",
            required: true,
            cols: 12,
          },
        ],
      },
    ],
  };

  return {
    title: title || "Новая услуга",
    kind,
    org: orgEntry.org,
    orgShort: orgEntry.orgShort,
    category,
    summary,
    complexity: "simple",
    stages: [stage],
  };
}

/* ───────────────────────── валидация перед публикацией ───────────────────────── */

function validateForPublish(draft) {
  const errors = [];
  if (!draft.title || !draft.title.trim()) errors.push("У услуги не заполнено название.");
  if (!draft.org) errors.push("У услуги не выбрана организация.");
  if (!draft.stages || draft.stages.length === 0) errors.push("У услуги нет ни одного этапа.");

  const seenIds = new Map();
  const flat = allFieldsFlat(draft);

  for (const { field, stageId, stepId } of flat) {
    const where = `stage «${stageId}» / step «${stepId}»`;
    if (!field.id) {
      errors.push(`Поле без id (${where}).`);
      continue;
    }
    if (seenIds.has(field.id)) {
      errors.push(`Дублирующийся id поля «${field.id}»: ${seenIds.get(field.id)} и ${where}.`);
    } else {
      seenIds.set(field.id, where);
    }

    if (OPTION_SOURCE_TYPES.has(field.type)) {
      const hasOptions = Array.isArray(field.options) && field.options.length > 0;
      const hasDictionary = !!field.dictionary && !!dictionaries[field.dictionary];
      if (!hasOptions && !hasDictionary) {
        errors.push(`Поле «${field.label || field.id}» (${field.id}): нужны варианты — справочник или свой список.`);
      }
    }

    if (field.type === "calc") {
      if (!field.compute || !field.compute.trim()) {
        errors.push(`Поле «${field.label || field.id}» (${field.id}): не задана формула.`);
      } else {
        try {
          evalFormula(field.compute, {});
        } catch (e) {
          errors.push(`Поле «${field.label || field.id}» (${field.id}): формула некорректна (${e.message}).`);
        }
      }
    }
  }

  for (const stage of draft.stages || []) {
    if (!stage.title || !stage.title.trim()) errors.push(`У этапа «${stage.id}» не заполнено название.`);
    if (!stage.steps || stage.steps.length === 0) errors.push(`У этапа «${stage.title || stage.id}» нет ни одного шага.`);
  }

  return errors;
}

/* ═══════════════════════════════════════════════════════════════════════
   ГЛАВНЫЙ КОМПОНЕНТ
   ═══════════════════════════════════════════════════════════════════════ */

export default function Constructor({ service, onBack, notify, openAssistant }) {
  // Next.js обнаруживает src/views как каталог Pages Router и на build пытается
  // статически отрендерить компонент без пропсов — в реальном приложении service
  // всегда передаётся из Admin.jsx, этот guard нужен только для фантомного роута сборки.
  if (!service) return null;

  const [draft, setDraft] = useState(() => deepClone(service));
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(service));
  const [selection, setSelection] = useState({ type: "service" });
  const [previewStageId, setPreviewStageId] = useState(service.stages?.[0]?.id || null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSource, setAiSource] = useState(null); // "llm" | "local"
  const [aiDraftPreview, setAiDraftPreview] = useState(null);
  const [publishErrors, setPublishErrors] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);

  const dirty = JSON.stringify(draft) !== savedSnapshot;

  const stats = useMemo(() => countStats(draft), [draft]);
  const previewStage = useMemo(
    () => (draft.stages || []).find((s) => s.id === previewStageId) || draft.stages?.[0] || null,
    [draft, previewStageId]
  );

  /* ── мутации дерева ── */

  function patchService(patch) {
    setDraft((d) => ({ ...d, ...patch }));
  }
  function patchCard(patch) {
    setDraft((d) => ({ ...d, card: { ...(d.card || {}), ...patch } }));
  }
  function patchStage(stageId, patch) {
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) => (s.id === stageId ? { ...s, ...patch } : s)),
    }));
  }
  function patchStep(stageId, stepId, patch) {
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) =>
        s.id !== stageId
          ? s
          : { ...s, steps: s.steps.map((st) => (st.id === stepId ? { ...st, ...patch } : st)) }
      ),
    }));
  }
  function patchField(stageId, stepId, fieldId, patch) {
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) =>
        s.id !== stageId
          ? s
          : {
              ...s,
              steps: s.steps.map((st) =>
                st.id !== stepId
                  ? st
                  : { ...st, fields: st.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) }
              ),
            }
      ),
    }));
    if (patch.id && patch.id !== fieldId && selection.type === "field" && selection.fieldId === fieldId) {
      setSelection((sel) => ({ ...sel, fieldId: patch.id }));
    }
  }

  function addStage() {
    const s = makeStage((draft.stages?.length || 0) + 1);
    setDraft((d) => ({ ...d, stages: [...(d.stages || []), s] }));
    setSelection({ type: "stage", stageId: s.id });
  }
  function removeStage(stageId) {
    setDraft((d) => ({ ...d, stages: d.stages.filter((s) => s.id !== stageId) }));
    if (selection.stageId === stageId) setSelection({ type: "service" });
    if (previewStageId === stageId) setPreviewStageId(null);
  }
  function moveStage(stageId, dir) {
    setDraft((d) => {
      const idx = d.stages.findIndex((s) => s.id === stageId);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= d.stages.length) return d;
      const next = [...d.stages];
      [next[idx], next[j]] = [next[j], next[idx]];
      return { ...d, stages: next };
    });
  }

  function addStep(stageId) {
    const stage = draft.stages.find((s) => s.id === stageId);
    const s = makeStep((stage?.steps.length || 0) + 1);
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((st) => (st.id === stageId ? { ...st, steps: [...st.steps, s] } : st)),
    }));
    setSelection({ type: "step", stageId, stepId: s.id });
  }
  function removeStep(stageId, stepId) {
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) => (s.id !== stageId ? s : { ...s, steps: s.steps.filter((st) => st.id !== stepId) })),
    }));
    if (selection.stepId === stepId) setSelection({ type: "stage", stageId });
  }
  function moveStep(stageId, stepId, dir) {
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) => {
        if (s.id !== stageId) return s;
        const idx = s.steps.findIndex((st) => st.id === stepId);
        const j = idx + dir;
        if (idx < 0 || j < 0 || j >= s.steps.length) return s;
        const next = [...s.steps];
        [next[idx], next[j]] = [next[j], next[idx]];
        return { ...s, steps: next };
      }),
    }));
  }

  function addField(stageId, stepId) {
    const flat = allFieldsFlat(draft).map((e) => e.field.id);
    const f = makeField(new Set(flat));
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) =>
        s.id !== stageId
          ? s
          : { ...s, steps: s.steps.map((st) => (st.id !== stepId ? st : { ...st, fields: [...st.fields, f] })) }
      ),
    }));
    setSelection({ type: "field", stageId, stepId, fieldId: f.id });
  }
  function removeField(stageId, stepId, fieldId) {
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) =>
        s.id !== stageId
          ? s
          : {
              ...s,
              steps: s.steps.map((st) =>
                st.id !== stepId ? st : { ...st, fields: st.fields.filter((f) => f.id !== fieldId) }
              ),
            }
      ),
    }));
    if (selection.fieldId === fieldId) setSelection({ type: "step", stageId, stepId });
  }
  function moveField(stageId, stepId, fieldId, dir) {
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) => {
        if (s.id !== stageId) return s;
        return {
          ...s,
          steps: s.steps.map((st) => {
            if (st.id !== stepId) return st;
            const idx = st.fields.findIndex((f) => f.id === fieldId);
            const j = idx + dir;
            if (idx < 0 || j < 0 || j >= st.fields.length) return st;
            const next = [...st.fields];
            [next[idx], next[j]] = [next[j], next[idx]];
            return { ...st, fields: next };
          }),
        };
      }),
    }));
  }

  function addRule() {
    setDraft((d) => ({
      ...d,
      rules: [...(d.rules || []), { id: uid("rule"), label: "Новое правило", expr: "1 >= 1", level: "warning" }],
    }));
  }
  function patchRule(idx, patch) {
    setDraft((d) => ({ ...d, rules: d.rules.map((r, i) => (i === idx ? { ...r, ...patch } : r)) }));
  }
  function removeRule(idx) {
    setDraft((d) => ({ ...d, rules: d.rules.filter((_, i) => i !== idx) }));
  }

  /* ── сохранение / публикация ── */

  async function handleSaveDraft() {
    setSaving(true);
    try {
      const saved = await api.saveService(draft);
      setDraft(saved);
      setSavedSnapshot(JSON.stringify(saved));
      notify?.("Черновик сохранён", `Версия ${saved.version}`);
    } catch (err) {
      notify?.("Не удалось сохранить", err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    const errors = validateForPublish(draft);
    if (errors.length > 0) {
      setPublishErrors(errors);
      return;
    }
    setSaving(true);
    try {
      const saved = await api.saveService(draft);
      await api.publishService(saved.id);
      const published = { ...saved, status: "published" };
      setDraft(published);
      setSavedSnapshot(JSON.stringify(published));
      notify?.("Опубликовано", "Услуга доступна в каталоге");
    } catch (err) {
      notify?.("Не удалось опубликовать", err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (dirty && !confirm("Есть несохранённые изменения. Выйти без сохранения?")) return;
    onBack?.();
  }

  /* ── ИИ-набросок ── */

  function applyAiDraft() {
    if (!aiDraftPreview) return;
    setDraft((d) => ({
      ...d,
      title: aiDraftPreview.title,
      kind: aiDraftPreview.kind,
      org: aiDraftPreview.org,
      orgShort: aiDraftPreview.orgShort,
      category: aiDraftPreview.category,
      summary: aiDraftPreview.summary,
      complexity: aiDraftPreview.complexity,
      stages: aiDraftPreview.stages,
    }));
    setSelection({ type: "service" });
    setPreviewStageId(aiDraftPreview.stages[0]?.id || null);
    setAiOpen(false);
    setAiDraftPreview(null);
    setAiText("");
    notify?.("Черновик собран", "ИИ-набросок применён — проверьте и уточните поля");
  }

  function suggestHints() {
    let count = 0;
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) => ({
        ...s,
        steps: s.steps.map((st) => ({
          ...st,
          fields: st.fields.map((f) => {
            if (f.hint && f.hint.trim()) return f;
            count += 1;
            return { ...f, hint: hintTemplateFor(f.type) };
          }),
        })),
      })),
    }));
    notify?.("Подсказки предложены", count > 0 ? `Заполнено полей: ${count}` : "Все поля уже с подсказками");
  }

  /* ── рендер ── */

  const statusChip =
    draft.status === "published" ? "chip-green" : draft.status === "archived" ? "chip-line" : "chip-amber";
  const statusLabel =
    draft.status === "published" ? "Опубликована" : draft.status === "archived" ? "В архиве" : "Черновик";

  return (
    <div className="adm-ctor">
      <div className="adm-ctor-top">
        <button className="btn btn-ghost btn-sm" onClick={handleBack}>
          <ArrowLeft size={15} /> Назад
        </button>
        <div className="adm-ctor-top-title">
          <b>{draft.title || "Без названия"}</b>
          <span className={`chip ${statusChip}`}>{statusLabel}</span>
          <span className="mono muted small">v{draft.version ?? 1}</span>
          {dirty && <span className="adm-dot" title="Есть несохранённые изменения" />}
        </div>
        <div className="row">
          <button className="btn btn-ghost btn-sm" onClick={() => setAiOpen(true)}>
            <Sparkles size={15} /> Собрать черновик по описанию
          </button>
          <button className="btn btn-ghost btn-sm" onClick={suggestHints}>
            <Lightbulb size={15} /> Предложить подсказки
          </button>
          <button className="btn btn-ghost btn-sm adm-preview-toggle" onClick={() => setMobilePreview((v) => !v)}>
            <Eye size={15} /> Предпросмотр
          </button>
          <button className="btn btn-ghost" onClick={handleSaveDraft} disabled={saving}>
            <Save size={15} /> Сохранить черновик
          </button>
          <button className="btn btn-gold" onClick={handlePublish} disabled={saving}>
            <UploadCloud size={15} /> Опубликовать
          </button>
        </div>
      </div>

      <div className="adm-ctor-body">
        <TreePanel
          draft={draft}
          selection={selection}
          setSelection={setSelection}
          stats={stats}
          onAddStage={addStage}
          onRemoveStage={removeStage}
          onMoveStage={moveStage}
          onAddStep={addStep}
          onRemoveStep={removeStep}
          onMoveStep={moveStep}
          onAddField={addField}
          onRemoveField={removeField}
          onMoveField={moveField}
        />

        <div className="adm-ctor-center">
          {selection.type === "service" && (
            <ServiceEditor
              draft={draft}
              onPatchService={patchService}
              onPatchCard={patchCard}
              onAddRule={addRule}
              onPatchRule={patchRule}
              onRemoveRule={removeRule}
            />
          )}
          {selection.type === "stage" && (
            <StageEditor stage={draft.stages.find((s) => s.id === selection.stageId)} onPatch={(p) => patchStage(selection.stageId, p)} />
          )}
          {selection.type === "step" && (
            <StepEditor
              step={draft.stages.find((s) => s.id === selection.stageId)?.steps.find((st) => st.id === selection.stepId)}
              onPatch={(p) => patchStep(selection.stageId, selection.stepId, p)}
            />
          )}
          {selection.type === "field" && (
            <FieldEditor
              draft={draft}
              stageId={selection.stageId}
              stepId={selection.stepId}
              field={draft.stages
                .find((s) => s.id === selection.stageId)
                ?.steps.find((st) => st.id === selection.stepId)
                ?.fields.find((f) => f.id === selection.fieldId)}
              allFieldIds={allFieldsFlat(draft).map((e) => e.field.id)}
              precedingFields={fieldsBefore(draft, selection.stageId, selection.stepId, selection.fieldId)}
              onPatch={(p) => patchField(selection.stageId, selection.stepId, selection.fieldId, p)}
            />
          )}
        </div>

        <div className={`adm-ctor-preview${mobilePreview ? " open" : ""}`}>
          <div className="adm-preview-head">
            <span className="eyebrow">Живой предпросмотр</span>
            {draft.stages.length > 1 && (
              <div className="adm-preview-stages">
                {draft.stages.map((s) => (
                  <button
                    key={s.id}
                    className={`chip ${previewStageId === s.id || (!previewStageId && draft.stages[0].id === s.id) ? "chip-gold" : "chip-line"}`}
                    onClick={() => setPreviewStageId(s.id)}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="adm-preview-frame">
            {previewStage && previewStage.steps?.length > 0 ? (
              <FormRunner
                key={JSON.stringify(previewStage) + draft.title + draft.id}
                service={{ ...draft, id: `${draft.id || "draft"}__preview` }}
                stage={previewStage}
                initialAnswers={{}}
                onSubmit={() => notify?.("Предпросмотр", "Отправка отключена в режиме конструктора")}
              />
            ) : (
              <div className="empty">
                <h3>Нет шагов для предпросмотра</h3>
                <p>Добавьте этап и хотя бы один шаг с полями.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {aiOpen && (
        <AiModal
          text={aiText}
          setText={setAiText}
          preview={aiDraftPreview}
          generating={aiGenerating}
          source={aiSource}
          onGenerate={async () => {
            setAiGenerating(true);
            try {
              const res = await api.aiSchema(aiText);
              if (res && res.schema && !res.fallback) {
                setAiSource("llm");
                setAiDraftPreview(normalizeAiSchema(res.schema));
              } else {
                setAiSource("local");
                setAiDraftPreview(buildAiDraft(aiText));
              }
            } catch {
              setAiSource("local");
              setAiDraftPreview(buildAiDraft(aiText));
            } finally {
              setAiGenerating(false);
            }
          }}
          onApply={applyAiDraft}
          onClose={() => {
            setAiOpen(false);
            setAiDraftPreview(null);
          }}
        />
      )}

      {publishErrors && (
        <ErrorsModal errors={publishErrors} onClose={() => setPublishErrors(null)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ЛЕВАЯ ПАНЕЛЬ — ДЕРЕВО УСЛУГИ
   ═══════════════════════════════════════════════════════════════════════ */

function TreePanel({
  draft,
  selection,
  setSelection,
  stats,
  onAddStage,
  onRemoveStage,
  onMoveStage,
  onAddStep,
  onRemoveStep,
  onMoveStep,
  onAddField,
  onRemoveField,
  onMoveField,
}) {
  return (
    <div className="adm-tree">
      <button
        className={`adm-tree-service${selection.type === "service" ? " active" : ""}`}
        onClick={() => setSelection({ type: "service" })}
      >
        <div className="adm-tree-service-title">{draft.title || "Без названия"}</div>
        <div className="muted small">{draft.orgShort || draft.org}</div>
        <div className="muted small">
          {stats.stages} эт. · {stats.steps} шаг. · {stats.fields} пол.
        </div>
      </button>

      <div className="adm-tree-list">
        {(draft.stages || []).map((stage, sIdx) => (
          <div key={stage.id} className="adm-tree-stage">
            <div
              className={`adm-tree-row adm-tree-row-stage${selection.type === "stage" && selection.stageId === stage.id ? " active" : ""}`}
              onClick={() => setSelection({ type: "stage", stageId: stage.id })}
            >
              <Layers size={14} />
              <span className="adm-tree-row-title">{stage.title}</span>
              <span className="muted small">{stage.steps.length}</span>
              <TreeRowActions
                onUp={sIdx > 0 ? () => onMoveStage(stage.id, -1) : null}
                onDown={sIdx < draft.stages.length - 1 ? () => onMoveStage(stage.id, 1) : null}
                onAdd={() => onAddStep(stage.id)}
                addTitle="Добавить шаг"
                onDelete={() => {
                  if (confirm(`Удалить этап «${stage.title}»?`)) onRemoveStage(stage.id);
                }}
              />
            </div>

            {stage.steps.map((step, stIdx) => (
              <div key={step.id} className="adm-tree-step">
                <div
                  className={`adm-tree-row adm-tree-row-step${selection.type === "step" && selection.stepId === step.id ? " active" : ""}`}
                  onClick={() => setSelection({ type: "step", stageId: stage.id, stepId: step.id })}
                >
                  <ListTree size={13} />
                  <span className="adm-tree-row-title">{step.title}</span>
                  <span className="muted small">{step.fields.length}</span>
                  <TreeRowActions
                    onUp={stIdx > 0 ? () => onMoveStep(stage.id, step.id, -1) : null}
                    onDown={stIdx < stage.steps.length - 1 ? () => onMoveStep(stage.id, step.id, 1) : null}
                    onAdd={() => onAddField(stage.id, step.id)}
                    addTitle="Добавить поле"
                    onDelete={() => {
                      if (confirm(`Удалить шаг «${step.title}»?`)) onRemoveStep(stage.id, step.id);
                    }}
                  />
                </div>

                {step.fields.map((field, fIdx) => (
                  <div
                    key={field.id}
                    className={`adm-tree-row adm-tree-row-field${selection.type === "field" && selection.fieldId === field.id ? " active" : ""}`}
                    onClick={() => setSelection({ type: "field", stageId: stage.id, stepId: step.id, fieldId: field.id })}
                  >
                    <FileText size={12} />
                    <span className="adm-tree-row-title">{field.label || field.id}</span>
                    <span className="chip chip-line adm-tree-type">{field.type}</span>
                    <TreeRowActions
                      onUp={fIdx > 0 ? () => onMoveField(stage.id, step.id, field.id, -1) : null}
                      onDown={fIdx < step.fields.length - 1 ? () => onMoveField(stage.id, step.id, field.id, 1) : null}
                      onDelete={() => {
                        if (confirm(`Удалить поле «${field.label || field.id}»?`)) onRemoveField(stage.id, step.id, field.id);
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <button className="btn btn-ghost btn-sm adm-tree-add-stage" onClick={onAddStage}>
        <Plus size={14} /> Этап
      </button>
    </div>
  );
}

function TreeRowActions({ onUp, onDown, onAdd, addTitle, onDelete }) {
  return (
    <span className="adm-tree-actions" onClick={(e) => e.stopPropagation()}>
      {onUp && (
        <button className="adm-icon-btn" onClick={onUp} title="Переместить вверх">
          <ArrowUp size={12} />
        </button>
      )}
      {onDown && (
        <button className="adm-icon-btn" onClick={onDown} title="Переместить вниз">
          <ArrowDown size={12} />
        </button>
      )}
      {onAdd && (
        <button className="adm-icon-btn" onClick={onAdd} title={addTitle}>
          <Plus size={12} />
        </button>
      )}
      {onDelete && (
        <button className="adm-icon-btn danger" onClick={onDelete} title="Удалить">
          <Trash2 size={12} />
        </button>
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ЦЕНТР — РЕДАКТОРЫ УЗЛОВ
   ═══════════════════════════════════════════════════════════════════════ */

function Field({ label, children, hint }) {
  return (
    <div className="adm-field">
      <label className="label">{label}</label>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

function ServiceEditor({ draft, onPatchService, onPatchCard, onAddRule, onPatchRule, onRemoveRule }) {
  const card = draft.card || {};

  function handleOrgChange(orgName) {
    const found = ORG_OPTIONS.find((o) => o.org === orgName);
    onPatchService({ org: orgName, orgShort: found?.orgShort || orgName });
  }

  return (
    <div className="stack">
      <h2 className="adm-editor-title">Услуга</h2>

      <div className="grid12">
        <div style={{ gridColumn: "span 8" }}>
          <Field label="Название">
            <input className="input" value={draft.title || ""} onChange={(e) => onPatchService({ title: e.target.value })} />
          </Field>
        </div>
        <div style={{ gridColumn: "span 4" }}>
          <Field label="Идентификатор" hint="slug услуги, латиница">
            <input className="input mono" value={draft.id || ""} onChange={(e) => onPatchService({ id: slugify(e.target.value) })} />
          </Field>
        </div>

        <div style={{ gridColumn: "span 6" }}>
          <Field label="Организация">
            <select className="select" value={draft.org || ""} onChange={(e) => handleOrgChange(e.target.value)}>
              {ORG_OPTIONS.map((o) => (
                <option key={o.org} value={o.org}>
                  {o.org}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ gridColumn: "span 3" }}>
          <Field label="Тип меры">
            <select className="select" value={draft.kind || ""} onChange={(e) => onPatchService({ kind: e.target.value })}>
              {KIND_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ gridColumn: "span 3" }}>
          <Field label="Категория">
            <select className="select" value={draft.category || ""} onChange={(e) => onPatchService({ category: e.target.value })}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div style={{ gridColumn: "span 12" }}>
          <Field label="Краткое описание (для карточки каталога)">
            <textarea className="textarea" value={draft.summary || ""} onChange={(e) => onPatchService({ summary: e.target.value })} />
          </Field>
        </div>

        <div style={{ gridColumn: "span 8" }}>
          <Field label="Теги" hint="через запятую">
            <input
              className="input"
              value={(draft.tags || []).join(", ")}
              onChange={(e) => onPatchService({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
            />
          </Field>
        </div>
        <div style={{ gridColumn: "span 4" }}>
          <Field label="Сложность">
            <select className="select" value={draft.complexity || "simple"} onChange={(e) => onPatchService({ complexity: e.target.value })}>
              {COMPLEXITY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <hr className="divider" />
      <h3 className="small">Карточка услуги</h3>
      <div className="grid12">
        <div style={{ gridColumn: "span 3" }}>
          <Field label="Сумма">
            <input className="input" value={card.amount || ""} onChange={(e) => onPatchCard({ amount: e.target.value })} />
          </Field>
        </div>
        <div style={{ gridColumn: "span 3" }}>
          <Field label="Срок">
            <input className="input" value={card.term || ""} onChange={(e) => onPatchCard({ term: e.target.value })} />
          </Field>
        </div>
        <div style={{ gridColumn: "span 3" }}>
          <Field label="Ставка">
            <input className="input" value={card.rate || ""} onChange={(e) => onPatchCard({ rate: e.target.value })} />
          </Field>
        </div>
        <div style={{ gridColumn: "span 3" }}>
          <Field label="Срок решения, дней">
            <input
              className="input"
              type="number"
              value={card.decisionDays ?? ""}
              onChange={(e) => onPatchCard({ decisionDays: Number(e.target.value) || 0 })}
            />
          </Field>
        </div>

        <div style={{ gridColumn: "span 6" }}>
          <Field label="Преимущества" hint="по одному пункту на строку">
            <textarea
              className="textarea"
              value={(card.benefits || []).join("\n")}
              onChange={(e) => onPatchCard({ benefits: splitLines(e.target.value) })}
            />
          </Field>
        </div>
        <div style={{ gridColumn: "span 6" }}>
          <Field label="Условия" hint="по одному пункту на строку">
            <textarea
              className="textarea"
              value={(card.conditions || []).join("\n")}
              onChange={(e) => onPatchCard({ conditions: splitLines(e.target.value) })}
            />
          </Field>
        </div>
        <div style={{ gridColumn: "span 12" }}>
          <Field label="Документы" hint="по одному пункту на строку">
            <textarea
              className="textarea"
              value={(card.documents || []).join("\n")}
              onChange={(e) => onPatchCard({ documents: splitLines(e.target.value) })}
            />
          </Field>
        </div>

        <div style={{ gridColumn: "span 12" }}>
          <Field label="Итог для предпринимателя">
            <textarea className="textarea" value={card.resultText || ""} onChange={(e) => onPatchCard({ resultText: e.target.value })} />
          </Field>
        </div>

        <div style={{ gridColumn: "span 12" }}>
          <FaqEditor faq={card.faq || []} onChange={(faq) => onPatchCard({ faq })} />
        </div>
      </div>

      <hr className="divider" />
      <RulesEditor rules={draft.rules || []} onAdd={onAddRule} onPatch={onPatchRule} onRemove={onRemoveRule} />
    </div>
  );
}

function FaqEditor({ faq, onChange }) {
  function update(i, patch) {
    onChange(faq.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function add() {
    onChange([...faq, { q: "", a: "" }]);
  }
  function remove(i) {
    onChange(faq.filter((_, idx) => idx !== i));
  }
  return (
    <div>
      <div className="spread">
        <label className="label">Вопросы и ответы (FAQ)</label>
        <button className="btn btn-ghost btn-sm" onClick={add}>
          <Plus size={13} /> Добавить
        </button>
      </div>
      <div className="stack">
        {faq.map((item, i) => (
          <div key={i} className="adm-faq-row">
            <input className="input" placeholder="Вопрос" value={item.q} onChange={(e) => update(i, { q: e.target.value })} />
            <input className="input" placeholder="Ответ" value={item.a} onChange={(e) => update(i, { a: e.target.value })} />
            <button className="adm-icon-btn danger" onClick={() => remove(i)}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {faq.length === 0 && <p className="muted small">Вопросов пока нет.</p>}
      </div>
    </div>
  );
}

function RulesEditor({ rules, onAdd, onPatch, onRemove }) {
  return (
    <div>
      <div className="spread">
        <h3 className="small">Правила услуги (проверка соответствия)</h3>
        <button className="btn btn-ghost btn-sm" onClick={onAdd}>
          <Plus size={13} /> Правило
        </button>
      </div>
      <p className="muted small">
        Формула: id полей (числа), + − * / ( ), функции pct(part,whole), min, max, round, annuity(principal,ratePct,months);
        сравнения &gt;= &lt;= &gt; &lt; == != и логика &amp;&amp; ||.
      </p>
      <div className="stack">
        {rules.map((rule, i) => (
          <div key={rule.id || i} className="adm-rule-row">
            <input className="input" placeholder="Название правила" value={rule.label} onChange={(e) => onPatch(i, { label: e.target.value })} />
            <input className="input mono" placeholder="expr, напр. pct(own, amount) >= 15" value={rule.expr} onChange={(e) => onPatch(i, { expr: e.target.value })} />
            <select className="select" value={rule.level} onChange={(e) => onPatch(i, { level: e.target.value })}>
              {RULE_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <button className="adm-icon-btn danger" onClick={() => onRemove(i)}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {rules.length === 0 && <p className="muted small">Правил пока нет.</p>}
      </div>
    </div>
  );
}

function StageEditor({ stage, onPatch }) {
  if (!stage) return null;
  return (
    <div className="stack">
      <h2 className="adm-editor-title">Этап</h2>
      <Field label="Название этапа">
        <input className="input" value={stage.title || ""} onChange={(e) => onPatch({ title: e.target.value })} />
      </Field>
      <Field label="Описание">
        <textarea className="textarea" value={stage.description || ""} onChange={(e) => onPatch({ description: e.target.value })} />
      </Field>
    </div>
  );
}

function StepEditor({ step, onPatch }) {
  if (!step) return null;
  return (
    <div className="stack">
      <h2 className="adm-editor-title">Шаг</h2>
      <Field label="Название шага">
        <input className="input" value={step.title || ""} onChange={(e) => onPatch({ title: e.target.value })} />
      </Field>
      <Field label="Подсказка под заголовком">
        <input className="input" value={step.hint || ""} onChange={(e) => onPatch({ hint: e.target.value })} />
      </Field>
    </div>
  );
}

/* ───────────────────────── редактор поля ───────────────────────── */

function OptionsEditor({ options, onChange }) {
  function update(i, patch) {
    onChange(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }
  function add() {
    onChange([...options, { value: `option-${options.length + 1}`, label: "Новый вариант" }]);
  }
  function remove(i) {
    onChange(options.filter((_, idx) => idx !== i));
  }
  return (
    <div>
      <div className="spread">
        <label className="label">Варианты</label>
        <button className="btn btn-ghost btn-sm" onClick={add}>
          <Plus size={13} /> Вариант
        </button>
      </div>
      <div className="stack">
        {options.map((o, i) => (
          <div key={i} className="adm-option-row">
            <input className="input mono" placeholder="value" value={o.value} onChange={(e) => update(i, { value: e.target.value })} />
            <input className="input" placeholder="Подпись" value={o.label} onChange={(e) => update(i, { label: e.target.value })} />
            <button className="adm-icon-btn danger" onClick={() => remove(i)}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {options.length === 0 && <p className="muted small">Вариантов пока нет.</p>}
      </div>
    </div>
  );
}

function FieldEditor({ draft, field, allFieldIds, precedingFields, onPatch }) {
  if (!field) return null;

  const duplicate = allFieldIds.filter((id) => id === field.id).length > 1;
  const numericPrecedingIds = allFieldsFlat(draft)
    .map((e) => e.field)
    .filter((f) => f.id !== field.id && NUMERIC_FIELD_TYPES.has(f.type))
    .map((f) => f.id);

  function regenerateId() {
    const base = camelize(slugify(field.label || "field"));
    const taken = new Set(allFieldIds.filter((id) => id !== field.id));
    onPatch({ id: uniqueId(base, taken) });
  }

  const optionsSource = field.dictionary ? "dictionary" : "options";

  return (
    <div className="stack">
      <h2 className="adm-editor-title">Поле</h2>

      {duplicate && (
        <div className="adm-warning">
          <AlertTriangle size={14} /> Такой id уже используется другим полем услуги — исправьте перед публикацией.
        </div>
      )}

      <div className="grid12">
        <div style={{ gridColumn: "span 6" }}>
          <Field label="Подпись (label)">
            <input className="input" value={field.label || ""} onChange={(e) => onPatch({ label: e.target.value })} />
          </Field>
        </div>
        <div style={{ gridColumn: "span 4" }}>
          <Field label="id поля" hint="латиница, уникален в услуге">
            <input className="input mono" value={field.id || ""} onChange={(e) => onPatch({ id: slugify(e.target.value).replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()) })} />
          </Field>
        </div>
        <div style={{ gridColumn: "span 2", display: "flex", alignItems: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" style={{ width: "100%" }} onClick={regenerateId}>
            <Wand2 size={13} /> Из label
          </button>
        </div>

        <div style={{ gridColumn: "span 6" }}>
          <Field label="Тип поля">
            <select className="select" value={field.type} onChange={(e) => onPatch({ type: e.target.value })}>
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ gridColumn: "span 3" }}>
          <Field label="Ширина (колонки)">
            <select className="select" value={field.cols || 12} onChange={(e) => onPatch({ cols: Number(e.target.value) })}>
              {COLS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c} / 12
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ gridColumn: "span 3", display: "flex", alignItems: "flex-end", paddingBottom: 10 }}>
          <label className="row" style={{ gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={!!field.required} onChange={(e) => onPatch({ required: e.target.checked })} />
            Обязательное
          </label>
        </div>

        <div style={{ gridColumn: "span 6" }}>
          <Field label="Подсказка (hint)">
            <input className="input" value={field.hint || ""} onChange={(e) => onPatch({ hint: e.target.value })} />
          </Field>
        </div>
        <div style={{ gridColumn: "span 6" }}>
          <Field label="Плейсхолдер">
            <input className="input" value={field.placeholder || ""} onChange={(e) => onPatch({ placeholder: e.target.value })} />
          </Field>
        </div>
      </div>

      {OPTION_SOURCE_TYPES.has(field.type) && (
        <div className="adm-subblock">
          <div className="row" style={{ marginBottom: 10 }}>
            <button
              className={`chip ${optionsSource === "dictionary" ? "chip-gold" : "chip-line"}`}
              onClick={() => onPatch({ dictionary: field.dictionary || Object.keys(dictionaries)[0], options: undefined })}
            >
              Справочник
            </button>
            <button
              className={`chip ${optionsSource === "options" ? "chip-gold" : "chip-line"}`}
              onClick={() => onPatch({ dictionary: undefined, options: field.options || [] })}
            >
              Свои варианты
            </button>
          </div>
          {optionsSource === "dictionary" ? (
            <Field label="Справочник">
              <select className="select" value={field.dictionary || ""} onChange={(e) => onPatch({ dictionary: e.target.value })}>
                {Object.keys(dictionaries)
                  .filter((k) => k !== "categories")
                  .map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
              </select>
            </Field>
          ) : (
            <OptionsEditor options={field.options || []} onChange={(options) => onPatch({ options })} />
          )}
        </div>
      )}

      {!NO_PREFILL_TYPES.has(field.type) && (
        <div className="adm-subblock">
          <Field label="Предзаполнение из профиля компании (eGov)">
            <select className="select" value={field.prefill || ""} onChange={(e) => onPatch({ prefill: e.target.value || undefined })}>
              {PREFILL_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {field.type === "calc" && (
        <div className="adm-subblock">
          <Field
            label="Формула (compute)"
            hint={`Поля: ${numericPrecedingIds.join(", ") || "числовых полей пока нет"}. Функции: pct, min, max, round, annuity.`}
          >
            <input className="input mono" value={field.compute || ""} onChange={(e) => onPatch({ compute: e.target.value })} />
          </Field>
          <Field label="Формат отображения">
            <select className="select" value={field.format || "number"} onChange={(e) => onPatch({ format: e.target.value })}>
              <option value="number">Число</option>
              <option value="money">Сумма, ₸</option>
              <option value="percent">Процент</option>
            </select>
          </Field>
        </div>
      )}

      <div className="adm-subblock">
        <label className="label">Валидация (необязательно)</label>
        <div className="grid12">
          <div style={{ gridColumn: "span 3" }}>
            <input
              className="input"
              type="number"
              placeholder="min"
              value={field.validate?.min ?? ""}
              onChange={(e) => onPatch({ validate: { ...(field.validate || {}), min: e.target.value === "" ? undefined : Number(e.target.value) } })}
            />
          </div>
          <div style={{ gridColumn: "span 3" }}>
            <input
              className="input"
              type="number"
              placeholder="max"
              value={field.validate?.max ?? ""}
              onChange={(e) => onPatch({ validate: { ...(field.validate || {}), max: e.target.value === "" ? undefined : Number(e.target.value) } })}
            />
          </div>
          <div style={{ gridColumn: "span 3" }}>
            <input
              className="input mono"
              placeholder="pattern"
              value={field.validate?.pattern ?? ""}
              onChange={(e) => onPatch({ validate: { ...(field.validate || {}), pattern: e.target.value || undefined } })}
            />
          </div>
          <div style={{ gridColumn: "span 3" }}>
            <input
              className="input"
              placeholder="Сообщение об ошибке"
              value={field.validate?.message ?? ""}
              onChange={(e) => onPatch({ validate: { ...(field.validate || {}), message: e.target.value || undefined } })}
            />
          </div>
        </div>
      </div>

      <hr className="divider" />
      <WhenEditor field={field} precedingFields={precedingFields} onPatch={onPatch} />
    </div>
  );
}

/* ───────────────────────── редактор условий видимости ───────────────────────── */

function WhenEditor({ field, precedingFields, onPatch }) {
  const state = parseWhen(field.when);

  function commit(next) {
    onPatch({ when: buildWhen(next) });
  }

  function setMode(mode) {
    commit({ ...state, mode });
  }
  function setCombinator(combinator) {
    commit({ ...state, combinator });
  }
  function setNegate(negate) {
    commit({ ...state, negate });
  }
  function updateCondition(i, patch) {
    const conditions = state.conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    commit({ ...state, conditions });
  }
  function addCondition() {
    if (state.conditions.length >= 3) return;
    commit({ ...state, conditions: [...state.conditions, emptyCondition()] });
  }
  function removeCondition(i) {
    const conditions = state.conditions.filter((_, idx) => idx !== i);
    commit({ ...state, conditions: conditions.length ? conditions : [emptyCondition()] });
  }

  return (
    <div>
      <label className="label">Условия видимости</label>
      <div className="row" style={{ marginBottom: 10 }}>
        <button className={`chip ${state.mode === "always" ? "chip-gold" : "chip-line"}`} onClick={() => setMode("always")}>
          Показывать всегда
        </button>
        <button className={`chip ${state.mode === "condition" ? "chip-gold" : "chip-line"}`} onClick={() => setMode("condition")}>
          По условию
        </button>
      </div>

      {state.mode === "condition" && (
        <div className="adm-when-block">
          {state.conditions.map((cond, i) => {
            const sourceField = precedingFields.find((f) => f.id === cond.field);
            const sourceOptions = sourceField
              ? sourceField.dictionary && dictionaries[sourceField.dictionary]
                ? dictionaries[sourceField.dictionary].map((o) => (o.value !== undefined ? o : { value: o.id, label: o.label }))
                : sourceField.options || []
              : [];
            return (
              <div key={i} className="adm-when-row">
                <select className="select" value={cond.field} onChange={(e) => updateCondition(i, { field: e.target.value, value: "" })}>
                  <option value="">— поле —</option>
                  {precedingFields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label || f.id}
                    </option>
                  ))}
                </select>
                <select className="select" value={cond.op} onChange={(e) => updateCondition(i, { op: e.target.value })}>
                  {OP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {cond.op !== "truthy" &&
                  (sourceOptions.length > 0 ? (
                    <select className="select" value={cond.value} onChange={(e) => updateCondition(i, { value: e.target.value })}>
                      <option value="">— значение —</option>
                      {sourceOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : cond.op === "in" ? (
                    <input
                      className="input"
                      placeholder="значения через запятую"
                      value={Array.isArray(cond.value) ? cond.value.join(", ") : cond.value || ""}
                      onChange={(e) => updateCondition(i, { value: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })}
                    />
                  ) : (
                    <input className="input" placeholder="значение" value={cond.value ?? ""} onChange={(e) => updateCondition(i, { value: e.target.value })} />
                  ))}
                <button className="adm-icon-btn danger" onClick={() => removeCondition(i)}>
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}

          <div className="row" style={{ marginTop: 6 }}>
            {state.conditions.length < 3 && (
              <button className="btn btn-ghost btn-sm" onClick={addCondition}>
                <Plus size={13} /> Условие
              </button>
            )}
            {state.conditions.length > 1 && (
              <select className="select" style={{ maxWidth: 220 }} value={state.combinator} onChange={(e) => setCombinator(e.target.value)}>
                {COMBINATOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
            {state.conditions.length === 1 && (
              <label className="row small" style={{ gap: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={state.negate} onChange={(e) => setNegate(e.target.checked)} />
                Инвертировать (НЕ)
              </label>
            )}
          </div>
          {precedingFields.length === 0 && (
            <p className="muted small" style={{ marginTop: 8 }}>
              Нет полей выше по услуге — условие сослаться пока не на что.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   МОДАЛКИ
   ═══════════════════════════════════════════════════════════════════════ */

function ModalShell({ title, onClose, children, wide }) {
  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className={`adm-modal card${wide ? " wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="spread adm-modal-head">
          <h3>{title}</h3>
          <button className="adm-icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="adm-modal-body">{children}</div>
      </div>
    </div>
  );
}

function AiModal({ text, setText, preview, generating, source, onGenerate, onApply, onClose }) {
  return (
    <ModalShell title="Собрать черновик по описанию" onClose={onClose} wide>
      <p className="muted small">
        Опишите услугу своими словами: назначение, сумму, срок, документы, условия («если …») и вопросы
        к заявителю. При настроенном ИИ структура собирается языковой моделью, иначе — локальным разбором.
        Результат нужно проверить и уточнить.
      </p>
      <textarea
        className="textarea"
        style={{ minHeight: 140 }}
        placeholder="Например: Кредитование на пополнение оборотных средств для АПК. Сумма до 500 млн тенге. Срок до 3 лет. Если есть залог, приложите отчёт об оценке. Есть ли у компании экспортные контракты?"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn btn-primary" onClick={onGenerate} disabled={!text.trim() || generating}>
          <Sparkles size={15} /> {generating ? "Собираем структуру…" : "Сгенерировать структуру"}
        </button>
        {source ? (
          <span className="chip chip-line">
            {source === "llm" ? "собрано ИИ-моделью" : "локальный разбор (без ИИ-ключа)"}
          </span>
        ) : null}
      </div>

      {preview && (
        <div className="adm-ai-preview">
          <hr className="divider" />
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <span className="chip chip-gold">{preview.kind}</span>
            <span className="chip chip-line">{preview.org}</span>
            <span className="chip chip-line">{preview.category}</span>
          </div>
          <h4 style={{ marginTop: 10 }}>{preview.title}</h4>
          <p className="muted small">{preview.summary}</p>
          <div className="stack" style={{ marginTop: 10 }}>
            {preview.stages[0].steps.map((step) => (
              <div key={step.id} className="adm-ai-step">
                <b className="small">{step.title}</b>
                <ul className="adm-ai-fields">
                  {step.fields.map((f) => (
                    <li key={f.id} className="muted small">
                      {f.label} <span className="chip chip-line" style={{ marginLeft: 6 }}>{f.type}</span>
                      {f.when && <span className="chip chip-amber" style={{ marginLeft: 6 }}>по условию</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="muted small" style={{ marginTop: 8 }}>
            ИИ-набросок: проверьте и уточните поля.
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            <button
              className="btn btn-gold"
              onClick={() => {
                if (confirm("Применить сгенерированную структуру к черновику? Текущие этапы/шаги/поля будут заменены.")) onApply();
              }}
            >
              Применить к черновику
            </button>
            <button className="btn btn-ghost" onClick={onClose}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function ErrorsModal({ errors, onClose }) {
  return (
    <ModalShell title="Публикация невозможна" onClose={onClose}>
      <p className="muted small">Устраните ошибки и попробуйте снова:</p>
      <ul className="adm-error-list">
        {errors.map((e, i) => (
          <li key={i}>
            <AlertTriangle size={13} /> {e}
          </li>
        ))}
      </ul>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={onClose}>
          Понятно
        </button>
      </div>
    </ModalShell>
  );
}
