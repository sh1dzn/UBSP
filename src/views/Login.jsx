"use client";
import { useState } from "react";
import { ArrowRight, Building2, KeyRound, ShieldCheck } from "lucide-react";
import { useAuth, checkAdminCredentials, DEMO_ADMIN, DEMO_BUSINESS } from "../shell/auth.js";

export default function Login({ go, route, notify }) {
  const { signIn } = useAuth();
  const [egovLoading, setEgovLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const next = route.query?.next || null;

  const finish = (user, fallback) => {
    signIn(user);
    notify("Вы вошли в портал", user.name);
    go(next || fallback);
  };

  const loginEgov = () => {
    setEgovLoading(true);
    setTimeout(() => finish(DEMO_BUSINESS, "/cabinet"), 800);
  };

  const loginAdmin = (e) => {
    e.preventDefault();
    if (!checkAdminCredentials(email, password)) {
      setError("Неверная почта или пароль. Для демо: admin@baiterek.gov.kz / baiterek2026");
      return;
    }
    setError(null);
    finish(DEMO_ADMIN, "/admin");
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <span className="eyebrow">Вход в портал</span>
        <h1>Войдите, чтобы продолжить</h1>
        <p className="auth-sub">
          Заявки, статусы и черновики привязаны к вашему аккаунту.
        </p>

        <div className="auth-block">
          <div className="auth-block-head">
            <Building2 size={16} />
            <b>Предприниматель</b>
          </div>
          <p>Вход через государственную систему идентификации по ЭЦП руководителя.</p>
          <button className="btn btn-gold btn-lg auth-egov" onClick={loginEgov} disabled={egovLoading}>
            {egovLoading ? "Подключение к eGov IDP…" : <>Войти через eGov Business <ArrowRight size={16} /></>}
          </button>
          <span className="auth-hint">Демо: вход выполняется как {DEMO_BUSINESS.name}</span>
        </div>

        <div className="auth-divider"><span>или</span></div>

        <form className="auth-block" onSubmit={loginAdmin}>
          <div className="auth-block-head">
            <ShieldCheck size={16} />
            <b>Сотрудник Холдинга</b>
          </div>
          <label className="label" htmlFor="auth-email">Рабочая почта</label>
          <input
            id="auth-email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@baiterek.gov.kz"
            autoComplete="username"
          />
          <label className="label" htmlFor="auth-pass" style={{ marginTop: 12 }}>Пароль</label>
          <input
            id="auth-pass"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          {error ? <div className="field-error">{error}</div> : null}
          <button type="submit" className="btn btn-primary btn-lg auth-admin-btn">
            <KeyRound size={16} /> Войти в админ-кабинет
          </button>
          <span className="auth-hint">Демо-доступ: admin@baiterek.gov.kz / baiterek2026</span>
        </form>
      </div>
      <p className="auth-note">
        Прототип: авторизация имитируется на стороне клиента. В продуктиве — eGov IDP
        для предпринимателей и корпоративный SSO для сотрудников.
      </p>
    </div>
  );
}
