import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RunForecastCommand } from '../commands/run-forecast.command';
import { ForecastService } from '../../modules/forecast/forecast.service';

@CommandHandler(RunForecastCommand)
export class RunForecastHandler implements ICommandHandler<RunForecastCommand> {
  constructor(private readonly forecast: ForecastService) {}

  execute(cmd: RunForecastCommand) {
    return this.forecast.run({ scenarioId: cmd.scenarioId });
  }
}
