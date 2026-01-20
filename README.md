# CIR Staff Dashboard

A modern, responsive staff dashboard built with Next.js and TypeScript for managing assignments and work submissions.

## Overview

The Staff Dashboard provides a centralized interface for staff members to:
- View and track their assignments
- Submit work for completed tasks
- Monitor submission statuses (Submitted, Verified, Rejected)
- Get alerts for rejected submissions requiring revision

## Features

### 📊 Dashboard Statistics

| Metric | Description |
|--------|-------------|
| **My Assignments** | Total number of assignments assigned to the staff member |
| **Pending** | Assignments awaiting completion (PENDING or IN_PROGRESS status) |
| **Verified** | Submissions that have been approved by managers |
| **Submitted** | Submissions awaiting review |

### ⚠️ Rejection Alerts

When submissions are rejected, a prominent alert card displays:
- Count of rejected submissions
- Instructions to review and resubmit

### 📋 Pending Assignments

- Lists up to 5 pending assignments
- Shows responsibility title and due date
- Quick "Submit Work" action button
- Status badge for each assignment

### 📁 Recent Submissions

- Displays the 5 most recent work submissions
- Shows submission date and status
- Quick navigation to full submissions list

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/
│   └── (dashboard)/
│       └── staff/
│           ├── page.tsx          # Main dashboard
│           ├── assignments/      # Assignments management
│           ├── work-submissions/ # Work submissions
│           ├── analytics/        # Staff analytics
│           └── profile/          # User profile
├── components/
│   ├── ui/                       # Reusable UI components
│   └── providers/                # Context providers
├── lib/
│   └── api.ts                    # API client
└── types/
    └── cir.ts                    # TypeScript types
```

## API Integration

The dashboard integrates with the following API endpoints:

```typescript
api.assignments.getAll()     // Fetch staff assignments
api.workSubmissions.getAll() // Fetch work submissions
```

> **Note**: The backend automatically scopes data to the authenticated staff member.

## User Roles

| Role | Access |
|------|--------|
| **Staff** | View own assignments, submit work, track submission status |
| **Manager** | Review submissions, manage staff, view analytics |
| **Admin** | Full system access, user management, department configuration |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=your_api_url
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

## Components Used

| Component | Purpose |
|-----------|---------|
| `Card` | Container for stats and content sections |
| `Button` | Action buttons and navigation |
| `SubmissionStatusBadge` | Visual status indicator for submissions |
| `AssignmentStatusBadge` | Visual status indicator for assignments |

## Status Types

### Assignment Status
- `PENDING` - Not yet started
- `IN_PROGRESS` - Currently being worked on
- `COMPLETED` - Work finished

### Submission Status
- `SUBMITTED` - Awaiting manager review
- `VERIFIED` - Approved by manager
- `REJECTED` - Requires revision

## License

This project is proprietary software.
