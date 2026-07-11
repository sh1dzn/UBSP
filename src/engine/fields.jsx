"use client";

import { useRef, useState } from "react";
import {
  Info,
  AlertTriangle,
  Search,
  Building2,
  Upload,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  X,
} from "lucide-react";

// ---------- форматирование ----------

function formatMoney(value) {
  const num = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(num)) return "";
  return `${Math.round(num).toLocaleString("ru-RU").replace(/,/g, " ")} ₸`;
}

function formatMoneyInput(raw) {
  const digits = String(raw).replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatPercentDisplay(value) {
  const num = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(num)) return "";
  return `${num}%`;
}

function formatNumberDisplay(value) {
  const num = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString("ru-RU").replace(/,/g, " ");
}

function formatCalcValue(value, format) {
  if (value === undefined || value === null || value === "") return "—";
  if (format === "money") return formatMoney(value);
  if (format === "percent") return formatPercentDisplay(value);
  return formatNumberDisplay(value);
}

// ---------- вспомогательные обёртки ----------

function FieldShell({ field, error, children }) {
  return (
    <div className="fr-field">
      <label className="label" htmlFor={field.id}>
        {field.label}
        {field.required ? <span className="req">*</span> : null}
      </label>
      {children}
      {field.hint ? <div className="hint">{field.hint}</div> : null}
      {error ? <div className="field-error">{error}</div> : null}
    </div>
  );
}

// ---------- отдельные типы полей ----------

function TextField({ field, value, error, onChange }) {
  return (
    <FieldShell field={field} error={error}>
      <input
        id={field.id}
        className={`input${error ? " invalid" : ""}`}
        type="text"
        placeholder={field.placeholder || ""}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

function TextareaField({ field, value, error, onChange }) {
  return (
    <FieldShell field={field} error={error}>
      <textarea
        id={field.id}
        className={`textarea${error ? " invalid" : ""}`}
        placeholder={field.placeholder || ""}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

function NumberField({ field, value, error, onChange }) {
  return (
    <FieldShell field={field} error={error}>
      <input
        id={field.id}
        className={`input${error ? " invalid" : ""}`}
        type="number"
        placeholder={field.placeholder || ""}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
      />
    </FieldShell>
  );
}

function MoneyField({ field, value, error, onChange }) {
  const display = value === "" || value === undefined || value === null ? "" : formatMoneyInput(value);
  return (
    <FieldShell field={field} error={error}>
      <div className="fr-money-wrap">
        <input
          id={field.id}
          className={`input${error ? " invalid" : ""}`}
          type="text"
          inputMode="numeric"
          placeholder={field.placeholder || "0"}
          value={display}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^\d]/g, "");
            onChange(digits === "" ? "" : Number(digits));
          }}
        />
        <span className="fr-money-suffix">₸</span>
      </div>
    </FieldShell>
  );
}

function PercentField({ field, value, error, onChange }) {
  return (
    <FieldShell field={field} error={error}>
      <div className="fr-money-wrap">
        <input
          id={field.id}
          className={`input${error ? " invalid" : ""}`}
          type="number"
          step="0.1"
          placeholder={field.placeholder || "0"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
        />
        <span className="fr-money-suffix">%</span>
      </div>
    </FieldShell>
  );
}

function SelectField({ field, value, error, onChange }) {
  const options = field.__options || field.options || [];
  return (
    <FieldShell field={field} error={error}>
      <select
        id={field.id}
        className={`select${error ? " invalid" : ""}`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Выберите...
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function RadioField({ field, value, error, onChange }) {
  const options = field.__options || field.options || [];
  return (
    <FieldShell field={field} error={error}>
      <div className="fr-radio-grid">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              type="button"
              key={opt.value}
              className={`fr-radio-card${active ? " is-active" : ""}`}
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
            >
              <span className="fr-radio-dot" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}

function CheckboxField({ field, value, error, onChange }) {
  return (
    <div className="fr-field">
      <label className="fr-checkbox-row">
        <input
          id={field.id}
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          {field.label}
          {field.required ? <span className="req">*</span> : null}
        </span>
      </label>
      {field.hint ? <div className="hint">{field.hint}</div> : null}
      {error ? <div className="field-error">{error}</div> : null}
    </div>
  );
}

function ChecklistField({ field, value, error, onChange }) {
  const options = field.__options || field.options || [];
  const list = Array.isArray(value) ? value : [];
  const toggle = (val) => {
    if (list.includes(val)) onChange(list.filter((v) => v !== val));
    else onChange([...list, val]);
  };
  return (
    <FieldShell field={field} error={error}>
      <div className="fr-checklist">
        {options.map((opt) => {
          const active = list.includes(opt.value);
          return (
            <label key={opt.value} className={`fr-checklist-item${active ? " is-active" : ""}`}>
              <input type="checkbox" checked={active} onChange={() => toggle(opt.value)} />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
    </FieldShell>
  );
}

function DateField({ field, value, error, onChange }) {
  return (
    <FieldShell field={field} error={error}>
      <input
        id={field.id}
        className={`input${error ? " invalid" : ""}`}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

function BinField({ field, value, error, onChange, onVerifyBin }) {
  const company = field.__company;
  return (
    <FieldShell field={field} error={error}>
      <div className="fr-bin-row">
        <input
          id={field.id}
          className={`input mono${error ? " invalid" : ""}`}
          type="text"
          inputMode="numeric"
          maxLength={12}
          placeholder="123456789012"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, "").slice(0, 12))}
        />
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onVerifyBin && onVerifyBin(value)}
          disabled={!value || String(value).length !== 12}
        >
          <Search size={16} /> Проверить
        </button>
      </div>
      {company ? (
        <div className="fr-company-card">
          <Building2 size={18} />
          <div>
            <div className="fr-company-name">{company.name}</div>
            <div className="fr-company-meta">
              {company.region ? <span>{company.region}</span> : null}
              {company.okedCode ? <span>ОКЭД {company.okedCode}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </FieldShell>
  );
}

function IinField({ field, value, error, onChange }) {
  return (
    <FieldShell field={field} error={error}>
      <input
        id={field.id}
        className={`input mono${error ? " invalid" : ""}`}
        type="text"
        inputMode="numeric"
        maxLength={12}
        placeholder="123456789012"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, "").slice(0, 12))}
      />
    </FieldShell>
  );
}

function PhoneField({ field, value, error, onChange }) {
  return (
    <FieldShell field={field} error={error}>
      <input
        id={field.id}
        className={`input${error ? " invalid" : ""}`}
        type="tel"
        placeholder={field.placeholder || "+7 (___) ___-__-__"}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

function FileField({ field, value, error, onChange }) {
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef(null);

  const handlePick = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setVerifying(true);
    onChange({ name: file.name, size: file.size, signed: false });
    setTimeout(() => {
      onChange({ name: file.name, size: file.size, signed: true });
      setVerifying(false);
    }, 600);
  };

  const clear = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <FieldShell field={field} error={error}>
      {!value ? (
        <button type="button" className="btn" onClick={() => inputRef.current && inputRef.current.click()}>
          <Upload size={16} /> Выбрать файл
        </button>
      ) : (
        <div className="fr-file-card">
          <FileCheck2 size={18} />
          <div className="fr-file-meta">
            <div className="fr-file-name">{value.name}</div>
            <div className="muted small">{formatFileSize(value.size)}</div>
          </div>
          <div className="row">
            {verifying ? (
              <span className="chip">Проверка...</span>
            ) : (
              <>
                <span className="chip chip-green">
                  <ShieldCheck size={14} /> Проверен антивирусом
                </span>
                {value.signed ? (
                  <span className="chip chip-gold">
                    <CheckCircle2 size={14} /> Подписан ЭЦП (мок)
                  </span>
                ) : null}
              </>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={clear} aria-label="Удалить файл">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handlePick}
      />
    </FieldShell>
  );
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function CalcField({ field, value }) {
  return (
    <div className="fr-field">
      <label className="label">{field.label}</label>
      <div className="fr-calc-value">{formatCalcValue(value, field.format)}</div>
      {field.hint ? <div className="hint">{field.hint}</div> : null}
    </div>
  );
}

function InfoField({ field }) {
  const isWarning = field.variant === "warning";
  return (
    <div className={`fr-info-block${isWarning ? " is-warning" : ""}`}>
      {isWarning ? <AlertTriangle size={18} /> : <Info size={18} />}
      <div>
        {field.label ? <div className="fr-info-title">{field.label}</div> : null}
        {field.hint ? <div className="fr-info-text">{field.hint}</div> : null}
      </div>
    </div>
  );
}

// ---------- маршрутизатор типов ----------

export function FieldControl({ field, value, answers, error, onChange, onVerifyBin }) {
  switch (field.type) {
    case "text":
      return <TextField field={field} value={value} error={error} onChange={onChange} />;
    case "textarea":
      return <TextareaField field={field} value={value} error={error} onChange={onChange} />;
    case "number":
      return <NumberField field={field} value={value} error={error} onChange={onChange} />;
    case "money":
      return <MoneyField field={field} value={value} error={error} onChange={onChange} />;
    case "percent":
      return <PercentField field={field} value={value} error={error} onChange={onChange} />;
    case "select":
      return <SelectField field={field} value={value} error={error} onChange={onChange} />;
    case "radio":
      return <RadioField field={field} value={value} error={error} onChange={onChange} />;
    case "checkbox":
      return <CheckboxField field={field} value={value} error={error} onChange={onChange} />;
    case "checklist":
      return <ChecklistField field={field} value={value} error={error} onChange={onChange} />;
    case "date":
      return <DateField field={field} value={value} error={error} onChange={onChange} />;
    case "bin":
      return (
        <BinField field={field} value={value} error={error} onChange={onChange} onVerifyBin={onVerifyBin} />
      );
    case "iin":
      return <IinField field={field} value={value} error={error} onChange={onChange} />;
    case "phone":
      return <PhoneField field={field} value={value} error={error} onChange={onChange} />;
    case "file":
      return <FileField field={field} value={value} error={error} onChange={onChange} />;
    case "calc":
      return <CalcField field={field} value={value} answers={answers} />;
    case "info":
      return <InfoField field={field} />;
    default:
      return <TextField field={field} value={value} error={error} onChange={onChange} />;
  }
}

export default FieldControl;
