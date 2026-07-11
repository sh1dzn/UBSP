"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Search, ArrowRight, Banknote, Truck, ShieldCheck, HandCoins, Globe2, TrendingUp,
  MapPin, BarChart3,
} from "lucide-react";
import api from "../api.js";
import { KZ_OUTLINE } from "../data/kzOutline.js";
import { projects } from "../data/projects.js";

const CATEGORIES = [
  { kind: "Кредитование", label: "Кредитование", desc: "Займы на инвестиции и оборотный капитал", icon: Banknote },
  { kind: "Лизинг", label: "Лизинг", desc: "Техника, оборудование и транспорт в рассрочку", icon: Truck },
  { kind: "Гарантирование", label: "Гарантирование", desc: "Частичное покрытие обеспечения по кредиту", icon: ShieldCheck },
  { kind: "Субсидирование", label: "Субсидирование", desc: "Возмещение части ставки вознаграждения", icon: HandCoins },
  { kind: "Экспорт", label: "Экспорт", desc: "Страхование и финансирование поставок за рубеж", icon: Globe2 },
  { kind: "Инвестиции", label: "Инвестиции", desc: "Соинвестирование в проекты роста бизнеса", icon: TrendingUp },
];

const EXAMPLE_CHIPS = [
  "купить 20 вагонов в лизинг",
  "кредит на закупку скота",
  "гарантия по кредиту без залога",
  "субсидирование ставки для АПК",
];

const HOW_IT_WORKS = [
  { title: "Найдите меру", text: "Опишите задачу навигатору или отфильтруйте каталог по отрасли и виду поддержки." },
  { title: "Проверьте соответствие", text: "Система сверит условия с данными компании по БИН и покажет, что нужно донастроить." },
  { title: "Подайте заявку онлайн", text: "Короткая предварительная форма — полный пакет документов потребуется только после одобрения." },
  { title: "Подпишите ЭЦП", text: "Заявка удостоверяется электронной подписью и уходит в BPM дочерней организации." },
  { title: "Отслеживайте в кабинете", text: "Статус, запросы документов и решения — в едином личном кабинете предпринимателя." },
];

const ECOSYSTEM = [
  "Банк развития Казахстана", "Фонд «Даму»", "БРК-Лизинг", "КазАгроФинанс",
  "Аграрная кредитная корпорация", "KazakhExport", "Отбасы банк", "QIC",
];

function plural(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "мера доступна";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "меры доступны";
  return "мер доступно";
}

function ServiceCardSkeleton() {
  return (
    <div className="card pub-service-card">
      <div className="pub-skel" style={{ width: 90, height: 20 }} />
      <div className="pub-skel" style={{ width: "80%", height: 20 }} />
      <div className="pub-skel" style={{ width: "100%", height: 40 }} />
      <div className="pub-skel" style={{ width: 110, height: 34 }} />
    </div>
  );
}

export default function Home({ go, notify, openAssistant }) {
  const [services, setServices] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    api.services()
      .then((data) => { if (alive) setServices((data.services || []).filter((s) => s.status === "published")); })
      .catch(() => { if (alive) setServices([]); });
    return () => { alive = false; };
  }, []);

  const kindCounts = useMemo(() => {
    const map = {};
    (services || []).forEach((s) => { map[s.kind] = (map[s.kind] || 0) + 1; });
    return map;
  }, [services]);

  const popular = useMemo(() => {
    if (!services) return null;
    const priority = { "wagons-leasing": 0, "agro-livestock": 1 };
    return [...services]
      .sort((a, b) => (priority[a.id] ?? 9) - (priority[b.id] ?? 9) || a.title.localeCompare(b.title, "ru"))
      .slice(0, 3);
  }, [services]);

  const handleSearch = (e) => {
    e.preventDefault();
    openAssistant(query.trim() || undefined);
  };

  return (
    <>
      <section className="pub-hero dark-band">
        <div className="container pub-hero-grid">
          <div className="pub-hero-copy">
            <span className="pub-hero-eyebrow">Группа АО «НУХ «Байтерек» · Единый портал поддержки бизнеса</span>
            <h1 className="display">
              <span className="accent">Одно окно</span> ко всем мерам поддержки бизнеса
            </h1>
            <p className="pub-hero-sub">
              Кредиты, лизинг, гарантии и субсидии восьми институтов развития —
              подбор за минуту, заявка онлайн, статус в одном кабинете.
            </p>
            <form className="pub-search" onSubmit={handleSearch}>
              <Search size={18} className="pub-search-icon" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Опишите задачу: «купить 20 вагонов в лизинг»…"
                aria-label="Опишите задачу бизнеса"
              />
              <button type="submit" className="pub-search-btn">
                Подобрать <ArrowRight size={16} />
              </button>
            </form>
            <div className="pub-chips">
              <span className="pub-chips-label">Например:</span>
              {EXAMPLE_CHIPS.map((text) => (
                <button key={text} type="button" className="pub-chip-ex" onClick={() => openAssistant(text)}>
                  {text}
                </button>
              ))}
            </div>
          </div>

          <div className="pub-hero-map" aria-hidden="true">
            <svg viewBox="0 0 100 62">
              <path className="pub-kz-fill" d={KZ_OUTLINE} />
              {projects.slice(0, 14).map((p, i) => (
                <g key={p.id} transform={`translate(${p.x}, ${(p.y / 100) * 62})`}>
                  <circle className="pub-kz-ring" r="0.8" style={{ animationDelay: `${(i % 7) * 0.9}s` }} />
                  <circle className={"pub-kz-dot" + (i % 4 === 0 ? " gold" : "")} r="0.8" />
                </g>
              ))}
            </svg>
            <div className="pub-hero-map-caption mono">
              проекты, профинансированные группой «Байтерек»
            </div>
          </div>
        </div>

        <div className="container pub-hero-rail-row">
          <div className="rail on-dark">
            {[
              ["Подбор", "Навигатор подбирает меры по описанию задачи"],
              ["Заявка", "Короткая форма — данные компании подтягиваются по БИН"],
              ["Рассмотрение", "Решение профильного института развития"],
              ["Финансирование", "Выплата, лизинг или открытие гарантии"],
            ].map(([title, desc], i) => (
              <div key={title} className={"rail-node" + (i === 0 ? " done" : i === 1 ? " active" : "")}>
                <div className="rail-title">{title}</div>
                <div className="pub-hero-rail-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="pub-hero-facts-band">
          <div className="container pub-hero-facts mono">
            <span><b>70+</b> мер поддержки</span>
            <span><b>8</b> институтов развития</span>
            <span>решение <b>от 5 дней</b></span>
            <span>вход через <b>eGov Business</b></span>
          </div>
        </div>
      </section>

      <section className="pub-section container">
        <div className="pub-section-head">
          <div>
            <span className="eyebrow">Направления поддержки</span>
            <h2>Выберите вид поддержки под вашу задачу</h2>
          </div>
        </div>
        <div className="pub-cat-grid">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = kindCounts[cat.kind];
            return (
              <button
                key={cat.kind}
                className="card card-hover pub-cat-card"
                onClick={() => go(`/catalog?kind=${encodeURIComponent(cat.kind)}`)}
              >
                <span className="pub-cat-icon"><Icon size={20} /></span>
                <div>
                  <h3>{cat.label}</h3>
                  <p>{cat.desc}</p>
                </div>
                <span className="pub-cat-count">
                  {services === null ? "…" : <><b>{count || 0}</b> {plural(count || 0)}</>}
                  <ArrowRight size={14} className="pub-cat-arrow" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="pub-section container">
        <div className="pub-section-head">
          <div>
            <span className="eyebrow">Популярное</span>
            <h2>Востребованные меры поддержки</h2>
          </div>
          <button className="btn btn-ghost" onClick={() => go("/catalog")}>
            Весь каталог <ArrowRight size={16} />
          </button>
        </div>
        <div className="pub-service-grid">
          {popular === null
            ? [1, 2, 3].map((i) => <ServiceCardSkeleton key={i} />)
            : popular.length === 0
              ? <div className="empty" style={{ gridColumn: "1 / -1" }}>
                  <h3>Каталог пока пуст</h3>
                  <p>Меры поддержки скоро появятся.</p>
                </div>
              : popular.map((s) => (
                  <div key={s.id} className="card card-hover pub-service-card">
                    <div className="pub-service-top">
                      <span className="chip">{s.orgShort || s.org}</span>
                      <span className="chip chip-gold pub-badge-popular">Популярное</span>
                    </div>
                    <h3>{s.title}</h3>
                    <p className="pub-summary">{s.summary}</p>
                    <div className="pub-mini-table">
                      {s.card?.amount && (
                        <div className="pub-mini-item"><span>Сумма</span><b className="mono">{s.card.amount}</b></div>
                      )}
                      {s.card?.term && (
                        <div className="pub-mini-item"><span>Срок</span><b className="mono">{s.card.term}</b></div>
                      )}
                      {s.card?.rate && (
                        <div className="pub-mini-item"><span>Ставка</span><b className="mono">{s.card.rate}</b></div>
                      )}
                    </div>
                    <button className="btn btn-primary" onClick={() => go(`/service/${s.id}`)}>
                      Подробнее <ArrowRight size={16} />
                    </button>
                  </div>
                ))
          }
        </div>
      </section>

      <section className="pub-section container">
        <div className="pub-section-head">
          <div>
            <span className="eyebrow">Как это работает</span>
            <h2>Путь от идеи до финансирования</h2>
          </div>
        </div>
        <div className="rail pub-rail-wide">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className={"rail-node" + (i === 0 ? " active" : "")}>
              <div className="rail-title">{step.title}</div>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pub-eco dark-band">
        <div className="container">
          <span className="eyebrow on-dark" style={{ marginBottom: 16, display: "inline-flex" }}>Экосистема группы «Байтерек»</span>
          <div className="pub-eco-orgs">
            {ECOSYSTEM.map((org) => <span key={org}>{org}</span>)}
          </div>
          <div className="pub-eco-links">
            <button className="card card-hover pub-eco-link" onClick={() => go("/map")}>
              <div>
                <h4>Карта проектов</h4>
                <p>Профинансированные проекты по регионам и отраслям</p>
                <span className="mono">24 проекта · 410 млрд ₸ в демо-данных</span>
              </div>
              <MapPin size={20} className="muted" />
            </button>
            <button className="card card-hover pub-eco-link" onClick={() => go("/reports")}>
              <div>
                <h4>Аналитика</h4>
                <p>Динамика выдач и структура поддержки по мерам</p>
                <span className="mono">данные обновляются ежедневно</span>
              </div>
              <BarChart3 size={20} className="muted" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
