import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Application, Recruiter, ActivityLog, ReminderRule, ApplicationStatus, ActivityType, AppState, ApplicationMilestones } from './src/types.js';
import { addDays, format, parseISO, isAfter } from 'date-fns';

const app = express();
app.use(express.json());

const PORT = 3000;

const DEFAULT_MILESTONES: ApplicationMilestones = {
  recruiterEmailed: false,
  responseReceived: false,
  interviewScheduled: false,
  offerReceived: false,
  rejected: false
};

function computeStatusFromMilestones(milestones: ApplicationMilestones): ApplicationStatus {
  if (milestones.rejected) return ApplicationStatus.Rejected;
  if (milestones.offerReceived) return ApplicationStatus.Offer;
  if (milestones.interviewScheduled) return ApplicationStatus.InterviewScheduled;
  if (milestones.responseReceived) return ApplicationStatus.ResponseReceived;
  if (milestones.recruiterEmailed) return ApplicationStatus.RecruiterEmailed;
  return ApplicationStatus.Applied;
}

function updateMilestonesFromStatus(status: ApplicationStatus, current: ApplicationMilestones): ApplicationMilestones {
  const m = { ...DEFAULT_MILESTONES };
  switch (status) {
    case ApplicationStatus.Rejected:
      m.rejected = true;
      m.recruiterEmailed = current.recruiterEmailed;
      m.responseReceived = current.responseReceived;
      m.interviewScheduled = current.interviewScheduled;
      break;
    case ApplicationStatus.Offer:
      m.offerReceived = true;
      m.recruiterEmailed = true;
      m.responseReceived = true;
      m.interviewScheduled = true;
      break;
    case ApplicationStatus.InterviewScheduled:
      m.interviewScheduled = true;
      m.recruiterEmailed = true;
      m.responseReceived = true;
      break;
    case ApplicationStatus.ResponseReceived:
      m.responseReceived = true;
      m.recruiterEmailed = true;
      break;
    case ApplicationStatus.RecruiterEmailed:
      m.recruiterEmailed = true;
      break;
    case ApplicationStatus.Applied:
      // default
      break;
  }
  return m;
}

// In-memory data store
let state: AppState = {
  reminderRules: [
    { id: "rr_1", name: "Default follow-up", daysNoResponse: 7, enabled: true }
  ],
  resumes: [
    { 
      id: "res_1", 
      label: "v1", 
      fileName: "Software_Engineer_2026.pdf", 
      fileType: "application/pdf", 
      fileSizeKB: 245, 
      uploadedAt: "2026-04-10T10:00:00Z", 
      updatedAt: "2026-04-10T10:00:00Z", 
      storageRef: "data:application/pdf;base64,JVBERi0xLjQKJ...", // dummy base64
      notes: "Master resume for general software engineer roles" 
    },
    { 
      id: "res_2", 
      label: "v2", 
      fileName: "Product_Analyst_Nova.pdf", 
      fileType: "application/pdf", 
      fileSizeKB: 312, 
      uploadedAt: "2026-04-20T14:30:00Z", 
      updatedAt: "2026-04-20T14:30:00Z", 
      storageRef: "data:application/pdf;base64,JVBERi0xLjQKJ...", 
      notes: "Tailored for data-heavy product roles" 
    }
  ],
  coverLetters: [],
  applications: [
    {
      id: "app_1",
      company: "Nova Systems",
      role: "Product Analyst",
      jobId: "NS-PA-221",
      dateApplied: "2026-04-28",
      status: ApplicationStatus.Applied,
      recruiterContacts: [
        { id: "c1", applicationId: "app_1", name: "Maya Chen", email: "maya.chen@novaexample.com", title: "Staff Recruiter", createdAt: "2026-04-28T10:00:00Z" }
      ],
      resumeLabel: "v2",
      resumeVersionId: "res_2",
      lastTouchpointAt: "2026-04-28",
      nextFollowUpAt: "2026-05-05",
      notes: "Referred by alumni; emphasize analytics project.",
      milestones: { ...DEFAULT_MILESTONES }
    },
    {
      id: "app_2",
      company: "BrightWave",
      role: "Associate PM",
      jobId: "BW-APM-104",
      dateApplied: "2026-05-02",
      status: ApplicationStatus.RecruiterEmailed,
      recruiterContacts: [
        { id: "c2", applicationId: "app_2", name: "Jordan Patel", email: "j.patel@brightwaveexample.com", title: "Recruiting Manager", createdAt: "2026-05-02T10:00:00Z" }
      ],
      resumeLabel: "v1",
      resumeVersionId: "res_1",
      lastTouchpointAt: "2026-05-03",
      nextFollowUpAt: "2026-05-10",
      notes: "Sent recruiter note + portfolio link.",
      milestones: { ...DEFAULT_MILESTONES, recruiterEmailed: true }
    },
    {
      id: "app_3",
      company: "Atlas Analytics",
      role: "Data Product Intern",
      jobId: "AA-DPI-88",
      dateApplied: "2026-04-20",
      status: ApplicationStatus.ResponseReceived,
      recruiterContacts: [
        { id: "c3", applicationId: "app_3", name: "Elena Garcia", email: "elena@atlasexample.com", title: "Lead Talent", createdAt: "2026-04-20T10:00:00Z" }
      ],
      resumeLabel: "v1",
      resumeVersionId: "res_1",
      lastTouchpointAt: "2026-04-30",
      nextFollowUpAt: "2026-05-07",
      notes: "They asked availability; reply sent.",
      milestones: { ...DEFAULT_MILESTONES, recruiterEmailed: true, responseReceived: true }
    },
    {
      id: "app_4",
      company: "Pinecone Health",
      role: "Operations Analyst",
      jobId: "PH-OA-12",
      dateApplied: "2026-05-06",
      status: ApplicationStatus.InterviewScheduled,
      recruiterContacts: [
        { id: "c4", applicationId: "app_4", name: "Sarah Connor", email: "sarah@pineconeexample.com", title: "HR Business Partner", createdAt: "2026-05-06T10:00:00Z" },
        { id: "c5", applicationId: "app_4", name: "John Doe", email: "jdoe@pineconeexample.com", title: "Hiring Manager", createdAt: "2026-05-06T10:00:00Z" }
      ],
      resumeLabel: "v2",
      resumeVersionId: "res_2",
      lastTouchpointAt: "2026-05-09",
      nextFollowUpAt: "2026-05-16",
      notes: "Phone screen booked for next week.",
      milestones: { ...DEFAULT_MILESTONES, recruiterEmailed: true, responseReceived: true, interviewScheduled: true }
    }
  ],
  activityLogs: [
    { id: "log_1", applicationId: "app_1", type: ActivityType.Applied, occurredAt: "2026-04-28T10:10:00", summary: "Applied via company site." },
    { id: "log_2", applicationId: "app_2", type: ActivityType.Applied, occurredAt: "2026-05-02T09:02:00", summary: "Applied with v3 resume." },
    { id: "log_3", applicationId: "app_2", type: ActivityType.RecruiterEmailSent, occurredAt: "2026-05-03T14:20:00", summary: "Emailed recruiter with portfolio link." },
    { id: "log_4", applicationId: "app_3", type: ActivityType.Applied, occurredAt: "2026-04-20T11:40:00", summary: "Applied via referral portal." },
    { id: "log_5", applicationId: "app_3", type: ActivityType.ResponseReceived, occurredAt: "2026-04-30T16:05:00", summary: "Recruiter asked about start date." },
    { id: "log_6", applicationId: "app_4", type: ActivityType.InterviewScheduled, occurredAt: "2026-05-09T12:30:00", summary: "Phone screen scheduled." }
  ]
};

// API Routes
app.get('/api/state', (req, res) => {
  res.json(state);
});

app.post('/api/applications', (req, res) => {
  const newApp: Application = {
    ...req.body,
    id: `app_${Date.now()}`,
    lastTouchpointAt: req.body.dateApplied,
    nextFollowUpAt: format(addDays(parseISO(req.body.dateApplied), state.reminderRules[0].daysNoResponse), 'yyyy-MM-dd'),
    status: ApplicationStatus.Applied,
    milestones: { ...DEFAULT_MILESTONES }
  };
  state.applications.push(newApp);
  
  const log: ActivityLog = {
    id: `log_${Date.now()}`,
    applicationId: newApp.id,
    type: ActivityType.Applied,
    occurredAt: new Date().toISOString(),
    summary: 'Application added'
  };
  state.activityLogs.push(log);
  
  res.status(201).json(newApp);
});

app.patch('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = state.applications.findIndex(a => a.id === id);
  if (index !== -1) {
    const oldApp = state.applications[index];
    let newApp = { ...oldApp, ...updates };

    // If milestones updated, recompute status
    if (updates.milestones) {
      newApp.status = computeStatusFromMilestones(newApp.milestones);
      newApp.lastTouchpointAt = format(new Date(), 'yyyy-MM-dd');
      console.log('updateApplication OK (Milestones)', id, updates.milestones, 'New status:', newApp.status);
    } 
    // If status updated manually, sync milestones
    else if (updates.status && updates.status !== oldApp.status) {
      newApp.milestones = updateMilestonesFromStatus(newApp.status, newApp.milestones);
      newApp.lastTouchpointAt = format(new Date(), 'yyyy-MM-dd');
      console.log('updateApplication OK (Status)', id, updates.status);
    } else {
       console.log('updateApplication OK (General)', id, updates);
    }

    // Always recompute nextFollowUpAt if touchpoint changed
    if (newApp.lastTouchpointAt !== oldApp.lastTouchpointAt || updates.status) {
       newApp.nextFollowUpAt = format(addDays(parseISO(newApp.lastTouchpointAt), state.reminderRules[0].daysNoResponse), 'yyyy-MM-dd');
    }

    state.applications[index] = newApp;

    // Create activity logs for major changes
    if (newApp.status !== oldApp.status) {
      const logType = Object.values(ActivityType).find(t => t === newApp.status) as ActivityType || ActivityType.Note;
      state.activityLogs.push({
        id: `log_${Date.now()}`,
        applicationId: id,
        type: logType,
        occurredAt: new Date().toISOString(),
        summary: `Status updated via ${updates.milestones ? 'checklist' : 'manual change'} to ${newApp.status}`
      });
    }
    res.json(state.applications[index]);
  } else {
    console.error('Application not found:', id);
    res.status(404).json({ error: 'Not found' });
  }
});

app.post('/api/applications/:id/log', (req, res) => {
  const { id } = req.params;
  const { type, summary, occurredAt } = req.body;
  
  const log: ActivityLog = {
    id: `log_${Date.now()}`,
    applicationId: id,
    type,
    summary,
    occurredAt: occurredAt || new Date().toISOString()
  };
  state.activityLogs.push(log);

  // Update application based on log type
  const appIndex = state.applications.findIndex(a => a.id === id);
  if (appIndex !== -1) {
    const app = state.applications[appIndex];
    app.lastTouchpointAt = log.occurredAt.split('T')[0];
    
    // Auto-update status for certain log types
    if ([ActivityType.ResponseReceived, ActivityType.InterviewScheduled, ActivityType.Rejected, ActivityType.Offer].includes(type)) {
      app.status = type as unknown as ApplicationStatus;
    }

    // Update next follow up if needed
    if ([ActivityType.RecruiterEmailSent, ActivityType.FollowUpSent].includes(type)) {
      app.nextFollowUpAt = format(addDays(parseISO(app.lastTouchpointAt), state.reminderRules[0].daysNoResponse), 'yyyy-MM-dd');
    }

    state.applications[appIndex] = { ...app };
  }

  res.status(201).json(log);
});

app.patch('/api/settings/reminder', (req, res) => {
  const { daysNoResponse, enabled } = req.body;
  state.reminderRules[0] = { ...state.reminderRules[0], daysNoResponse, enabled };
  res.json(state.reminderRules[0]);
});

app.post('/api/reset', (req, res) => {
  // Reset logic if needed
  res.json({ status: 'ok' });
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
