import { AppState, Application, ActivityLog, ApplicationStatus, ActivityType } from '../types';

export async function fetchState(): Promise<AppState> {
  const res = await fetch('/api/state');
  return res.json();
}

export async function addApplication(appData: Partial<Application>): Promise<Application> {
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appData),
  });
  return res.json();
}

export async function updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
  const res = await fetch(`/api/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function logActivity(applicationId: string, activity: Partial<ActivityLog>): Promise<ActivityLog> {
  const res = await fetch(`/api/applications/${applicationId}/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activity),
  });
  return res.json();
}

export async function updateReminderSettings(daysNoResponse: number, enabled: boolean) {
  const res = await fetch('/api/settings/reminder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ daysNoResponse, enabled }),
  });
  return res.json();
}
