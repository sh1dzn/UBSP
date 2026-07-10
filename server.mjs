import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = 3001;
const production = process.argv.includes("--production");
const root = path.dirname(fileURLToPath(import.meta.url));
const applications = new Map();
const serviceCatalog = [
  { id: "wagons", title: "Приобретение вагонов в лизинг", organization: "КазАгроФинанс", kind: "Лизинг", minAdvance: 15, termYears: 7 },
  { id: "agro", title: "Агробизнес: животноводство", organization: "Аграрная кредитная корпорация", kind: "Кредитование", minAdvance: 10, termYears: 10 },
  { id: "guarantee", title: "Гарантирование по кредитам МСБ", organization: "Фонд «Даму»", kind: "Гарантия", coverage: 85, termYears: 5 },
];

const json = (res, status, value) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(value));
  return true;
};

const parseBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
};

async function api(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health")
    return json(res, 200, { status: "ok", integrations: { registry: "mock", bpm: "mock", eds: "mock" }, serviceCount: 72 });
  if (req.method === "GET" && url.pathname === "/api/services")
    return json(res, 200, { services: serviceCatalog });
  if (req.method === "GET" && url.pathname.startsWith("/api/company/")) {
    const bin = url.pathname.split("/").pop();
    if (!/^\d{12}$/.test(bin)) return json(res, 400, { message: "БИН должен содержать 12 цифр" });
    return json(res, 200, { verified: true, source: "Mock eGov registry", company: { bin, name: "ТОО «Astana Logistics»", region: "г. Астана", activity: "Грузовые железнодорожные перевозки", registeredAt: "2012-09-14" } });
  }
  if (req.method === "POST" && url.pathname === "/api/eligibility") {
    const input = await parseBody(req);
    const service = serviceCatalog.find((item) => item.id === (input.serviceId || "wagons"));
    if (!service) return json(res, 404, { message: "Мера поддержки не найдена" });
    const amount = Number(input.amount || 0);
    const own = Number(input.own || 0);
    const advancePercent = amount > 0 ? Math.round((own / amount) * 1000) / 10 : 0;
    const checks = [
      { id: "registry", passed: /^\d{12}$/.test(String(input.bin)), label: "Компания найдена в реестре" },
      { id: "advance", passed: advancePercent >= (service.minAdvance || 0), label: `Аванс не ниже ${service.minAdvance || 0}%` },
      { id: "valuation", passed: input.used !== "used", warning: input.used === "used", label: input.used === "used" ? "Нужен отчёт об оценке вагонов" : "Дополнительная оценка не требуется" },
    ];
    const eligible = checks.slice(0, 2).every((check) => check.passed);
    return json(res, 200, { score: Math.round((checks.filter((check) => check.passed).length / checks.length) * 100), eligible, checks, nextAction: advancePercent < (service.minAdvance || 0) ? "Увеличьте собственное участие" : "Можно отправлять предварительную заявку" });
  }
  if (req.method === "POST" && url.pathname === "/api/calculations/lease") {
    const input = await parseBody(req);
    const amount = Number(input.amount || 0);
    const own = Number(input.own || 0);
    if (amount <= 0 || own < 0 || own > amount) return json(res, 400, { message: "Проверьте стоимость и собственные средства" });
    const financed = amount - own;
    const advancePercent = Math.round((own / amount) * 1000) / 10;
    return json(res, 200, { financed, advancePercent, estimatedMonthly: Math.round((financed * 1.09) / 84), minimumMet: advancePercent >= 15, currency: "KZT" });
  }
  if (req.method === "POST" && url.pathname === "/api/applications") {
    const input = await parseBody(req);
    const amount = Number(input.amount || 0);
    const own = Number(input.own || 0);
    if (!/^\d{12}$/.test(String(input.bin)) || amount <= 0 || own / amount < 0.15)
      return json(res, 422, { message: "Заявка не прошла обязательные проверки" });
    const id = `OR-2026-${String(1284 + applications.size).padStart(6, "0")}`;
    const application = { id, status: "Передано в КазАгроФинанс", submittedAt: new Date().toISOString(), nextUpdateAt: "2026-07-14", audit: ["EDS_MOCK_VERIFIED", "SENT_TO_BPM_MOCK"] };
    applications.set(id, application);
    return json(res, 201, application);
  }
  return false;
}

async function staticFile(res, url) {
  if (!production) return false;
  let file = path.join(root, "dist", url.pathname === "/" ? "index.html" : url.pathname);
  try {
    if (!(await stat(file)).isFile()) throw new Error();
  } catch {
    file = path.join(root, "dist", "index.html");
  }
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  res.end(await readFile(file));
  return true;
}

createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      });
      return res.end();
    }
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      if (!(await api(req, res, url))) json(res, 404, { message: "API route not found" });
      return;
    }
    if (!(await staticFile(res, url))) json(res, 404, { message: "Not found" });
  } catch (error) {
    json(res, 500, { message: error.message });
  }
}).listen(port, "127.0.0.1", () => console.log(`ÖRKEN backend listening on http://127.0.0.1:${port}`));
