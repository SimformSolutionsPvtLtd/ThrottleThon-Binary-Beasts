import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '../../domain/events/domain-event.base';

@Injectable()
export class EventBusService {
  constructor(private readonly emitter: EventEmitter2) {}

  publish<T extends DomainEvent>(event: T): void {
    this.emitter.emit(event.name, event);
  }

  on<T extends DomainEvent>(name: string, handler: (e: T) => void | Promise<void>): void {
    this.emitter.on(name, handler);
  }
}
