import { Injectable } from '@nestjs/common';
import { GithubAdapter } from './adapters/github.adapter';
import { GitlabAdapter } from './adapters/gitlab.adapter';
import { BitbucketAdapter } from './adapters/bitbucket.adapter';
import { JiraAdapter } from './adapters/jira.adapter';
import { ZohoProjectsAdapter } from './adapters/zoho-projects.adapter';
import { BambooHRAdapter } from './adapters/bamboohr.adapter';
import { ZohoPeopleAdapter } from './adapters/zoho-people.adapter';
import { WorkdayAdapter } from './adapters/workday.adapter';
import { HRISAdapter, IssueTrackerAdapter, SCMAdapter } from './integration.adapter';

@Injectable()
export class IntegrationsService {
  readonly scm: Record<string, SCMAdapter>;
  readonly issues: Record<string, IssueTrackerAdapter>;
  readonly hris: Record<string, HRISAdapter>;

  constructor(
    gh: GithubAdapter,
    gl: GitlabAdapter,
    bb: BitbucketAdapter,
    jira: JiraAdapter,
    zp: ZohoProjectsAdapter,
    bamboo: BambooHRAdapter,
    zoho: ZohoPeopleAdapter,
    wd: WorkdayAdapter,
  ) {
    this.scm = { [gh.key]: gh, [gl.key]: gl, [bb.key]: bb };
    this.issues = { [jira.key]: jira, [zp.key]: zp };
    this.hris = { [bamboo.key]: bamboo, [zoho.key]: zoho, [wd.key]: wd };
  }

  status() {
    const map = (rec: Record<string, { key: string; isConfigured(): boolean }>) =>
      Object.values(rec).map((a) => ({ key: a.key, configured: a.isConfigured() }));
    return { scm: map(this.scm), issues: map(this.issues), hris: map(this.hris) };
  }
}
