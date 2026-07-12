"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, Trash2, X } from "lucide-react";
import api from "../api.js";

/**
 * Навигатор ЕППБ — «AI»-помощник предпринимателя.
 * Никаких внешних LLM: детерминированный локальный движок интентов
 * поверх схем услуг (api.services) + серверный скоринг (api.aiMatch).
 */

const HISTORY_KEY = "eppb-chat-history";

const DISCLAIMER =
  "Навигатор анализирует схемы услуг конструктора — рекомендации не являются решением о финансировании.";

const SUGGESTIONS = [
  "Подобрать меру поддержки",
  "Хочу купить вагоны в лизинг",
  "Что нужно для кредита на животноводство?",
  "Объясни, что такое гарантия Даму",
];

const GREETING =
  "Здравствуйте! Я Навигатор ЕППБ — помогу подобрать меру поддержки, объяснить условия услуги простым языком или разобраться с шагом заявки. С чего начнём?";

const STOPWORDS = new Set([
  "что", "такое", "объясни", "поясни", "расскажи", "условия", "условие",
  "простым", "простыми", "языком", "словами", "про", "для", "как", "мне",
  "нужно", "нужна", "нужен", "это", "меня", "мой", "моя", "моё", "быстро",
]);

const TERMS = [
  {
    key: "гарант",
    title: "Гарантия",
    text: "Например, гарантия «Даму» — это обязательство фонда закрыть часть долга перед банком, если бизнес не сможет платить. Деньги напрямую она не даёт, а снижает риск банка — поэтому кредит одобряют охотнее и часто без полного залога.",
  },
  {
    key: "субсиди",
    title: "Субсидирование ставки",
    text: "Государство или институт развития компенсирует часть процентной ставки по кредиту или лизингу. Вы платите банку по сниженной ставке, а разницу доплачивает субсидирующая организация напрямую банку.",
  },
  {
    key: "аннуитет",
    title: "Аннуитетный платёж",
    text: "Ежемесячный платёж одинакового размера на весь срок кредита: в начале в нём больше процентов, к концу — больше основного долга. Удобен тем, что сумму легко планировать заранее.",
  },
  {
    key: "лизинг",
    title: "Лизинг",
    text: "Аренда имущества (техники, вагонов, оборудования) с правом выкупа. Лизингодатель покупает актив и передаёт его вам в пользование за регулярные платежи, а по итогу срока актив переходит в вашу собственность.",
  },
  {
    key: "аванс",
    title: "Аванс (собственное участие)",
    text: "Часть стоимости проекта, которую вы вносите из своих средств, а не занимаете. Обычно это остаток на счёте компании, уже вложенное оборудование или земля по оценке — подтверждается документами.",
  },
  {
    key: "эцп",
    title: "ЭЦП",
    text: "Электронная цифровая подпись — аналог собственноручной подписи для подачи документов онлайн. В портале подписание заявки и документов выполняется мок-ЭЦП без визита в офис.",
  },
  {
    key: "бин",
    title: "БИН",
    text: "Бизнес-идентификационный номер — 12 цифр, уникальный код компании или ИП в госреестре. По нему портал автоматически подтягивает данные о регистрации, регионе и виде деятельности.",
  },
  {
    key: "оборотн",
    title: "Оборотные средства",
    text: "Деньги на текущие нужды бизнеса: закупку сырья, зарплату, аренду — то, что не является долгосрочным вложением вроде техники или недвижимости.",
  },
];

const MATCH_HINT =
  /куп|нужн|хочу|хотим|кредит|лизинг|деньги|денег|финансир|поддержк|заявк|подбер|оборудован|вагон|скот|поголовь|техник|развит|бизнес|инвестиц|стройк|строительств/i;

const EXPLAIN_HINT = /(объясни|что такое|поясни|расскажи|условия|простым языком|простыми словами)/i;
const APPLY_HELP_HINT = /помоги с (шагом|заполнением|разделом)/i;
const COMPARE_HINT = /(сравни|сравнить|чем отличается|разница между|что лучше)/i;

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function findTerm(text) {
  const lower = text.toLowerCase();
  return TERMS.find((t) => lower.includes(t.key));
}

function findServiceByQuery(services, tokens) {
  let best = null;
  let bestScore = 0;
  services.forEach((s) => {
    const title = (s.title || "").toLowerCase();
    const tags = (s.tags || []).map((t) => t.toLowerCase());
    const kind = (s.kind || "").toLowerCase();
    let score = 0;
    tokens.forEach((tok) => {
      if (title.includes(tok)) score += 3;
      if (tags.some((t) => t.includes(tok))) score += 2;
      if (kind.includes(tok)) score += 1;
    });
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  });
  return bestScore >= 2 ? best : null;
}

function buildExplainText(service) {
  const card = service.card || {};
  const parts = [`«${service.title}» — мера от ${service.org}.`];

  const money = [];
  if (card.amount) money.push(`сумма ${card.amount}`);
  if (card.term) money.push(`срок ${card.term}`);
  if (card.rate) money.push(`ставка ${card.rate}`);
  if (money.length) parts.push(`По деньгам: ${money.join(", ")}.`);

  if (card.decisionDays) {
    parts.push(`Решение по заявке обычно занимает около ${card.decisionDays} дней.`);
  }

  if (card.conditions?.length) {
    parts.push(`Условия простыми словами: ${card.conditions.join("; ")}.`);
  }

  if (service.rules?.length) {
    parts.push(`При рассмотрении заявки проверят: ${service.rules.map((r) => r.label).join("; ")}.`);
  }

  if (!card.conditions?.length && !service.rules?.length) {
    parts.push("Детальные условия сейчас уточняются в конструкторе, но карточка услуги уже доступна.");
  }

  parts.push("Готовы попробовать? Первый этап обычно занимает около 7 минут.");
  return parts.join(" ");
}

function buildApplyHelpTips(rawText) {
  const lower = rawText.toLowerCase();
  const tips = [];
  if (/бин/.test(lower)) {
    tips.push(
      "БИН компании — 12 цифр из справки о госрегистрации. Введите его и нажмите «Проверить в реестре» рядом с полем — остальные данные о компании подтянутся сами."
    );
  }
  if (/аванс|собственн|взнос/.test(lower)) {
    tips.push(
      "Под «собственным участием» понимают деньги не из кредита: остаток на счёте компании, уже купленное оборудование или землю по оценке — это тоже засчитывается."
    );
  }
  if (/докум|файл|справк/.test(lower)) {
    tips.push(
      "Подойдут сканы или фото в PDF/JPG: устав, финансовая отчётность за последний год, техническое задание или бизнес-план. Загрузка — в один клик, антивирусная проверка мок."
    );
  }
  if (!tips.length) {
    tips.push("Заполняйте поля по порядку — часть данных система подтянет автоматически по БИН.");
    tips.push("Если точной цифры пока нет — укажите примерную оценку, на предварительном этапе это не критично.");
    tips.push("Обязательные поля отмечены звёздочкой, остальные можно пропустить и вернуться к ним позже.");
  }
  return tips.slice(0, 3);
}

function serviceFacts(service) {
  const card = service.card || {};
  return [
    card.amount && `сумма: ${card.amount}`,
    card.rate && `ставка: ${card.rate}`,
    card.term && `срок: ${card.term}`,
    card.decisionDays && `решение: около ${card.decisionDays} дней`,
  ].filter(Boolean);
}

export default function Assistant({ go, open, prompt, onClose, onOpen }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [greeted, setGreeted] = useState(false);

  const feedRef = useRef(null);
  const textareaRef = useRef(null);
  const servicesRef = useRef(null);
  const lastPromptRef = useRef(null);

  const ensureServices = useCallback(async () => {
    if (!servicesRef.current) {
      servicesRef.current = api
        .services()
        .then((r) => r.services || [])
        .catch(() => []);
    }
    return servicesRef.current;
  }, []);

  const closeAndGo = useCallback(
    (path) => {
      onClose();
      go(path);
    },
    [go, onClose]
  );

  const handleMatch = useCallback(
    async (text) => {
      const services = await ensureServices();
      const byId = new Map(services.map((s) => [s.id, s]));
      let matches = [];
      try {
        const res = await api.aiMatch({ query: text });
        matches = res.matches || [];
      } catch {
        return {
          text: "Не получилось получить подбор с сервера. Попробуйте ещё раз или откройте каталог напрямую.",
          chips: [{ label: "Каталог мер", path: "/catalog" }],
          source: "rules",
        };
      }
      const enriched = matches
        .map((m) => ({ ...m, service: byId.get(m.serviceId) }))
        .filter((m) => m.service);
      const top = enriched.slice(0, 3);
      const maxScore = top.length ? Math.max(...top.map((m) => m.score)) : 0;

      if (!top.length || maxScore < 30) {
        return {
          text: "Пока данных недостаточно для обоснованной рекомендации. Уточните цель финансирования и хотя бы один параметр: отрасль, сумма или тип актива.",
          chips: [
            { label: "Кредит или гарантия", prompt: "Нужен кредит или гарантия для бизнеса" },
            { label: "Лизинг техники", prompt: "Нужен лизинг техники или оборудования" },
            { label: "Открыть каталог", path: "/catalog" },
          ],
          disclaimer: true,
          source: "rules",
        };
      }

      return {
        text: "Смотрите, что нашлось под вашу задачу:",
        matches: top.filter((m) => m.score > 0).map((m) => ({
          serviceId: m.serviceId,
          title: m.service.title,
          org: m.service.org,
          score: m.score,
          reasons: (m.reasons || []).slice(0, 2),
        })),
        disclaimer: true,
        source: "rules",
      };
    },
    [ensureServices, closeAndGo]
  );

  const handleCompare = useCallback(
    async (rawText) => {
      const services = await ensureServices();
      const tokens = tokenize(rawText);
      const ranked = services
        .map((service) => ({ service, score: tokenize(`${service.title} ${(service.tags || []).join(" ")} ${service.kind || ""}`).filter((t) => tokens.some((q) => t.includes(q) || q.includes(t))).length }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map((item) => item.service);
      if (ranked.length < 2) {
        return {
          text: "Чтобы сравнение было честным, назовите две меры или опишите задачу — например: «сравни лизинг вагонов и льготный кредит для покупки техники».",
          chips: [{ label: "Выбрать меры в каталоге", path: "/catalog" }],
          source: "rules",
        };
      }
      const [first, second] = ranked;
      return {
        text: `Сравнение по опубликованным условиям:\n\n${first.title} (${first.org})\n${serviceFacts(first).join("; ") || "числовые условия не указаны"}.\n\n${second.title} (${second.org})\n${serviceFacts(second).join("; ") || "числовые условия не указаны"}.\n\nВыбор зависит от цели и соответствия условиям — это не прогноз одобрения.`,
        matches: [first, second].map((s) => ({ serviceId: s.id, title: s.title, org: s.org, reasons: (s.card?.conditions || []).slice(0, 1) })),
        source: "rules",
      };
    },
    [ensureServices]
  );

  const handleExplain = useCallback(
    async (rawText) => {
      const services = await ensureServices();
      const tokens = tokenize(rawText);
      const svc = findServiceByQuery(services, tokens);
      if (svc) {
        return {
          text: buildExplainText(svc),
          source: "rules",
          ctas: [
            { label: "Начать заявку", primary: true, onClick: () => closeAndGo(`/apply/${svc.id}`) },
            { label: "Открыть карточку услуги", onClick: () => closeAndGo(`/service/${svc.id}`) },
          ],
        };
      }
      const term = findTerm(rawText);
      if (term) {
        return { text: `${term.title}. ${term.text}`, source: "rules" };
      }
      return {
        text: "Не нашёл подходящую услугу или термин по этому запросу. Можно посмотреть весь каталог или уточнить формулировку.",
        chips: [{ label: "Каталог мер", path: "/catalog" }],
        source: "rules",
      };
    },
    [ensureServices, closeAndGo]
  );

  const STATUS_GLOSSARY = {
    "подана": "Заявка принята порталом, подписана ЭЦП и передана через интеграционную шину в профильную организацию.",
    "на рассмотрении": "Заявку изучает профильная дочерняя организация в своей BPM-системе. Ничего делать не нужно — при вопросах менеджер запросит уточнения.",
    "требуются уточнения": "Менеджеру не хватает данных или документов. Откройте заявку в кабинете — в таймлайне написано, что именно нужно дослать.",
    "этап одобрен": "Первичное решение положительное. Если у услуги есть следующий этап, в кабинете появится кнопка «Продолжить оформление» — заполните расширенные данные.",
    "одобрено": "Финальное решение принято, готовится договор. Организация свяжется с вами по контактам из заявки.",
  };

  const buildReply = useCallback(
    async (rawText) => {
      const lower = rawText.toLowerCase();

      if (/статус/.test(lower)) {
        const hit = Object.entries(STATUS_GLOSSARY).find(([k]) => lower.includes(k));
        if (hit) {
          return {
            text: `«${hit[0][0].toUpperCase()}${hit[0].slice(1)}» — ${hit[1]}`,
            chips: [{ label: "Открыть кабинет", onClick: () => closeAndGo("/cabinet") }],
          };
        }
        return {
          text: "Статусы заявки идут по цепочке: подана → на рассмотрении → (требуются уточнения) → этап одобрен → одобрено. Спросите про конкретный статус — объясню, что делать.",
          chips: [{ label: "Открыть кабинет", onClick: () => closeAndGo("/cabinet") }],
        };
      }

      if (APPLY_HELP_HINT.test(lower) || (/шаг/.test(lower) && /заявк/.test(lower))) {
        return { text: "Вот конкретные действия для этого шага:", tips: buildApplyHelpTips(rawText), source: "rules" };
      }

      if (COMPARE_HINT.test(lower)) return handleCompare(rawText);

      if (EXPLAIN_HINT.test(lower)) {
        return handleExplain(rawText);
      }

      if (MATCH_HINT.test(lower)) {
        return handleMatch(rawText);
      }

      return {
        text: "Уточните, пожалуйста, что нужно сделать: подобрать меру, сравнить две программы, объяснить условие или помочь с конкретным полем заявки.",
        chips: [
          { label: "Подобрать меру", prompt: "Подобрать меру поддержки" },
          { label: "Сравнить программы", prompt: "Сравни две подходящие программы" },
          { label: "Помочь с заявкой", prompt: "Помоги с заполнением заявки" },
        ],
        source: "rules",
      };
    },
    [handleExplain, handleMatch, handleCompare, closeAndGo]
  );

  /* LLM-режим (OpenRouter): сервер собирает системный промпт из живых схем конструктора.
     При отсутствии ключа или ошибке — локальный детерминированный движок. */
  const buildLlmReply = useCallback(
    async (history) => {
      const payload = history
        .filter((m) => m.text)
        .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
      const res = await api.aiChat(payload);
      if (!res || res.fallback || !res.text) return null;

      const reply = { text: res.text.replace(/\*\*/g, ""), llm: true, source: "ai" };
      if (res.apply && res.apply.serviceId) {
        reply.apply = res.apply;
      }
      if (res.services && res.services.length) {
        const services = await ensureServices();
        const byId = new Map(services.map((s) => [s.id, s]));
        const matches = res.services
          .map((id) => byId.get(id))
          .filter(Boolean)
          .map((s) => ({ serviceId: s.id, title: s.title, org: s.org, reasons: [] }));
        if (matches.length) {
          reply.matches = matches;
          reply.disclaimer = true;
        }
      }
      return reply;
    },
    [ensureServices]
  );

  const send = useCallback(
    async (text) => {
      const trimmed = (text || "").trim();
      if (!trimmed) return;
      const userMsg = { id: uid(), role: "user", text: trimmed };
      let history = [];
      setMessages((prev) => {
        history = [...prev, userMsg];
        return history;
      });
      setDraft("");
      setTyping(true);
      let reply = null;
      const useDeterministicFlow = COMPARE_HINT.test(trimmed) || APPLY_HELP_HINT.test(trimmed);
      if (!useDeterministicFlow) {
        try {
          reply = await buildLlmReply(history);
        } catch {
          reply = null;
        }
      }
      if (!reply) {
        const delay = 500 + Math.random() * 400;
        [reply] = await Promise.all([buildReply(trimmed), wait(delay)]);
      }
      setTyping(false);
      setMessages((prev) => [...prev, { id: uid(), role: "assistant", ...reply }]);
    },
    [buildLlmReply, buildReply]
  );

  const clearChat = useCallback(() => {
    try { window.localStorage.removeItem(HISTORY_KEY); } catch {}
    setMessages([
      { id: uid(), role: "assistant", text: GREETING, chips: SUGGESTIONS.map((s) => ({ label: s, prompt: s })) },
    ]);
  }, []);

  /* восстановление истории при первом открытии */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        if (Array.isArray(stored) && stored.length) {
          setMessages(stored);
          setGreeted(true);
        }
      }
    } catch {
      // повреждённая история — начнём заново
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* автосохранение: только сериализуемые части (без onClick-замыканий) */
  useEffect(() => {
    if (!messages.length) return;
    try {
      const plain = messages.slice(-40).map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        matches: m.matches,
        tips: m.tips,
        disclaimer: m.disclaimer,
        source: m.source,
        apply: m.apply,
        chips: m.chips?.map(({ label, path, prompt }) => ({ label, path, prompt })),
      }));
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(plain));
    } catch {
      // хранилище недоступно — история живёт в рамках сессии
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    if (!greeted) {
      setMessages([
        {
          id: uid(),
          role: "assistant",
          text: GREETING,
          chips: SUGGESTIONS.map((s) => ({ label: s, prompt: s })),
        },
      ]);
      setGreeted(true);
    }
    const raf = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && prompt && prompt !== lastPromptRef.current) {
      lastPromptRef.current = prompt;
      send(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prompt]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const handleTextareaChange = (e) => {
    setDraft(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(draft);
    }
  };

  if (!open) {
    return (
      <button className="ai-fab" aria-label="Открыть Навигатор ЕППБ" onClick={onOpen}>
        <Bot size={22} />
        <span className="ai-fab-dot" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="ai-panel card" role="dialog" aria-label="Навигатор ЕППБ" aria-modal="false">
      <header className="ai-head">
        <div className="ai-head-title">
          <div className="ai-head-name">
            Навигатор ЕППБ <span className="chip chip-gold">ИИ-помощник</span>
          </div>
          <div className="ai-head-sub">Подбор мер, объяснение условий, помощь с заявкой</div>
        </div>
        <div className="ai-head-actions">
          <button className="ai-icon-btn" aria-label="Очистить диалог" onClick={clearChat}>
            <Trash2 size={16} />
          </button>
          <button className="ai-icon-btn" aria-label="Закрыть Навигатор" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="ai-feed" ref={feedRef}>
        {messages.map((m) => (
          <div key={m.id} className={"ai-msg " + (m.role === "user" ? "ai-msg-user" : "ai-msg-assistant")}>
            <div className="ai-bubble">
              {m.text ? <p>{m.text}</p> : null}
              {m.role === "assistant" && m.source ? (
                <span className={`ai-source ai-source-${m.source}`}>
                  {m.source === "ai" ? "Ответ ИИ по данным портала" : "Проверено правилами портала"}
                </span>
              ) : null}

              {m.tips ? (
                <ul className="ai-tips">
                  {m.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              ) : null}

              {m.matches ? (
                <div className="ai-matches">
                  {m.matches.map((item) => (
                    <div className="ai-match-card" key={item.serviceId}>
                      <div className="spread">
                        <div>
                          <div className="ai-match-title">{item.title}</div>
                          <div className="ai-match-org muted small">{item.org}</div>
                        </div>
                        {Number.isFinite(item.score) ? <span className="chip chip-gold">совпадение {item.score}%</span> : null}
                      </div>
                      {item.reasons?.length ? (
                        <ul className="ai-match-reasons">
                          {item.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      ) : null}
                      <div className="row ai-match-actions">
                        <button className="btn btn-sm" onClick={() => closeAndGo(`/service/${item.serviceId}`)}>
                          Открыть
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => closeAndGo(`/apply/${item.serviceId}`)}
                        >
                          Подать заявку
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {m.apply ? (
                <button
                  className="btn btn-gold ai-apply-btn"
                  onClick={() => {
                    try {
                      const key = `eppb-draft-${m.apply.serviceId}-${m.apply.stageId}`;
                      const cur = JSON.parse(window.localStorage.getItem(key) || "{}");
                      window.localStorage.setItem(key, JSON.stringify({ ...cur, ...m.apply.answers }));
                    } catch {}
                    onClose();
                    go(`/apply/${m.apply.serviceId}`);
                  }}
                >
                  Открыть заявку с моими данными →
                </button>
              ) : null}
              {m.ctas?.length ? (
                <div className="row ai-ctas">
                  {m.ctas.map((c, i) => (
                    <button key={i} className={"btn btn-sm" + (c.primary ? " btn-primary" : "")} onClick={c.onClick}>
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {m.chips?.length ? (
                <div className="ai-chips">
                  {m.chips.map((c, i) => (
                    <button key={i} className="chip chip-line ai-chip" onClick={c.onClick || (() => c.path ? closeAndGo(c.path) : c.prompt ? send(c.prompt) : null)}>
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {m.disclaimer ? <p className="ai-disclaimer">{DISCLAIMER}</p> : null}
            </div>
          </div>
        ))}

        {typing ? (
          <div className="ai-msg ai-msg-assistant">
            <div className="ai-bubble ai-typing" aria-label="Навигатор печатает">
              <span className="ai-typing-dot" />
              <span className="ai-typing-dot" />
              <span className="ai-typing-dot" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="ai-input-row">
        <textarea
          ref={textareaRef}
          className="ai-textarea"
          rows={1}
          value={draft}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Спросите про меры поддержки, условия или заявку…"
          aria-label="Сообщение Навигатору"
        />
        <button
          className="ai-send"
          aria-label="Отправить сообщение"
          onClick={() => send(draft)}
          disabled={!draft.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
