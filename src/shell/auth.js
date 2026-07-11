"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

/* Базовая авторизация-прототип: сессия в localStorage, две демо-роли. */

const KEY = "eppb-session";

export const DEMO_BUSINESS = {
  role: "business",
  name: "ТОО «Demo Trans Logistics»",
  bin: "123456789012",
  via: "eGov Business (мок)",
};

export const DEMO_ADMIN = {
  role: "admin",
  name: "Айгерим Сапарова",
  title: "Автор услуг, ДО «Байтерек»",
  email: "admin@baiterek.gov.kz",
};

/* Демо-доступ администратора: admin@baiterek.gov.kz / baiterek2026 */
export function checkAdminCredentials(email, password) {
  return email.trim().toLowerCase() === DEMO_ADMIN.email && password === "baiterek2026";
}

export const AuthContext = createContext({
  user: null,
  ready: false,
  signIn: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function useAuthState() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // повреждённая сессия — игнорируем
    }
    setReady(true);
  }, []);

  const signIn = useCallback((nextUser) => {
    setUser(nextUser);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(nextUser));
    } catch {}
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(KEY);
    } catch {}
  }, []);

  return { user, ready, signIn, signOut };
}
