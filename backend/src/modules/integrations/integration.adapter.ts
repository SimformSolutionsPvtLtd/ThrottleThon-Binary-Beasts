export interface RepoSummary {
  id: string;
  name: string;
  url: string;
  defaultBranch?: string;
}

export interface IssueSummary {
  id: string;
  key: string;
  title: string;
  status: string;
}

export interface PersonSummary {
  id: string;
  name: string;
  department?: string;
  email?: string;
}

export interface IntegrationAdapter {
  readonly key: string;
  isConfigured(): boolean;
}

export interface SCMAdapter extends IntegrationAdapter {
  listRepos(orgOrUser: string): Promise<RepoSummary[]>;
}

export interface IssueTrackerAdapter extends IntegrationAdapter {
  listIssues(projectKey: string): Promise<IssueSummary[]>;
}

export interface HRISAdapter extends IntegrationAdapter {
  listPeople(): Promise<PersonSummary[]>;
}
