import raw from './brief/content.json';

export type Lang = 'ko' | 'en';
export type Text = { ko: string; en: string };
export type Mode = 'L' | 'M';
export interface Question {
  id: string; order: number; axis: string; scene: Text; prompt: Text;
  explanation: Record<Mode, Text>;
  endpoints: { left: { mode: Mode; text: Text }; right: { mode: Mode; text: Text } };
}

export const content = raw as typeof raw & { questions: Question[] };
export const questions = [...content.questions].sort((a, b) => a.order - b.order);
export const GROUP_IDS = content.groups.map(g => g.id);
export const axisById = (id: string) => content.axes.find(a => a.id === id)!;
export const profileByCode = (code: string) => content.profiles.find(p => p.code === code);
export const questionById = (id: string) => content.questions.find(q => q.id === id)!;
