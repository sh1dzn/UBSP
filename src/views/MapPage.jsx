"use client";
import { useMemo, useState } from "react";
import { ChevronDown, MapPin, X, RotateCcw } from "lucide-react";
import { projects, projectStats } from "../data/projects.js";
import { dictionaries } from "../data/dictionaries.js";
import { KZ_OUTLINE } from "../data/kzOutline.js";
import PageHero from "../shell/PageHero.jsx";


const ORG_COLOR_VAR = {
  "БРК": "--org-brk",
  "Даму": "--org-damu",
  "КазАгроФинанс": "--org-kaf",
  "АКК": "--org-akk",
  "KazakhExport": "--org-kexport",
  "БРК-Лизинг": "--org-brkl",
  "Отбасы банк": "--org-otbasy",
  "QIC": "--org-qic",
};
const ORGS = Object.keys(ORG_COLOR_VAR);

const STATUSES = ["Действует", "Реализуется", "Завершён"];
const STATUS_CHIP = { "Действует": "chip-green", "Реализуется": "chip", "Завершён": "chip-line" };

function orgColor(org) {
  return `var(${ORG_COLOR_VAR[org] || "--sky"})`;
}

function markerRadius(amountMln) {
  if (amountMln >= 5000) return 1.9;
  if (amountMln >= 1500) return 1.45;
  return 1.05;
}

function formatSum(amountMln) {
  if (amountMln >= 1000) {
    const bln = amountMln / 1000;
    return `${bln.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} млрд ₸`;
  }
  return `${amountMln.toLocaleString("ru-RU")} млн ₸`;
}

const YEARS = Array.from(new Set(projects.map((p) => p.year))).sort();

export default function MapPage({ notify }) {
  const [orgFilter, setOrgFilter] = useState([]);
  const [sector, setSector] = useState("");
  const [region, setRegion] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const projectPoint = (p) => ({
    x: 5 + ((p.lng - 46.4) / (87.4 - 46.4)) * 90,
    y: 5 + ((55.5 - p.lat) / (55.5 - 40.5)) * 90,
  });

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (orgFilter.length && !orgFilter.includes(p.org)) return false;
      if (sector && p.sector !== sector) return false;
      if (region && p.region !== region) return false;
      if (statusFilter.length && !statusFilter.includes(p.status)) return false;
      if (yearFrom && p.year < Number(yearFrom)) return false;
      if (yearTo && p.year > Number(yearTo)) return false;
      return true;
    });
  }, [orgFilter, sector, region, statusFilter, yearFrom, yearTo]);

  const filteredIds = useMemo(() => new Set(filtered.map((p) => p.id)), [filtered]);

  const regionCounts = useMemo(() => {
    const map = {};
    filtered.forEach((p) => { map[p.region] = (map[p.region] || 0) + 1; });
    const regionLabel = (v) => dictionaries.regions.find((r) => r.value === v)?.label || v;
    return Object.entries(map)
      .map(([value, count]) => ({ value, label: regionLabel(value), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filtered]);
  const maxRegionCount = regionCounts[0]?.count || 1;

  const toggleOrg = (org) => setOrgFilter((cur) => cur.includes(org) ? cur.filter((o) => o !== org) : [...cur, org]);
  const toggleStatus = (st) => setStatusFilter((cur) => cur.includes(st) ? cur.filter((s) => s !== st) : [...cur, st]);
  const resetFilters = () => { setOrgFilter([]); setSector(""); setRegion(""); setStatusFilter([]); setYearFrom(""); setYearTo(""); };

  const selectedProject = selected ? projects.find((p) => p.id === selected) : null;

  return (
    <div className="container">
      <PageHero
        photo="/assets/dir-rail.jpg"
        eyebrow="Карта проектов"
        title="Проекты, профинансированные группой Байтерек"
        sub="Кредиты, лизинг, гарантии и субсидии, доведённые до конкретных предприятий по всей стране."
      >
        <div className="mod-hero-stats on-dark">
          <span className="mod-stat"><b className="mono">{projectStats.total}</b> проектов</span>
          <span className="mod-stat"><b className="mono">{(projectStats.totalAmountBln / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} трлн ₸</b></span>
          <span className="mod-stat"><b className="mono">{projectStats.regionsCovered}</b> регионов</span>
          <span className="mod-stat"><b className="mono">{projectStats.jobs.toLocaleString("ru-RU")}</b> рабочих мест</span>
        </div>
      </PageHero>

      <section className="mod-section mod-map-layout">
        <aside className={"mod-filters" + (filtersOpen ? " open" : "")}>
          <button type="button" className="mod-filters-toggle" onClick={() => setFiltersOpen((v) => !v)}>
            Фильтры <ChevronDown size={16} style={{ transform: filtersOpen ? "rotate(180deg)" : "none" }} />
          </button>
          <div className="mod-filters-body">
            <div className="mod-filter-group">
              <span className="label">Организация</span>
              <div className="mod-chip-set">
                {ORGS.map((org) => (
                  <button
                    key={org}
                    type="button"
                    className={"mod-chip-toggle" + (orgFilter.includes(org) ? " active" : "")}
                    onClick={() => toggleOrg(org)}
                  >
                    {org}
                  </button>
                ))}
              </div>
            </div>

            <div className="mod-filter-group">
              <span className="label">Отрасль</span>
              <select className="select" value={sector} onChange={(e) => setSector(e.target.value)}>
                <option value="">Все отрасли</option>
                {dictionaries.sectors.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="mod-filter-group">
              <span className="label">Регион</span>
              <select className="select" value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="">Все регионы</option>
                {dictionaries.regions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="mod-filter-group">
              <span className="label">Статус</span>
              <div className="mod-chip-set">
                {STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={"mod-chip-toggle" + (statusFilter.includes(st) ? " active" : "")}
                    onClick={() => toggleStatus(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="mod-filter-group">
              <span className="label">Период</span>
              <div className="mod-year-row">
                <select className="select" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)}>
                  <option value="">с года</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select className="select" value={yearTo} onChange={(e) => setYearTo(e.target.value)}>
                  <option value="">по год</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="mod-count">Показано <b>{filtered.length}</b> из {projects.length}</div>
            <button type="button" className="btn btn-ghost" style={{ width: "100%" }} onClick={resetFilters}>
              <RotateCcw size={15} /> Сбросить фильтры
            </button>
          </div>
        </aside>

        <div>
          <div className="mod-map-panel">
            <div className="mod-map-svg-wrap">
              <svg className="mod-map-svg" viewBox="0 0 100 62" role="img" aria-label="Карта Казахстана с проектами">
                <path className="mod-kz-outline" d={KZ_OUTLINE} />
                {projects.map((p) => {
                  const visible = filteredIds.has(p.id);
                  const point = projectPoint(p);
                  const cx = point.x;
                  const cy = (point.y / 100) * 62;
                  const isSelected = selected === p.id;
                  return (
                    <circle
                      key={p.id}
                      cx={cx}
                      cy={cy}
                      r={markerRadius(p.amountMln)}
                      className={"mod-marker" + (isSelected ? " selected" : "") + (visible ? "" : " dim")}
                      fill={orgColor(p.org)}
                      onMouseEnter={() => setHovered(p.id)}
                      onMouseLeave={() => setHovered((h) => (h === p.id ? null : h))}
                      onClick={() => setSelected(p.id)}
                    />
                  );
                })}
              </svg>
              {hovered && (() => {
                const p = projects.find((pr) => pr.id === hovered);
                if (!p) return null;
                const point = projectPoint(p);
                return (
                  <div className="mod-tooltip" style={{ left: `${point.x}%`, top: `${point.y}%` }}>
                    <b>{p.name}</b>
                    <span className="mono">{formatSum(p.amountMln)}</span>
                  </div>
                );
              })()}
            </div>

            <div className="mod-legend">
              {ORGS.map((org) => (
                <span key={org} className="mod-legend-item">
                  <span className="mod-legend-dot" style={{ background: orgColor(org) }} />
                  {org}
                </span>
              ))}
            </div>

            {selectedProject ? (
              <div className="mod-project-card">
                <div className="mod-pc-top">
                  <div>
                    <span className="chip">{selectedProject.org}</span>
                    <h3>{selectedProject.name}</h3>
                    <div className="mod-pc-meta">
                      <span><MapPin size={13} style={{ verticalAlign: -2 }} /> {selectedProject.city}, {dictionaries.regions.find((r) => r.value === selectedProject.region)?.label}</span>
                      <span>{dictionaries.sectors.find((s) => s.value === selectedProject.sector)?.label}</span>
                      <span className={"chip " + (STATUS_CHIP[selectedProject.status] || "chip-line")}>{selectedProject.status}</span>
                    </div>
                  </div>
                  <button className="mod-modal-close" onClick={() => setSelected(null)} aria-label="Закрыть карточку проекта">
                    <X size={18} />
                  </button>
                </div>
                <div className="mod-pc-sum-label">Сумма финансирования</div>
                <div className="mod-pc-sum mono">{formatSum(selectedProject.amountMln)}</div>
                <p className="mod-pc-desc">{selectedProject.desc}</p>
                <div className="mod-pc-stats">
                  <div>Период<b className="mono">{selectedProject.year}</b></div>
                  <div>Рабочих мест<b className="mono">{selectedProject.jobs}</b></div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setDetailOpen(true)}
                >
                  Подробнее о проекте
                </button>
              </div>
            ) : (
              <div className="mod-pc-empty">Выберите точку на карте, чтобы увидеть карточку проекта</div>
            )}
          </div>

          <div className="mod-regions card">
            <span className="eyebrow">Распределение по регионам</span>
            <h2 className="section-title" style={{ margin: "8px 0 16px" }}>Топ-8 регионов по числу проектов</h2>
            {regionCounts.map((r) => (
              <div key={r.value} className={"mod-region-bar-row" + (region === r.value ? " active" : "")}>
                <button type="button" onClick={() => setRegion((cur) => cur === r.value ? "" : r.value)}>
                  <span className="mod-region-name">{r.label}</span>
                  <span className="mod-region-track">
                    <span className="mod-region-fill" style={{ width: `${(r.count / maxRegionCount) * 100}%` }} />
                  </span>
                  <span className="mod-region-val mono">{r.count}</span>
                </button>
              </div>
            ))}
            {regionCounts.length === 0 && <div className="mod-pc-empty">Нет проектов под текущие фильтры</div>}
          </div>
        </div>
      </section>
      {detailOpen && selectedProject && (
        <div className="mod-modal-overlay" role="dialog" aria-modal="true" aria-label={`Проект ${selectedProject.name}`} onClick={() => setDetailOpen(false)}>
          <div className="mod-project-detail" onClick={(e) => e.stopPropagation()}>
            <div className="mod-pc-top">
              <div><span className="eyebrow">Карточка профинансированного проекта</span><h2>{selectedProject.name}</h2></div>
              <button className="mod-modal-close" onClick={() => setDetailOpen(false)} aria-label="Закрыть"><X size={20} /></button>
            </div>
            <p className="mod-pc-desc">{selectedProject.desc}</p>
            <div className="mod-detail-grid">
              <div><span>Оператор</span><b>{selectedProject.org}</b></div>
              <div><span>Инструмент</span><b>{selectedProject.org.includes("Лизинг") || selectedProject.org === "КазАгроФинанс" ? "Лизинг" : selectedProject.org === "Даму" ? "Гарантия" : "Финансирование"}</b></div>
              <div><span>Объём</span><b className="mono">{formatSum(selectedProject.amountMln)}</b></div>
              <div><span>Год</span><b className="mono">{selectedProject.year}</b></div>
              <div><span>Рабочие места</span><b className="mono">{selectedProject.jobs}</b></div>
              <div><span>Статус</span><b>{selectedProject.status}</b></div>
              <div><span>Местоположение</span><b>{selectedProject.city}</b></div>
              <div><span>Координаты WGS84</span><b className="mono">{selectedProject.lat.toFixed(4)}, {selectedProject.lng.toFixed(4)}</b></div>
            </div>
            <a className="btn btn-primary" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${selectedProject.lat}&mlon=${selectedProject.lng}#map=11/${selectedProject.lat}/${selectedProject.lng}`}>
              Открыть точку в OpenStreetMap
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
