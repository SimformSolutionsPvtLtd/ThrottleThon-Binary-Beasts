import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { IssueSummary, IssueTrackerAdapter } from '../integration.adapter';

@Injectable()
export class ZohoProjectsAdapter implements IssueTrackerAdapter {
  readonly key = 'zoho-projects';

  isConfigured(): boolean {
    return Boolean(process.env.ZOHO_PROJECTS_TOKEN);
  }

  async listIssues(portalProjectId: string): Promise<IssueSummary[]> {
    if (!this.isConfigured()) return [];
    const [portal, project] = portalProjectId.split(':');
    const url = `https://projectsapi.zoho.com/restapi/portal/${portal}/projects/${project}/tasks/`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Zoho-oauthtoken ${process.env.ZOHO_PROJECTS_TOKEN}` },
    });
    return ((data as { tasks: Array<{ id: string; key: string; name: string; status: { name: string } }> }).tasks ?? []).map((t) => ({
      id: t.id,
      key: t.key ?? t.id,
      title: t.name,
      status: t.status?.name ?? 'unknown',
    }));
  }
}
