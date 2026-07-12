"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MessageCircleQuestion, Send, Trash2, CheckCircle2, XCircle, AlertTriangle, ClipboardCheck, FileText } from "lucide-react";
import { FieldControl } from "./fields.jsx";
import { isVisible } from "./conditions.js";
import { validateStep, collectVisibleFields } from "./validate.js";
import { evalFormula, evalRule } from "./formula.js";
import { dictionaries } from "../data/dictionaries.js";
import { activeBranchReasons } from "./branching.js";
import api from "../api.js";

function draftKey(serviceId, stageId) {
  return `eppb-draft-${serviceId}-${stageId}`;
}

function loadDraft(serviceId, stageId) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey(serviceId, stageId));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveDraft(serviceId, stageId, answers) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(draftKey(serviceId, stageId), JSON.stringify(answers));
  } catch (e) {
    // хранилище недоступно — тихо игнорируем
  }
}

function clearDraft(serviceId, stageId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftKey(serviceId, stageId));
  } catch (e) {
    // ignore
  }
}

function resolveOptions(field) {
  if (field.dictionary && dictionaries[field.dictionary]) {
    return dictionaries[field.dictionary].map((opt) =>
      opt.value !== undefined ? opt : { value: opt.id, label: opt.label }
    );
  }
  return field.options || [];
}

function setPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (typeof cur[key] !== "object" || cur[key] === null) cur[key] = {};
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
}

function getPath(obj, path) {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function allFieldsOfStage(step) {
  return (step && step.fields) || [];
}

function collectAllSteps(service, stage) {
  return (stage && stage.steps) || [];
}

export default function FormRunner({ service, stage, initialAnswers, onSubmit, onSaveDraft, onAskAssistant }) {
  const steps = useMemo(() => collectAllSteps(service, stage), [service, stage]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const draft = loadDraft(service.id, stage.id);
    return { ...(initialAnswers || {}), ...(draft || {}) };
  });
  const [errors, setErrors] = useState({});
  const [companyInfo, setCompanyInfo] = useState({});
  const [companyAgeMonths, setCompanyAgeMonths] = useState(answers.companyAgeMonths);
  const [binLoading, setBinLoading] = useState({});
  const [review, setReview] = useState(null);       // результат ИИ-предпроверки
  const [reviewing, setReviewing] = useState(false);
  const [hasDraft, setHasDraft] = useState(() => !!loadDraft(service.id, stage.id));
  const formRef = useRef(null);
  const errorSummaryRef = useRef(null);
  const stepHeadingRef = useRef(null);

  const visibleSteps = useMemo(() => steps.filter((step) => isVisible(step.when, answers)), [steps, answers]);
  const currentStep = visibleSteps[stepIndex] || null;

  useEffect(() => {
    if (stepIndex >= visibleSteps.length) setStepIndex(Math.max(0, visibleSteps.length - 1));
  }, [stepIndex, visibleSteps.length]);

  // живой пересчёт calc-полей по всем видимым шагам стейджа
  useEffect(() => {
    setAnswers((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const step of steps) {
        for (const field of step.fields || []) {
          if (field.type !== "calc" || !field.compute) continue;
          if (!isVisible(field.when, next)) continue;
          const computed = evalFormula(field.compute, next);
          if (next[field.id] !== computed) {
            next[field.id] = computed;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, steps]);

  // autosave
  useEffect(() => {
    saveDraft(service.id, stage.id, answers);
    setHasDraft(true);
    onSaveDraft && onSaveDraft(answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, service.id, stage.id]);

  function updateAnswer(fieldId, value) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      if (!(fieldId in prev)) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }

  async function handleVerifyBin(field, bin) {
    if (!bin || String(bin).length !== 12) return;
    setBinLoading((prev) => ({ ...prev, [field.id]: true }));
    try {
      const res = await api.company(bin);
      const company = res.company || res;
      setCompanyInfo((prev) => ({ ...prev, [field.id]: company }));

      setAnswers((prev) => {
        const next = { ...prev, [field.id]: bin, company };
        // prefill остальных полей по field.prefill = "company.xxx"
        for (const step of steps) {
          for (const f of step.fields || []) {
            if (f.prefill && f.prefill.startsWith("company.")) {
              let value = getPath({ company }, f.prefill);
              if (value !== undefined) {
                // select-поля: реестр отдаёт label, а select хранит value справочника
                const opts = resolveOptions(f);
                if (opts.length) {
                  const match = opts.find((o) => o.value === value || o.label === value);
                  if (match) value = match.value;
                }
                next[f.id] = value;
              }
            }
          }
        }
        return next;
      });

      if (company && company.ageMonths !== undefined) {
        setCompanyAgeMonths(company.ageMonths);
        setAnswers((prev) => ({ ...prev, companyAgeMonths: company.ageMonths }));
      }
    } catch (e) {
      // мок-ошибка проверки — не блокируем форму
    } finally {
      setBinLoading((prev) => ({ ...prev, [field.id]: false }));
    }
  }

  function handleNext() {
    if (!currentStep) return;
    const { errors: stepErrors, valid } = validateStep(currentStep, answers);
    if (!valid) {
      setErrors(stepErrors);
      requestAnimationFrame(() => {
        errorSummaryRef.current?.focus();
      });
      return;
    }
    setErrors({});
    if (stepIndex < visibleSteps.length - 1) {
      setStepIndex((i) => i + 1);
      requestAnimationFrame(() => stepHeadingRef.current?.focus());
    } else {
      onSubmit && onSubmit(answers);
      clearDraft(service.id, stage.id);
      setHasDraft(false);
    }
  }

  function handleBack() {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleClearDraft() {
    clearDraft(service.id, stage.id);
    setHasDraft(false);
    setAnswers(initialAnswers || {});
    setStepIndex(0);
    setErrors({});
  }

  const ruleCtx = useMemo(() => ({ ...answers, companyAgeMonths }), [answers, companyAgeMonths]);

  const checks = useMemo(() => {
    const rules = service.rules || [];
    return rules.map((rule) => ({
      ...rule,
      passed: evalRule(rule.expr, ruleCtx),
    }));
  }, [service.rules, ruleCtx]);

  const fillPercent = useMemo(() => {
    let total = 0;
    let filled = 0;
    for (const step of steps) {
      for (const field of collectVisibleFields(step, answers)) {
        if (!field.required || field.type === "calc" || field.type === "info") continue;
        total += 1;
        const value = answers[field.id];
        const isFilled =
          value !== undefined &&
          value !== null &&
          value !== "" &&
          !(Array.isArray(value) && value.length === 0);
        if (isFilled) filled += 1;
      }
    }
    if (total === 0) return 100;
    return Math.round((filled / total) * 100);
  }, [steps, answers]);

  const readiness = useMemo(() => {
    const required = [];
    for (const step of visibleSteps) {
      for (const field of collectVisibleFields(step, answers)) {
        if (!field.required || field.type === "calc" || field.type === "info") continue;
        const value = answers[field.id];
        const filled = value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0);
        required.push({ field, step, filled });
      }
    }
    const blockingRules = checks.filter((check) => !check.passed && check.level !== "warning");
    return { required, missing: required.filter((item) => !item.filled), blockingRules, ready: required.every((item) => item.filled) && blockingRules.length === 0 };
  }, [visibleSteps, answers, checks]);

  const isFinalStep = stepIndex === visibleSteps.length - 1;

  if (!currentStep) {
    return <div className="empty">У этого этапа нет шагов.</div>;
  }

  const visibleFields = collectVisibleFields(currentStep, answers);
  const branchReasons = activeBranchReasons(visibleFields, answers, service, dictionaries);

  return (
    <div className="fr-layout">
      <div className="fr-main" ref={formRef}>
        <div className="fr-rail-wrap">
          <div className="rail">
            {visibleSteps.map((step, idx) => (
              <div
                key={step.id}
                className={`rail-node${idx < stepIndex ? " done" : ""}${idx === stepIndex ? " active" : ""}`}
              >
                <div className="rail-title">{step.title}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="fr-step-head">
          <h2 ref={stepHeadingRef} tabIndex="-1">{currentStep.title}</h2>
          {currentStep.hint ? <p className="muted">{currentStep.hint}</p> : null}
        </div>

        {isFinalStep ? (
          <div className={`fr-readiness ${readiness.ready ? "is-ready" : ""}`}>
            <div className="fr-readiness-icon"><ClipboardCheck size={22} /></div>
            <div>
              <strong>{readiness.ready ? "Заявка готова к отправке" : "Финальная проверка заявки"}</strong>
              <p>{readiness.ready ? "Обязательные данные заполнены, блокирующие условия выполнены." : `Осталось: ${readiness.missing.length} обязательных полей и ${readiness.blockingRules.length} условий.`}</p>
            </div>
          </div>
        ) : null}

        {branchReasons.length ? (
          <div className="fr-branch-note" role="status">
            <span className="fr-branch-note-label">Почему появились эти поля</span>
            <span>{branchReasons.join(" · ")}</span>
          </div>
        ) : null}

        {Object.keys(errors).length ? (
          <div className="fr-error-summary" role="alert" tabIndex="-1" ref={errorSummaryRef}>
            <h3>Проверьте заполнение формы</h3>
            <p>Исправьте отмеченные поля, чтобы продолжить:</p>
            <ul>
              {Object.entries(errors).map(([id, message]) => {
                const field = visibleFields.find((item) => item.id === id);
                return <li key={id}><a href={`#${id}`}>{field?.label || id}: {message}</a></li>;
              })}
            </ul>
          </div>
        ) : null}
        <div className="grid12">
          {visibleFields.map((field) => {
            const resolvedField =
              field.type === "select" || field.type === "radio" || field.type === "checklist"
                ? { ...field, __options: resolveOptions(field), __company: companyInfo[field.id] }
                : field.type === "bin"
                ? { ...field, __company: companyInfo[field.id] }
                : field;
            return (
              <div
                key={field.id}
                className="fr-field-col"
                style={{ gridColumn: `span ${field.cols || 12}` }}
                data-field-id={field.id}
              >
                <FieldControl
                  field={resolvedField}
                  value={answers[field.id]}
                  answers={answers}
                  error={errors[field.id]}
                  onChange={(value) => updateAnswer(field.id, value)}
                  onVerifyBin={(bin) => handleVerifyBin(field, bin)}
                />
              </div>
            );
          })}
        </div>

        {isFinalStep ? (
          <div className="fr-review-sheet">
            <div className="fr-review-sheet-head"><FileText size={18} /><strong>Сводка перед отправкой</strong></div>
            {visibleSteps.slice(0, -1).map((reviewStep) => {
              const fields = collectVisibleFields(reviewStep, answers).filter((f) => !["info", "file"].includes(f.type) && answers[f.id] !== undefined && answers[f.id] !== "");
              if (!fields.length) return null;
              return <section key={reviewStep.id}><h3>{reviewStep.title}</h3><dl>{fields.slice(0, 8).map((field) => <div key={field.id}><dt>{field.label}</dt><dd>{Array.isArray(answers[field.id]) ? answers[field.id].join(", ") : String(answers[field.id])}</dd></div>)}</dl></section>;
            })}
          </div>
        ) : null}

        <div className="fr-nav spread">
          <div className="row">
            <button type="button" className="btn" onClick={handleBack} disabled={stepIndex === 0}>
              <ArrowLeft size={16} /> Назад
            </button>
            {hasDraft ? (
              <button type="button" className="btn btn-ghost" onClick={handleClearDraft}>
                <Trash2 size={16} /> Очистить черновик
              </button>
            ) : null}
          </div>
          <button type="button" className="btn btn-primary" onClick={handleNext}>
            {stepIndex < visibleSteps.length - 1 ? (
              <>
                Далее <ArrowRight size={16} />
              </>
            ) : (
              <>
                {readiness.ready ? "Подписать и отправить" : "Проверить и отправить"} <Send size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      <aside className="fr-sidebar">
        <div className="card fr-sidebar-card">
          <div className="fr-sidebar-title">Соответствие условиям</div>
          {checks.length === 0 ? (
            <div className="muted small">Условия появятся по мере заполнения формы.</div>
          ) : (
            <div className="stack">
              {checks.map((check) => {
                const isWarning = check.level === "warning";
                const Icon = check.passed ? CheckCircle2 : isWarning ? AlertTriangle : XCircle;
                const chipClass = check.passed ? "chip-green" : isWarning ? "chip-amber" : "chip-red";
                return (
                  <div key={check.id} className={`fr-check-row chip ${chipClass}`}>
                    <Icon size={14} />
                    <span>{check.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card fr-sidebar-card">
          <div className="fr-sidebar-title">Ваши данные заполнены на {fillPercent}%</div>
          <div className="fr-progress-bar">
            <div className="fr-progress-fill" style={{ width: `${fillPercent}%` }} />
          </div>
        </div>

        <div className="card fr-sidebar-card">
          <div className="fr-sidebar-title">Предпроверка заявки</div>
          <p className="fr-review-hint">
            Сначала портал проверит обязательные поля и правила программы. Если ИИ доступен, он дополнительно объяснит результат.
          </p>
          <button
            type="button"
            className="btn fr-review-btn"
            disabled={reviewing}
            onClick={async () => {
              setReviewing(true);
              try {
                const res = await api.aiReview({ serviceId: service.id, stageId: stage.id, answers });
                setReview(res);
              } catch {
                setReview({ summary: "Проверка сейчас недоступна — попробуйте позже.", issues: [], ok: false });
              } finally {
                setReviewing(false);
              }
            }}
          >
            {reviewing ? "Проверяем…" : "Проверить готовность заявки"}
          </button>
          {review ? (
            <div className={"fr-review-result" + (review.ok ? " ok" : "")}>
              <div className="fr-review-source">{review.source === "ai" ? "Пояснение ИИ · проверки по правилам" : "Детерминированная проверка по правилам"}</div>
              <p>{review.summary}</p>
              {review.issues?.length ? (
                <ul>
                  {review.issues.slice(0, 6).map((issue, i) => (
                    <li key={i} className={issue.level}>{issue.text}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        {onAskAssistant ? (
          <button
            type="button"
            className="btn btn-gold fr-assistant-btn"
            onClick={() => {
              // контекст для навигатора: что за услуга, где пользователь, что не заполнено
              const visible = currentStep ? collectVisibleFields(currentStep, answers) : [];
              const empty = visible
                .filter((f) => f.required && (answers[f.id] === undefined || answers[f.id] === "" || answers[f.id] === null))
                .map((f) => f.label);
              const failing = checks.filter((c) => !c.passed).map((c) => c.label);
              const parts = [
                `Помоги с заявкой «${service.title}», этап «${stage.title}», шаг «${currentStep?.title || ""}».`,
                `Заполнено ${fillPercent}% данных.`,
              ];
              if (empty.length) parts.push(`Не заполнены обязательные поля: ${empty.join(", ")}.`);
              if (failing.length) parts.push(`Не выполнены условия: ${failing.join("; ")}.`);
              parts.push("Подскажи, что и как заполнить.");
              onAskAssistant({ prompt: parts.join(" ") });
            }}
          >
            <MessageCircleQuestion size={16} /> Спросить навигатора
          </button>
        ) : null}
      </aside>
    </div>
  );
}
