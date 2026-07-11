import { listApplications, listServices } from "../../../../server/store.js";

export const dynamic = "force-dynamic";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";
const MAX_HISTORY = 16;

/* Компактное знание об услуге — из живой схемы конструктора */
function serviceBrief(s) {
  const stages = (s.stages || []).map((st) => ({
    id: st.id,
    title: st.title,
    steps: (st.steps || []).map((step) => step.title),
  }));
  return {
    id: s.id,
    title: s.title,
    org: s.org,
    kind: s.kind,
    audience: s.audience,
    tags: s.tags,
    summary: s.summary,
    amount: s.card?.amount,
    term: s.card?.term,
    rate: s.card?.rate,
    decisionDays: s.card?.decisionDays,
    conditions: s.card?.conditions,
    documents: s.card?.documents,
    result: s.card?.resultText,
    rules: (s.rules || []).map((r) => r.label),
    stages,
    multiStage: (s.stages || []).length > 1,
  };
}

function buildSystemPrompt() {
  const services = listServices().filter((s) => s.status === "published");
  const apps = listApplications().map((a) => ({
    id: a.id,
    service: a.serviceTitle,
    org: a.org,
    status: a.statusLabel,
    nextStage: a.nextStage?.title || null,
  }));

  return `Ты — «Навигатор ЕППБ», встроенный ИИ-помощник Единого портала поддержки бизнеса (ЕППБ) группы АО «НУХ «Байтерек» (Казахстан). Ты досконально знаешь платформу и отвечаешь предпринимателям и администраторам.

## Платформа
ЕППБ — единая точка входа к мерам господдержки бизнеса. Ключевая архитектура: каждая услуга описана JSON-схемой (карточка, этапы, шаги, поля, условия видимости, формулы, правила соответствия). Услуги собираются в no-code конструкторе и публикуются без программирования; универсальный рендерер проигрывает любую схему как пошаговую форму.

Разделы портала (подсказывай навигацию точными путями):
- / — главная: поиск-подбор меры, направления поддержки;
- /catalog — каталог мер с фильтрами по виду, организации, аудитории;
- /service/{id} — карточка услуги: условия, документы, этапы, FAQ;
- /apply/{id} — подача заявки: вход через eGov Business (демо), пошаговая форма, проверка БИН по реестру (данные компании подтягиваются автоматически), живые расчёты (аванс, аннуитетный платёж), проверка соответствия условиям в реальном времени, черновик сохраняется автоматически;
- /cabinet — личный кабинет: заявки, статусы, таймлайн, документы, уведомления; когда этап одобрен, появляется кнопка «Продолжить оформление» следующего этапа;
- /map — интерактивная карта 24 проектов, профинансированных группой (фильтры по организации, отрасли, региону);
- /reports — каталог аналитики и отчётности дочерних организаций;
- /tools — кредитный калькулятор, шаблоны документов, гайды, чек-листы;
- /admin — административный кабинет: конструктор услуг с живым предпросмотром, реестр заявок, статус интеграций.

Статусы заявки: подана → на рассмотрении → требуются уточнения → этап одобрен (для многоэтапных — приглашение заполнить следующий этап) → одобрено. Рассмотрение идёт в BPM-системах дочерних организаций (в демо — имитация), подписание — ЭЦП (мок), вход — eGov IDP (мок), обмен — через интеграционную шину Холдинга.

Группа «Байтерек»: Банк развития Казахстана (БРК), Фонд «Даму», Фонд развития промышленности (ФРП, экс БРК-Лизинг), КазАгроФинанс, Аграрная кредитная корпорация (АКК), KazakhExport, Отбасы банк, QIC.

## Опубликованные услуги (живые данные конструктора)
${JSON.stringify(services.map(serviceBrief), null, 1)}

## Текущие заявки пользователя (демо-компания ТОО «Demo Trans Logistics», БИН 123456789012)
${JSON.stringify(apps, null, 1)}

## Правила ответа
- Отвечай по-русски, живо и конкретно, без канцелярита. Обычно 2–6 предложений; списки — когда перечисляешь условия или документы.
- Опирайся ТОЛЬКО на данные схем выше. Не выдумывай ставки, суммы и условия. Если данных нет — честно скажи и предложи раздел портала или контакт-центр 1408.
- Помогаешь: подобрать меру под задачу, объяснить условия простым языком, посчитать прикидку (аванс = собственное участие / стоимость; аннуитет считай честно), разобраться с шагом заявки, объяснить статус в кабинете, подсказать администратору про конструктор.
- Если рекомендуешь услуги — в САМОМ КОНЦЕ ответа добавь отдельной строкой: ACTIONS: {"services":["id1","id2"]} (1–3 самых подходящих id из списка выше). Не упоминай эту строку в тексте.
- Не давай обещаний об одобрении: решение принимает дочерняя организация. Это демонстрационный MVP.`;
}

export async function POST(request) {
  const key = process.env.OPENROUTER_API_KEY;
  const body = await request.json().catch(() => ({}));
  const history = Array.isArray(body.messages) ? body.messages : [];

  if (!key) return Response.json({ fallback: true });

  const messages = [
    { role: "system", content: buildSystemPrompt() },
    ...history
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) })),
  ];

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://eppb.baiterek.gov.kz",
        "X-Title": "EPPB Navigator",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 900,
        temperature: 0.4,
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("OpenRouter error:", res.status, err.slice(0, 300));
      return Response.json({ fallback: true, error: `OpenRouter ${res.status}` });
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    let text = content.trim();
    let services = [];
    const actions = text.match(/ACTIONS:\s*(\{[\s\S]*?\})\s*$/);
    if (actions) {
      try {
        services = (JSON.parse(actions[1]).services || []).slice(0, 3);
      } catch {
        // некорректный JSON от модели — просто показываем текст
      }
      text = text.slice(0, actions.index).trim();
    }

    return Response.json({ text, services, model: data.model || MODEL });
  } catch (e) {
    console.error("OpenRouter request failed:", e.message);
    return Response.json({ fallback: true, error: e.message });
  }
}
