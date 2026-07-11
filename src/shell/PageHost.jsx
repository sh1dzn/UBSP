"use client";
import { useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePortal } from "./portal-context.js";

/**
 * Адаптер страниц: даёт каждому модулю единый контракт пропсов
 * { go, route: { path, params, query }, notify, openAssistant }
 */
export default function PageHost({ component: Component, path }) {
  const { notify, openAssistant } = usePortal();
  const router = useRouter();
  const params = useParams() || {};
  const searchParams = useSearchParams();
  const go = useCallback((to) => router.push(to), [router]);
  const route = {
    path,
    params,
    query: Object.fromEntries(searchParams ? searchParams.entries() : []),
  };
  return <Component go={go} route={route} notify={notify} openAssistant={openAssistant} />;
}
