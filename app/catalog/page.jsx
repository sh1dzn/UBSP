"use client";
import PageHost from "../../src/shell/PageHost.jsx";
import Component from "../../src/views/Catalog.jsx";
export default function Page() {
  return <PageHost component={Component} path="/catalog" />;
}
