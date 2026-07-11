// ЕППБ — серверный стор (мок-бэкенд). Чистый ESM, без JSX.
// Состояние живёт в globalThis, чтобы переживать hot-reload в dev-режиме Next.js.

import { seedServices } from "../src/data/seedServices.js";
import { dictionaries } from "../src/data/dictionaries.js";
import { evalRule } from "../src/engine/formula.js";

// ---------- ошибки ----------

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---------- инициализация состояния ----------

const REF_DATE = new Date(2026, 6, 1); // «до 2026-07» — фиксированная точка отсчёта возраста компании

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(title) {
  const map = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  const translit = String(title || "service")
    .toLowerCase()
    .split("")
    .map((ch) => (map[ch] !== undefined ? map[ch] : ch))
    .join("");
  const slug = translit
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `service-${Date.now()}`;
}

function createInitialState() {
  const services = new Map();
  for (const svc of seedServices) {
    services.set(svc.id, { ...svc });
  }

  const applications = new Map();
  const integrationLog = [];
  const notifications = [];

  const state = {
    services,
    applications,
    notifications,
    integrationLog,
    appCounter: 1040,
    notifCounter: 0,
    logCounter: 0,
  };

  seedDemoData(state);
  return state;
}

function getState() {
  if (!globalThis.__eppbStore) {
    globalThis.__eppbStore = createInitialState();
  }
  return globalThis.__eppbStore;
}

// ---------- вспомогательные генераторы ----------

function nextAppNumber(state) {
  state.appCounter += 1;
  return `EPPB-2026-${String(state.appCounter).padStart(6, "0")}`;
}

function pushLog(state, entry) {
  state.logCounter += 1;
  const item = { id: `log-${state.logCounter}`, date: nowIso(), ok: true, ...entry };
  state.integrationLog.push(item);
  return item;
}

function pushNotification(state, { appId = null, title, text }) {
  state.notifCounter += 1;
  const item = {
    id: `ntf-${state.notifCounter}`,
    appId,
    title,
    text,
    date: nowIso(),
    read: false,
  };
  state.notifications.push(item);
  return item;
}

function collectDocuments(answers) {
  const docs = [];
  const seen = new Set();
  const consider = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(consider);
      return;
    }
    if (typeof value.name === "string" && (typeof value.size === "number" || typeof value.size === "string")) {
      const key = `${value.name}:${value.size}`;
      if (seen.has(key)) return;
      seen.add(key);
      docs.push({
        name: value.name,
        size: value.size,
        status: "verified",
        signedBy: "ЭЦП (мок)",
      });
    }
  };
  Object.values(answers || {}).forEach(consider);
  return docs;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

// ---------- статусный конвейер заявки ----------

const STATUS_CHAIN = ["submitted", "review", "info_requested", "stage_approved", "approved"];

function statusLabelFor(app, service, status, nextStage) {
  const org = service?.org || "оператора программы";
  switch (status) {
    case "submitted":
      return `Заявка принята. Передаётся в ${org}`;
    case "review":
      return `На рассмотрении в ${org}`;
    case "info_requested":
      return "Требуются уточнения";
    case "stage_approved":
      return nextStage ? "Одобрено. Заполните следующий этап" : "Этап одобрен";
    case "approved":
      return "Одобрено. Договор готовится";
    default:
      return "";
  }
}

function findNextStage(service, currentStageId) {
  if (!service?.stages?.length) return null;
  const idx = service.stages.findIndex((s) => s.id === currentStageId);
  if (idx === -1 || idx + 1 >= service.stages.length) return null;
  const next = service.stages[idx + 1];
  return { id: next.id, title: next.title };
}

// ---------- сидовые данные ----------

function seedDemoData(state) {
  const service = state.services.get("agro-livestock");
  const org = service?.org || "Аграрная кредитная корпорация";
  const stage = service?.stages?.[0];
  const id = "EPPB-2026-001041";
  const createdAt = new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString();
  const timeline = [
    { date: createdAt, title: "Заявка подана", text: "Заявка сформирована заявителем в личном кабинете", kind: "user" },
    { date: createdAt, title: "Подписано ЭЦП", text: "Комплект документов подписан электронной цифровой подписью (мок)", kind: "system" },
    { date: createdAt, title: "Передано в интеграционную шину", text: "Пакет заявки отправлен через ESB", kind: "system" },
    {
      date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      title: `Принято BPM ${org}`,
      text: `Заявка зарегистрирована в BPM-системе «${org}» и передана на рассмотрение`,
      kind: "org",
    },
  ];
  state.applications.set(id, {
    id,
    serviceId: service?.id || "agro-livestock",
    serviceTitle: service?.title || "Кредитование АПК",
    org,
    stageId: stage?.id || "prescreening",
    stageTitle: stage?.title || "Предварительная заявка",
    status: "review",
    statusLabel: `На рассмотрении в ${org}`,
    answers: {
      companyName: "КХ «Алтын Дала»",
      bin: "010203040506",
      amount: 42000000,
    },
    documents: [
      { name: "ustav.pdf", size: 184320, status: "verified", signedBy: "ЭЦП (мок)" },
      { name: "finotchet_2025.xlsx", size: 92160, status: "verified", signedBy: "ЭЦП (мок)" },
    ],
    timeline,
    nextStage: null,
    createdAt,
    updatedAt: timeline[timeline.length - 1].date,
    applicant: { name: "Серик Байжанов", phone: "+7 701 555 12 34" },
  });
  state.appCounter = 1041;

  pushLog(state, { gateway: "esb", event: `Пакет заявки ${id} передан из ESB в BPM ${org}`, appId: id });
  pushLog(state, { gateway: "bpm_damu", event: `Заявка ${id} зарегистрирована в BPM «${org}»`, appId: id });
  pushLog(state, { gateway: "gbdul", event: "Синхронизация реестра ГБД ЮЛ выполнена успешно" });
  pushLog(state, { gateway: "eds", event: "Проверка сертификата ЭЦП пройдена" });

  pushNotification(state, {
    appId: id,
    title: "Заявка принята к рассмотрению",
    text: `Заявка ${id} на «${service?.title || "Кредитование АПК"}» передана в ${org}`,
  });
  pushNotification(state, {
    appId: null,
    title: "Добро пожаловать в ЕППБ",
    text: "В каталоге доступно 6 мер поддержки. Подберите подходящую с помощью AI-помощника.",
  });
}

// ---------- УСЛУГИ ----------

export function listServices() {
  const state = getState();
  return Array.from(state.services.values());
}

export function getService(id) {
  const state = getState();
  const svc = state.services.get(id);
  if (!svc) throw new ApiError(404, `Услуга «${id}» не найдена`);
  return svc;
}

export function saveService(schema) {
  if (!schema || typeof schema !== "object") {
    throw new ApiError(400, "Некорректная схема услуги");
  }
  const state = getState();
  const id = schema.id || slugify(schema.title);
  const existing = state.services.get(id);
  const saved = {
    ...existing,
    ...schema,
    id,
    status: schema.status || existing?.status || "draft",
    version: (existing?.version || 0) + 1,
    updatedAt: todayIso(),
  };
  state.services.set(id, saved);
  return saved;
}

export function publishService(id) {
  const state = getState();
  const svc = state.services.get(id);
  if (!svc) throw new ApiError(404, `Услуга «${id}» не найдена`);
  svc.status = "published";
  svc.updatedAt = todayIso();
  state.services.set(id, svc);
  return { status: "published" };
}

// ---------- КОМПАНИЯ (мок eGov / ГБД ЮЛ) ----------

const COMPANY_NAMES = [
  "ТОО «Астана Логистикс»", "КХ «Алтын Дала»", "ТОО «QazTrade Group»", "ТОО «Жетысу Агро»",
  "АО «Каспий Индастриз»", "ТОО «Меридиан Строй»", "ИП Сейтжанов Б.К.", "ТОО «Сарыарка Инвест»",
  "ТОО «Достык Транс»", "КХ «Нура Фермер»", "ТОО «Байтерек Девелопмент»", "АО «Ертыс Металл»",
  "ТОО «Silk Road Trade»", "ТОО «Актобе Агрохолдинг»", "ТОО «Есіл Құрылыс»", "ИП Тлеубердиева А.С.",
  "ТОО «Оркен Пласт»", "АО «Тараз Химпром»", "ТОО «Green Fields KZ»", "ТОО «Улытау Ресурс»",
];

const COMPANY_CEOS = [
  "Аскар Жумабеков", "Гульнара Сатыбалдиева", "Ерлан Тлеубердиев", "Айгерим Нурланова",
  "Талгат Оспанов", "Дана Кенжегалиева", "Бекзат Абенов", "Жанна Мухамедиева",
  "Нурлан Сарсенбаев", "Асель Дюсенова", "Марат Калиев", "Сауле Ибраева",
  "Данияр Ахметов", "Гаухар Тастанбекова", "Серик Байжанов", "Алия Смагулова",
  "Ринат Утегенов", "Мадина Жаксыбекова", "Олжас Байтасов", "Айнур Кульжанова",
];

const COMPANY_ACTIVITIES = [
  { activity: "Выращивание зерновых культур", okedCode: "01.11" },
  { activity: "Разведение крупного рогатого скота", okedCode: "01.41" },
  { activity: "Производство молочных продуктов", okedCode: "10.51" },
  { activity: "Грузовые перевозки автомобильным транспортом", okedCode: "49.41" },
  { activity: "Складирование и хранение грузов", okedCode: "52.10" },
  { activity: "Строительство жилых и нежилых зданий", okedCode: "41.20" },
  { activity: "Производство готовых металлических изделий", okedCode: "25.11" },
  { activity: "Оптовая торговля непродовольственными товарами", okedCode: "46.90" },
  { activity: "Производство хлебобулочных изделий", okedCode: "10.71" },
  { activity: "Добыча и обогащение руд цветных металлов", okedCode: "07.29" },
  { activity: "Разработка программного обеспечения", okedCode: "62.01" },
  { activity: "Гостиницы и места для временного проживания", okedCode: "55.10" },
  { activity: "Производство текстильных изделий", okedCode: "13.20" },
  { activity: "Ремонт и техническое обслуживание машин и оборудования", okedCode: "33.12" },
  { activity: "Производство изделий из бетона для строительства", okedCode: "23.61" },
];

export function getCompany(bin) {
  const clean = String(bin || "").trim();
  if (!/^\d{12}$/.test(clean)) {
    throw new ApiError(400, "Некорректный БИН — требуется 12 цифр");
  }
  const digits = clean.split("").map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  const product = digits.reduce((a, b) => a * (b || 1), 1);

  const nameIdx = sum % COMPANY_NAMES.length;
  const regionIdx = (sum * 7 + 3) % dictionaries.regions.length;
  const activityIdx = (sum * 13 + 5) % COMPANY_ACTIVITIES.length;
  const ceoIdx = (product * 17 + sum * 11) % COMPANY_CEOS.length;

  const year = 2005 + (sum % 20);
  const month = ((sum * 3 + 7) % 12) + 1;
  const day = ((sum * 5 + 11) % 28) + 1;
  const registeredAt = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  let ageMonths = (REF_DATE.getFullYear() - year) * 12 + (REF_DATE.getMonth() + 1 - month);
  if (ageMonths < 0) ageMonths = 0;

  const region = dictionaries.regions[regionIdx];
  const { activity, okedCode } = COMPANY_ACTIVITIES[activityIdx];

  return {
    verified: true,
    company: {
      bin: clean,
      name: COMPANY_NAMES[nameIdx],
      region: region.label,
      activity,
      okedCode,
      registeredAt,
      ageMonths,
      ceo: COMPANY_CEOS[ceoIdx],
    },
  };
}

// ---------- ELIGIBILITY ----------

export function checkEligibility(serviceId, answers) {
  const service = getService(serviceId);
  const rules = service.rules || [];
  const ctx = { ...(answers || {}), companyAgeMonths: (answers && answers.companyAgeMonths) || 0 };

  const checks = rules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: evalRule(rule.expr, ctx),
    level: rule.level || "error",
  }));

  const eligible = checks.filter((c) => c.level === "error").every((c) => c.passed);

  let weightedTotal = 0;
  let weightedPassed = 0;
  checks.forEach((c) => {
    const weight = c.level === "error" ? 2 : 1;
    weightedTotal += weight;
    if (c.passed) weightedPassed += weight;
  });
  const score = weightedTotal === 0 ? 100 : Math.round((weightedPassed / weightedTotal) * 100);

  return { eligible, score, checks };
}

// ---------- ЗАЯВКИ ----------

export function listApplications() {
  const state = getState();
  return Array.from(state.applications.values()).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}

export function getApplication(id) {
  const state = getState();
  const app = state.applications.get(id);
  if (!app) throw new ApiError(404, `Заявка «${id}» не найдена`);
  return app;
}

export function createApplication({ serviceId, stageId, answers, applicant }) {
  const state = getState();
  const service = getService(serviceId);
  const stage = service.stages?.find((s) => s.id === stageId) || service.stages?.[0];
  const id = nextAppNumber(state);
  const now = nowIso();

  const documents = collectDocuments(answers);

  const timeline = [
    { date: now, title: "Заявка подана", text: `Заявка на «${service.title}» сформирована и отправлена заявителем`, kind: "user" },
    { date: now, title: "Подписано ЭЦП", text: "Комплект документов подписан электронной цифровой подписью (мок, НУЦ РК)", kind: "system" },
    { date: now, title: "Передано в интеграционную шину", text: "Пакет заявки маршрутизирован через ESB в BPM оператора", kind: "system" },
  ];

  const app = {
    id,
    serviceId: service.id,
    serviceTitle: service.title,
    org: service.org,
    stageId: stage?.id || "prescreening",
    stageTitle: stage?.title || "Предварительная заявка",
    status: "submitted",
    statusLabel: statusLabelFor(null, service, "submitted", null),
    answers: { ...(answers || {}) },
    documents,
    timeline,
    nextStage: null,
    createdAt: now,
    updatedAt: now,
    applicant: applicant || null,
  };

  state.applications.set(id, app);

  pushLog(state, { gateway: "esb", event: `Пакет заявки ${id} передан из ESB в BPM ${service.org}`, appId: id });
  pushLog(state, {
    gateway: service.org && (service.org.toLowerCase().includes("промышленности") || service.org.toLowerCase().includes("брк")) ? "bpm_frp" : "bpm_damu",
    event: `Заявка ${id} зарегистрирована в BPM «${service.org}»`,
    appId: id,
  });

  pushNotification(state, {
    appId: id,
    title: "Заявка принята",
    text: `Заявка ${id} на «${service.title}» передана в ${service.org}`,
  });

  return app;
}

export function advanceApplication(id) {
  const state = getState();
  const app = getApplication(id);
  const service = state.services.get(app.serviceId);

  if (app.status === "approved" || app.status === "rejected") {
    return app;
  }

  const currentIdx = STATUS_CHAIN.indexOf(app.status);
  const nextStatus = STATUS_CHAIN[currentIdx + 1] || "approved";
  const now = nowIso();

  if (nextStatus === "review") {
    app.timeline.push({
      date: now,
      title: `Принято BPM ${service?.org || app.org}`,
      text: `Заявка зарегистрирована в BPM-системе «${service?.org || app.org}» и передана эксперту на рассмотрение`,
      kind: "org",
    });
    app.status = "review";
    app.statusLabel = statusLabelFor(app, service, "review", null);
    pushNotification(state, { appId: id, title: "Заявка на рассмотрении", text: `${id}: ${app.statusLabel}` });
  } else if (nextStatus === "info_requested") {
    app.timeline.push({
      date: now,
      title: "Запрошены уточнения",
      text: `Менеджер ${service?.org || app.org} запросил уточнение по обеспечению сделки — приложите дополнительный документ и актуальную финансовую отчётность`,
      kind: "org",
    });
    app.status = "info_requested";
    app.statusLabel = statusLabelFor(app, service, "info_requested", null);
    pushNotification(state, {
      appId: id,
      title: "Требуются уточнения",
      text: `По заявке ${id} запрошены дополнительные документы`,
    });
  } else if (nextStatus === "stage_approved") {
    const nextStage = findNextStage(service, app.stageId);
    app.timeline.push({
      date: now,
      title: "Этап одобрен",
      text: nextStage
        ? `Этап «${app.stageTitle}» одобрен. Доступен следующий этап «${nextStage.title}»`
        : `Этап «${app.stageTitle}» одобрен`,
      kind: "org",
    });
    app.status = "stage_approved";
    app.nextStage = nextStage;
    app.statusLabel = statusLabelFor(app, service, "stage_approved", nextStage);
    pushNotification(state, {
      appId: id,
      title: nextStage ? "Этап одобрен" : "Заявка одобрена",
      text: nextStage
        ? `Перейдите к этапу «${nextStage.title}» по заявке ${id}`
        : `Этап по заявке ${id} одобрен`,
    });
  } else {
    app.timeline.push({
      date: now,
      title: "Заявка одобрена",
      text: `Итоговое решение по заявке ${id} положительное. ${service?.org || app.org} готовит договор`,
      kind: "org",
    });
    app.status = "approved";
    app.nextStage = null;
    app.statusLabel = statusLabelFor(app, service, "approved", null);
    pushNotification(state, { appId: id, title: "Заявка одобрена", text: `${id}: договор готовится к подписанию` });
  }

  app.updatedAt = now;
  state.applications.set(id, app);
  return app;
}

export function submitStage(id, { stageId, answers }) {
  const state = getState();
  const app = getApplication(id);
  const service = state.services.get(app.serviceId);
  const stage = service?.stages?.find((s) => s.id === stageId);
  const now = nowIso();

  app.answers = { ...app.answers, ...(answers || {}) };
  const newDocs = collectDocuments(answers);
  const existingKeys = new Set(app.documents.map((d) => `${d.name}:${d.size}`));
  newDocs.forEach((d) => {
    const key = `${d.name}:${d.size}`;
    if (!existingKeys.has(key)) {
      app.documents.push(d);
      existingKeys.add(key);
    }
  });

  app.stageId = stageId || app.stageId;
  app.stageTitle = stage?.title || app.stageTitle;
  app.status = "review";
  app.nextStage = null;
  app.statusLabel = statusLabelFor(app, service, "review", null);

  app.timeline.push({
    date: now,
    title: `Этап «${app.stageTitle}» отправлен`,
    text: `Данные этапа переданы в ${service?.org || app.org} на рассмотрение`,
    kind: "user",
  });
  app.updatedAt = now;

  state.applications.set(id, app);

  pushLog(state, { gateway: "esb", event: `Этап «${app.stageTitle}» заявки ${id} передан в BPM`, appId: id });
  pushNotification(state, {
    appId: id,
    title: "Этап отправлен",
    text: `Этап «${app.stageTitle}» по заявке ${id} передан на рассмотрение`,
  });

  return app;
}

// ---------- AI-ПОДБОР ----------

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

const SECTOR_LABELS = Object.fromEntries(dictionaries.sectors.map((s) => [s.value, s.label]));

export function aiMatch({ query, profile } = {}) {
  const state = getState();
  const published = Array.from(state.services.values()).filter((s) => s.status === "published");
  const tokens = tokenize(query);

  const scored = published.map((service) => {
    let score = 0;
    const reasons = [];
    const haystack = {
      title: (service.title || "").toLowerCase(),
      summary: (service.summary || "").toLowerCase(),
      tags: (service.tags || []).map((t) => t.toLowerCase()),
      kind: (service.kind || "").toLowerCase(),
      org: (service.org || "").toLowerCase(),
    };

    const matchedTitle = new Set();
    const matchedTags = new Set();
    tokens.forEach((tok) => {
      if (haystack.title.includes(tok)) {
        score += 18;
        matchedTitle.add(tok);
      }
      const tagHit = haystack.tags.find((t) => t.includes(tok));
      if (tagHit) {
        score += 15;
        matchedTags.add(tagHit);
      }
      if (haystack.summary.includes(tok)) score += 6;
      if (haystack.kind.includes(tok)) {
        score += 10;
        matchedTags.add(service.kind);
      }
      if (haystack.org.includes(tok)) score += 4;
    });
    if (matchedTitle.size || matchedTags.size) {
      const words = [...new Set([...matchedTitle, ...matchedTags])].slice(0, 4);
      reasons.push(`Совпадение по запросу: ${words.join(", ")}`);
    }

    if (profile?.sector) {
      const sectorLabel = SECTOR_LABELS[profile.sector] || profile.sector;
      if (service.category === profile.sector || haystack.tags.some((t) => t.includes(sectorLabel.toLowerCase()))) {
        score += 22;
        reasons.push(`Категория подходит для сектора «${sectorLabel}»`);
      }
    }

    if (profile?.size) {
      const sizeMap = { small: "малый бизнес", medium: "средний бизнес", large: "крупный бизнес" };
      const sizeLabel = sizeMap[profile.size] || profile.size;
      if (haystack.tags.some((t) => t.includes(sizeLabel.split(" ")[0]))) {
        score += 12;
        reasons.push(`Подходит для сегмента «${sizeLabel}»`);
      }
    }

    if (profile?.need) {
      const needLabel = String(profile.need);
      if (haystack.kind.includes(needLabel.toLowerCase()) || haystack.tags.some((t) => t.includes(needLabel.toLowerCase()))) {
        score += 18;
        reasons.push(`Соответствует запросу: «${needLabel}»`);
      }
    }

    if (!tokens.length && !profile?.sector && !profile?.size && !profile?.need) {
      score += 30;
      reasons.push("Популярная мера поддержки в каталоге");
    }

    return { serviceId: service.id, score: Math.max(0, Math.min(100, score)), reasons };
  });

  return {
    matches: scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((m) => ({ ...m, reasons: m.reasons.length ? m.reasons : ["Подобрано по общим параметрам запроса"] })),
  };
}

// ---------- ИНТЕГРАЦИИ ----------

const GATEWAYS = [
  { id: "egov_idp", name: "eGov IDP" },
  { id: "gbdul", name: "ГБД ЮЛ" },
  { id: "eds", name: "НУЦ ЭЦП" },
  { id: "esb", name: "Интеграционная шина" },
  { id: "bpm_damu", name: "BPM Даму" },
  { id: "bpm_frp", name: "BPM Фонд развития промышленности" },
  { id: "crm", name: "Единая CRM" },
];

export function getIntegrations() {
  const state = getState();
  const now = Date.now();

  const gateways = GATEWAYS.map((g) => {
    const h = hashStr(g.id);
    const latencyMs = 40 + (h % 260);
    const minutesAgo = h % 50;
    return {
      id: g.id,
      name: g.name,
      status: "online",
      latencyMs,
      lastSync: new Date(now - minutesAgo * 60 * 1000).toISOString(),
    };
  });

  const events = [...state.integrationLog]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12);

  return { gateways, events };
}

// ---------- УВЕДОМЛЕНИЯ ----------

export function listNotifications() {
  const state = getState();
  return [...state.notifications].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ---------- HEALTH ----------

export function health() {
  const state = getState();
  return { status: "ok", services: state.services.size, mode: "mock-integrations" };
}
