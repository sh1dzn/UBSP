"use client";
import { useMemo, useState } from "react";
import { ChevronDown, MapPin, X, RotateCcw } from "lucide-react";
import { projects, projectStats } from "../data/projects.js";
import { dictionaries } from "../data/dictionaries.js";

// Упрощённый узнаваемый контур Казахстана: широкий запад с каспийским
// изгибом и полуостровом Мангистау, северный выступ к Петропавловску,
// «клюв» на юго-восток к Жетысу/Алматы, волнистая южная граница.
const KZ_OUTLINE =
  "M55.2,3.6 L56.8,3.8 L57.9,4.6 L58.6,4.2 L59.7,4.2 L60.2,5.0 L60.3,6.4 L60.8,6.9 L60.6,9.0 L61.7,9.1 L61.9,8.4 " +
  "L62.6,8.4 L62.4,8.2 L62.6,7.9 L63.4,8.3 L63.7,9.1 L64.7,9.1 L65.6,9.7 L66.8,9.2 L66.8,10.4 L66.2,10.4 " +
  "L65.7,11.2 L66.1,11.7 L66.6,11.2 L67.7,11.2 L68.3,11.7 L68.4,10.9 L69.5,10.3 L70.1,10.3 L70.7,9.7 L70.7,9.2 " +
  "L72.6,8.6 L72.8,8.1 L73.7,8.2 L74.0,7.8 L74.5,8.1 L74.5,8.7 L73.7,9.5 L77.2,12.7 L82.3,22.4 L82.5,22.0 " +
  "L83.1,21.7 L83.0,20.9 L83.5,20.7 L83.5,20.3 L84.9,20.8 L85.1,21.5 L84.8,21.7 L85.6,21.9 L85.8,22.5 L86.3,22.2 " +
  "L88.0,22.6 L88.7,21.9 L90.6,21.6 L91.9,22.5 L92.9,24.6 L94.5,25.2 L94.6,26.0 L95.5,26.9 L97.0,27.4 L98.2,26.1 " +
  "L98.8,26.2 L98.6,27.0 L99.5,28.3 L100.0,28.3 L100.0,28.9 L98.6,29.6 L98.7,30.6 L98.2,31.3 L97.2,31.8 " +
  "L96.4,31.8 L96.0,32.2 L95.7,32.7 L96.0,35.5 L95.7,36.5 L94.7,36.8 L93.8,37.4 L93.3,36.9 L92.0,37.1 L89.6,36.2 " +
  "L89.0,37.8 L87.9,41.3 L87.9,42.1 L88.5,42.5 L88.4,43.5 L87.6,43.2 L87.0,43.6 L86.1,42.9 L85.7,43.2 L83.1,43.6 " +
  "L82.0,44.3 L83.4,44.7 L83.2,46.9 L84.1,49.8 L83.9,50.3 L83.2,50.6 L83.6,51.1 L82.6,51.7 L82.7,53.3 L82.3,53.3 " +
  "L81.7,52.5 L80.8,52.5 L79.6,51.4 L78.9,51.4 L78.4,51.0 L74.4,50.8 L73.1,51.2 L72.6,51.0 L70.5,51.2 L69.3,51.0 " +
  "L68.3,50.2 L67.3,50.2 L66.4,50.8 L66.2,52.8 L65.9,52.9 L65.3,52.4 L64.7,52.4 L62.2,51.2 L61.7,51.5 L60.8,51.4 " +
  "L59.0,53.9 L58.6,53.7 L58.0,54.6 L55.5,56.0 L55.3,56.5 L54.1,57.3 L54.1,58.4 L53.6,58.4 L52.6,57.8 L52.6,56.9 " +
  "L52.1,56.5 L51.2,56.8 L49.7,56.8 L49.4,56.5 L49.0,54.6 L47.7,53.9 L47.9,51.2 L47.0,50.8 L46.5,49.6 L45.2,48.4 " +
  "L44.3,48.8 L41.5,48.5 L38.1,49.2 L35.8,46.7 L35.6,45.9 L33.6,44.4 L29.6,42.0 L23.5,43.9 L23.5,56.4 L22.0,56.5 " +
  "L20.7,54.2 L18.9,52.8 L17.3,52.9 L14.7,54.3 L14.6,53.2 L15.1,52.5 L15.1,51.7 L14.7,51.2 L13.1,51.1 L12.6,50.1 " +
  "L11.7,49.9 L11.9,49.0 L10.7,47.2 L10.7,46.6 L9.4,46.2 L9.0,45.3 L9.4,44.9 L10.8,44.9 L11.6,45.4 L11.7,45.0 " +
  "L10.8,44.1 L11.6,43.5 L12.2,42.2 L12.5,42.5 L12.9,42.1 L13.4,42.3 L15.2,42.2 L15.2,41.4 L16.2,39.8 L15.9,39.6 " +
  "L15.7,39.1 L14.9,39.4 L16.0,38.6 L16.1,38.1 L15.7,37.4 L15.5,37.6 L15.1,37.2 L14.3,37.7 L13.1,37.3 L12.9,38.1 " +
  "L12.2,36.8 L11.6,36.8 L10.3,37.3 L10.1,37.7 L9.5,37.7 L8.1,39.0 L7.7,38.9 L7.7,39.2 L5.0,38.1 L5.2,37.3 " +
  "L6.1,37.4 L5.0,35.3 L4.0,34.0 L2.6,33.8 L2.2,34.2 L1.7,33.8 L1.4,33.2 L1.5,32.3 L0.0,31.3 L0.6,29.5 L1.3,28.9 " +
  "L0.8,28.0 L0.9,26.1 L1.9,25.5 L2.3,23.9 L3.0,23.7 L4.9,26.0 L5.4,25.8 L5.8,25.3 L5.4,24.6 L5.3,23.1 L7.1,22.2 " +
  "L7.0,21.6 L7.2,21.2 L8.0,21.2 L9.1,20.6 L9.9,19.7 L9.9,19.1 L10.3,19.1 L10.6,18.6 L11.0,18.6 L11.2,19.0 " +
  "L12.1,19.0 L12.2,19.7 L12.8,19.7 L13.0,19.1 L14.4,18.8 L15.2,19.8 L17.3,19.8 L17.7,20.0 L17.7,20.6 L18.6,20.9 " +
  "L19.2,21.9 L19.6,22.0 L19.8,21.5 L20.5,21.5 L22.6,23.1 L23.3,22.9 L23.7,22.0 L24.5,21.3 L24.9,21.6 L25.0,21.2 " +
  "L25.9,21.2 L26.4,21.3 L26.9,22.0 L27.4,22.0 L27.6,21.1 L28.6,21.2 L29.0,20.9 L29.6,21.1 L29.9,22.1 L30.5,22.8 " +
  "L31.3,22.9 L32.2,23.5 L32.9,23.1 L33.1,22.1 L33.6,22.1 L33.9,22.8 L34.8,23.1 L36.7,22.0 L36.9,20.4 L36.5,20.0 " +
  "L35.3,19.9 L35.1,19.4 L34.3,19.4 L33.9,19.0 L34.0,18.8 L32.9,17.9 L34.8,17.1 L35.6,16.3 L34.8,15.1 L34.8,14.6 " +
  "L36.0,13.6 L38.3,13.6 L37.4,13.0 L35.8,12.6 L36.0,11.7 L35.3,11.3 L35.3,10.9 L36.0,10.4 L35.6,10.1 L35.6,9.7 " +
  "L36.0,9.7 L36.2,9.2 L38.5,9.5 L40.6,9.1 L40.7,8.7 L42.8,8.6 L44.5,7.9 L45.4,7.8 L45.7,8.1 L45.9,7.3 L46.4,6.9 " +
  "L47.2,6.9 L47.7,6.5 L48.2,6.9 L51.0,5.9 L51.9,5.9 L52.3,5.4 L53.1,5.5 L53.4,4.5 L54.1,4.5 L54.5,3.7 Z ";

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
  if (amountMln >= 5000) return 3.4;
  if (amountMln >= 1500) return 2.4;
  return 1.6;
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
      <section className="mod-hero">
        <span className="eyebrow">Карта проектов</span>
        <h1>Проекты, профинансированные группой Байтерек</h1>
        <p className="mod-hero-sub">
          Кредиты, лизинг, гарантии и субсидии, доведённые до конкретных предприятий по всей стране —
          от животноводческих ферм до промышленных производств.
        </p>
        <div className="mod-hero-stats">
          <span className="mod-stat"><b className="mono">{projectStats.total}</b> проектов</span>
          <span className="mod-stat"><b className="mono">{(projectStats.totalAmountBln / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} трлн ₸</b></span>
          <span className="mod-stat"><b className="mono">{projectStats.regionsCovered}</b> регионов</span>
          <span className="mod-stat"><b className="mono">{projectStats.jobs.toLocaleString("ru-RU")}</b> рабочих мест</span>
        </div>
      </section>

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
                  const cx = p.x;
                  const cy = (p.y / 100) * 62;
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
                return (
                  <div className="mod-tooltip" style={{ left: `${p.x}%`, top: `${(p.y / 100) * 100}%` }}>
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
                  onClick={() => notify("Демо: переход в ИС Аналитического центра", selectedProject.name)}
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
            <h2 style={{ fontSize: 18, margin: "8px 0 16px" }}>Топ-8 регионов по числу проектов</h2>
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
    </div>
  );
}
