import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GithubAdapter } from './adapters/github.adapter';
import { GitlabAdapter } from './adapters/gitlab.adapter';
import { BitbucketAdapter } from './adapters/bitbucket.adapter';
import { JiraAdapter } from './adapters/jira.adapter';
import { ZohoProjectsAdapter } from './adapters/zoho-projects.adapter';
import { BambooHRAdapter } from './adapters/bamboohr.adapter';
import { ZohoPeopleAdapter } from './adapters/zoho-people.adapter';
import { WorkdayAdapter } from './adapters/workday.adapter';

@Module({
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    GithubAdapter,
    GitlabAdapter,
    BitbucketAdapter,
    JiraAdapter,
    ZohoProjectsAdapter,
    BambooHRAdapter,
    ZohoPeopleAdapter,
    WorkdayAdapter,
  ],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
