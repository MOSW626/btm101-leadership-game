export type Zone = 'L' | 'M' | 'X';
export interface Summary {
  sum: number; total: number; maxAbs: number; mean: number | null; leadershipIndex: number | null; zone: Zone | null;
  responses: { l: number; m: number; midpoint: number };
}
export interface AxisSummary extends Summary { id: string }
export interface Result {
  version: string; code: string; profileCode: string | null; typeBucket: string; axes: AxisSummary[]; overall: Summary;
}
export interface QuestionStat {
  id: string; order: number; n: number; counts: Record<string, number>; l: number; m: number; midpoint: number;
  mean: number | null; variance: number | null; opposingCount: number;
}
export interface Aggregate {
  n: number; typeCounts: Record<string, number>; patternCounts: Record<string, number>; overall: Summary;
  axes: AxisSummary[]; questionStats: QuestionStat[]; mostDivisive: { id: string; tiedIds: string[] } | null;
}
export function signedValue(question: unknown, rating: unknown): number;
export function score(content: unknown, answers: unknown): Result;
export function aggregate(content: unknown, rows: { answers: Record<string, number> }[]): Aggregate;
