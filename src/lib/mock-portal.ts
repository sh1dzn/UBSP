export type ServiceDefinition = {
  id: string;
  title: string;
  organization: string;
  kind: string;
  minAdvance?: number;
  coverage?: number;
  termYears: number;
};

export const serviceCatalog: ServiceDefinition[] = [
  { id: "wagons", title: "Приобретение вагонов в лизинг", organization: "КазАгроФинанс", kind: "Лизинг", minAdvance: 15, termYears: 7 },
  { id: "agro", title: "Агробизнес: животноводство", organization: "Аграрная кредитная корпорация", kind: "Кредитование", minAdvance: 10, termYears: 10 },
  { id: "guarantee", title: "Гарантирование по кредитам МСБ", organization: "Фонд «Даму»", kind: "Гарантия", coverage: 85, termYears: 5 },
];

export const applications = new Map<string, Record<string, unknown>>();

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function numeric(value: unknown): number {
  return Number(value || 0);
}
