import { dictionaries } from "../../../../src/data/dictionaries.js";

export const dynamic = "force-dynamic";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";

const FIELD_TYPES = [
  "text", "textarea", "number", "money", "percent", "select", "radio", "checkbox",
  "checklist", "date", "bin", "iin", "phone", "file", "calc", "info",
];

function buildPrompt(description) {
  return `Собери черновик схемы услуги для no-code конструктора «Единого портала поддержки бизнеса» (Казахстан) по описанию автора.

Верни ТОЛЬКО валидный JSON без markdown-ограждений, строго такой структуры:
{
 "title": "...", "org": "...", "kind": "Кредитование|Лизинг|Гарантирование|Субсидирование|Страхование|Инвестиции|Экспорт",
 "summary": "1-2 предложения", "complexity": "simple|complex",
 "card": { "amount": "...", "term": "...", "rate": "...", "decisionDays": 10,
   "benefits": ["..."], "conditions": ["..."], "documents": ["..."], "faq": [], "resultText": "..." },
 "stages": [ { "id": "application", "title": "Заявка", "description": "...",
   "steps": [ { "id": "applicant", "title": "О заявителе", "hint": "...",
     "fields": [ { "id": "bin", "type": "bin", "label": "БИН компании", "required": true, "prefill": "company.bin" } ] } ] } ],
 "rules": [ { "id": "r1", "label": "...", "expr": "amount >= 1000000", "level": "error" } ]
}

Правила:
- Типы полей ТОЛЬКО из списка: ${FIELD_TYPES.join(", ")}.
- id полей — латиницей, уникальные в рамках услуги; ответы хранятся плоско (answers[id]).
- Условная видимость: "when": {"field":"x","op":"eq","value":"y"} (op: eq,neq,gt,gte,lt,lte,in,truthy,falsy; комбинаторы all/any/not).
- Вычисляемые поля: type "calc" + "compute": формула из id числовых полей и функций pct(a,b), min, max, round, annuity(principal, ratePercentYear, months); + "format": "money|percent|number".
- Для select можно "dictionary" из: ${Object.keys(dictionaries).join(", ")} — или свои "options": [{"value","label"}].
- Первый шаг всегда «О заявителе» с полем bin (prefill company.name/region/activity где уместно), последний — «Подтверждение» с checkbox-согласиями.
- 2 этапа, если услуга сложная (предварительная + полная), иначе 1. На русский конкретный язык, без канцелярита.
- В rules 1-3 проверки из описания (суммы, доли, сроки).

Описание автора: ${description}`;
}

export async function POST(request) {
  const key = process.env.OPENROUTER_API_KEY;
  const body = await request.json().catch(() => ({}));
  const description = String(body.description || "").slice(0, 4000);
  if (!description.trim()) return Response.json({ message: "Пустое описание" }, { status: 400 });
  if (!key) return Response.json({ fallback: true });

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 3500,
        temperature: 0.3,
        messages: [{ role: "user", content: buildPrompt(description) }],
      }),
    });
    if (!res.ok) return Response.json({ fallback: true });
    const data = await res.json();
    let text = (data.choices?.[0]?.message?.content || "").trim();
    text = text.replace(/^```(json)?/m, "").replace(/```$/m, "").trim();
    const schema = JSON.parse(text);

    // валидация структуры и типов полей
    if (!schema.title || !Array.isArray(schema.stages) || !schema.stages.length) {
      return Response.json({ fallback: true });
    }
    for (const st of schema.stages) {
      for (const step of st.steps || []) {
        step.fields = (step.fields || []).filter((f) => f.id && f.label && FIELD_TYPES.includes(f.type));
      }
    }
    return Response.json({ schema, llm: true });
  } catch {
    return Response.json({ fallback: true });
  }
}
