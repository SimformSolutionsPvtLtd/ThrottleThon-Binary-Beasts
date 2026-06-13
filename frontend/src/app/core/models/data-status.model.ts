export interface DataStatus {
  tenant: {
    name: string;
    slug: string;
    plan: string;
  };
  sources: {
    git: SourceStatus;
    jira: SourceStatus;
    hrms: SourceStatus;
  };
}

export interface SourceStatus {
  mode: 'sandbox' | 'live';
  repoCount?: number;
  ticketCount?: number;
  sprintCount?: number;
  employeeCount?: number;
  lastSyncAt: string | null;
}
