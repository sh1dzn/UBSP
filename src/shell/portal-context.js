"use client";
import { createContext, useContext } from "react";

export const PortalContext = createContext({
  notify: () => {},
  openAssistant: () => {},
});

export const usePortal = () => useContext(PortalContext);
