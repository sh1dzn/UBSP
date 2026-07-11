export type EligibilityResult = {
  score: number;
  eligible: boolean;
  nextAction: string;
};

export type LeaseCalculation = {
  financed: number;
  advancePercent: number;
  estimatedMonthly: number;
  minimumMet: boolean;
  currency: string;
};

export type ApplicationResult = {
  id: string;
  status: string;
  submittedAt: string;
  nextUpdateAt: string;
  audit: string[];
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = "/api";
  const response = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = (await response.json()) as { message?: string } & T;
  if (!response.ok) throw new Error(body.message || "Backend request failed");
  return body;
}

export const portalApi = {
  health: () => request<{ status: string }>("/health"),
  services: () => request<{ services: unknown[] }>("/services"),
  company: (bin: string) => request(`/company/${bin}`),
  eligibility: (payload: Record<string, unknown>) =>
    request<EligibilityResult>("/eligibility", { method: "POST", body: JSON.stringify(payload) }),
  calculateLease: (payload: Record<string, unknown>) =>
    request<LeaseCalculation>("/calculations/lease", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  submitApplication: (payload: Record<string, unknown>) =>
    request<ApplicationResult>("/applications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
