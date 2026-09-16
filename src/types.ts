export const Priority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export interface ActionItem {
  task: string;
  assignee: string | null;
  dueDate: string | null;
  priority: Priority;
  description?: string;
  completed?: boolean;
}

export interface OpenQuestion {
  question: string;
  owner: string | null;
}

export interface TopicItem {
  title: string;
  summary: string;
  keyPoints: string[];
}

export interface MeetingTranscriptSegment {
  speaker?: string;
  timestamp?: string;
  text: string;
}

export interface MeetingRecapData {
  title: string;
  language: string;
  durationEstimate?: string;
  attendees?: string[];
  meetingGoal?: string | null;
  goalAchievementStatus?: string | null;
  executiveSummary: string;
  decisions: string[];
  actionItems: ActionItem[];
  openQuestions?: OpenQuestion[];
  risks?: string[];
  topics: TopicItem[];
  transcript?: MeetingTranscriptSegment[];
}

export interface MeetingRecord {
  id: string;
  title: string;
  createdAt: string;
  audioFileName?: string;
  audioMimeType?: string;
  audioDurationSeconds?: number;
  recap: MeetingRecapData;
}

export interface MeetingSummaryItem {
  id: string;
  title: string;
  createdAt: string;
  language: string;
  actionItemsCount: number;
  decisionsCount: number;
  executiveSummaryPreview: string;
}
