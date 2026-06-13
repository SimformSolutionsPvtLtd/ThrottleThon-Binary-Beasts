import { ICommand } from '@nestjs/cqrs';

export class RunForecastCommand implements ICommand {
  constructor(
    public readonly scenarioId: string,
    public readonly userId: string,
  ) {}
}
