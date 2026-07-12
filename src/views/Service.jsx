"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Check, FileText, ChevronDown, Sparkles } from "lucide-react";
import api from "../api.js";

function Skeleton() {
  return (
    <div className="container pub-section">
      <div className="pub-skel" style={{ width: 240, height: 16, marginBottom: 24 }} />
      <div className="pub-svc-head">
        <div>
          <div className="pub-skel" style={{ width: 160, height: 22, marginBottom: 16 }} />
          <div className="pub-skel" style={{ width: "70%", height: 36, marginBottom: 14 }} />
          <div className="pub-skel" style={{ width: "90%", height: 60 }} />
        </div>
        <div className="pub-skel" style={{ width: "100%", height: 260, borderRadius: "var(--r-lg)" }} />
      </div>
    </div>
  );
}

function Faq({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"pub-faq-item" + (open ? " open" : "")}>
      <button className="pub-faq-q" onClick={() => setOpen((v) => !v)}>
        {item.q}
        <ChevronDown size={18} />
      </button>
      {open && <div className="pub-faq-a">{item.a}</div>}
    </div>
  );
}

export default function Service({ go, route, openAssistant }) {
  const id = route.params?.id;
  const [service, setService] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    let alive = true;
    if (!id) return;
    api.service(id)
      .then((data) => { if (alive) setService(data && data.id ? data : null); })
      .catch(() => { if (alive) setService(null); });
    return () => { alive = false; };
  }, [id]);

  if (service === undefined) return <Skeleton />;

  if (service === null) {
    return (
      <div className="container pub-section">
        <div className="empty">
          <h3>Услуга не найдена</h3>
          <p>Возможно, она была снята с публикации или адрес указан неверно.</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => go("/catalog")}>
            В каталог мер поддержки
          </button>
        </div>
      </div>
    );
  }

  const s = service;
  const card = s.card || {};
  const stages = s.stages || [];

  return (
    <div className="container pub-section">
      <div className="pub-crumbs">
        <button onClick={() => go("/catalog")}>Каталог</button>
        <span>/</span>
        <button onClick={() => go(`/catalog?kind=${encodeURIComponent(s.kind)}`)}>{s.kind}</button>
      </div>

      {s.id === "wagons-leasing" && (
        <div className="pub-demo-context">
          <span className="chip chip-gold">Демо · шаг 2 из 7</span>
          <span>AI подобрал услугу. Проверьте условия и начните предварительную заявку.</span>
        </div>
      )}

      <div className="pub-svc-head">
        <div>
          <div className="pub-svc-chips">
            <span className="chip">{s.orgShort || s.org}</span>
            <span className="chip chip-line">{s.kind}</span>
          </div>
          <h1>{s.title}</h1>
          <p className="pub-svc-summary">{s.summary}</p>
          <button className="btn btn-ghost pub-explain-btn" onClick={() => openAssistant(`Объясни условия услуги ${s.title}`)}>
            <Sparkles size={16} /> Объяснить условия простым языком
          </button>
        </div>

        <div className="card pub-apply-card">
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>Подать заявку</h3>
          <p className="small muted">Предварительная форма займёт немного времени</p>
          <div className="pub-apply-table">
            {card.amount && <div className="pub-apply-row"><span>Сумма</span><b className="mono">{card.amount}</b></div>}
            {card.term && <div className="pub-apply-row"><span>Срок</span><b className="mono">{card.term}</b></div>}
            {card.rate && <div className="pub-apply-row"><span>Ставка</span><b className="mono">{card.rate}</b></div>}
            {card.decisionDays && <div className="pub-apply-row"><span>Решение</span><b className="mono">{card.decisionDays} дней</b></div>}
          </div>
          <button className="btn btn-gold btn-lg" onClick={() => go(`/apply/${s.id}?demo=1`)}>
            Начать заявку <ArrowRight size={16} />
          </button>
          <p className="pub-apply-note">
            ≈ 5–10 минут на первый этап · сохраняется черновик · вход через eGov (мок)
          </p>
        </div>
      </div>

      {stages.length > 1 && (
        <div className="pub-stages-wrap">
          <div className="pub-section-head">
            <div>
              <span className="eyebrow">Процесс</span>
              <h2>Как проходит услуга</h2>
            </div>
          </div>
          <div className="rail pub-rail-wide">
            {stages.map((stage, i) => (
              <div key={stage.id} className={"rail-node" + (i === 0 ? " active" : "")}>
                <div className="rail-title">{stage.title}</div>
                <p>{stage.description}</p>
              </div>
            ))}
          </div>
          <div className="pub-stages-note">
            Сначала короткая предварительная заявка — полный пакет документов потребуется только после одобрения.
          </div>
        </div>
      )}

      {card.resultText && (
        <div className="pub-result-block">
          <h2>Что вы получите</h2>
          <p>{card.resultText}</p>
        </div>
      )}

      <div className="pub-svc-grid">
        {card.conditions?.length > 0 && (
          <div className="pub-svc-block">
            <h2>Условия</h2>
            <ul className="pub-list-check">
              {card.conditions.map((c, i) => (
                <li key={i}><Check size={16} />{c}</li>
              ))}
            </ul>
          </div>
        )}
        {card.benefits?.length > 0 && (
          <div className="pub-svc-block">
            <h2>Преимущества</h2>
            <ul className="pub-list-check">
              {card.benefits.map((b, i) => (
                <li key={i}><Check size={16} />{b}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {card.documents?.length > 0 && (
        <div className="pub-svc-block" style={{ marginBottom: 48 }}>
          <h2>Документы</h2>
          <div className="pub-doc-list">
            {card.documents.map((d, i) => (
              <div key={i} className="pub-doc-item">
                <FileText size={16} />
                <span>{d}</span>
                <span className="tag">на этапе полной заявки</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {card.faq?.length > 0 && (
        <div className="pub-svc-block">
          <h2>Вопросы и ответы</h2>
          <div>
            {card.faq.map((item, i) => <Faq key={i} item={item} />)}
          </div>
        </div>
      )}
    </div>
  );
}
