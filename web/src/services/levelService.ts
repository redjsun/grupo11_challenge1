import { httpGet } from "./httpClient";
import { Level } from "../types";

export const LOCAL_LEVELS: Level[] = [
  { number: 1, board_size: 7, tick_ms: 400, min_score_to_advance: 30 },
  { number: 2, board_size: 7, tick_ms: 350, min_score_to_advance: 40 },
  { number: 3, board_size: 7, tick_ms: 300, min_score_to_advance: 50 },
  { number: 4, board_size: 6, tick_ms: 300, min_score_to_advance: 50 },
  { number: 5, board_size: 6, tick_ms: 250, min_score_to_advance: 60 },
  { number: 6, board_size: 6, tick_ms: 200, min_score_to_advance: 70 },
];

export const levelService = {
  async listLevels(): Promise<Level[]> {
    try {
      return await httpGet<Level[]>("/levels");
    } catch {
      return LOCAL_LEVELS;
    }
  },
};
