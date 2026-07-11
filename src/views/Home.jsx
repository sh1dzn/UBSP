"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, ArrowRight, MapPin, BarChart3 } from "lucide-react";
import api from "../api.js";

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
      <section className="pub-hero2">
        <div className="pub-hero2-media" aria-hidden="true" />
        <div className="container pub-hero2-content">
          <span className="pub-hero-eyebrow">Группа АО «НУХ «Байтерек»</span>
          <h1 className="display-xl">
            Одно окно ко всем мерам поддержки бизнеса
          </h1>
          <p className="pub-hero2-sub">
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
          <div className="pub-hero2-bottom">
            <button className="pub-cta-lime" onClick={() => go("/catalog")}>
              Все меры поддержки <span className="pub-cta-circle"><ArrowRight size={15} /></span>
            </button>
            <div className="pub-hero2-tags">
              {["Кредитование", "Лизинг", "Гарантирование", "Субсидирование"].map((k, i) => (
                <button
                  key={k}
                  className={i === 0 ? "active" : ""}
                  onClick={() => go(`/catalog?kind=${encodeURIComponent(k)}`)}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="pub-facts-strip">
        <div className="container pub-hero-facts mono">
          <span><b>70+</b> мер поддержки</span>
          <span><b>8</b> институтов развития</span>
          <span>решение <b>от 5 дней</b></span>
          <span>вход через <b>eGov Business</b></span>
        </div>
      </div>

      <section className="pub-gallery container">
        <div className="pub-gallery-col">
          <figure
            className="pub-gcard tall"
            onClick={() => go("/catalog?kind=Субсидирование")}
            role="link"
            tabIndex={0}
          >
            <img src="/assets/dir-fields.jpg" alt="Субсидирование АПК" loading="lazy" />
            <figcaption><span className="mono">01</span><b>Субсидирование</b></figcaption>
          </figure>
          <div className="pub-gallery-arrows" aria-hidden="true">
            <span className="pub-arrow-circle"><ArrowRight size={15} /></span>
            <span className="pub-arrow-circle lime"><ArrowRight size={15} /></span>
          </div>
        </div>

        <div className="pub-gallery-col offset">
          <div className="pub-gallery-head">
            <h2>Начните сейчас</h2>
            <p>Подбор меры занимает минуту — данные компании подтянутся по БИН автоматически.</p>
            <button
              className="pub-arrow-circle dark lg"
              aria-label="Открыть навигатор"
              onClick={() => openAssistant()}
            >
              <ArrowRight size={17} />
            </button>
          </div>
          <figure
            className="pub-gcard"
            onClick={() => go("/service/wagons-leasing")}
            role="link"
            tabIndex={0}
          >
            <img src="/assets/dir-rail.jpg" alt="Лизинг подвижного состава" loading="lazy" />
            <figcaption><span className="mono">02</span><b>Лизинг и транспорт</b></figcaption>
          </figure>
        </div>

        <div className="pub-gallery-col">
          <figure
            className="pub-gcard tall"
            onClick={() => go("/service/agro-livestock")}
            role="link"
            tabIndex={0}
          >
            <img src="/assets/dir-agro.jpg" alt="Финансирование животноводства" loading="lazy" />
            <figcaption><span className="mono">03</span><b>Агрофинансирование</b></figcaption>
          </figure>
        </div>

        <div className="pub-gallery-col offset2">
          <figure
            className="pub-gcard"
            onClick={() => go("/catalog?kind=Экспорт")}
            role="link"
            tabIndex={0}
          >
            <img src="/assets/dir-export.jpg" alt="Поддержка экспорта" loading="lazy" />
            <figcaption><span className="mono">04</span><b>Экспорт</b></figcaption>
          </figure>
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
