import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { RepoSummary, SCMAdapter } from '../integration.adapter';

@Injectable()
export class GitlabAdapter implements SCMAdapter {
  readonly key = 'gitlab';

  isConfigured(): boolean {
    return Boolean(process.env.GITLAB_TOKEN);
  }

  async listRepos(group: string): Promise<RepoSummary[]> {
    if (!this.isConfigured()) return [];
    const { data } = await axios.get(`https://gitlab.com/api/v4/groups/${encodeURIComponent(group)}/projects?per_page=100`, {
      headers: { 'PRIVATE-TOKEN': process.env.GITLAB_TOKEN },
    });
    return (data as Array<{ id: number; name: string; web_url: string; default_branch: string }>).map((p) => ({
      id: String(p.id),
      name: p.name,
      url: p.web_url,
      defaultBranch: p.default_branch,
    }));
  }
}
