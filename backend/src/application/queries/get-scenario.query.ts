import { IQuery } from '@nestjs/cqrs';

export class GetScenarioQuery implements IQuery {
  constructor(public readonly id: string) {}
}
