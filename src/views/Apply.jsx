"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import api from "../api.js";
import FormRunner from "../engine/FormRunner.jsx";
import { useAuth, DEMO_BUSINESS } from "../shell/auth.js";

const APPLICANT = { name: "ТОО «Demo Trans Logistics»", bin: "123456789012" };

export default function Apply({ go, route, notify, openAssistant }) {
  const serviceId = route.params?.id;
  const appId = route.query?.app || null;
  const requestedStage = route.query?.stage || null;

  const { user, ready, signIn } = useAuth();
  const authed = !!user;
  const [authing, setAuthing] = useState(false);

  const [service, setService] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [result, setResult] = useState(null); // успешно отправленная заявка
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const svc = await api.service(serviceId);
        let app = null;
        if (appId) app = await api.application(appId);
        if (!cancelled) {
          setService(svc);
          setApplication(app);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (serviceId) load();
    return () => {
      cancelled = true;
    };
  }, [serviceId, appId]);

  const stageId = requestedStage || service?.stages?.[0]?.id;
  const stageIndex = useMemo(
    () => (service ? service.stages.findIndex((s) => s.id === stageId) : -1),
    [service, stageId]
  );
  const stage = stageIndex >= 0 ? service.stages[stageIndex] : null;

  async function handleEgovLogin() {
    setAuthing(true);
    await new Promise((r) => setTimeout(r, 700));
    setAuthing(false);
    signIn(DEMO_BUSINESS);
    notify?.("Вы вошли через eGov (мок)", APPLICANT.name);
  }

  async function handleSubmit(answers) {
    setSubmitError(null);
    try {
      let saved;
      if (appId) {
        saved = await api.submitStage(appId, { stageId, answers });
      } else {
        saved = await api.submitApplication({
          serviceId,
          stageId,
          answers,
          applicant: APPLICANT,
        });
      }
      setResult(saved);
      notify?.("Заявка отправлена", saved.id);
    } catch (err) {
      setSubmitError(err.message);
      notify?.("Не удалось отправить", err.message);
    }
  }

  if (!ready || loading) {
    return (
      <div className="container cab-page">
        <div className="cab-skeleton-block" style={{ maxWidth: 640, margin: "40px auto" }} />
      </div>
    );
  }

  if (loadError || !service) {
    return (
      <div className="container cab-page">
        <div className="empty">
          <h3>Не удалось загрузить услугу</h3>
          <p>{loadError || "Услуга не найдена"}</p>
          <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => go("/catalog")}>
              В каталог услуг
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!authed && !appId) {
    return (
      <div className="cab-gate-wrap">
        <div className="container">
          <div className="cab-gate-card card">
            <div className="cab-gate-icon">
              <ShieldCheck size={28} />
            </div>
            <span className="eyebrow">Вход через eGov</span>
            <h1 className="cab-gate-title">Для подачи заявки войдите через eGov Business</h1>
            <p className="muted">
              Демонстрация: вход имитирует авторизацию через государственную систему eGov Business
              по ЭЦП руководителя. Данные компании подтягиваются из реестра автоматически.
            </p>
            <button className="btn btn-gold btn-lg cab-gate-btn" onClick={handleEgovLogin} disabled={authing}>
              {authing ? (
                <>
                  <Loader2 size={18} className="cab-spin" /> Подключение к eGov IDP…
                </>
              ) : (
                <>
                  <LogIn size={18} /> Войти как {APPLICANT.name} (БИН {APPLICANT.bin})
                </>
              )}
            </button>
            <button className="btn btn-ghost" onClick={() => go(`/service/${serviceId}`)}>
              <ArrowLeft size={16} /> Вернуться к услуге
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    const stages = service.stages || [];
    const doneIndex = stages.findIndex((s) => s.id === (result.stageId || stageId));
    return (
      <div className="container cab-page">
        <div className="cab-success card">
          <div className="cab-success-icon">
            <CheckCircle2 size={36} />
          </div>
          <span className="eyebrow">Заявка отправлена</span>
          <h1>Заявка принята в работу</h1>
          <div className="cab-success-number mono">{result.id}</div>
          <span className="chip chip-green">{result.statusLabel}</span>

          {stages.length > 1 && (
            <div className="rail cab-success-rail">
              {stages.map((s, i) => (
                <div key={s.id} className={`rail-node ${i <= doneIndex ? "done" : ""}`}>
                  <span className="rail-title">{s.title}</span>
                </div>
              ))}
            </div>
          )}

          <div className="cab-success-next">
            <h3>Что дальше</h3>
            <ul>
              <li>Мы уведомим вас об изменении статуса в личном кабинете и по электронной почте.</li>
              <li>
                Ориентировочный срок рассмотрения — {service.card?.decisionDays ?? 10} рабочих дней.
              </li>
              {result.nextStage ? (
                <li>
                  После одобрения этапа откроется следующий этап: «{result.nextStage.title}».
                </li>
              ) : (
                <li>Решение по заявке поступит в личный кабинет.</li>
              )}
            </ul>
          </div>

          <div className="row cab-success-actions">
            <button className="btn btn-primary" onClick={() => go("/cabinet")}>
              В личный кабинет
            </button>
            <button className="btn btn-ghost" onClick={() => go("/")}>
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container cab-page">
      <div className="cab-apply-head">
        <a
          className="cab-back-link"
          href={`/service/${serviceId}`}
          onClick={(e) => {
            e.preventDefault();
            go(`/service/${serviceId}`);
          }}
        >
          <ArrowLeft size={15} /> К странице услуги
        </a>
        <span className="eyebrow">Подача заявки</span>
        <h1>{service.title}</h1>
        <div className="row cab-apply-chips">
          <span className="chip">
            <Building2 size={14} /> {service.org}
          </span>
          {service.stages.length > 1 && stage && (
            <span className="chip chip-gold">
              Этап {stageIndex + 1} из {service.stages.length}: {stage.title}
            </span>
          )}
        </div>
      </div>

      {submitError && (
        <div className="cab-submit-error">
          Не удалось отправить заявку: {submitError}
        </div>
      )}

      {stage ? (
        <FormRunner
          service={service}
          stage={stage}
          initialAnswers={application?.answers || {}}
          onSubmit={handleSubmit}
          onAskAssistant={(ctx) =>
            openAssistant?.(
              ctx?.prompt || `Помогите заполнить заявку по услуге «${service.title}»`
            )
          }
        />
      ) : (
        <div className="empty">
          <h3>Этап не найден</h3>
          <p>Проверьте ссылку на заявку.</p>
        </div>
      )}
    </div>
  );
}
