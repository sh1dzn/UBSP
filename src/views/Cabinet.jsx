"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  Building2,
  Download,
  FileCheck2,
  MessageCircleQuestion,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  User2,
} from "lucide-react";
import api from "../api.js";
import PageHero from "../shell/PageHero.jsx";
import { useAuth } from "../shell/auth.js";

const APPLICANT = { name: "ТОО «Demo Trans Logistics»", bin: "123456789012" };

const STATUS_CHIP = {
  submitted: "",
  review: "",
  info_requested: "chip-amber",
  stage_approved: "chip-green",
  approved: "chip-green",
  rejected: "chip-red",
};

function statusChipClass(status) {
  return `chip ${STATUS_CHIP[status] || ""}`.trim();
}

const KIND_LABEL = { user: "Вы", system: "Система", org: "Организация" };

export default function Cabinet({ go, notify, openAssistant }) {
  const { user, ready } = useAuth();
  const [applications, setApplications] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [serviceStages, setServiceStages] = useState({}); // serviceId -> [{id,title}]
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("applications"); // applications | notifications
  const [advancing, setAdvancing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [appsRes, notifRes] = await Promise.all([api.applications(), api.notifications()]);
      const apps = appsRes.applications || [];
      setApplications(apps);
      setNotifications(notifRes.notifications || []);
      setSelectedId((prev) => prev || (apps[0] ? apps[0].id : null));

      const uniqueServiceIds = [...new Set(apps.map((a) => a.serviceId))];
      const pairs = await Promise.all(
        uniqueServiceIds.map(async (id) => {
          try {
            const svc = await api.service(id);
            return [id, svc.stages || []];
          } catch {
            return [id, []];
          }
        })
      );
      setServiceStages(Object.fromEntries(pairs));
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selected = useMemo(
    () => (applications || []).find((a) => a.id === selectedId) || null,
    [applications, selectedId]
  );

  async function handleAdvance() {
    if (!selected) return;
    setAdvancing(true);
    try {
      const updated = await api.advanceApplication(selected.id);
      await loadData();
      notify?.("Статус обновлён", updated.statusLabel);
    } catch (err) {
      notify?.("Не удалось выполнить шаг BPM", err.message);
    } finally {
      setAdvancing(false);
    }
  }

  function handleNotificationClick(n) {
    if (n.appId) {
      setSelectedId(n.appId);
      setTab("applications");
    }
  }

  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  const loading = applications === null || notifications === null;

  if (ready && !user) {
    return (
      <div className="container">
        <div className="auth-gate card">
          <span className="eyebrow">Личный кабинет</span>
          <h2>Войдите, чтобы видеть свои заявки</h2>
          <p>Статусы, документы и уведомления доступны после входа через eGov Business.</p>
          <div className="row">
            <button className="btn btn-gold btn-lg" onClick={() => go("/login?next=/cabinet")}>Войти</button>
            <button className="btn" onClick={() => go("/catalog")}>Смотреть каталог</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container cab-page">
      <PageHero
        eyebrow="Кабинет предпринимателя"
        title="Личный кабинет"
      >
        <div className="page-hero-actions">
          <div className="cab-user-card card">
            <div className="cab-user-icon">
              <User2 size={18} />
            </div>
            <div className="cab-user-info">
              <div className="cab-user-name">{APPLICANT.name}</div>
              <div className="muted small">
                БИН <span className="mono">{APPLICANT.bin}</span>
              </div>
            </div>
            <span className="chip chip-green">
              <ShieldCheck size={13} /> Подтверждено через eGov (мок)
            </span>
          </div>
        </div>
      </PageHero>

      <div className="cab-tabs row">
        <button
          className={`cab-tab ${tab === "applications" ? "active" : ""}`}
          onClick={() => setTab("applications")}
        >
          Заявки {applications ? `(${applications.length})` : ""}
        </button>
        <button
          className={`cab-tab ${tab === "notifications" ? "active" : ""}`}
          onClick={() => setTab("notifications")}
        >
          <Bell size={14} /> Уведомления {unreadCount > 0 ? `(${unreadCount})` : ""}
        </button>
      </div>

      {loadError && <div className="cab-submit-error">Ошибка загрузки: {loadError}</div>}

      {loading ? (
        <div className="cab-skel-grid">
          <div className="cab-skeleton-block" />
          <div className="cab-skeleton-block" />
        </div>
      ) : tab === "notifications" ? (
        <NotificationsPanel
          notifications={notifications}
          onSelect={handleNotificationClick}
          onSetTab={setTab}
        />
      ) : applications.length === 0 ? (
        <div className="empty">
          <h3>Заявок пока нет</h3>
          <p>Подберите меру поддержки, подходящую вашему бизнесу, или спросите навигатора.</p>
          <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => go("/catalog")}>
              Подобрать меру поддержки
            </button>
            <button className="btn btn-ghost" onClick={() => openAssistant?.()}>
              <MessageCircleQuestion size={16} /> Спросить навигатора
            </button>
          </div>
        </div>
      ) : (
        <div className="cab-layout">
          <div className="cab-list">
            {applications.map((app) => (
              <ApplicationListCard
                key={app.id}
                app={app}
                stages={serviceStages[app.serviceId] || []}
                active={app.id === selectedId}
                onClick={() => setSelectedId(app.id)}
              />
            ))}
          </div>
          <div className="cab-detail">
            {selected && (
              <ApplicationDetail
                app={selected}
                onContinue={() =>
                  go(
                    `/apply/${selected.serviceId}?app=${selected.id}&stage=${selected.nextStage.id}`
                  )
                }
                onAdvance={handleAdvance}
                advancing={advancing}
                notify={notify}
                onExplainStatus={() =>
                  openAssistant(
                    `Объясни статус заявки ${selected.id} («${selected.statusLabel}») по услуге «${selected.serviceTitle}». Что мне делать дальше?`
                  )
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationListCard({ app, stages, active, onClick }) {
  const currentIndex = stages.findIndex((s) => s.id === app.stageId);
  const isTerminal = app.status === "approved" || app.status === "rejected";
  return (
    <button className={`cab-app-card ${active ? "active" : ""}`} onClick={onClick}>
      <div className="spread">
        <span className="mono cab-app-number">{app.id}</span>
        <span className={statusChipClass(app.status)}>{app.statusLabel}</span>
      </div>
      <div className="cab-app-title">{app.serviceTitle}</div>
      <div className="muted small row">
        <Building2 size={13} /> {app.org}
      </div>
      <div className="muted small">
        {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString("ru-RU") : ""}
      </div>
      {stages.length > 1 && (
        <div className="rail cab-mini-rail">
          {stages.map((s, i) => (
            <div
              key={s.id}
              className={`rail-node ${
                i < currentIndex || (i === currentIndex && isTerminal) ? "done" : i === currentIndex ? "active" : ""
              }`}
            />
          ))}
        </div>
      )}
    </button>
  );
}

function ApplicationDetail({ app, onContinue, onAdvance, advancing, notify, onExplainStatus }) {
  const timeline = [...(app.timeline || [])].reverse();
  return (
    <div className="stack">
      <div className="card cab-detail-head">
        <div className="mono cab-detail-number">{app.id}</div>
        <div className="spread">
          <span className={statusChipClass(app.status)}>{app.statusLabel}</span>
          <button className="btn btn-sm btn-ghost" onClick={onExplainStatus}>
            Что значит этот статус?
          </button>
        </div>
        <div className="cab-detail-service">{app.serviceTitle}</div>
        <div className="muted small row">
          <Building2 size={13} /> {app.org}
        </div>
      </div>

      {app.nextStage && (
        <div className="cab-next-stage">
          <Sparkles size={18} />
          <div className="cab-next-stage-body">
            <div className="cab-next-stage-title">
              Этап «{app.nextStage.title}» ждёт заполнения
            </div>
            <p className="muted small">
              Первичное решение принято. Чтобы продолжить оформление, донесите расширенные данные
              по проекту.
            </p>
            <button className="btn btn-gold" onClick={onContinue}>
              Продолжить оформление <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="cab-block-title">Ход рассмотрения</h3>
        <div className="cab-timeline">
          {timeline.length === 0 && <p className="muted small">Событий пока нет.</p>}
          {timeline.map((t, i) => (
            <div className="cab-timeline-item" key={i}>
              <div className="cab-timeline-dot" />
              <div className="cab-timeline-body">
                <div className="spread">
                  <span className="cab-timeline-title">{t.title}</span>
                  <span className="mono cab-timeline-date">
                    {t.date ? new Date(t.date).toLocaleString("ru-RU") : ""}
                  </span>
                </div>
                <p className="muted small">{t.text}</p>
                <span className="chip-line chip cab-timeline-kind">{KIND_LABEL[t.kind] || t.kind}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="cab-block-title">Документы</h3>
        {app.documents && app.documents.length > 0 ? (
          <table className="registry">
            <thead>
              <tr>
                <th>Файл</th>
                <th>Размер</th>
                <th>Проверка</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {app.documents.map((doc, i) => (
                <tr key={i}>
                  <td>
                    <div className="row">
                      <FileCheck2 size={14} /> {doc.name}
                    </div>
                  </td>
                  <td className="mono small">{doc.size}</td>
                  <td>
                    <div className="row">
                      <span className="chip chip-green">Проверен</span>
                      {doc.signedBy && <span className="chip chip-gold">ЭЦП</span>}
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => notify?.("Демо: скачивание отключено", doc.name)}
                    >
                      <Download size={14} /> Скачать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted small">Документы не прикреплены.</p>
        )}
      </div>

      <div className="cab-demo-panel">
        <p className="muted small cab-demo-caption">
          Демонстрация: имитация решения BPM дочерней организации
        </p>
        <button className="btn btn-primary" onClick={onAdvance} disabled={advancing}>
          <PlayCircle size={16} /> {advancing ? "Выполняется…" : "Симулировать шаг BPM"}
        </button>
      </div>
    </div>
  );
}

function NotificationsPanel({ notifications, onSelect, onSetTab }) {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="empty">
        <h3>Уведомлений пока нет</h3>
        <p>Здесь будут появляться сообщения о статусе ваших заявок.</p>
      </div>
    );
  }
  return (
    <div className="cab-notif-list">
      {notifications.map((n) => (
        <button
          key={n.id}
          className="cab-notif-item"
          onClick={() => {
            onSelect(n);
            if (n.appId) onSetTab("applications");
          }}
        >
          <div className="cab-notif-dot-wrap">
            {!n.read && <span className="cab-notif-dot" />}
          </div>
          <div className="cab-notif-body">
            <div className="spread">
              <span className="cab-notif-title">{n.title}</span>
              <span className="muted small mono">
                {n.date ? new Date(n.date).toLocaleDateString("ru-RU") : ""}
              </span>
            </div>
            <p className="muted small">{n.text}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
