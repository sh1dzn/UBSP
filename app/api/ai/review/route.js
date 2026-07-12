import { getService } from "../../../../server/store.js";
import { evalRule } from "../../../../src/engine/formula.js";
import { isVisible } from "../../../../src/engine/conditions.js";

export const dynamic = "force-dynamic";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";

/* Детерминированная предпроверка — работает и без LLM-ключа */
function localReview(service, stage, answers) {
  const issues = [];

  for (const step of stage.steps || []) {
    for (const field of step.fields || []) {
      if (!isVisible(field.when, answers)) continue;
      const value = answers[field.id];
      const empty = value === undefined || value === null || value === "";
      if (field.required && empty && field.type !== "calc" && field.type !== "info") {
        issues.push({ level: "error", text: `Не заполнено обязательное поле «${field.label}» (шаг «${step.title}»)` });
      }
      if (field.type === "file" && field.required && empty) {
        issues.push({ level: "error", text: `Не приложен документ «${field.label}»` });
      }
    }
  }

  const ruleCtx = { ...answers };
  for (const rule of service.rules || []) {
    const passed = evalRule(rule.expr, ruleCtx);
    if (!passed) {
      issues.push({
        level: rule.level === "warning" ? "warning" : "error",
        text: `Условие не выполнено: ${rule.label}`,
      });
    }
  }

  const deduped = [...new Map(issues.map((i) => [i.text, i])).values()];
  const errors = deduped.filter((i) => i.level === "error").length;
  const summary = errors
    ? `Найдено проблем: ${deduped.length}. Исправьте их до отправки — это сократит срок рассмотрения.`
    : deduped.length
      ? "Критичных проблем нет, но есть предупреждения — просмотрите их перед отправкой."
      : "Заявка выглядит полной: обязательные поля заполнены, условия программы выполнены.";

  return { summary, issues: deduped, ok: errors === 0 };
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { serviceId, stageId, answers = {} } = body;
  const service = getService(serviceId);
  if (!service) return Response.json({ message: "Услуга не найдена" }, { status: 404 });
  const stage = (service.stages || []).find((s) => s.id === stageId) || service.stages?.[0];
  if (!stage) return Response.json({ message: "Этап не найден" }, { status: 404 });

  const base = localReview(service, stage, answers);

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return Response.json({ ...base, source: "rules" });

  // LLM-надстройка: человеческое объяснение поверх детерминированных проверок
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "Ты — проверяющий заявок портала поддержки бизнеса Казахстана. Кратко (3-5 предложений), по-русски, без канцелярита: оцени готовность заявки и дай 1-3 конкретных совета, как её усилить. Не выдумывай условий, опирайся только на данные.",
          },
          {
            role: "user",
            content: `Услуга: ${service.title} (${service.org}). Этап: ${stage.title}. Ответы заявителя: ${JSON.stringify(answers).slice(0, 3000)}. Результаты проверок: ${JSON.stringify(base.issues)}.`,
          },
        ],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return Response.json({ ...base, summary: text, llm: true, source: "ai" });
    }
  } catch {
    // LLM недоступен — детерминированного результата достаточно
  }
  return Response.json({ ...base, source: "rules", fallback: true });
}
