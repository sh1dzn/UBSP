// @ts-nocheck
"use client";

// This file intentionally keeps the existing prototype's dense component surface
// together while the migration lands. New server-facing code is fully typed.

import React, { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { portalApi } from "../lib/api-client";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Building2,
  Calculator,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Database,
  FileCheck2,
  FileText,
  Filter,
  FolderOpen,
  Globe2,
  GripVertical,
  Home,
  Landmark,
  LayoutDashboard,
  Map,
  Menu,
  MessageCircle,
  PackagePlus,
  PanelLeft,
  Plus,
  Rocket,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrainFront,
  Upload,
  UserRound,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";

const services = [
  {
    id: "wagons",
    icon: TrainFront,
    title: "Приобретение вагонов в лизинг",
    org: "КазАгроФинанс",
    type: "Лизинг",
    term: "до 7 лет",
    amount: "до 85% стоимости",
    desc: "Финансирование приобретения грузовых вагонов для перевозки продукции.",
    tags: ["Транспорт", "Средний бизнес"],
    color: "blue",
  },
  {
    id: "agro",
    icon: Landmark,
    title: "Агробизнес: животноводство",
    org: "Аграрная кредитная корпорация",
    type: "Кредитование",
    term: "до 10 лет",
    amount: "от 6% годовых",
    desc: "Финансирование покупки поголовья, техники и оборотных средств.",
    tags: ["АПК", "Микро и малый бизнес"],
    color: "green",
  },
  {
    id: "guarantee",
    icon: ShieldCheck,
    title: "Гарантирование по кредитам МСБ",
    org: "Фонд «Даму»",
    type: "Гарантия",
    term: "до 5 лет",
    amount: "до 85% займа",
    desc: "Гарантия при недостаточности залогового обеспечения.",
    tags: ["Все отрасли", "МСБ"],
    color: "lime",
  },
];

const projects = [
  {
    id: 1,
    x: 24,
    y: 31,
    name: "Молочно-товарная ферма «Ақ-Бұлақ»",
    region: "Акмолинская область",
    org: "АКК",
    sector: "АПК",
    amount: "4,8 млрд ₸",
    status: "Реализуется",
    year: "2025",
  },
  {
    id: 2,
    x: 53,
    y: 55,
    name: "Ветровая электростанция 100 МВт",
    region: "Карагандинская область",
    org: "БРК",
    sector: "Энергетика",
    amount: "38,2 млрд ₸",
    status: "Действует",
    year: "2024",
  },
  {
    id: 3,
    x: 75,
    y: 46,
    name: "Мультимодальный логистический хаб",
    region: "область Жетісу",
    org: "БРК",
    sector: "Логистика",
    amount: "21,6 млрд ₸",
    status: "Реализуется",
    year: "2026",
  },
  {
    id: 4,
    x: 38,
    y: 72,
    name: "Завод по переработке томатов",
    region: "Туркестанская область",
    org: "КазАгроФинанс",
    sector: "Промышленность",
    amount: "7,1 млрд ₸",
    status: "Действует",
    year: "2023",
  },
  {
    id: 5,
    x: 88,
    y: 30,
    name: "Производство кабельной продукции",
    region: "ВКО",
    org: "Qazaqstan Investment Corporation",
    sector: "Промышленность",
    amount: "12,4 млрд ₸",
    status: "Действует",
    year: "2024",
  },
];

const nav = [
  ["home", "Главная"],
  ["catalog", "Меры поддержки"],
  ["map", "Карта проектов"],
  ["reports", "Аналитика"],
  ["tools", "Бизнесу"],
];

function Logo() {
  return (
    <button className="logo" onClick={() => (window.location.href = "/")}>
      <span>Ö</span>
      <div>
        <b>ÖRKEN</b>
        <small>Поддержка бизнеса</small>
      </div>
    </button>
  );
}

function App() {
  const pathname = usePathname();
  const router = useRouter();
  const page = pathname === "/" ? "home" : pathname.split("/")[1] || "home";
  const [toast, setToast] = useState("");
  const go = (p) => {
    router.push(p === "home" ? "/" : `/${p}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const notify = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2800);
  };
  const admin = page === "admin";
  return (
    <div className={admin ? "admin-app antialiased" : "antialiased"}>
      {!admin && (
        <>
          <div className="trust">
            <div className="wrap">
              <span>
                <ShieldCheck size={14} /> Официальный портал группы «Байтерек»
              </span>
              <span>
                ҚАЗ <b>РУС</b> ENG
              </span>
            </div>
          </div>
          <header>
            <div className="wrap head">
              <Logo />
              <nav>
                {nav.map(([id, label]) => (
                  <button
                    key={id}
                    className={page === id ? "active" : ""}
                    onClick={() => go(id)}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              <div className="head-actions">
                <button className="icon-btn">
                  <Bell size={19} />
                  <i />
                </button>
                <button className="outline" onClick={() => go("cabinet")}>
                  <UserRound size={18} /> Личный кабинет
                </button>
                <button className="menu">
                  <Menu />
                </button>
              </div>
            </div>
          </header>
        </>
      )}
      {page === "home" && <HomePage go={go} />}{" "}
      {page === "catalog" && <Catalog go={go} />}{" "}
      {page.startsWith("service") && <ServicePage go={go} />}{" "}
      {page === "apply" && <Apply go={go} notify={notify} />}{" "}
      {page === "cabinet" && <Cabinet go={go} />}{" "}
      {page === "map" && <ProjectsMap />}{" "}
      {page === "reports" && <Reports notify={notify} />}{" "}
      {page === "tools" && <Tools notify={notify} />}{" "}
      {page === "admin" && <Admin go={go} notify={notify} />}
      {!admin && <Footer go={go} />}{" "}
      {toast && (
        <div className="toast">
          <Check size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

function HomePage({ go }) {
  const [q, setQ] = useState("");
  const [ai, setAi] = useState(false);
  return (
    <main>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">
              <Sparkles size={15} /> 70+ мер поддержки в одном месте
            </div>
            <h1>
              Поддержка бизнеса — <em>в одном окне</em>
            </h1>
            <p className="lead">
              Найдите подходящую программу, подайте заявку и отслеживайте
              результат без визитов и повторного ввода данных.
            </p>
            <div className="searchbox">
              <Search />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Что нужно вашему бизнесу?"
              />
              <button onClick={() => go("catalog")}>Найти</button>
            </div>
            <button className="ai-link" onClick={() => setAi(true)}>
              <span>
                <ClipboardCheck size={20} />
              </span>
              <div>
                <b>Не знаете, с чего начать?</b>
                <small>Подбор по ситуации — четыре простых вопроса</small>
              </div>
              <ArrowRight />
            </button>
          </div>
          <div className="hero-panel">
            <div className="panel-top">
              <span>Ваш путь к поддержке</span>
              <span className="live">
                <i /> Сервисы доступны
              </span>
            </div>
            <div className="journey">
              <div className="journey-step done">
                <span>
                  <Check />
                </span>
                <div>
                  <small>ШАГ 1</small>
                  <b>Расскажите о бизнесе</b>
                  <p>БИН и основные параметры</p>
                </div>
              </div>
              <div className="journey-step">
                <span>2</span>
                <div>
                  <small>ШАГ 2</small>
                  <b>Получите подборку</b>
                  <p>Только релевантные меры</p>
                </div>
              </div>
              <div className="journey-step">
                <span>3</span>
                <div>
                  <small>ШАГ 3</small>
                  <b>Подайте заявку</b>
                  <p>Данные заполнятся автоматически</p>
                </div>
              </div>
            </div>
            <div className="panel-note">
              <Zap size={18} />
              <span>
                <b>В среднем 12 минут</b>
                <small>от выбора меры до отправки заявки</small>
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="directions wrap">
        <span>Поддержка по направлению</span>
        {[
          "Финансирование",
          "Субсидирование",
          "Гарантии",
          "Лизинг",
          "Экспорт",
          "Инвестиции",
        ].map((x) => (
          <button onClick={() => go("catalog")} key={x}>
            {x}
            <ArrowRight size={15} />
          </button>
        ))}
      </section>
      <MatchMoment go={go} />
      <section className="section wrap">
        <div className="section-head">
          <div>
            <span className="kicker">ПОПУЛЯРНОЕ</span>
            <h2>Меры для развития бизнеса</h2>
          </div>
          <button className="text-btn" onClick={() => go("catalog")}>
            Все 70+ мер <ArrowRight />
          </button>
        </div>
        <div className="service-grid">
          {services.map((s) => (
            <ServiceCard key={s.id} s={s} go={go} />
          ))}
        </div>
      </section>
      <section className="how">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="kicker">ПРОСТОЙ ПУТЬ</span>
              <h2>От задачи до решения</h2>
            </div>
            <p>
              Портал сам подскажет следующий шаг и не покажет лишних вопросов.
            </p>
          </div>
          <div className="how-grid">
            {[
              [
                "01",
                "Найдите меру",
                "По задаче, отрасли или параметрам бизнеса",
                Search,
              ],
              [
                "02",
                "Заполните заявку",
                "Пошагово, с подсказками и автозаполнением",
                ClipboardCheck,
              ],
              [
                "03",
                "Следите за статусом",
                "Документы, уведомления и история — в кабинете",
                Bell,
              ],
            ].map(([n, t, d, I]) => (
              <div className="how-card" key={n}>
                <span>{n}</span>
                <I />
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section wrap split-feature">
        <div className="map-preview">
          <img src="/assets/kazakhstan-projects.png" alt="Макет проектов на карте Казахстана" />
          <div className="map-stats">
            <b>1 284</b>
            <small>проекта в 20 регионах</small>
          </div>
        </div>
        <div className="feature-copy">
          <span className="kicker">КАРТА ПРОЕКТОВ</span>
          <h2>Развитие, которое видно</h2>
          <p>
            Смотрите проекты группы «Байтерек» по регионам, отраслям и объёму
            финансирования.
          </p>
          <div className="mini-stats">
            <span>
              <b>5,7 трлн ₸</b>
              <small>объём финансирования</small>
            </span>
            <span>
              <b>89 тыс.</b>
              <small>созданных рабочих мест</small>
            </span>
          </div>
          <button className="primary" onClick={() => go("map")}>
            Открыть карту <ArrowRight />
          </button>
        </div>
      </section>
      <section className="section wrap resources">
        <div className="resource-card dark">
          <BarChart3 />
          <span className="kicker">АНАЛИТИКА</span>
          <h3>Отчёты и исследования группы</h3>
          <p>
            Финансовая отчётность, отраслевые обзоры и интерактивные панели.
          </p>
          <button onClick={() => go("reports")}>
            Смотреть материалы <ArrowRight />
          </button>
        </div>
        <div className="resource-card light">
          <Calculator />
          <span className="kicker">ИНСТРУМЕНТЫ</span>
          <h3>Практическая помощь бизнесу</h3>
          <p>Калькуляторы, шаблоны документов, инструкции и чек-листы.</p>
          <button onClick={() => go("tools")}>
            Перейти к инструментам <ArrowRight />
          </button>
        </div>
      </section>
      {ai && <AiModal close={() => setAi(false)} go={go} />}
    </main>
  );
}

function MatchMoment({ go }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    try {
      const response = await portalApi.eligibility({
        serviceId: "wagons",
        bin: "120940012345",
        amount: 500000000,
        own: 90000000,
        used: "new",
      });
      setResult(response);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="match-moment wrap">
      <div className="match-visual">
        <img src="/assets/service-paths.png" alt="Два направления поддержки: логистика и агробизнес" />
        <span>Лизинг или агрофинансирование</span>
      </div>
      <div className="match-copy">
        <span className="kicker">МОМЕНТ ЯСНОСТИ</span>
        <h2>Не каталог из 70 услуг. Один понятный следующий шаг.</h2>
        <p>
          Портал сопоставляет данные реестра, правила программы и параметры
          проекта на сервере — и объясняет результат до заполнения анкеты.
        </p>
        {!result ? (
          <button className="primary" onClick={check} disabled={loading}>
            {loading ? "Проверяем правила…" : "Проверить на примере компании"}
            {!loading && <ArrowRight />}
          </button>
        ) : (
          <div className="match-result">
            <div className="score-ring">{result.score}%</div>
            <div>
              <b>{result.eligible ? "Предварительно подходит" : "Нужны уточнения"}</b>
              <p>{result.nextAction}</p>
              <button onClick={() => go("service-wagons")}>Посмотреть условия <ArrowRight /></button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ServiceCard({ s, go }) {
  const I = s.icon;
  return (
    <article className="service-card">
      <div className="card-icon">
        <I />
      </div>
      <div className="tags">
        {s.tags.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <h3>{s.title}</h3>
      <p>{s.desc}</p>
      <div className="service-meta">
        <span>
          <small>Инструмент</small>
          <b>{s.type}</b>
        </span>
        <span>
          <small>Срок</small>
          <b>{s.term}</b>
        </span>
      </div>
      <div className="card-foot">
        <span>
          <Building2 /> {s.org}
        </span>
        <button onClick={() => go("service-wagons")}>
          <ArrowRight />
        </button>
      </div>
    </article>
  );
}

function Catalog({ go }) {
  const [search, setSearch] = useState("");
  const filtered = services.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <main className="page wrap">
      <div className="breadcrumbs">
        Главная <ChevronRight /> Меры поддержки
      </div>
      <div className="page-title">
        <div>
          <span className="kicker">КАТАЛОГ</span>
          <h1>Меры поддержки бизнеса</h1>
          <p>
            Подберите финансирование, гарантию или другой инструмент под вашу
            задачу.
          </p>
        </div>
        <button className="ai-button">
          <Filter /> Подобрать по ситуации
        </button>
      </div>
      <div className="catalog-layout">
        <aside className="filters">
          <div className="filter-head">
            <b>Фильтры</b>
            <button>Сбросить</button>
          </div>
          {[
            "Задача бизнеса",
            "Размер бизнеса",
            "Отрасль",
            "Регион",
            "Организация",
          ].map((x, i) => (
            <label key={x}>
              {x}
              <select defaultValue="">
                <option value="">Все варианты</option>
                <option>Развитие</option>
                <option>Финансирование</option>
              </select>
            </label>
          ))}
        </aside>
        <section className="catalog-main">
          <div className="catalog-bar">
            <div className="catalog-search">
              <Search />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Название меры или ключевое слово"
              />
            </div>
            <span>
              Найдено: <b>{filtered.length}</b>
            </span>
          </div>
          <div className="service-grid catalog-cards">
            {filtered.map((s) => (
              <ServiceCard key={s.id} s={s} go={go} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ServicePage({ go }) {
  return (
    <main className="page">
      <div className="wrap">
        <div className="breadcrumbs">
          Главная <ChevronRight /> Каталог <ChevronRight /> Лизинг вагонов
        </div>
        <div className="service-hero">
          <div>
            <div className="tags">
              <span>ЛИЗИНГ</span>
              <span>ТРАНСПОРТ</span>
            </div>
            <h1>Приобретение вагонов в лизинг</h1>
            <p>
              Финансирование приобретения новых и подержанных грузовых вагонов
              для развития перевозок.
            </p>
            <div className="provider">
              <span className="provider-logo">KAF</span>
              <div>
                <small>УСЛУГУ ПРЕДОСТАВЛЯЕТ</small>
                <b>КазАгроФинанс</b>
              </div>
            </div>
          </div>
          <aside className="apply-card">
            <span className="ready">
              <Check /> Вы можете подать онлайн
            </span>
            <div>
              <small>Время заполнения</small>
              <b>≈ 12 минут</b>
            </div>
            <div>
              <small>Рассмотрение I этапа</small>
              <b>до 3 рабочих дней</b>
            </div>
            <button className="primary full" onClick={() => go("apply")}>
              Начать заявку <ArrowRight />
            </button>
            <p>
              <ShieldCheck /> Данные сохраняются автоматически
            </p>
          </aside>
        </div>
        <div className="service-tabs">
          <button className="active">Об услуге</button>
          <button>Условия</button>
          <button>Документы</button>
          <button>Этапы</button>
        </div>
        <div className="service-content">
          <section>
            <h2>Подходит ли вам эта мера?</h2>
            <div className="eligibility">
              <div>
                <Check />
                <span>
                  <b>Кто может получить</b>
                  <p>Юридические лица и ИП, зарегистрированные в Казахстане</p>
                </span>
              </div>
              <div>
                <Check />
                <span>
                  <b>Цель финансирования</b>
                  <p>
                    Приобретение грузовых вагонов для предпринимательской
                    деятельности
                  </p>
                </span>
              </div>
              <div>
                <Check />
                <span>
                  <b>Первоначальный взнос</b>
                  <p>От 15% стоимости предмета лизинга</p>
                </span>
              </div>
            </div>
            <h2>Основные условия</h2>
            <div className="condition-grid">
              <span>
                <small>Срок лизинга</small>
                <b>до 7 лет</b>
              </span>
              <span>
                <small>Аванс</small>
                <b>от 15%</b>
              </span>
              <span>
                <small>Ставка</small>
                <b>индивидуально</b>
              </span>
              <span>
                <small>Валюта</small>
                <b>тенге</b>
              </span>
            </div>
            <h2>Как проходит заявка</h2>
            <ol className="timeline">
              <li>
                <span>1</span>
                <div>
                  <b>Предварительная заявка</b>
                  <p>Основные сведения о компании и проекте</p>
                </div>
                <em>≈ 12 мин</em>
              </li>
              <li>
                <span>2</span>
                <div>
                  <b>Первичная проверка</b>
                  <p>Получите решение о переходе на следующий этап</p>
                </div>
                <em>до 3 дней</em>
              </li>
              <li>
                <span>3</span>
                <div>
                  <b>Расширенный пакет</b>
                  <p>Загрузите финансовые и правоустанавливающие документы</p>
                </div>
                <em>по запросу</em>
              </li>
            </ol>
          </section>
          <aside className="help-card">
            <CircleHelp />
            <h3>Есть вопросы по условиям?</h3>
            <p>Получите объяснение требований со ссылкой на правило услуги.</p>
            <button>Разобрать условие</button>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Apply({ go, notify }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [form, setForm] = useState({
    bin: "120940012345",
    company: "ТОО «Astana Logistics»",
    wagons: "",
    used: "new",
    amount: "",
    own: "",
    consent: true,
  });
  const set = (k, v) => setForm({ ...form, [k]: v });
  const pct = Math.round((step / 4) * 100);
  React.useEffect(() => {
    if (!form.amount || !form.own) return setCalculation(null);
    const timer = setTimeout(() => {
      portalApi
        .calculateLease({ amount: form.amount, own: form.own })
        .then(setCalculation)
        .catch((error) => setBackendError(error.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [form.amount, form.own]);

  const submit = async () => {
    setSubmitting(true);
    setBackendError("");
    try {
      const application = await portalApi.submitApplication({
        ...form,
        amount: Number(form.amount || 500000000),
        own: Number(form.own || 75000000),
      });
      setSubmitted(application);
    } catch (error) {
      setBackendError(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  if (submitted)
    return (
      <main className="success-page wrap">
        <div className="success-mark">
          <Check />
        </div>
        <span className="kicker">ЗАЯВКА ОТПРАВЛЕНА</span>
        <h1>Готово! Мы приняли заявку</h1>
        <p>
          Предварительная заявка передана в систему КазАгроФинанс. Результат
          появится в личном кабинете.
        </p>
        <div className="request-number">
          <small>НОМЕР ЗАЯВКИ</small>
          <b>{submitted.id}</b>
          <button onClick={() => notify("Номер скопирован")}>
            Скопировать
          </button>
        </div>
        <div className="next-box">
          <Clock3 />
          <div>
            <b>Что дальше?</b>
            <p>
              До 14 июля специалист проверит данные. Мы отправим уведомление при
              смене статуса.
            </p>
          </div>
        </div>
        <button className="primary" onClick={() => go("cabinet")}>
          Перейти в личный кабинет <ArrowRight />
        </button>
      </main>
    );
  return (
    <main className="apply-page">
      <div className="wrap">
        <div className="apply-head">
          <button onClick={() => go("service-wagons")}>
            <ChevronLeft /> Выйти
          </button>
          <div>
            <small>ПРИОБРЕТЕНИЕ ВАГОНОВ В ЛИЗИНГ</small>
            <b>Предварительная заявка</b>
          </div>
          <span>Черновик сохранён</span>
        </div>
        <div className="progress">
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="apply-layout">
          <aside className="stepper">
            {["Компания", "Предмет лизинга", "Финансирование", "Проверка"].map(
              (x, i) => (
                <button
                  key={x}
                  className={
                    step === i + 1 ? "active" : step > i + 1 ? "done" : ""
                  }
                  onClick={() => step > i && setStep(i + 1)}
                >
                  <span>{step > i + 1 ? <Check /> : i + 1}</span>
                  <div>
                    <small>ШАГ {i + 1}</small>
                    <b>{x}</b>
                  </div>
                </button>
              ),
            )}
            <div className="step-help">
              <CircleHelp />
              <b>Проверка заявки</b>
              <p>Сервер проверит реестр, аванс и обязательные документы.</p>
              <button>Что проверяется?</button>
            </div>
          </aside>
          <section className="form-card">
            {step === 1 && (
              <>
                <div className="form-title">
                  <span>1 из 4</span>
                  <h1>Данные компании</h1>
                  <p>
                    Получили сведения из государственных реестров. Проверьте их.
                  </p>
                </div>
                <div className="prefill">
                  <Database />
                  <div>
                    <b>Данные получены по БИН</b>
                    <small>Mock eGov / 10 июля, 15:24</small>
                  </div>
                  <Check />
                </div>
                <label>
                  БИН
                  <input
                    value={form.bin}
                    onChange={(e) => set("bin", e.target.value)}
                  />
                  <small>12 цифр</small>
                </label>
                <label>
                  Наименование компании
                  <input
                    value={form.company}
                    onChange={(e) => set("company", e.target.value)}
                  />
                </label>
                <div className="form-row">
                  <label>
                    Организационная форма
                    <select>
                      <option>ТОО</option>
                      <option>ИП</option>
                      <option>АО</option>
                    </select>
                  </label>
                  <label>
                    Регион
                    <select>
                      <option>г. Астана</option>
                      <option>г. Алматы</option>
                    </select>
                  </label>
                </div>
                <label>
                  Основной вид деятельности
                  <input value="Грузовые железнодорожные перевозки" readOnly />
                </label>
              </>
            )}
            {step === 2 && (
              <>
                <div className="form-title">
                  <span>2 из 4</span>
                  <h1>Предмет лизинга</h1>
                  <p>Расскажите, какие вагоны планируете приобрести.</p>
                </div>
                <label>
                  Тип вагонов
                  <select>
                    <option>Полувагоны</option>
                    <option>Крытые вагоны</option>
                    <option>Цистерны</option>
                    <option>Платформы</option>
                  </select>
                </label>
                <div className="form-row">
                  <label>
                    Количество вагонов
                    <input
                      type="number"
                      value={form.wagons}
                      onChange={(e) => set("wagons", e.target.value)}
                      placeholder="Например, 20"
                    />
                  </label>
                  <label>
                    Состояние
                    <select
                      value={form.used}
                      onChange={(e) => set("used", e.target.value)}
                    >
                      <option value="new">Новые</option>
                      <option value="used">Подержанные</option>
                    </select>
                  </label>
                </div>
                {form.used === "used" && (
                  <div className="conditional">
                    <Sparkles />
                    <div>
                      <b>Дополнительный вопрос</b>
                      <p>
                        Для подержанных вагонов потребуется отчёт об оценке
                        технического состояния.
                      </p>
                    </div>
                  </div>
                )}
                <label>
                  Предполагаемый поставщик
                  <input placeholder="Можно указать позже" />
                </label>
                <label>
                  Для чего будут использоваться вагоны?
                  <textarea placeholder="Кратко опишите маршруты и тип грузов" />
                </label>
              </>
            )}
            {step === 3 && (
              <>
                <div className="form-title">
                  <span>3 из 4</span>
                  <h1>Параметры финансирования</h1>
                  <p>
                    Укажите ориентировочную стоимость — расчёт обновится
                    автоматически.
                  </p>
                </div>
                <div className="form-row">
                  <label>
                    Стоимость, ₸
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => set("amount", e.target.value)}
                      placeholder="500 000 000"
                    />
                  </label>
                  <label>
                    Собственные средства, ₸
                    <input
                      type="number"
                      value={form.own}
                      onChange={(e) => set("own", e.target.value)}
                      placeholder="75 000 000"
                    />
                  </label>
                </div>
                <div className="calculation">
                  <Calculator />
                  <div>
                    <small>ОРИЕНТИРОВОЧНЫЙ РАСЧЁТ</small>
                    <div>
                      <span>
                        Размер аванса{" "}
                        <b>
                          {form.amount && form.own
                            ? calculation?.advancePercent ?? "…"
                            : 15}
                          %
                        </b>
                      </span>
                      <span>
                        Сумма лизинга{" "}
                        <b>
                          {form.amount
                            ? calculation
                              ? new Intl.NumberFormat("ru").format(calculation.financed)
                              : "Расчёт…"
                            : "425 000 000"}{" "}
                          ₸
                        </b>
                      </span>
                    </div>
                    <p>
                      Финальные условия определит КазАгроФинанс после
                      рассмотрения.
                    </p>
                  </div>
                </div>
                <label className="upload">
                  <Upload />
                  <b>Коммерческое предложение</b>
                  <span>PDF, DOCX или XLSX, до 20 МБ</span>
                  <button>Выбрать файл</button>
                </label>
              </>
            )}
            {step === 4 && (
              <>
                <div className="form-title">
                  <span>4 из 4</span>
                  <h1>Проверьте заявку</h1>
                  <p>Проверка правил завершена: критических ошибок не найдено.</p>
                </div>
                <div className="ai-check">
                  <Sparkles />
                  <div>
                    <b>Реестр и правила программы проверены</b>
                    <p>
                      Заполнено 18 из 18 обязательных полей. БИН и регистрация
                      подтверждены.
                    </p>
                  </div>
                  <span>100%</span>
                </div>
                {backendError && <div className="form-error">{backendError}</div>}
                {[
                  ["Компания", form.company],
                  ["БИН", form.bin],
                  ["Предмет", "Полувагоны, " + (form.wagons || "20") + " шт."],
                  [
                    "Стоимость",
                    (form.amount
                      ? new Intl.NumberFormat("ru").format(form.amount)
                      : "500 000 000") + " ₸",
                  ],
                  ["Организация", "КазАгроФинанс"],
                ].map(([k, v]) => (
                  <div className="review-row" key={k}>
                    <span>{k}</span>
                    <b>{v}</b>
                    <button
                      onClick={() =>
                        setStep(
                          k === "Компания" || k === "БИН"
                            ? 1
                            : k === "Предмет"
                              ? 2
                              : 3,
                        )
                      }
                    >
                      Изменить
                    </button>
                  </div>
                ))}
                <label className="check">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                  />
                  <span>
                    Подтверждаю достоверность данных и согласен на их обработку
                  </span>
                </label>
                <div className="esign">
                  <ShieldCheck />
                  <div>
                    <b>Подписание через ЭЦП</b>
                    <p>
                      После нажатия откроется демонстрационный сервис НУЦ РК.
                    </p>
                  </div>
                </div>
              </>
            )}
            <div className="form-actions">
              <button
                className="secondary"
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
              >
                <ChevronLeft /> Назад
              </button>
              <span>Сохранено 1 минуту назад</span>
              {step < 4 ? (
                <button className="primary" onClick={() => setStep(step + 1)}>
                  Продолжить <ChevronRight />
                </button>
              ) : (
                <button
                  className="primary"
                  disabled={!form.consent || submitting}
                  onClick={submit}
                >
                  <ShieldCheck /> {submitting ? "Передаём в BPM…" : "Подписать и отправить"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Cabinet({ go }) {
  return (
    <main className="page cabinet wrap">
      <div className="cab-head">
        <div>
          <span className="kicker">ЛИЧНЫЙ КАБИНЕТ</span>
          <h1>Добрый день, Айдар</h1>
          <p>ТОО «Astana Logistics» · БИН 120940012345</p>
        </div>
        <button className="primary" onClick={() => go("catalog")}>
          <Plus /> Новая заявка
        </button>
      </div>
      <div className="cab-stats">
        <div>
          <span>Активные заявки</span>
          <b>2</b>
          <small>
            <i className="green" /> одна требует действия
          </small>
        </div>
        <div>
          <span>На рассмотрении</span>
          <b>1</b>
          <small>обновлено сегодня</small>
        </div>
        <div>
          <span>Одобрено</span>
          <b>3</b>
          <small>за последние 12 месяцев</small>
        </div>
        <div>
          <span>Уведомления</span>
          <b>4</b>
          <small>
            <i className="orange" /> два новых
          </small>
        </div>
      </div>
      <div className="cab-grid">
        <section>
          <div className="block-title">
            <h2>Мои заявки</h2>
            <button>
              Все заявки <ArrowRight />
            </button>
          </div>
          <article className="application-card">
            <div className="app-icon">
              <TrainFront />
            </div>
            <div className="app-main">
              <span className="status warning">ТРЕБУЕТ ДЕЙСТВИЯ</span>
              <h3>Приобретение вагонов в лизинг</h3>
              <p>OR-2026-001284 · КазАгроФинанс</p>
              <div className="app-progress">
                <i />
                <i />
                <i className="off" />
                <i className="off" />
              </div>
              <small>
                Нужно загрузить расширенный пакет документов до 17 июля
              </small>
            </div>
            <button className="primary">
              Продолжить <ArrowRight />
            </button>
          </article>
          <article className="application-card">
            <div className="app-icon green">
              <Landmark />
            </div>
            <div className="app-main">
              <span className="status info">НА РАССМОТРЕНИИ</span>
              <h3>Агробизнес: животноводство</h3>
              <p>OR-2026-000918 · Аграрная кредитная корпорация</p>
              <small>Предварительное решение ожидается до 12 июля</small>
            </div>
            <button className="secondary">Подробнее</button>
          </article>
        </section>
        <aside>
          <div className="block-title">
            <h2>Уведомления</h2>
            <button>Все</button>
          </div>
          {[
            [
              "Сегодня, 14:32",
              "Нужны дополнительные документы",
              "По заявке OR-2026-001284",
            ],
            [
              "Вчера, 09:10",
              "Заявка передана на рассмотрение",
              "Агробизнес: животноводство",
            ],
            ["8 июля", "Отчёт готов", "Кредитный рейтинг компании"],
          ].map((n, i) => (
            <div className="notice" key={n[0]}>
              <i className={i === 0 ? "new" : ""} />
              <small>{n[0]}</small>
              <b>{n[1]}</b>
              <p>{n[2]}</p>
            </div>
          ))}
        </aside>
      </div>
    </main>
  );
}

function ProjectsMap() {
  const [selected, setSelected] = useState(projects[1]);
  const [sector, setSector] = useState("Все отрасли");
  const visible = projects.filter(
    (p) => sector === "Все отрасли" || p.sector === sector,
  );
  return (
    <main className="page map-page">
      <div className="wrap">
        <div className="breadcrumbs">
          Главная <ChevronRight /> Карта проектов
        </div>
        <div className="page-title">
          <div>
            <span className="kicker">ИНТЕРАКТИВНАЯ КАРТА</span>
            <h1>Проекты группы «Байтерек»</h1>
            <p>Финансирование реального сектора по регионам Казахстана.</p>
          </div>
          <div className="map-summary">
            <span>
              <b>1 284</b>
              <small>проекта</small>
            </span>
            <span>
              <b>5,7 трлн ₸</b>
              <small>финансирование</small>
            </span>
            <span>
              <b>89 240</b>
              <small>рабочих мест</small>
            </span>
          </div>
        </div>
      </div>
      <div className="map-toolbar wrap">
        <label>
          <Filter /> Отрасль
          <select value={sector} onChange={(e) => setSector(e.target.value)}>
            <option>Все отрасли</option>
            <option>АПК</option>
            <option>Энергетика</option>
            <option>Логистика</option>
            <option>Промышленность</option>
          </select>
        </label>
        <label>
          Организация
          <select>
            <option>Все организации</option>
            <option>БРК</option>
            <option>АКК</option>
          </select>
        </label>
        <label>
          Статус
          <select>
            <option>Все статусы</option>
            <option>Действует</option>
            <option>Реализуется</option>
          </select>
        </label>
        <button className="icon-btn">
          <Search />
        </button>
      </div>
      <div className="big-map">
        <div className="kazakhstan">
          <span className="region-label north">
            СЕВЕР
            <br />
            <b>186</b>
          </span>
          <span className="region-label center">
            ЦЕНТР
            <br />
            <b>242</b>
          </span>
          <span className="region-label east">
            ВОСТОК
            <br />
            <b>163</b>
          </span>
          <span className="region-label south">
            ЮГ
            <br />
            <b>418</b>
          </span>
          <span className="region-label west">
            ЗАПАД
            <br />
            <b>275</b>
          </span>
          {visible.map((p) => (
            <button
              key={p.id}
              className={
                "project-pin " + (selected?.id === p.id ? "active" : "")
              }
              style={{ left: p.x + "%", top: p.y + "%" }}
              onClick={() => setSelected(p)}
            >
              <span>{p.id === 2 ? "12" : p.id === 4 ? "8" : "•"}</span>
            </button>
          ))}
        </div>
        {selected && (
          <aside className="project-pop">
            <button className="close" onClick={() => setSelected(null)}>
              <X />
            </button>
            <span className="status success">
              {selected.status.toUpperCase()}
            </span>
            <h3>{selected.name}</h3>
            <p>
              <Map size={16} />
              {selected.region}
            </p>
            <div className="project-data">
              <span>
                <small>Организация</small>
                <b>{selected.org}</b>
              </span>
              <span>
                <small>Отрасль</small>
                <b>{selected.sector}</b>
              </span>
              <span>
                <small>Финансирование</small>
                <b>{selected.amount}</b>
              </span>
              <span>
                <small>Год</small>
                <b>{selected.year}</b>
              </span>
            </div>
            <button className="primary full">
              Подробнее о проекте <ArrowRight />
            </button>
          </aside>
        )}
        <div className="map-legend">
          <span>
            <i className="sm" />
            1–5
          </span>
          <span>
            <i className="md" />
            6–15
          </span>
          <span>
            <i className="lg" />
            16+ проектов
          </span>
        </div>
      </div>
    </main>
  );
}

function Reports({ notify }) {
  return (
    <main className="page wrap">
      <div className="breadcrumbs">
        Главная <ChevronRight /> Аналитика
      </div>
      <div className="page-title">
        <div>
          <span className="kicker">ЕДИНАЯ БИБЛИОТЕКА</span>
          <h1>Аналитика и отчётность</h1>
          <p>Готовые материалы Холдинга и дочерних организаций.</p>
        </div>
      </div>
      <div className="report-feature">
        <div>
          <span className="status success">ИНТЕРАКТИВНЫЙ ОТЧЁТ</span>
          <h2>Вклад группы «Байтерек» в развитие экономики</h2>
          <p>
            Ключевые показатели финансирования, занятости и отраслевого развития
            за I полугодие 2026 года.
          </p>
          <div className="provider">
            <span className="provider-logo">B</span>
            <div>
              <small>ИСТОЧНИК</small>
              <b>НИХ «Байтерек» · обновлено 8 июля</b>
            </div>
          </div>
          <button
            className="primary"
            onClick={() => notify("Демо-встраивание BI открыто")}
          >
            Открыть дашборд <ArrowRight />
          </button>
        </div>
        <img
          className="report-visual"
          src="/assets/kazakhstan-projects.png"
          alt="Проекты группы на карте Казахстана"
        />
      </div>
      <div className="section-head compact">
        <h2>Последние материалы</h2>
        <div className="tabs">
          <button className="active">Все</button>
          <button>Отчёты</button>
          <button>Исследования</button>
          <button>Дашборды</button>
        </div>
      </div>
      <div className="report-grid">
        {[
          [
            "Годовой отчёт 2025",
            "Финансовая отчётность",
            "НИХ «Байтерек»",
            "PDF · 8,4 МБ",
          ],
          [
            "Обзор рынка лизинга",
            "Исследование",
            "КазАгроФинанс",
            "PDF · 3,1 МБ",
          ],
          [
            "Экспорт Казахстана",
            "Интерактивный портал",
            "KazakhExport",
            "Внешний ресурс",
          ],
          [
            "Жилищный рынок: Q2 2026",
            "Аналитический обзор",
            "Отбасы банк",
            "PDF · 5,7 МБ",
          ],
          [
            "Портфель проектов БРК",
            "Дашборд",
            "Банк Развития Казахстана",
            "Power BI",
          ],
          [
            "МСБ: барометр активности",
            "Исследование",
            "Фонд «Даму»",
            "PDF · 2,9 МБ",
          ],
        ].map((r, i) => (
          <article className="report-card" key={r[0]}>
            <div className={"file-icon i" + i}>
              {i === 2 || i === 4 ? <Globe2 /> : <FileText />}
            </div>
            <span>{r[1]}</span>
            <h3>{r[0]}</h3>
            <p>{r[2]}</p>
            <footer>
              <small>{r[3]}</small>
              <button onClick={() => notify("Материал открыт в демо-режиме")}>
                <ArrowRight />
              </button>
            </footer>
          </article>
        ))}
      </div>
    </main>
  );
}

function Tools({ notify }) {
  return (
    <main className="page wrap">
      <div className="breadcrumbs">
        Главная <ChevronRight /> Бизнесу
      </div>
      <div className="page-title">
        <div>
          <span className="kicker">ПРАКТИЧЕСКАЯ ПОМОЩЬ</span>
          <h1>Инструменты для бизнеса</h1>
          <p>Рассчитайте, скачайте и разберитесь — без сложных терминов.</p>
        </div>
      </div>
      <div className="tool-grid">
        <article className="tool-card featured">
          <Calculator />
          <span>КАЛЬКУЛЯТОР</span>
          <h2>Оцените платёж по финансированию</h2>
          <p>Предварительный расчёт займа, лизинга или гарантии.</p>
          <button onClick={() => notify("Калькулятор запущен")}>
            Рассчитать <ArrowRight />
          </button>
        </article>
        {[
          [
            "Проверить кредитный рейтинг",
            "Экспресс-оценка компании по БИН",
            ClipboardCheck,
          ],
          [
            "Шаблоны документов",
            "Бизнес-планы, заявления и финансовые модели",
            FolderOpen,
          ],
          [
            "Как получить поддержку",
            "Пошаговые инструкции по 18 направлениям",
            BookOpen,
          ],
          [
            "Экспортный чек-лист",
            "Готовность компании к выходу на новые рынки",
            Globe2,
          ],
          [
            "Календарь предпринимателя",
            "Налоги, отчётность и важные сроки",
            Clock3,
          ],
        ].map(([t, d, I]) => (
          <article className="tool-card" key={t}>
            <I />
            <span>ИНСТРУМЕНТ</span>
            <h3>{t}</h3>
            <p>{d}</p>
            <button onClick={() => notify("Инструмент открыт")}>
              Открыть <ArrowRight />
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}

function Admin({ go, notify }) {
  const [selected, setSelected] = useState("field-amount");
  const [published, setPublished] = useState(false);
  const [preview, setPreview] = useState(false);
  return (
    <main className="admin">
      <header className="admin-head">
        <Logo />
        <div className="admin-service">
          <span className="status draft">ЧЕРНОВИК</span>
          <div>
            <b>Приобретение вагонов в лизинг</b>
            <small>Версия 1.4 · сохранено только что</small>
          </div>
        </div>
        <div className="admin-actions">
          <button className="secondary" onClick={() => setPreview(!preview)}>
            <PanelLeft /> {preview ? "Редактор" : "Предпросмотр"}
          </button>
          <button
            className="primary"
            onClick={() => {
              setPublished(true);
              notify("Услуга опубликована");
            }}
          >
            <Rocket /> {published ? "Опубликовано" : "Опубликовать"}
          </button>
          <button className="icon-btn">
            <Settings2 />
          </button>
          <button className="avatar">AK</button>
        </div>
      </header>
      <div className="admin-body">
        <aside className="admin-nav">
          <button className="active">
            <WandSparkles />
            <span>Конструктор</span>
          </button>
          <button>
            <LayoutDashboard />
            <span>Услуги</span>
          </button>
          <button>
            <ClipboardCheck />
            <span>Заявки</span>
          </button>
          <button>
            <Database />
            <span>Справочники</span>
          </button>
          <button>
            <Zap />
            <span>Интеграции</span>
          </button>
          <button>
            <BarChart3 />
            <span>Аналитика</span>
          </button>
          <i />
          <button onClick={() => go("home")}>
            <Home />
            <span>На портал</span>
          </button>
        </aside>
        {preview ? (
          <AdminPreview />
        ) : (
          <>
            <aside className="palette">
              <div className="pane-title">
                <b>Компоненты</b>
                <button>
                  <X />
                </button>
              </div>
              <div className="palette-search">
                <Search />
                <input placeholder="Найти компонент" />
              </div>
              {[
                [
                  "ПОЛЯ",
                  ["Короткий текст", "Число", "Выбор из списка", "Дата"],
                ],
                ["СТРУКТУРА", ["Заголовок", "Инфоблок", "Загрузка файла"]],
                ["ЛОГИКА", ["Условие", "Расчёт", "Интеграция"]],
              ].map(([h, items]) => (
                <div className="palette-group" key={h}>
                  <span>{h}</span>
                  {items.map((x, i) => (
                    <button key={x}>
                      <GripVertical />
                      <span className="mini-component">
                        {i % 2 === 0 ? "Aa" : "#"}
                      </span>
                      {x}
                      <Plus />
                    </button>
                  ))}
                </div>
              ))}
            </aside>
            <section className="builder">
              <div className="builder-bar">
                <div>
                  <button>
                    <ChevronLeft />
                  </button>
                  <b>Шаг 3 · Финансирование</b>
                  <ChevronDown />
                </div>
                <span>
                  Масштаб <b>100%</b>
                </span>
              </div>
              <div className="canvas">
                <div className="canvas-form">
                  <div className="canvas-title">
                    <span>ШАГ 3 ИЗ 4</span>
                    <h2>Параметры финансирования</h2>
                    <p>
                      Укажите ориентировочную стоимость — расчёт обновится
                      автоматически.
                    </p>
                  </div>
                  <CanvasField
                    label="Стоимость предмета лизинга"
                    text="500 000 000"
                    selected={selected === "field-amount"}
                    onClick={() => setSelected("field-amount")}
                  />
                  <CanvasField
                    label="Собственные средства"
                    text="75 000 000"
                    selected={selected === "field-own"}
                    onClick={() => setSelected("field-own")}
                  />
                  <div className="canvas-calc">
                    <Calculator />
                    <div>
                      <small>ОРИЕНТИРОВОЧНЫЙ РАСЧЁТ</small>
                      <span>
                        Размер аванса <b>15%</b>
                      </span>
                      <span>
                        Сумма лизинга <b>425 000 000 ₸</b>
                      </span>
                    </div>
                  </div>
                  <button className="add-component">
                    <Plus /> Добавить компонент
                  </button>
                </div>
                <div className="flow-mini">
                  <b>СЦЕНАРИЙ</b>
                  <span className="done">1 Компания</span>
                  <i />
                  <span className="done">2 Предмет</span>
                  <i />
                  <span className="active">3 Финансы</span>
                  <i />
                  <span>4 Проверка</span>
                </div>
              </div>
            </section>
            <aside className="properties">
              <div className="pane-title">
                <b>Настройки поля</b>
                <button>
                  <X />
                </button>
              </div>
              <div className="prop-tabs">
                <button className="active">Свойства</button>
                <button>
                  Логика <i>1</i>
                </button>
              </div>
              <label>
                Название поля
                <input
                  defaultValue={
                    selected === "field-own"
                      ? "Собственные средства"
                      : "Стоимость предмета лизинга"
                  }
                />
              </label>
              <label>
                Подсказка
                <input defaultValue="Укажите сумму в тенге" />
              </label>
              <div className="switch-row">
                <span>
                  <b>Обязательное поле</b>
                  <small>Нельзя перейти дальше без ответа</small>
                </span>
                <button className="switch on">
                  <i />
                </button>
              </div>
              <label>
                Тип данных
                <select>
                  <option>Денежная сумма</option>
                  <option>Число</option>
                </select>
              </label>
              <label>
                Минимальное значение
                <input defaultValue="1 000 000" />
              </label>
              <div className="rule-box">
                <header>
                  <Sparkles />
                  <b>Условие отображения</b>
                  <button>
                    <Settings2 />
                  </button>
                </header>
                <p>Показывать, если:</p>
                <span>
                  <b>Тип финансирования</b> равно <b>Лизинг</b>
                </span>
              </div>
              <button className="danger-link">Удалить поле</button>
            </aside>
          </>
        )}
      </div>
    </main>
  );
}

function CanvasField({ label, text, selected, onClick }) {
  return (
    <div
      className={"canvas-field " + (selected ? "selected" : "")}
      onClick={onClick}
    >
      <span className="drag">
        <GripVertical />
      </span>
      <label>
        {label}
        <b>*</b>
      </label>
      <div>
        {text}
        <span>₸</span>
      </div>
      {selected && <em>Выбрано</em>}
    </div>
  );
}
function AdminPreview() {
  return (
    <section className="admin-preview">
      <div className="preview-device">
        <div className="preview-top">
          <Logo />
          <span>Предварительный просмотр</span>
        </div>
        <div className="preview-content">
          <span>ШАГ 3 ИЗ 4</span>
          <h1>Параметры финансирования</h1>
          <p>
            Укажите ориентировочную стоимость — расчёт обновится автоматически.
          </p>
          <label>
            Стоимость предмета лизинга
            <input value="500 000 000" readOnly />
          </label>
          <label>
            Собственные средства
            <input value="75 000 000" readOnly />
          </label>
          <div className="calculation">
            <Calculator />
            <div>
              <small>РАСЧЁТ</small>
              <div>
                <span>
                  Размер аванса <b>15%</b>
                </span>
                <span>
                  Сумма лизинга <b>425 000 000 ₸</b>
                </span>
              </div>
            </div>
          </div>
          <button className="primary">
            Продолжить <ArrowRight />
          </button>
        </div>
      </div>
    </section>
  );
}

function AiModal({ close, go }) {
  const [stage, setStage] = useState(0);
  return (
    <div className="modal-back">
      <div className="ai-modal">
        <button className="close" onClick={close}>
          <X />
        </button>
        <div className="ai-orb">
          <Sparkles />
        </div>
        {stage === 0 ? (
          <>
            <span className="kicker">ПОДБОР ПО СИТУАЦИИ</span>
            <h2>Найдём подходящую поддержку</h2>
            <p>
              Ответьте на 4 коротких вопроса. Мы не будем запрашивать
              персональные данные.
            </p>
            <div className="chat-bubble">
              Какая задача сейчас важнее для вашего бизнеса?
            </div>
            <div className="answer-grid">
              {[
                "Купить технику или оборудование",
                "Пополнить оборотные средства",
                "Выйти на экспорт",
                "Не знаю — помогите выбрать",
              ].map((x) => (
                <button key={x} onClick={() => setStage(1)}>
                  {x}
                  <ArrowRight />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <span className="kicker">ГОТОВО ЗА 38 СЕКУНД</span>
            <h2>Нашли 3 подходящие меры</h2>
            <p>
              Результат учитывает отрасль, задачу, размер бизнеса и правила
              программ. Модель помогает объяснить совпадение, а решение
              принимается по проверяемым условиям.
            </p>
            <div className="ai-result">
              <span>96% совпадение</span>
              <TrainFront />
              <div>
                <b>Приобретение вагонов в лизинг</b>
                <small>КазАгроФинанс · до 7 лет</small>
              </div>
              <button onClick={() => go("service-wagons")}>
                <ArrowRight />
              </button>
            </div>
            <button className="secondary full" onClick={() => go("catalog")}>
              Посмотреть все результаты
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Footer({ go }) {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <Logo />
          <p>Единая цифровая точка входа для предпринимателей Казахстана.</p>
        </div>
        <div>
          <b>Предпринимателю</b>
          <button onClick={() => go("catalog")}>Меры поддержки</button>
          <button onClick={() => go("cabinet")}>Мои заявки</button>
          <button onClick={() => go("tools")}>Инструменты</button>
        </div>
        <div>
          <b>О портале</b>
          <button>Группа «Байтерек»</button>
          <button onClick={() => go("reports")}>Аналитика</button>
          <button onClick={() => go("map")}>Карта проектов</button>
        </div>
        <div>
          <b>Поддержка</b>
          <span>1414</span>
          <button>Частые вопросы</button>
          <button onClick={() => go("admin")}>Демо конструктора</button>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© 2026 АО «НИХ «Байтерек»</span>
        <span>Конфиденциальность · Доступность</span>
        <span>
          <ShieldCheck /> Данные защищены
        </span>
      </div>
    </footer>
  );
}

export default App;
