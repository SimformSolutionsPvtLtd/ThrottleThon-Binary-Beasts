import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { RepoSummary, SCMAdapter } from '../integration.adapter';

@Injectable()
export class BitbucketAdapter implements SCMAdapter {
  readonly key = 'bitbucket';

  isConfigured(): boolean {
    return Boolean(process.env.BITBUCKET_TOKEN);
  }

  async listRepos(workspace: string): Promise<RepoSummary[]> {
    if (!this.isConfigured()) return [];
    const { data } = await axios.get(`https://api.bitbucket.org/2.0/repositories/${workspace}?pagelen=100`, {
      headers: { Authorization: `Bearer ${process.env.BITBUCKET_TOKEN}` },
    });
    const values = (data as { values: Array<{ uuid: string; name: string; links: { html: { href: string } }; mainbranch?: { name: string } }> }).values ?? [];
    return values.map((r) => ({
      id: r.uuid,
      name: r.name,
      url: r.links.html.href,
      defaultBranch: r.mainbranch?.name,
    }));
  }
}
