"use client";
import { useMemo, useState } from "react";
import { Search, ExternalLink, PlayCircle, X } from "lucide-react";
import { reports } from "../data/reports.js";

function typeLabel(type) {
  return type;
}

export default function Reports() {
  const [type, setType] = useState("");
  const [org, setOrg] = useState("");
  const [query, setQuery] = useState("");
  const [modalReport, setModalReport] = useState(null);

  const orgs = useMemo(() => Array.from(new Set(reports.map((r) => r.org))).sort((a, b) => a.localeCompare(b, "ru")), []);
  const types = useMemo(() => Array.from(new Set(reports.map((r) => r.type))), []);

  const featured = useMemo(() => reports.filter((r) => r.embeddable).slice(0, 2), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (type && r.type !== type) return false;
      if (org && r.org !== org) return false;
      if (q && !(r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || (r.tags || []).some((t) => t.toLowerCase().includes(q)))) return false;
      return true;
    });
  }, [type, org, query]);

  const featuredIds = new Set(featured.map((r) => r.id));
  const rest = filtered.filter((r) => !featuredIds.has(r.id));

  const renderCard = (r) => (
    <div key={r.id} className="card card-hover mod-report-card">
      <div className="mod-report-top">
        <span className="chip">{typeLabel(r.type)}</span>
        <span className="mono mod-report-updated">{r.period}</span>
      </div>
      <h3>{r.title}</h3>
      <span className="mod-report-org">{r.org}</span>
      <p className="mod-report-desc">{r.desc}</p>
      <div className="mod-report-tags">
        {(r.tags || []).map((t) => <span key={t} className="chip chip-line">{t}</span>)}
      </div>
      <div className="mod-report-updated">Обновлено: {r.updated}</div>
      <div className="mod-report-actions">
        <a className="btn btn-ghost" href={r.url} target="_blank" rel="noreferrer">
          Открыть <ExternalLink size={15} />
        </a>
        {r.embeddable && (
          <button className="btn btn-primary" onClick={() => setModalReport(r)}>
            <PlayCircle size={15} /> Смотреть здесь
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="container">
      <section className="mod-hero">
        <span className="eyebrow">Аналитика</span>
        <h1>Аналитика и отчётность группы</h1>
        <p className="mod-hero-sub">
          Единый каталог отчётов, исследований и дашбордов дочерних организаций Байтерека — без поиска по
          отдельным сайтам институтов развития.
        </p>
      </section>

      <section className="mod-section">
        <div className="mod-reports-toolbar">
          <div className="mod-chip-set">
            <button
              type="button"
              className={"mod-chip-toggle" + (type === "" ? " active" : "")}
              onClick={() => setType("")}
            >
              Все типы
            </button>
            {types.map((t) => (
              <button
                key={t}
                type="button"
                className={"mod-chip-toggle" + (type === t ? " active" : "")}
                onClick={() => setType((cur) => cur === t ? "" : t)}
              >
                {typeLabel(t)}
              </button>
            ))}
          </div>
          <div className="row" style={{ gap: 12 }}>
            <select className="select" style={{ width: 200 }} value={org} onChange={(e) => setOrg(e.target.value)}>
              <option value="">Все организации</option>
              {orgs.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <div className="mod-search">
              <Search size={15} />
              <input
                className="input"
                placeholder="Поиск по материалам..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {featured.length > 0 && !type && !org && !query && (
          <>
            <div className="mod-section-head">
              <div>
                <span className="eyebrow">Избранное аналитиками</span>
              </div>
            </div>
            <div className="mod-featured">
              {featured.map(renderCard)}
            </div>
          </>
        )}

        <div className="mod-section-head">
          <div>
            <span className="eyebrow">Каталог материалов</span>
          </div>
          <span className="muted mono small">{filtered.length} из {reports.length}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <h3>Ничего не найдено</h3>
            <p>Измените фильтры или запрос поиска.</p>
          </div>
        ) : (
          <div className="mod-report-grid">
            {(type || org || query ? filtered : rest).map(renderCard)}
          </div>
        )}
      </section>

      {modalReport && (
        <div className="mod-modal-overlay" onClick={() => setModalReport(null)}>
          <div className="mod-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mod-modal-head">
              <h3>{modalReport.title}</h3>
              <button className="mod-modal-close" onClick={() => setModalReport(null)} aria-label="Закрыть">
                <X size={18} />
              </button>
            </div>
            <iframe src={modalReport.url} title={modalReport.title} />
            <div className="mod-modal-note">Материал загружается с сайта организации</div>
          </div>
        </div>
      )}
    </div>
  );
}
