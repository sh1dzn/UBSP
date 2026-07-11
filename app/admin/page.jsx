"use client";
import PageHost from "../../src/shell/PageHost.jsx";
import Component from "../../src/views/admin/Admin.jsx";
export default function Page() {
  return <PageHost component={Component} path="/admin" />;
}
