"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, ChevronDown, LogOut, Menu, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { PortalContext } from "./portal-context.js";
import { AuthContext, useAuthState } from "./auth.js";
import Assistant from "../ai/Assistant.jsx";

const NAV = [
  { path: "/catalog", label: "Меры поддержки" },
  { path: "/map", label: "Карта проектов" },
  { path: "/reports", label: "Аналитика" },
  { path: "/tools", label: "Инструменты" },
  { path: "/cabinet", label: "Личный кабинет" },
];

export default function PortalShell({ children }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [toasts, setToasts] = useState([]);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const auth = useAuthState();

  const notify = useCallback((title, text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, title, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5200);
  }, []);

  const openAssistant = useCallback((prompt) => {
    setAssistantPrompt(prompt || null);
    setAssistantOpen(true);
  }, []);

  const isAdmin = pathname.startsWith("/admin");
  const isHome = pathname === "/";

  return (
    <AuthContext.Provider value={auth}>
    <PortalContext.Provider value={{ notify, openAssistant }}>
      <div className="app-shell">
        <header className={"site-header" + (isHome ? " over-hero" : "")}>
          <div className="container site-header-inner">
            <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
              <span className="brand-mark">
                <img src="/assets/baiterek-mark.webp" alt="Байтерек" />
              </span>
              <span className="brand-text">
                <b>ЕППБ</b>
                <span>Единый портал поддержки бизнеса</span>
              </span>
            </Link>
            <nav className={"site-nav" + (menuOpen ? " open" : "")}>
              {NAV.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={pathname.startsWith(item.path) ? "active" : ""}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/admin"
                className={"nav-admin" + (isAdmin ? " active" : "")}
                onClick={() => setMenuOpen(false)}
              >
                Администрирование
              </Link>
            </nav>
            <div className="header-actions">
              {auth.user ? (
                <div className="user-menu-wrap">
                  <button
                    className="user-chip"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-expanded={userMenuOpen}
                  >
                    <span className="user-chip-icon">
                      {auth.user.role === "admin" ? <ShieldCheck size={15} /> : <UserRound size={15} />}
                    </span>
                    <span className="user-chip-name">{auth.user.name}</span>
                    <ChevronDown size={14} />
                  </button>
                  {userMenuOpen ? (
                    <div className="user-menu" onMouseLeave={() => setUserMenuOpen(false)}>
                      <div className="user-menu-head">
                        <b>{auth.user.name}</b>
                        <span>{auth.user.role === "admin" ? auth.user.title : `БИН ${auth.user.bin}`}</span>
                      </div>
                      {auth.user.role === "admin" ? (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)}>Администрирование</Link>
                      ) : (
                        <Link href="/cabinet" onClick={() => setUserMenuOpen(false)}>Личный кабинет</Link>
                      )}
                      <button
                        onClick={() => { auth.signOut(); setUserMenuOpen(false); notify("Вы вышли из аккаунта"); router.push("/"); }}
                      >
                        <LogOut size={14} /> Выйти
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link href="/login" className="btn btn-sm login-launch">Войти</Link>
              )}
              <button className="btn btn-sm assistant-launch" onClick={() => openAssistant()}>
                <Bot size={16} /> <span className="assistant-label">Навигатор</span>
              </button>
              <button
                className="btn btn-sm menu-toggle"
                aria-label="Меню"
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </div>
        </header>

        <main>{children}</main>

        {!isAdmin && (
          <footer className="site-footer">
            <div className="container footer-inner">
              <div>
                <div className="brand footer-brand">
                  <span className="brand-mark">
                    <img src="/assets/baiterek-mark.webp" alt="Байтерек" />
                  </span>
                  <span className="brand-text">
                    <b>ЕППБ</b>
                    <span>Группа АО «НУХ «Байтерек»</span>
                  </span>
                </div>
                <p className="footer-note">
                  Демонстрационный MVP. Авторизация — eGov IDP (мок), подписание — ЭЦП (мок),
                  передача заявок — через интеграционную шину в BPM дочерних организаций.
                </p>
              </div>
              <div className="footer-cols">
                <div>
                  <h4>Портал</h4>
                  {NAV.map((item) => (
                    <Link key={item.path} href={item.path}>{item.label}</Link>
                  ))}
                </div>
                <div>
                  <h4>Группа Байтерек</h4>
                  <a href="https://baiterek.gov.kz" target="_blank" rel="noreferrer">Холдинг «Байтерек»</a>
                  <a href="https://www.kdb.kz" target="_blank" rel="noreferrer">Банк развития Казахстана</a>
                  <a href="https://damu.kz" target="_blank" rel="noreferrer">Фонд «Даму»</a>
                  <a href="https://kazakhexport.kz" target="_blank" rel="noreferrer">KazakhExport</a>
                </div>
              </div>
            </div>
            <div className="container footer-bottom">
              <span className="mono">EPPB MVP · v2026.07</span>
              <span className="footer-phone"><Phone size={12} /> <b className="mono">1408</b> единый контакт-центр</span>
              <span>Единая точка входа к 70+ мерам поддержки</span>
            </div>
          </footer>
        )}

        <Assistant
          go={(to) => router.push(to)}
          open={assistantOpen}
          prompt={assistantPrompt}
          onClose={() => setAssistantOpen(false)}
          onOpen={() => openAssistant()}
        />

        <div className="toast-zone">
          {toasts.map((t) => (
            <div key={t.id} className="toast">
              <b>{t.title}</b>
              {t.text ? <span>{t.text}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </PortalContext.Provider>
    </AuthContext.Provider>
  );
}
