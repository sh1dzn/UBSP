"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  AlertTriangle,
  Bell,
  Building2,
  Download,
  FileCheck2,
  FileWarning,
  Clock3,
  MessageCircleQuestion,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Upload,
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

export default function Cabinet({ go, route, notify, openAssistant }) {
  const { user, ready } = useAuth();
  const [applications, setApplications] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [serviceStages, setServiceStages] = useState({}); // serviceId -> [{id,title}]
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("applications"); // applications | notifications
  const [advancing, setAdvancing] = useState(false);
  const [correctionFiles, setCorrectionFiles] = useState({});
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [focusSection, setFocusSection] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [appsRes, notifRes] = await Promise.all([api.applications(), api.notifications()]);
      const apps = appsRes.applications || [];
      setApplications(apps);
      setNotifications(notifRes.notifications || []);
      setSelectedId((prev) => route?.query?.app || prev || (apps[0] ? apps[0].id : null));

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
  }, [route?.query?.app]);

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
      notify?.(
        updated.nextStage ? "Этап одобрен — открылся следующий шаг" : "Статус обновлён",
        updated.nextStage ? `Нажмите «Продолжить оформление»: ${updated.nextStage.title}` : updated.statusLabel
      );
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
      setFocusSection(n.target?.section || null);
      window.setTimeout(() => {
        document.getElementById(`cab-${n.target?.section || "application"}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }

  async function handleCorrectionSubmit() {
    if (!selected?.infoRequest) return;
    setSubmittingCorrection(true);
    try {
      const files = selected.infoRequest.items.map((item) => ({ itemId: item.id, name: correctionFiles[item.id].name, size: correctionFiles[item.id].size }));
      const updated = await api.submitCorrection(selected.id, { files });
      await loadData();
      setCorrectionFiles({});
      notify?.("Уточнения отправлены", updated.statusLabel);
    } catch (err) {
      notify?.("Не удалось отправить уточнения", err.message);
    } finally {
      setSubmittingCorrection(false);
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

      {route?.query?.demo === "1" && (
        <div className="pub-demo-context cab-demo-context">
          <span className="chip chip-gold">Демо · шаг 4 из 7</span>
          <span>Заявка выбрана. Симулируйте решения BPM, пока не появится кнопка второго этапа.</span>
        </div>
      )}

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
                    `/apply/${selected.serviceId}?app=${selected.id}&stage=${selected.nextStage.id}&demo=1`
                  )
                }
                onOpenConstructor={() => go("/login?next=/admin")}
                onAdvance={handleAdvance}
                advancing={advancing}
                notify={notify}
                correctionFiles={correctionFiles}
                onCorrectionFile={(itemId, file) => setCorrectionFiles((current) => ({ ...current, [itemId]: file }))}
                onSubmitCorrection={handleCorrectionSubmit}
                submittingCorrection={submittingCorrection}
                focusSection={focusSection}
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

function ApplicationDetail({ app, onContinue, onAdvance, onOpenConstructor, advancing, notify, onExplainStatus, correctionFiles, onCorrectionFile, onSubmitCorrection, submittingCorrection, focusSection }) {
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

      {app.status === "info_requested" && app.infoRequest?.status === "open" && (
        <CorrectionRequest
          request={app.infoRequest}
          files={correctionFiles}
          onFile={onCorrectionFile}
          onSubmit={onSubmitCorrection}
          submitting={submittingCorrection}
          focused={focusSection === "correction"}
        />
      )}

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

      {app.status === "approved" && (
        <div className="cab-next-stage cab-demo-finish">
          <Sparkles size={18} />
          <div className="cab-next-stage-body">
            <div className="cab-next-stage-title">Путь предпринимателя завершён</div>
            <p className="muted small">Теперь покажите обратную сторону платформы: эта услуга собрана из схемы в no-code конструкторе.</p>
            <button className="btn btn-gold" onClick={onOpenConstructor}>
              Перейти в конструктор <ArrowRight size={15} />
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

      <div className="card" id="cab-documents">
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
                      <DocumentStatus status={doc.status} />
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
          {app.nextStage
            ? "Следующий этап уже открыт — продолжите оформление выше"
            : app.status === "approved"
              ? "Демо заявки завершено — переходите в конструктор выше"
              : "Демонстрация: имитация следующего решения BPM дочерней организации"}
        </p>
        <button className="btn btn-primary" onClick={onAdvance} disabled={advancing || !!app.nextStage || app.status === "approved"}>
          <PlayCircle size={16} /> {advancing ? "Выполняется…" : "Симулировать шаг BPM"}
        </button>
      </div>
    </div>
  );
}

const DOCUMENT_STATUS = {
  verified: ["Проверен", "chip-green"],
  correction_required: ["Нужно заменить", "chip-amber"],
  under_review: ["На проверке", "chip-gold"],
  replaced: ["Заменён", ""],
};

function DocumentStatus({ status }) {
  const [label, className] = DOCUMENT_STATUS[status] || ["Получен", ""];
  return <span className={`chip ${className}`.trim()}>{label}</span>;
}

function CorrectionRequest({ request, files, onFile, onSubmit, submitting, focused }) {
  const complete = request.items.every((item) => files[item.id]);
  const deadline = new Date(`${request.deadline}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  return (
    <section id="cab-correction" className={`cab-correction ${focused ? "cab-correction-focus" : ""}`} aria-labelledby="cab-correction-title">
      <div className="cab-correction-head">
        <div className="cab-correction-icon"><AlertTriangle size={20} /></div>
        <div>
          <span className="eyebrow">Требуется ваше действие</span>
          <h2 id="cab-correction-title">Предоставьте дополнительные сведения</h2>
          <div className="cab-deadline"><Clock3 size={15} /> Отправьте до {deadline}</div>
        </div>
      </div>
      <div className="cab-request-reason">
        <strong>Почему это нужно</strong>
        <p>{request.reason}</p>
      </div>
      <div className="cab-correction-items">
        {request.items.map((item, index) => {
          const file = files[item.id];
          return (
            <div className="cab-correction-item" key={item.id}>
              <div className="cab-correction-step">{index + 1}</div>
              <div className="cab-correction-copy">
                <div className="cab-correction-title"><FileWarning size={16} /> {item.title}</div>
                <p className="muted small">{item.description}</p>
                {item.documentName && <div className="cab-current-file">Текущий файл: <span className="mono">{item.documentName}</span></div>}
              </div>
              <label className={`btn btn-sm ${file ? "btn-ghost cab-file-ready" : "btn-primary"}`}>
                <Upload size={15} /> {file ? file.name : item.action === "replace" ? "Выбрать замену" : "Выбрать файл"}
                <input className="cab-file-input" type="file" accept={item.acceptedTypes} onChange={(event) => event.target.files?.[0] && onFile(item.id, event.target.files[0])} />
              </label>
            </div>
          );
        })}
      </div>
      <div className="cab-correction-footer">
        <div>
          <strong>Следующий шаг</strong>
          <p className="muted small">Прикрепите оба файла и отправьте их эксперту. Новую заявку создавать не нужно.</p>
          <span className="muted small">{request.contact}</span>
        </div>
        <button className="btn btn-gold" disabled={!complete || submitting} onClick={onSubmit}>
          {submitting ? "Отправляем…" : "Отправить уточнения"} <ArrowRight size={15} />
        </button>
      </div>
    </section>
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
