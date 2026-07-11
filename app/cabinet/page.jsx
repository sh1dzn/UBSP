"use client";
import PageHost from "../../src/shell/PageHost.jsx";
import Component from "../../src/views/Cabinet.jsx";
export default function Page() {
  return <PageHost component={Component} path="/cabinet" />;
}
