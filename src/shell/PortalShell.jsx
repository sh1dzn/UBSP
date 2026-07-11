"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Landmark, Menu, X } from "lucide-react";
import { PortalContext } from "./portal-context.js";
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

  return (
    <PortalContext.Provider value={{ notify, openAssistant }}>
      <div className="app-shell">
        <header className="site-header">
          <div className="container site-header-inner">
            <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
              <span className="brand-mark"><Landmark size={18} /></span>
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
              <button className="btn btn-sm assistant-launch" onClick={() => openAssistant()}>
                <Bot size={16} /> Навигатор
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
                  <span className="brand-mark"><Landmark size={18} /></span>
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
  );
}
