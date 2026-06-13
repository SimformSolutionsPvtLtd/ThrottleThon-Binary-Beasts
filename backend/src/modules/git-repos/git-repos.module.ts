import { Module } from '@nestjs/common';
import { GitReposController } from './git-repos.controller';
import { GitReposService } from './git-repos.service';

@Module({
  controllers: [GitReposController],
  providers: [GitReposService],
})
export class GitReposModule {}
