async function request(path, options) {
  const base = location.port === "5173" ? "http://127.0.0.1:3001/api" : "/api";
  const response = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Backend request failed");
  return body;
}

export const portalApi = {
  health: () => request("/health"),
  services: () => request("/services"),
  company: (bin) => request(`/company/${bin}`),
  eligibility: (payload) =>
    request("/eligibility", { method: "POST", body: JSON.stringify(payload) }),
  calculateLease: (payload) =>
    request("/calculations/lease", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  submitApplication: (payload) =>
    request("/applications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
