"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Calculator, FileDown, BookOpen, ListChecks, ChevronDown, ChevronUp, Download,
} from "lucide-react";
import { tools } from "../data/tools.js";

function formatMoney(n) {
  if (!n) return "";
  return Math.round(n).toLocaleString("ru-RU").replace(/,/g, " ");
}

function parseMoney(str) {
  const digits = str.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function annuityPayment(principal, ratePercentYear, months) {
  if (!principal || !months) return 0;
  const r = ratePercentYear / 100 / 12;
  if (!r) return principal / months;
  const k = Math.pow(1 + r, months);
  return (principal * r * k) / (k - 1);
}

function CreditCalculator({ openAssistant }) {
  const [amount, setAmount] = useState(15000000);
  const [rate, setRate] = useState(11.5);
  const [months, setMonths] = useState(36);

  const payment = annuityPayment(amount, rate, months);
  const total = payment * months;
  const overpay = total - amount;

  return (
    <div className="mod-calc-panel">
      <h3 style={{ marginBottom: 18 }}>Кредитный калькулятор</h3>
      <div className="mod-calc-grid">
        <div>
          <div className="mod-calc-field">
            <span className="label">Сумма кредита, ₸</span>
            <input
              className="input mono"
              inputMode="numeric"
              value={formatMoney(amount)}
              onChange={(e) => setAmount(parseMoney(e.target.value))}
            />
          </div>
          <div className="mod-calc-field">
            <span className="label">Ставка вознаграждения, % годовых</span>
            <div className="mod-calc-slider-row">
              <input type="range" min={3} max={25} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
              <span className="mono">{rate.toFixed(1)}%</span>
            </div>
          </div>
          <div className="mod-calc-field">
            <span className="label">Срок, месяцев</span>
            <div className="mod-calc-slider-row">
              <input type="range" min={6} max={180} step={1} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
              <span className="mono">{months} мес</span>
            </div>
          </div>
        </div>

        <div className="mod-calc-result">
          <div className="mod-calc-result-label">Ежемесячный платёж</div>
          <div className="mod-calc-result-value mono">{formatMoney(payment)} ₸</div>
          <div className="mod-calc-sub"><span>Переплата</span><b className="mono">{formatMoney(overpay)} ₸</b></div>
          <div className="mod-calc-sub"><span>Итого к возврату</span><b className="mono">{formatMoney(total)} ₸</b></div>
          <button
            className="btn btn-gold mod-calc-cta"
            onClick={() => openAssistant(`Нужен кредит ${formatMoney(amount)} ₸ на ${months} месяцев`)}
          >
            Подобрать меру поддержки под эти параметры
          </button>
        </div>
      </div>
    </div>
  );
}

function GuideCard({ guide }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card card-hover mod-guide-card" onClick={() => setOpen((v) => !v)}>
      <div className="mod-guide-head">
        <h3>{guide.title}</h3>
        <span className="mod-guide-mins">{guide.minutes} мин {open ? <ChevronUp size={15} style={{ verticalAlign: -2 }} /> : <ChevronDown size={15} style={{ verticalAlign: -2 }} />}</span>
      </div>
      {guide.desc && <p className="muted small">{guide.desc}</p>}
      {open && (
        <div className="mod-guide-steps">
          {(guide.steps || []).map((step, i) => (
            <div key={i} className="mod-guide-step">
              <p>{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistCard({ checklist }) {
  const storageKey = `eppb-checklist-${checklist.id}`;
  const [checked, setChecked] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  const toggle = (idx) => {
    setChecked((cur) => {
      const next = { ...cur, [idx]: !cur[idx] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const total = checklist.items.length;
  const done = checklist.items.filter((_, i) => checked[i]).length;

  return (
    <div className="card mod-checklist-card">
      <h3>{checklist.title}</h3>
      <div className="mod-checklist-progress-row">
        <span>Прогресс</span>
        <span className="mono">{done} из {total}</span>
      </div>
      <div className="mod-checklist-bar">
        <div className="mod-checklist-bar-fill" style={{ width: total ? `${(done / total) * 100}%` : "0%" }} />
      </div>
      {checklist.items.map((item, i) => (
        <label key={i} className={"mod-checklist-item" + (checked[i] ? " done" : "")}>
          <input type="checkbox" checked={!!checked[i]} onChange={() => toggle(i)} />
          <span>
            {item.text}
            {item.hint && <span className="mod-checklist-hint">{item.hint}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

export default function Tools({ notify, openAssistant }) {
  const [calcOpen, setCalcOpen] = useState(null);
  const creditCalc = tools.calculators.find((c) => c.id === "credit" || /кредит/i.test(c.title));

  return (
    <div className="container">
      <section className="mod-hero">
        <span className="eyebrow">Инструменты</span>
        <h1>Всё для запуска и роста бизнеса</h1>
        <p className="mod-hero-sub">
          Калькуляторы, шаблоны документов, пошаговые гайды и чек-листы — чтобы подготовиться к заявке
          заранее и не терять время на рассмотрении.
        </p>
      </section>

      <section className="mod-section">
        <div className="mod-section-head">
          <div>
            <span className="eyebrow">Калькуляторы</span>
            <h2 style={{ fontSize: 20 }}>Оцените параметры финансирования</h2>
          </div>
        </div>
        <div className="mod-tool-grid">
          {tools.calculators.map((c) => {
            const isCredit = c.id === "credit" || /кредит/i.test(c.title);
            return (
              <div key={c.id} className="card card-hover mod-tool-card">
                <span className="mod-tool-icon"><Calculator size={19} /></span>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
                {isCredit ? (
                  <button className="btn btn-primary" onClick={() => setCalcOpen((v) => v === c.id ? null : c.id)}>
                    {calcOpen === c.id ? "Свернуть" : "Рассчитать"}
                  </button>
                ) : (
                  <button className="btn" onClick={() => notify("Скоро", `Калькулятор «${c.title}» появится в следующем обновлении`)}>
                    Скоро
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {creditCalc && calcOpen === creditCalc.id && (
          <CreditCalculator openAssistant={openAssistant} />
        )}
      </section>

      <section className="mod-section">
        <div className="mod-section-head">
          <div>
            <span className="eyebrow">Шаблоны документов</span>
            <h2 style={{ fontSize: 20 }}>Готовые формы для заявки</h2>
          </div>
        </div>
        <div className="mod-registry-wrap">
          <table className="registry">
            <thead>
              <tr>
                <th>Документ</th>
                <th>Формат</th>
                <th>Размер</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tools.templates.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td><span className="chip chip-line">{t.format}</span></td>
                  <td className="mono">{t.size}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => notify("Демо: файл-шаблон", `«${t.title}» будет доступен для скачивания в рабочей версии`)}
                    >
                      <Download size={14} /> Скачать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mod-section">
        <div className="mod-section-head">
          <div>
            <span className="eyebrow">Пошаговые гайды</span>
            <h2 style={{ fontSize: 20 }}>Разберитесь до подачи заявки</h2>
          </div>
        </div>
        <div className="mod-tool-grid">
          {tools.guides.map((g) => <GuideCard key={g.id} guide={g} />)}
        </div>
      </section>

      <section className="mod-section">
        <div className="mod-section-head">
          <div>
            <span className="eyebrow">Чек-листы</span>
            <h2 style={{ fontSize: 20 }}>Проверьте готовность документов</h2>
          </div>
        </div>
        <div className="mod-tool-grid">
          {tools.checklists.map((c) => <ChecklistCard key={c.id} checklist={c} />)}
        </div>
      </section>

      <div className="mod-cta-band">
        <div>
          <h3>Не нашли нужное?</h3>
          <p>Навигатор подскажет меру поддержки и инструмент под вашу задачу.</p>
        </div>
        <button className="btn btn-gold" onClick={() => openAssistant()}>
          Спросить навигатора
        </button>
      </div>
    </div>
  );
}
