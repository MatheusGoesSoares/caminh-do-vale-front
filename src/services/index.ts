import type { DataService } from "./api/data-service";
import { ApiDataProvider } from "./api/api-provider";

let instance: DataService | null = null;

export function getDataService(): DataService {
  instance ??= new ApiDataProvider();
  return instance;
}

export type { DataService };
