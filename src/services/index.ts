import type { DataService } from "./api/data-service";
import { MockDataProvider } from "./mock/mock-provider";
import { ApiDataProvider } from "./api/api-provider";

let instance: DataService | null = null;

export function isDemoMode(): boolean {
  return import.meta.env.VITE_DATA_PROVIDER !== "api";
}

export function getDataService(): DataService {
  if (!instance) {
    instance = isDemoMode() ? new MockDataProvider() : new ApiDataProvider();
  }
  return instance;
}

export type { DataService };
