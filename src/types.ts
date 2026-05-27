
export enum ApplicationStatus {
  Applied = 'Applied',
  RecruiterEmailed = 'Recruiter Emailed',
  ResponseReceived = 'Response Received',
  InterviewScheduled = 'Interview Scheduled',
  Rejected = 'Rejected',
  Offer = 'Offer'
}

export enum ActivityType {
  Applied = 'Applied',
  RecruiterEmailSent = 'RecruiterEmailSent',
  FollowUpSent = 'FollowUpSent',
  ResponseReceived = 'ResponseReceived',
  InterviewScheduled = 'InterviewScheduled',
  Rejected = 'Rejected',
  Offer = 'Offer',
  Note = 'Note'
}

export interface Recruiter {
  id: string;
  name: string;
  email: string;
  company: string;
  linkedinUrl?: string;
}

export interface ApplicationMilestones {
  recruiterEmailed: boolean;
  responseReceived: boolean;
  interviewScheduled: boolean;
  offerReceived: boolean;
  rejected: boolean;
}

export interface ResumeVersion {
  id: string;
  label: string;
  fileName: string;
  fileType: string;
  fileSizeKB: number;
  uploadedAt: string;
  updatedAt: string;
  storageRef: string; // base64 content
  notes?: string;
}

export interface CoverLetter {
  id: string;
  label: string;
  fileName: string;
  fileType: string;
  fileSizeKB: number;
  uploadedAt: string;
  updatedAt: string;
  storageRef: string; // base64 content
  notes?: string;
}

export interface RecruiterContact {
  id: string;
  applicationId: string;
  name: string;
  email: string;
  title?: string;
  channel?: 'Email' | 'LinkedIn' | 'Phone';
  notes?: string;
  createdAt: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  jobId?: string;
  dateApplied: string; // ISO Date
  status: ApplicationStatus;
  resumeVersionId: string;
  resumeLabel: string;
  coverLetterId?: string;
  coverLetterLabel?: string;
  lastTouchpointAt: string; // ISO Date
  nextFollowUpAt: string; // ISO Date
  notes: string;
  milestones: ApplicationMilestones;
  recruiterContacts: RecruiterContact[];
}

export interface ActivityLog {
  id: string;
  applicationId: string;
  type: ActivityType;
  occurredAt: string; // ISO DateTime
  summary: string;
}

export interface ReminderRule {
  id: string;
  name: string;
  daysNoResponse: number;
  enabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  tier?: 'Free' | 'Pro';
}

export interface AppState {
  applications: Application[];
  resumes: ResumeVersion[];
  coverLetters: CoverLetter[];
  activityLogs: ActivityLog[];
  reminderRules: ReminderRule[];
}
