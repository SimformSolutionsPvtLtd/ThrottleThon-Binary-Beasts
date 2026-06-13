export class Duration {
  private constructor(public readonly days: number) {
    if (days < 0 || !Number.isFinite(days)) throw new Error('Duration: invalid days');
  }
  static ofDays(d: number): Duration {
    return new Duration(Math.ceil(d));
  }
  static ofWeeks(w: number): Duration {
    return new Duration(Math.ceil(w * 7));
  }
  toWeeks(): number {
    return Math.ceil(this.days / 7);
  }
  add(other: Duration): Duration {
    return new Duration(this.days + other.days);
  }
  mul(factor: number): Duration {
    return new Duration(this.days * factor);
  }
}
