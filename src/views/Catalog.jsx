"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search, Bot, Layers, X } from "lucide-react";
import api from "../api.js";
import PageHero from "../shell/PageHero.jsx";

const KINDS = ["Кредитование", "Лизинг", "Гарантирование", "Субсидирование", "Экспорт", "Страхование", "Инвестиции"];

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

export default function Catalog({ go, route, openAssistant }) {
  const [services, setServices] = useState(null);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState(route.query?.kind || "");
  const [orgs, setOrgs] = useState([]);
  const [audience, setAudience] = useState("");

  useEffect(() => {
    let alive = true;
    api.services()
      .then((data) => { if (alive) setServices((data.services || []).filter((s) => s.status === "published")); })
      .catch(() => { if (alive) setServices([]); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setKind(route.query?.kind || "");
  }, [route.query?.kind]);

  const allOrgs = useMemo(() => {
    const set = new Set();
    (services || []).forEach((s) => set.add(s.orgShort || s.org));
    return [...set].sort((a, b) => a.localeCompare(b, "ru"));
  }, [services]);

  const allAudience = useMemo(() => {
    const set = new Set();
    (services || []).forEach((s) => (s.audience || []).forEach((a) => set.add(a)));
    return [...set].sort();
  }, [services]);

  const filtered = useMemo(() => {
    if (!services) return null;
    const q = search.trim().toLowerCase();
    let list = services.filter((s) => {
      if (kind && s.kind !== kind) return false;
      if (orgs.length && !orgs.includes(s.orgShort || s.org)) return false;
      if (audience && !(s.audience || []).includes(audience)) return false;
      if (q) {
        const hay = [s.title, s.summary, s.org, ...(s.tags || [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const priority = { "wagons-leasing": 0, "agro-livestock": 1 };
    list = list.sort((a, b) => (priority[a.id] ?? 9) - (priority[b.id] ?? 9) || a.title.localeCompare(b.title, "ru"));
    return list;
  }, [services, search, kind, orgs, audience]);

  const toggleOrg = (o) => setOrgs((prev) => prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]);
  const resetFilters = () => { setSearch(""); setKind(""); setOrgs([]); setAudience(""); };
  const hasFilters = search || kind || orgs.length || audience;

  return (
    <div className="container pub-section">
      <PageHero
        photo="/assets/hero-steppe.jpg"
        eyebrow="Каталог"
        title="Меры поддержки бизнеса"
        sub="Кредиты, лизинг, гарантии и субсидии восьми институтов развития — в одном каталоге с фильтрами."
      >
        <div className="page-hero-actions">
          <button className="pub-cta-lime" onClick={() => openAssistant(search || undefined)}>
            Спросить навигатора <span className="pub-cta-circle"><Bot size={15} /></span>
          </button>
          <span className="mono" style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
            {filtered === null ? "загрузка…" : `найдено: ${filtered.length}`}
          </span>
        </div>
      </PageHero>

      <div className="pub-catalog-layout">
        <aside className="pub-filters">
          <div className="pub-filter-group">
            <h4>Поиск</h4>
            <div className="row" style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: 12, color: "var(--faint)" }} />
              <input
                className="input"
                style={{ paddingLeft: 34 }}
                placeholder="Название, тег, отрасль…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="pub-filter-group">
            <h4>Вид поддержки</h4>
            <div className="pub-filter-chips">
              <button className={"pub-filter-chip" + (kind === "" ? " active" : "")} onClick={() => setKind("")}>Все</button>
              {KINDS.map((k) => (
                <button key={k} className={"pub-filter-chip" + (kind === k ? " active" : "")} onClick={() => setKind(k)}>
                  {k}
                </button>
              ))}
            </div>
          </div>

          {allOrgs.length > 0 && (
            <div className="pub-filter-group">
              <h4>Организация</h4>
              <div className="pub-filter-list">
                {allOrgs.map((o) => (
                  <label key={o} className="pub-filter-check">
                    <input type="checkbox" checked={orgs.includes(o)} onChange={() => toggleOrg(o)} />
                    {o}
                  </label>
                ))}
              </div>
            </div>
          )}

          {allAudience.length > 0 && (
            <div className="pub-filter-group">
              <h4>Аудитория</h4>
              <div className="pub-filter-chips">
                <button className={"pub-filter-chip" + (audience === "" ? " active" : "")} onClick={() => setAudience("")}>Все</button>
                {allAudience.map((a) => (
                  <button key={a} className={"pub-filter-chip" + (audience === a ? " active" : "")} onClick={() => setAudience(a)}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasFilters && (
            <button className="btn btn-ghost btn-sm pub-filter-reset" onClick={resetFilters}>
              <X size={14} /> Сбросить фильтры
            </button>
          )}
        </aside>

        <div>
          {filtered === null ? (
            <div className="pub-service-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => <ServiceCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <h3>Ничего не найдено</h3>
              <p>Попробуйте изменить фильтры или опишите задачу словами.</p>
              <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => openAssistant(search || undefined)}>
                <Bot size={16} /> Спросить навигатора
              </button>
            </div>
          ) : (
            <div className="pub-service-grid">
              {filtered.map((s) => (
                <div key={s.id} className="card card-hover pub-service-card">
                  <div className="pub-service-top">
                    <span className="chip">{s.orgShort || s.org}</span>
                    <span className="chip chip-line">{s.kind}</span>
                    {s.complexity === "complex" && (
                      <span className="chip chip-amber"><Layers size={12} /> многоэтапная</span>
                    )}
                  </div>
                  <h3>{s.title}</h3>
                  <p className="pub-summary">{s.summary}</p>
                  {s.audience?.length > 0 && <p className="pub-card-audience"><b>Для кого:</b> {s.audience.join(", ")}</p>}
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
                    {s.card?.decisionDays && (
                      <div className="pub-mini-item"><span>Решение</span><b className="mono">{s.card.decisionDays} дн.</b></div>
                    )}
                  </div>
                  {s.card?.resultText && <p className="pub-card-outcome"><b>Результат:</b> {s.card.resultText}</p>}
                  {s.tags?.length > 0 && (
                    <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
                      {s.tags.map((t) => <span key={t} className="chip chip-line">{t}</span>)}
                    </div>
                  )}
                  <button className="btn btn-primary" onClick={() => go(`/service/${s.id}`)}>
                    Подробнее <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
