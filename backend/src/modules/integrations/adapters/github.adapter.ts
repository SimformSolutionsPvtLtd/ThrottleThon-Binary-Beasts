import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { RepoSummary, SCMAdapter } from '../integration.adapter';

@Injectable()
export class GithubAdapter implements SCMAdapter {
  readonly key = 'github';

  isConfigured(): boolean {
    return Boolean(process.env.GITHUB_TOKEN);
  }

  async listRepos(orgOrUser: string): Promise<RepoSummary[]> {
    if (!this.isConfigured()) return [];
    const { data } = await axios.get(`https://api.github.com/users/${orgOrUser}/repos?per_page=100`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
    });
    return (data as Array<{ id: number; name: string; html_url: string; default_branch: string }>).map((r) => ({
      id: String(r.id),
      name: r.name,
      url: r.html_url,
      defaultBranch: r.default_branch,
    }));
  }
}
