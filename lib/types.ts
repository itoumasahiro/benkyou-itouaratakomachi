export type Role = "child" | "parent";
export type SchoolLevel = "elementary" | "junior_high";
export type TestType = "midterm" | "final" | "regular" | "other";
export type GoalType = "weekly_minutes" | "score";

export interface Member {
  id: string;
  display_name: string;
  emoji: string;
  color: string;
  role: Role;
  grade: string | null;
  school_level: SchoolLevel | null;
  created_at: string;
}

export interface Subject {
  id: string;
  member_id: string;
  name: string;
  emoji: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Todo {
  id: number;
  member_id: string;
  text: string;
  subject_id: string;
  done: boolean;
  date: string;
  created_at: string;
  subject?: Subject;
}

export interface StudyLog {
  id: number;
  member_id: string;
  subject_id: string;
  minutes: number;
  date: string;
  created_at: string;
  subject?: Subject;
}

export interface Score {
  id: number;
  member_id: string;
  subject_id: string;
  name: string;
  test_type: TestType;
  score: number;
  max: number;
  date: string;
  created_at: string;
  image_url?: string | null;
  subject?: Subject;
}

export interface Goal {
  id: number;
  member_id: string;
  subject_id: string | null;
  type: GoalType;
  target_value: number;
  period: string;
  created_at: string;
  subject?: Subject;
}

export interface ChatMessage {
  id: number;
  member_id: string;
  text: string;
  created_at: string;
  member?: Member;
}
