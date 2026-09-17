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
  dod?: string;
  gate?: string;
  category?: string;
  dependencies?: string;
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

export interface OdooProjectRef {
  projectId: number;
  projectName: string;
  projectUrl: string;
  pushedBy: string;
  pushedAt: string;
  tasksCount: number;
  profileName: string;
}

export interface MeetingRecord {
  id: string;
  title: string;
  createdAt: string;
  ownerId?: number;
  ownerEmail?: string;
  audioFileName?: string;
  audioMimeType?: string;
  audioDurationSeconds?: number;
  odooProject?: OdooProjectRef;
  recap: MeetingRecapData;
}

export interface MeetingSummaryItem {
  id: string;
  title: string;
  createdAt: string;
  language: string;
  ownerId?: number;
  actionItemsCount: number;
  decisionsCount: number;
  executiveSummaryPreview: string;
  odooProjectUrl?: string;
}

export interface OdooUser {
  id: number;
  name: string;
  login: string;
  email: string;
  companyId?: number;
  companyName?: string;
}

export interface UserSession {
  uid: number;
  name: string;
  email: string;
  profile: string; // 'skillbon' | 'prod'
  issuedAt: number;
}
