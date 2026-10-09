import { httpGet } from "./httpClient";
import { UserProgress } from "../types";

export const progressService = {
  async getMyProgress(): Promise<UserProgress> {
    return httpGet<UserProgress>("/progress/me");
  },
};
