"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Calculator, FileDown, BookOpen, ListChecks, ChevronDown, ChevronUp, Download,
} from "lucide-react";
import { tools } from "../data/tools.js";
import PageHero from "../shell/PageHero.jsx";

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

function LeasingCalculator({ openAssistant }) {
  const [asset, setAsset] = useState(30000000);
  const [advancePct, setAdvancePct] = useState(20);
  const [rate, setRate] = useState(13.5);
  const [months, setMonths] = useState(60);
  const advance = asset * advancePct / 100;
  const financed = Math.max(0, asset - advance);
  const payment = annuityPayment(financed, rate, months);
  const total = advance + payment * months;
  return <CalculatorPanel title="Лизинговый калькулятор" fields={<>
    <MoneyField label="Стоимость предмета лизинга, ₸" value={asset} onChange={setAsset} />
    <RangeField label="Аванс" min={10} max={50} step={1} value={advancePct} onChange={setAdvancePct} suffix="%" />
    <RangeField label="Ставка" min={3} max={25} step={0.1} value={rate} onChange={setRate} suffix="%" decimals={1} />
    <RangeField label="Срок" min={12} max={120} step={1} value={months} onChange={setMonths} suffix=" мес" />
  </>} result={<>
    <ResultMain label="Ежемесячный платёж" value={`${formatMoney(payment)} ₸`} />
    <ResultRow label="Первоначальный взнос" value={`${formatMoney(advance)} ₸`} />
    <ResultRow label="Сумма финансирования" value={`${formatMoney(financed)} ₸`} />
    <ResultRow label="Итого выплат" value={`${formatMoney(total)} ₸`} />
    <button className="btn btn-gold mod-calc-cta" onClick={() => openAssistant(`Нужен лизинг актива стоимостью ${formatMoney(asset)} ₸ на ${months} месяцев`)}>Подобрать программу лизинга</button>
  </>} />;
}

function DebtLoadCalculator() {
  const [revenue, setRevenue] = useState(6000000);
  const [payments, setPayments] = useState(1500000);
  const [newPayment, setNewPayment] = useState(600000);
  const ratio = revenue ? ((payments + newPayment) / revenue) * 100 : 0;
  const level = ratio <= 40 ? ["Комфортная", "chip-green"] : ratio <= 50 ? ["Пограничная", "chip-amber"] : ["Высокая", "chip-red"];
  return <CalculatorPanel title="Проверка долговой нагрузки" fields={<>
    <MoneyField label="Среднемесячная выручка, ₸" value={revenue} onChange={setRevenue} />
    <MoneyField label="Текущие ежемесячные платежи, ₸" value={payments} onChange={setPayments} />
    <MoneyField label="Платёж по новому финансированию, ₸" value={newPayment} onChange={setNewPayment} />
  </>} result={<>
    <ResultMain label="Коэффициент долговой нагрузки" value={`${ratio.toFixed(1)}%`} />
    <div style={{ marginBottom: 12 }}><span className={`chip ${level[1]}`}>{level[0]} нагрузка</span></div>
    <ResultRow label="Все платежи в месяц" value={`${formatMoney(payments + newPayment)} ₸`} />
    <p className="muted small" style={{ marginTop: 14 }}>Ориентир MVP: до 40% — комфортно, 40–50% — требуется анализ, выше 50% — повышенный риск. Финальное решение принимает финансовая организация.</p>
  </>} />;
}

function SubsidyCalculator({ openAssistant }) {
  const [amount, setAmount] = useState(20000000);
  const [marketRate, setMarketRate] = useState(20);
  const [subsidy, setSubsidy] = useState(12);
  const [months, setMonths] = useState(36);
  const effectiveRate = Math.max(0, marketRate - subsidy);
  const marketPayment = annuityPayment(amount, marketRate, months);
  const subsidizedPayment = annuityPayment(amount, effectiveRate, months);
  const saving = (marketPayment - subsidizedPayment) * months;
  return <CalculatorPanel title="Калькулятор субсидирования ставки" fields={<>
    <MoneyField label="Сумма кредита, ₸" value={amount} onChange={setAmount} />
    <RangeField label="Рыночная ставка" min={8} max={30} step={0.1} value={marketRate} onChange={setMarketRate} suffix="%" decimals={1} />
    <RangeField label="Субсидируемая часть" min={0} max={20} step={0.1} value={subsidy} onChange={setSubsidy} suffix=" п.п." decimals={1} />
    <RangeField label="Срок" min={6} max={84} step={1} value={months} onChange={setMonths} suffix=" мес" />
  </>} result={<>
    <ResultMain label="Эффективная ставка для бизнеса" value={`${effectiveRate.toFixed(1)}%`} />
    <ResultRow label="Платёж без субсидии" value={`${formatMoney(marketPayment)} ₸`} />
    <ResultRow label="Платёж с субсидией" value={`${formatMoney(subsidizedPayment)} ₸`} />
    <ResultRow label="Экономия за срок" value={`${formatMoney(saving)} ₸`} />
    <button className="btn btn-gold mod-calc-cta" onClick={() => openAssistant(`Ищу субсидирование кредита ${formatMoney(amount)} ₸, рыночная ставка ${marketRate}%`)}>Найти подходящую субсидию</button>
  </>} />;
}

function MoneyField({ label, value, onChange }) {
  return <div className="mod-calc-field"><span className="label">{label}</span><input className="input mono" inputMode="numeric" value={formatMoney(value)} onChange={(e) => onChange(parseMoney(e.target.value))} /></div>;
}
function RangeField({ label, min, max, step, value, onChange, suffix, decimals = 0 }) {
  return <div className="mod-calc-field"><span className="label">{label}</span><div className="mod-calc-slider-row"><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /><span className="mono">{Number(value).toFixed(decimals)}{suffix}</span></div></div>;
}
function ResultMain({ label, value }) { return <><div className="mod-calc-result-label">{label}</div><div className="mod-calc-result-value mono">{value}</div></>; }
function ResultRow({ label, value }) { return <div className="mod-calc-sub"><span>{label}</span><b className="mono">{value}</b></div>; }
function CalculatorPanel({ title, fields, result }) { return <div className="mod-calc-panel"><h3 style={{ marginBottom: 18 }}>{title}</h3><div className="mod-calc-grid"><div>{fields}</div><div className="mod-calc-result">{result}</div></div></div>; }

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
  const calculator = calcOpen === "credit-calc" ? <CreditCalculator openAssistant={openAssistant} />
    : calcOpen === "leasing-calc" ? <LeasingCalculator openAssistant={openAssistant} />
    : calcOpen === "debt-load-calc" ? <DebtLoadCalculator />
    : calcOpen === "subsidy-calc" ? <SubsidyCalculator openAssistant={openAssistant} /> : null;

  return (
    <div className="container">
      <PageHero
        photo="/assets/dir-fields.jpg"
        eyebrow="Инструменты"
        title="Всё для запуска и роста бизнеса"
        sub="Калькуляторы, шаблоны документов, пошаговые гайды и чек-листы — подготовьтесь к заявке заранее."
      />

      <section className="mod-section">
        <div className="mod-section-head">
          <div>
            <span className="eyebrow">Калькуляторы</span>
            <h2 className="section-title">Оцените параметры финансирования</h2>
          </div>
        </div>
        <div className="mod-tool-grid">
          {tools.calculators.map((c) => {
            return (
              <div key={c.id} className="card card-hover mod-tool-card">
                <span className="mod-tool-icon"><Calculator size={19} /></span>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
                <button className="btn btn-primary" onClick={() => setCalcOpen((v) => v === c.id ? null : c.id)}>
                  {calcOpen === c.id ? "Свернуть" : "Рассчитать"}
                </button>
              </div>
            );
          })}
        </div>
        {calculator}
      </section>

      <section className="mod-section">
        <div className="mod-section-head">
          <div>
            <span className="eyebrow">Шаблоны документов</span>
            <h2 className="section-title">Готовые формы для заявки</h2>
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
                    <a className="btn btn-sm btn-ghost" href={t.href} download>
                      <Download size={14} /> Скачать
                    </a>
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
            <h2 className="section-title">Разберитесь до подачи заявки</h2>
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
            <h2 className="section-title">Проверьте готовность документов</h2>
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
