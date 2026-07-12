"use client";
import { createContext, useContext } from "react";

export const PortalContext = createContext({
  notify: () => {},
  openAssistant: () => {},
  locale: "ru",
  setLocale: () => {},
});

export const usePortal = () => useContext(PortalContext);
