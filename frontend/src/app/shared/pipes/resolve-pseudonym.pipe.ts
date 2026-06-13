import { Pipe, PipeTransform, inject } from '@angular/core';
import { ForecastStateService } from '../../core/services/forecast-state.service';

@Pipe({ name: 'resolveName', standalone: true, pure: false })
export class ResolvePseudonymPipe implements PipeTransform {
  private readonly forecastState = inject(ForecastStateService);

  transform(pseudonym: string): string {
    return this.forecastState.resolvedName()(pseudonym);
  }
}
