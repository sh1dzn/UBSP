"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Inbox,
  Cable,
  Plus,
  Pencil,
  RefreshCcw,
  ShieldCheck,
  Radio,
  Database,
  FileEdit,
  Settings,
} from "lucide-react";
import api from "../../api.js";
import Constructor from "./Constructor.jsx";
import { useAuth } from "../../shell/auth.js";
import { dictionaries } from "../../data/dictionaries.js";

const SECTIONS = [
  { id: "services", label: "Услуги", icon: Boxes },
  { id: "dictionaries", label: "Справочники", icon: Database },
  { id: "content", label: "Контент", icon: FileEdit },
  { id: "configuration", label: "Конфигурация", icon: Settings },
  { id: "applications", label: "Заявки", icon: Inbox },
  { id: "integrations", label: "Интеграции", icon: Cable },
];

const STATUS_CHIP = {
  published: { cls: "chip-green", label: "Опубликована" },
  draft: { cls: "chip-amber", label: "Черновик" },
  archived: { cls: "chip-line", label: "В архиве" },
};

const APP_STATUS_CHIP = {
  submitted: "chip-amber",
  review: "chip-amber",
  info_requested: "chip-amber",
  stage_approved: "chip-green",
  approved: "chip-green",
  rejected: "chip-red",
};

function countStats(service) {
  const stages = service.stages || [];
  let steps = 0;
  let fields = 0;
  for (const stage of stages) {
    const stageSteps = stage.steps || [];
    steps += stageSteps.length;
    for (const step of stageSteps) fields += (step.fields || []).length;
  }
  return { stages: stages.length, steps, fields };
}

function emptyService() {
  const stamp = Date.now().toString(36);
  return {
    id: `new-service-${stamp}`,
    title: "Новая услуга",
    org: "АО «БРК»",
    orgShort: "БРК",
    kind: "Кредитование",
    category: "finance",
    audience: ["ТОО", "АО", "ИП"],
    tags: [],
    summary: "",
    status: "draft",
    version: 0,
    updatedAt: new Date().toISOString().slice(0, 10),
    complexity: "simple",
    card: {
      amount: "",
      term: "",
      rate: "",
      decisionDays: 10,
      benefits: [],
      conditions: [],
      documents: [],
      faq: [],
      resultText: "",
    },
    stages: [
      {
        id: "stage-1",
        title: "Заявка",
        description: "",
        steps: [
          {
            id: "step-1",
            title: "Новый шаг",
            hint: "",
            fields: [],
          },
        ],
      },
    ],
    rules: [],
  };
}

export default function Admin({ go, route, notify, openAssistant }) {
  const { user, ready } = useAuth();
  const [section, setSection] = useState("services");
  const [services, setServices] = useState([]);
  const [applications, setApplications] = useState([]);
  const [integrations, setIntegrations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [openService, setOpenService] = useState(null); // service object в конструкторе
  const [dictionaryState, setDictionaryState] = useState(() => JSON.parse(JSON.stringify(dictionaries)));
  const [contentState, setContentState] = useState({ heroTitle: "Единый портал поддержки бизнеса", heroSubtitle: "Найдите подходящую меру поддержки и подайте заявку онлайн", supportPhone: "1408", announcement: "Приём заявок открыт" });
  const [configState, setConfigState] = useState({ maintenanceMode: false, aiNavigator: true, eGovPrefill: true, applicationSigning: true, maxUploadMb: 10, reviewSlaDays: 10 });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("eppb-admin-settings") || "null");
      if (saved?.dictionaries) setDictionaryState(saved.dictionaries);
      if (saved?.content) setContentState(saved.content);
      if (saved?.configuration) setConfigState(saved.configuration);
    } catch {}
  }, []);

  function saveAdminSettings() {
    localStorage.setItem("eppb-admin-settings", JSON.stringify({ dictionaries: dictionaryState, content: contentState, configuration: configState }));
    notify?.("Настройки сохранены", "Изменения сохранены для демо-контура");
  }

  async function loadAll() {
    setLoading(true);
    setLoadError(null);
    try {
      const [svcRes, appRes, intRes] = await Promise.all([
        api.services(),
        api.applications(),
        api.integrations(),
      ]);
      setServices(svcRes.services || []);
      setApplications(appRes.applications || []);
      setIntegrations(intRes);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function handleCreateService() {
    setOpenService(emptyService());
  }

  function handleEditService(service) {
    setOpenService(service);
  }

  function handleConstructorBack() {
    setOpenService(null);
    loadAll();
  }

  const registryRows = useMemo(
    () =>
      [...services].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [services]
  );

  if (openService) {
    return (
      <div className="adm-shell">
        <Constructor
          service={openService}
          onBack={handleConstructorBack}
          notify={notify}
          openAssistant={openAssistant}
        />
      </div>
    );
  }

  if (ready && (!user || user.role !== "admin")) {
    return (
      <div className="container">
        <div className="auth-gate card">
          <span className="eyebrow">Административный кабинет</span>
          <h2>Доступ только для сотрудников Холдинга</h2>
          <p>Управление услугами, заявками и интеграциями доступно после входа с корпоративной учётной записью.</p>
          <div className="row">
            <button className="btn btn-primary btn-lg" onClick={() => go("/login?next=/admin")}>Войти как сотрудник</button>
            <button className="btn" onClick={() => go("/")}>На главную</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <div className="adm-side-brand">
          <ShieldCheck size={18} />
          <span>ЕППБ · Админ</span>
        </div>
        <nav className="adm-side-nav">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                className={`adm-side-link${section === s.id ? " active" : ""}`}
                onClick={() => setSection(s.id)}
              >
                <Icon size={16} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="adm-side-foot muted small">
          Мок-режим демонстрации. Данные хранятся в памяти сервера.
        </div>
      </aside>

      <main className="adm-main">
        <div className="adm-topbar">
          <div>
            <span className="eyebrow">Административный кабинет</span>
            <h1>Административный кабинет</h1>
          </div>
          <div className="row">
            <span className="chip chip-gold">Автор услуг</span>
            <button className="btn btn-ghost btn-sm" onClick={loadAll} disabled={loading}>
              <RefreshCcw size={14} /> Обновить
            </button>
          </div>
        </div>

        {loadError && (
          <div className="empty" style={{ marginBottom: 16 }}>
            <h3>Не удалось загрузить данные</h3>
            <p>{loadError}</p>
            <button className="btn btn-primary" onClick={loadAll}>
              Повторить
            </button>
          </div>
        )}

        {section === "services" && (
          <section className="adm-panel">
            <div className="spread" style={{ marginBottom: 14 }}>
              <h2 className="adm-panel-title">Реестр услуг ({services.length})</h2>
              <button className="btn btn-gold" onClick={handleCreateService}>
                <Plus size={16} /> Создать услугу
              </button>
            </div>
            {loading ? (
              <div className="adm-skeleton" />
            ) : services.length === 0 ? (
              <div className="empty">
                <h3>Услуг пока нет</h3>
                <p>Соберите первую услугу конструктором — без единой строки кода.</p>
                <button className="btn btn-primary" onClick={handleCreateService}>
                  <Plus size={16} /> Создать услугу
                </button>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <table className="registry">
                  <thead>
                    <tr>
                      <th>Услуга</th>
                      <th>Организация</th>
                      <th>Тип</th>
                      <th>Версия</th>
                      <th>Статус</th>
                      <th>Обновлено</th>
                      <th>Состав</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {registryRows.map((svc) => {
                      const stats = countStats(svc);
                      const chip = STATUS_CHIP[svc.status] || STATUS_CHIP.draft;
                      return (
                        <tr key={svc.id}>
                          <td>
                            <div className="adm-cell-title">{svc.title}</div>
                            <div className="muted small mono">{svc.id}</div>
                          </td>
                          <td>{svc.orgShort || svc.org}</td>
                          <td>{svc.kind}</td>
                          <td className="mono">v{svc.version ?? 1}</td>
                          <td>
                            <span className={`chip ${chip.cls}`}>{chip.label}</span>
                          </td>
                          <td className="mono small">{svc.updatedAt}</td>
                          <td className="muted small">
                            {stats.stages} эт. · {stats.steps} шаг. · {stats.fields} пол.
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleEditService(svc)}
                            >
                              <Pencil size={14} /> Редактировать
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {section === "applications" && (
          <section className="adm-panel">
            <div className="spread" style={{ marginBottom: 14 }}>
              <h2 className="adm-panel-title">Заявки ({applications.length})</h2>
            </div>
            <p className="muted small" style={{ marginBottom: 14 }}>
              Рассмотрение — в BPM дочерней организации, здесь — мониторинг.
            </p>
            {loading ? (
              <div className="adm-skeleton" />
            ) : applications.length === 0 ? (
              <div className="empty">
                <h3>Заявок пока нет</h3>
                <p>Как только предприниматели подадут заявки, они появятся здесь.</p>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <table className="registry">
                  <thead>
                    <tr>
                      <th>Номер</th>
                      <th>Услуга</th>
                      <th>Заявитель</th>
                      <th>Статус</th>
                      <th>Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td className="mono">{app.id}</td>
                        <td>{app.serviceTitle}</td>
                        <td>{app.applicant?.name || app.answers?.companyName || "—"}</td>
                        <td>
                          <span className={`chip ${APP_STATUS_CHIP[app.status] || "chip-line"}`}>
                            {app.statusLabel || app.status}
                          </span>
                        </td>
                        <td className="mono small">{(app.createdAt || "").slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {section === "dictionaries" && (
          <ManagementPanel title="Справочники" description="Редактирование значений, используемых в формах, каталоге и карте." onSave={saveAdminSettings}>
            {Object.entries(dictionaryState).map(([key, items]) => (
              <DictionaryEditor key={key} name={key} items={items} onChange={(next) => setDictionaryState((cur) => ({ ...cur, [key]: next }))} />
            ))}
          </ManagementPanel>
        )}

        {section === "content" && (
          <ManagementPanel title="Контент портала" description="Основные публичные тексты без изменения кода." onSave={saveAdminSettings}>
            <div className="adm-settings-grid">
              {Object.entries(contentState).map(([key, value]) => <label key={key} className="adm-field"><span className="label">{key}</span><input className="input" value={value} onChange={(e) => setContentState((cur) => ({ ...cur, [key]: e.target.value }))} /></label>)}
            </div>
          </ManagementPanel>
        )}

        {section === "configuration" && (
          <ManagementPanel title="Конфигурация" description="Функциональные флаги и операционные лимиты MVP." onSave={saveAdminSettings}>
            <div className="adm-settings-grid">
              {Object.entries(configState).map(([key, value]) => typeof value === "boolean" ? (
                <label key={key} className="adm-config-toggle"><span><b>{key}</b><small>{value ? "Включено" : "Выключено"}</small></span><input type="checkbox" checked={value} onChange={(e) => setConfigState((cur) => ({ ...cur, [key]: e.target.checked }))} /></label>
              ) : (
                <label key={key} className="adm-field"><span className="label">{key}</span><input className="input" type="number" value={value} onChange={(e) => setConfigState((cur) => ({ ...cur, [key]: Number(e.target.value) }))} /></label>
              ))}
            </div>
          </ManagementPanel>
        )}

        {section === "integrations" && (
          <section className="adm-panel">
            <h2 className="adm-panel-title" style={{ marginBottom: 14 }}>
              Интеграционные шлюзы
            </h2>
            {loading ? (
              <div className="adm-skeleton" />
            ) : (
              <>
                <div className="adm-int-grid">
                  {(integrations?.gateways || []).map((gw) => (
                    <div key={gw.id} className="adm-int-card card">
                      <div className="spread">
                        <div className="row">
                          <span className={`status-dot ${gw.status === "online" ? "" : "red"}`} />
                          <b>{gw.name}</b>
                        </div>
                        <span className="chip chip-line mono">{gw.id}</span>
                      </div>
                      <div className="row muted small" style={{ marginTop: 10 }}>
                        <Radio size={13} />
                        <span className="mono">{gw.latencyMs ?? "—"} мс</span>
                        <span>· синхронизация: {gw.lastSync || "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 20 }}>
                  <h3 className="small" style={{ marginBottom: 8 }}>
                    Журнал событий шины
                  </h3>
                  <div className="adm-log card">
                    {(integrations?.events || []).length === 0 ? (
                      <p className="muted small">Событий пока нет.</p>
                    ) : (
                      (integrations?.events || []).map((ev) => (
                        <div key={ev.id} className="adm-log-line mono small">
                          <span className="muted">{(ev.date || "").replace("T", " ").slice(0, 16)}</span>{" "}
                          <span className="chip-line" style={{ padding: "1px 6px", borderRadius: 6 }}>
                            {ev.gateway}
                          </span>{" "}
                          {ev.event}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <p className="muted small" style={{ marginTop: 14 }}>
                  Все интеграции — мок для демонстрации готовности.
                </p>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function ManagementPanel({ title, description, onSave, children }) {
  return <section className="adm-panel"><div className="spread" style={{ marginBottom: 16 }}><div><h2 className="adm-panel-title">{title}</h2><p className="muted small">{description}</p></div><button className="btn btn-gold" onClick={onSave}>Сохранить изменения</button></div>{children}</section>;
}

function DictionaryEditor({ name, items, onChange }) {
  const normalized = Array.isArray(items) ? items : [];
  return <details className="adm-dictionary" open={name === "regions"}><summary><b>{name}</b><span className="chip chip-line">{normalized.length} знач.</span></summary><div className="stack">
    {normalized.map((item, index) => <div className="adm-dict-row" key={`${name}-${index}`}><input className="input mono" value={item.value ?? item.id ?? ""} onChange={(e) => onChange(normalized.map((x, i) => i === index ? { ...x, [x.value !== undefined ? "value" : "id"]: e.target.value } : x))} /><input className="input" value={item.label || ""} onChange={(e) => onChange(normalized.map((x, i) => i === index ? { ...x, label: e.target.value } : x))} /><button className="btn btn-ghost btn-sm btn-danger" onClick={() => onChange(normalized.filter((_, i) => i !== index))}>Удалить</button></div>)}
    <button className="btn btn-ghost btn-sm" onClick={() => onChange([...normalized, { value: `new-${normalized.length + 1}`, label: "Новое значение" }])}><Plus size={14} /> Добавить значение</button>
  </div></details>;
}
