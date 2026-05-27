# JobTrackr

**Live Demo:** https://jobtrackr-b119.onrender.com  
**Built by:** Harshitha Pingala 
**Stack:** TypeScript, Express.js, Vite, Node.js  
**Tools:** Google AI Studio, VS Code  

---

## The Problem

Active job seekers managing high-volume applications have no structured system to track recruiter outreach, follow-up timing, application status, and pipeline health. They rely on memory, scattered emails, and informal spreadsheets that break down under sustained pressure.

I experienced this firsthand during my own internship search. The cognitive overhead of tracking hundreds of applications across email, LinkedIn, and memory was exhausting and led to missed follow-ups and poor pipeline visibility.

The core insight: the problem is not storing data. The problem is knowing what to do today.

---

## Problem Sizing

The average active job seeker spends 30 to 45 minutes daily just managing application logistics. Across a 3-month search, that is 67 hours of overhead. At a graduate student's expected hourly rate of $28/hour, that is $1,876 in lost productive time per search cycle. Across 8 million active US job seekers, this represents $15 billion in wasted time annually.

---

## Why Existing Tools Fall Short

Google Sheets requires manual setup, offers no reminders, no visual pipeline, and gets abandoned under stress. Huntr and Teal are cluttered and require too much setup for high-volume searchers. LinkedIn shows applications but tracks no recruiter outreach, follow-up timing, or pipeline analytics. Email inboxes have no status tracking or pipeline view.

---

## The Solution

JobTrackr is a zero-friction job application tracker built for high-volume active job seekers who need daily actionability, not just data storage.

Position to own: the fastest job application tracker that tells you what to do today, not just where you applied.

---

## Product Decisions

**Kanban as the default view**
Job searching is a pipeline problem. A Kanban board with six stages, Only Applied, Recruiter Emailed, Response Received, Interview Scheduled, Rejected, and Offer, makes pipeline health visible at a glance and makes the next action obvious.

**Nudge Center with configurable smart follow-up alerts**
The single most common mistake job seekers make is not following up at the right time. JobTrackr automatically flags applications past a configurable threshold, adjustable from 3 to 21 days via a slider in Settings. The Nudge Center shows total nudges and actions due today, turning a reactive process into a proactive one.

**Resume Library and Cover Letter Library**
Job seekers manage multiple document versions across SWE, PM, and other tracks. JobTrackr stores them as named artifacts linked directly to each application, so there is always a clear record of which version was sent where.

**Progress Checklist per application**
Each application has a checklist: Recruiter Emailed, Response Received, Landed an Interview, Offer Received, Rejected. Checking off steps auto-updates the application status and logs an activity. This reduces manual data entry and keeps the pipeline accurate without friction.

**Activity Timeline**
Every status change and note is recorded chronologically per application, providing context before follow-up calls and helping identify patterns across the job search.

**Stats Dashboard**
Total applications, interviews scheduled, offers, and nudges at a glance. Pipeline velocity chart and pipeline overview show where applications are getting stuck so the user can adjust strategy.

**Freemium Pricing Model**
Free tier supports up to 25 active applications with basic pipeline and smart nudges. Career Pro at $2.99/month unlocks unlimited applications, advanced analytics, and interview prep assistance. The price point captures approximately 20% of the value created while remaining accessible to students.

---

## Key Screens

**Dashboard (Kanban Board)**
The default landing experience. Pipeline stages as columns. Each application card shows company, role, recruiter name, progress, and applied date. Nudge Center on the right surfaces follow-up actions due today.

**Applications (Table View)**
Filterable by status. Sortable by date. Recruiter contact visible inline. Follow-up date calculated automatically. Full CRUD operations per application.

**Application Detail**
Company, role, status, applied date, recruiter contacts, resume artifact, cover letter artifact, job reference ID, internal strategy notes, progress checklist, and full activity timeline in one view.

**Resume Library**
Upload and manage multiple resume versions labeled by track. Link each version to specific applications.

**Cover Letter Library**
Same structure as Resume Library. Supports tailored cover letters per track or per company.

**Stats**
KPI cards for total applications, interviews scheduled, offers, and nudges. Pipeline velocity bar chart. Pipeline overview donut chart with status distribution.

**Pricing**
Starter: Free, up to 25 active applications, basic pipeline, smart nudges, resume library. Career Pro: $2.99/month, unlimited applications, advanced stats, interview prep assistant, priority support.

**Settings**
Toggle smart nudges on or off. Adjust follow-up threshold with a slider from 3 to 21 days. Save automation rules.

---

## What I Learned

The hardest product decision was the default view. Job searching is inherently a pipeline problem where the user needs to see movement, not just data. Kanban as the default made the product immediately actionable.

The Nudge Center was the highest-value feature I almost did not build. Most trackers store data passively. The thing that actually changes user behavior is a system that proactively surfaces what needs attention today.

Building the Resume Library taught me that job seekers have a multi-artifact problem, not just a tracking problem. Managing multiple resume and cover letter versions with no record of which went where is a real and underserved pain point.

---

## Impact

Built and shipped in one week. Used personally to track a large volume of applications across SWE and PM tracks. Validated the core hypothesis: a system that tells you what to do today is more valuable than one that only stores what you did yesterday.
