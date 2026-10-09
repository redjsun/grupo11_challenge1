import { httpGet, httpPost } from "./httpClient";
import { Match, Question, AnswerResult, MatchResult } from "../types";

export const matchService = {
  async startMatch(level?: number): Promise<Match> {
    return httpPost<Match>("/matches", { level });
  },

  async getMatch(matchId: number): Promise<Match> {
    return httpGet<Match>(`/matches/${matchId}`);
  },

  async getNextQuestion(matchId: number): Promise<Question> {
    return httpGet<Question>(`/matches/${matchId}/next-question`);
  },

  async answerQuestion(
    matchId: number,
    questionId: number | string,
    answer: boolean
  ): Promise<AnswerResult> {
    return httpPost<AnswerResult>(`/matches/${matchId}/answers`, {
      question_id: Number(questionId),
      answer,
    });
  },

  async finishMatch(matchId: number): Promise<MatchResult> {
    return httpPost<MatchResult>(`/matches/${matchId}/finish`);
  },
};
