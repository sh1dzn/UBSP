# ЕППБ — Контракт модулей (единый источник правды)

Платформа: «Единый портал поддержки бизнеса» (ЕППБ), группа АО «НУХ «Байтерек».
Стек: Next.js 15 (App Router), React 18, JSX без TypeScript, lucide-react. Фронт и бэк — одно приложение: страницы в `app/*/page.jsx` (тонкие обёртки, УЖЕ созданы), API — route handlers в `app/api/**/route.js`.
Язык интерфейса: русский. Валюта: ₸ (KZT).
ВАЖНО: каждый файл-компонент модуля начинается с директивы `"use client";`. Модули данных/логики (`src/data/*`, `src/engine/formula.js` и т.п.) — обычные ESM без JSX, импортируются и клиентом, и сервером.

## 1. Ключевая идея архитектуры

Услуга = JSON-схема (Service Definition). Ничего не хардкодится в компонентах:
- `FormRunner` рендерит ЛЮБУЮ услугу из схемы (шаги, ветвления, расчёты, предзаполнение, документы);
- админ-конструктор редактирует и публикует те же схемы через API;
- каталог, карточка услуги, AI-помощник — читают те же схемы.

## 2. Схема услуги (Service Definition)

```js
{
  id: "wagons-leasing",            // slug, латиница
  title: "Приобретение вагонов в лизинг",
  org: "БРК-Лизинг",               // дочерняя организация
  orgShort: "БРК-Лизинг",
  kind: "Лизинг",                  // Лизинг | Кредитование | Гарантирование | Субсидирование | Страхование | Инвестиции | Экспорт
  category: "transport",           // ключ из dictionaries.categories
  audience: ["ТОО", "АО", "ИП"],
  tags: ["Транспорт", "Средний бизнес"],
  summary: "1–2 предложения для карточки в каталоге",
  status: "published",             // published | draft | archived
  version: 3,
  updatedAt: "2026-07-01",
  complexity: "complex",           // simple | complex — сложная = многоэтапная
  card: {                          // карточка услуги (страница)
    amount: "до 85% стоимости",
    term: "до 15 лет",
    rate: "от 9,5% годовых",
    decisionDays: 20,
    benefits: ["..."],             // 3-5 пунктов
    conditions: ["..."],           // требования к заявителю
    documents: ["..."],            // список документов
    faq: [{ q: "...", a: "..." }],
    resultText: "Что получит предприниматель в итоге"
  },
  stages: [                        // многоэтапность! stage 1 — первичная заявка, stage 2+ — расширенные данные
    {
      id: "prescreening",
      title: "Предварительная заявка",
      description: "Экспресс-оценка проекта, решение за 5 дней",
      steps: [
        {
          id: "applicant",
          title: "О компании",
          hint: "Данные подтянем из реестра по БИН",
          fields: [ /* Field[] — см. ниже */ ]
        }
      ]
    },
    { id: "full", title: "Полная заявка", description: "...", steps: [...] }
  ],
  rules: [                         // проверки соответствия (eligibility) — вычисляются на клиенте и сервере
    { id: "advance", label: "Аванс не ниже 15%", expr: "pct(own, amount) >= 15", level: "error" },
    { id: "age", label: "Компания старше 12 месяцев", expr: "companyAgeMonths >= 12", level: "warning" }
  ]
}
```

### Field (поле формы)

```js
{
  id: "amount",                    // уникален в рамках услуги; ответы живут в плоском объекте answers[id]
  type: "money",                   // см. типы ниже
  label: "Стоимость вагонов",
  hint: "Подсказка под полем (человеческим языком)",
  placeholder: "",
  required: true,
  when: { /* Condition — поле видно только если условие истинно */ },
  prefill: "company.name",         // путь в объекте профиля/компании из мока eGov
  dictionary: "regions",           // ключ справочника (для select) — из dictionaries.js
  options: [{ value: "new", label: "Новые вагоны" }],  // для select/radio, если не dictionary
  compute: "amount - own",         // формула для type:"calc" (readonly, живой пересчёт)
  format: "money",                 // money | percent | number — для calc
  validate: { min: 1, max: 9e12, pattern: "^\\d{12}$", message: "..." },
  cols: 6                          // ширина в 12-колоночной сетке (по умолчанию 12)
}
```

Типы полей (обязаны поддерживаться FormRunner и конструктором):
`text`, `textarea`, `number`, `money`, `percent`, `select`, `radio`, `checkbox` (boolean),
`checklist` (мультивыбор), `date`, `bin` (12 цифр + кнопка «Проверить в реестре» → api.company),
`iin`, `phone`, `file` (мок-загрузка: имя+размер, virus-check мок), `calc` (readonly формула),
`info` (текстовый блок-подсказка без ввода), `repeater` (опционально: список однотипных строк).

### Condition (условие видимости / ветвления)

```js
{ field: "wagonState", op: "eq", value: "used" }
// комбинаторы:
{ all: [c1, c2] } | { any: [c1, c2] } | { not: c1 }
// op: eq, neq, gt, gte, lt, lte, in (value: массив), truthy, falsy
```

### Формулы compute / rules.expr

Мини-язык: идентификаторы = id полей (числа; нечисло → 0), литералы, `+ - * / ( )`,
функции: `pct(part, whole)` → проценты (1 знак), `min(a,b)`, `max(a,b)`, `round(x)`,
`annuity(principal, ratePercentYear, months)` → месячный платёж.
Реализация: безопасный рекурсивный парсер в `src/engine/formula.js` (НИКАКОГО eval/Function).
Контекст rules дополнительно получает `companyAgeMonths` из проверки БИН.

## 3. Файловая структура (каждый агент пишет ТОЛЬКО свои файлы)

```
app/layout.jsx, app/**/page.jsx, src/shell/*           — shell и обёртки страниц (УЖЕ написаны, не трогать)
src/api.js                                             — клиент API (УЖЕ написан, не трогать)
src/styles/tokens.css, base.css, shell.css             — дизайн-система (не трогать)
src/engine/formula.js, conditions.js, validate.js      — агент Engine (чистый ESM, без JSX и "use client")
src/engine/FormRunner.jsx, fields.jsx, engine.css      — агент Engine ("use client")
src/data/dictionaries.js                               — агент Data (чистый ESM)
src/data/seedServices.js                               — агент Data (схемы 2 контрольных услуг + 6 карточек published)
src/data/projects.js, reports.js, tools.js             — агент Data (чистый ESM)
server/store.js + app/api/**/route.js                  — агент Server
src/views/Home.jsx, Catalog.jsx, Service.jsx, public.css        — агент Public
src/views/Apply.jsx, Cabinet.jsx, cabinet.css                   — агент Cabinet
src/views/admin/Admin.jsx, Constructor.jsx, admin.css           — агент Admin
src/views/MapPage.jsx, Reports.jsx, Tools.jsx, modules.css      — агент Modules
src/ai/Assistant.jsx, assistant.css                             — агент AI
```

CSS: у каждого модуля свой файл, классы с префиксом модуля (`fr-` engine, `pub-`, `cab-`, `adm-`, `mod-`, `ai-`). Все CSS-файлы уже импортированы в app/layout.jsx. Общие компоненты — только классы из base.css.

## 4. API (app/api/**/route.js ↔ src/api.js)

Бэкенд = Next route handlers. Всё состояние — в `server/store.js`, кэшируется через `globalThis.__eppbStore` (переживает hot-reload). Сид услуг: `import { seedServices } from "../src/data/seedServices.js"` (чистый ESM). Каждый route.js — тонкий: парсит запрос, зовёт функцию store, возвращает `Response.json(...)`. Динамические параметры Next 15: `const { id } = await params;` (params — Promise). У всех route.js: `export const dynamic = "force-dynamic";`.

- `GET  /services` → `{ services: ServiceDef[] }` (все, включая draft — фильтрует клиент)
- `GET  /services/:id` → ServiceDef
- `POST /services` (создать/обновить схему из конструктора) → сохранённая схема, version++
- `POST /services/:id/publish` → `{ status: "published" }`
- `GET  /company/:bin` — мок eGov: 12 цифр → `{ verified, company: { bin, name, region, activity, okedCode, registeredAt, ageMonths, ceo } }`. Разные БИН → разные детерминированные компании (генерация из цифр БИН). Невалидный → 400.
- `POST /eligibility` `{ serviceId, answers }` → `{ eligible, score, checks: [{id,label,passed,level}] }` — считает rules схемы.
- `POST /applications` `{ serviceId, stageId, answers, applicant }` → Application (см. ниже), статус `submitted`, номер `EPPB-2026-XXXXXX`, audit-события интеграций (ЭЦП мок, шина, передача в BPM ДО).
- `GET  /applications` → `{ applications: Application[] }`
- `GET  /applications/:id` → Application
- `POST /applications/:id/advance` — демо-кнопка «симулировать решение BPM»: двигает статус по цепочке, генерирует уведомление; когда статус = `stage_approved` и у услуги есть следующий stage — заявка получает `nextStage`.
- `POST /applications/:id/stage` `{ stageId, answers }` — досдача этапа 2.
- `POST /ai/match` `{ query | profile }` → `{ matches: [{ serviceId, score, reasons: [".."] }] }` — скоринг по тегам/категориям/аудитории схем.
- `GET  /integrations` → статус шлюзов: egov_idp, gbdul, eds, esb, bpm_damu, bpm_brk, crm — `{ id, name, status: "online", latencyMs, lastSync }` + журнал последних событий.
- `GET  /notifications` → `{ notifications: [{ id, appId, title, text, date, read }] }`

### Application

```js
{
  id: "EPPB-2026-001284",
  serviceId, serviceTitle, org,
  stageId, stageTitle,
  status: "submitted",   // submitted → review → info_requested? → stage_approved → next stage... → approved | rejected
  statusLabel: "На рассмотрении в БРК-Лизинг",
  answers: {...},
  documents: [{ name, size, status: "verified", signedBy: "ЭЦП (мок)" }],
  timeline: [{ date, title, text, kind: "system|org|user" }],
  nextStage: { id, title } | null,
  createdAt, updatedAt
}
```

## 5. Роутер и глобальный контекст (уже в src/shell — использовать как есть)

Маршруты: `/`, `/catalog`, `/service/[id]`, `/apply/[id]?app=<applicationId>&stage=<stageId>`,
`/cabinet`, `/map`, `/reports`, `/tools`, `/admin`.
Каждый компонент страницы получает пропсы: `{ go(path), route: { path, params, query }, notify(title, text), openAssistant(prompt?) }` — их прокидывает PageHost. Навигация ТОЛЬКО через `go("/service/wagons-leasing")` (внутри — router.push).
`Assistant` монтируется в PortalShell глобально (плавающая кнопка + панель), получает `{ go, open, prompt, onClose, onOpen }`.

## 6. Дизайн-система (обязательно к соблюдению)

Токены — только CSS-переменные из tokens.css: `--paper --card --ink --muted --line --sky --sky-deep --sky-soft --gold --gold-soft --green --green-soft --amber --amber-soft --red --red-soft --r --r-lg --shadow`.
Шрифты: `var(--font-ui)` (Golos Text) для всего; `var(--font-mono)` (JetBrains Mono) — ТОЛЬКО для номеров заявок, БИН, статус-кодов, сумм в реестровых таблицах, меток данных.
Готовые классы base.css: `.btn .btn-primary .btn-ghost .btn-gold`, `.chip`, `.chip-gold`, `.chip-green`, `.card`, `.input .select .textarea`, `.label`, `.eyebrow`, `.mono`, `.rail .rail-node .rail-node.done .rail-node.active` (сигнатурный мотив «маршрут»), `.container` (max-width 1200), `.status-dot`.
Принципы: границы 1px вместо теней, сдержанность, золото — только акцент (активная точка маршрута, ключевые CTA-детали, ярлыки «популярное»). Никаких фиолетовых градиентов, глассморфизма, эмодзи в UI. Иконки — lucide-react, размер 16–20.
Сигнатура портала — «маршрут предпринимателя»: горизонтальная линия со станциями (класс .rail). Используется: hero главной, прогресс шагов FormRunner, таймлайн заявки в кабинете.

## 7. Качество

- Реальный, конкретный русский копирайтинг (не lorem, не «инновационные решения»). Числа и условия — правдоподобные для мер Байтерека.
- Пустые состояния и ошибки — с действием («Заявок пока нет — подберите меру поддержки»).
- Клавиатурный фокус видим (base.css уже задаёт), reduced motion уважается.
- Никаких внешних зависимостей кроме уже установленных (react, lucide-react).
- JSX без TypeScript-аннотаций.
