import { httpGet } from "./httpClient";
import { Level } from "../types";

export const levelService = {
  async listLevels(): Promise<Level[]> {
    return httpGet<Level[]>("/levels");
  },
};
