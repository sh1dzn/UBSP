async function request(path, options) {
  const response = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Ошибка запроса к серверу");
  return body;
}

const post = (path, payload) =>
  request(path, { method: "POST", body: JSON.stringify(payload || {}) });

export const api = {
  health: () => request("/health"),

  services: () => request("/services"),
  service: (id) => request(`/services/${id}`),
  saveService: (schema) => post("/services", schema),
  publishService: (id) => post(`/services/${id}/publish`),

  company: (bin) => request(`/company/${bin}`),
  eligibility: (payload) => post("/eligibility", payload),

  applications: () => request("/applications"),
  application: (id) => request(`/applications/${id}`),
  submitApplication: (payload) => post("/applications", payload),
  advanceApplication: (id) => post(`/applications/${id}/advance`),
  submitStage: (id, payload) => post(`/applications/${id}/stage`, payload),

  aiMatch: (payload) => post("/ai/match", payload),
  aiChat: (messages) => post("/ai/chat", { messages }),
  aiReview: (payload) => post("/ai/review", payload),
  aiSchema: (description) => post("/ai/schema", { description }),
  integrations: () => request("/integrations"),
  notifications: () => request("/notifications"),
};

export default api;
