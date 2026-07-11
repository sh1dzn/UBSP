"use client";
import PageHost from "../../src/shell/PageHost.jsx";
import Component from "../../src/views/Reports.jsx";
export default function Page() {
  return <PageHost component={Component} path="/reports" />;
}
