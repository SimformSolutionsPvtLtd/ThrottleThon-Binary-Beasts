import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { IssueSummary, IssueTrackerAdapter } from '../integration.adapter';

@Injectable()
export class JiraAdapter implements IssueTrackerAdapter {
  readonly key = 'jira';

  isConfigured(): boolean {
    return Boolean(process.env.JIRA_BASE_URL && process.env.JIRA_TOKEN);
  }

  async listIssues(projectKey: string): Promise<IssueSummary[]> {
    if (!this.isConfigured()) return [];
    const url = `${process.env.JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(`project=${projectKey}`)}&maxResults=100`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${process.env.JIRA_TOKEN}`, Accept: 'application/json' },
    });
    return ((data as { issues: Array<{ id: string; key: string; fields: { summary: string; status: { name: string } } }> }).issues ?? []).map((i) => ({
      id: i.id,
      key: i.key,
      title: i.fields.summary,
      status: i.fields.status.name,
    }));
  }
}
