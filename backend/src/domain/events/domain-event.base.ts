export abstract class DomainEvent {
  abstract readonly name: string;
  readonly occurredAt: Date = new Date();
  constructor(public readonly aggregateId: string) {}
}

export class ScenarioCreatedEvent extends DomainEvent {
  readonly name = 'scenario.created';
}
export class ForecastGeneratedEvent extends DomainEvent {
  readonly name = 'forecast.generated';
  constructor(aggregateId: string, public readonly forecastId: string) {
    super(aggregateId);
  }
}
export class DebateCompletedEvent extends DomainEvent {
  readonly name = 'debate.completed';
  constructor(aggregateId: string, public readonly confidenceScore: number) {
    super(aggregateId);
  }
}
export class AllocationChangedEvent extends DomainEvent {
  readonly name = 'allocation.changed';
}
