export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {
    if (!Number.isFinite(amount)) throw new Error('Money: invalid amount');
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Money: invalid ISO currency');
  }

  static of(amount: number, currency = 'USD'): Money {
    return new Money(Math.round(amount * 100) / 100, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this.amount + other.amount, this.currency);
  }
  mul(factor: number): Money {
    return Money.of(this.amount * factor, this.currency);
  }

  private assertSameCurrency(o: Money): void {
    if (o.currency !== this.currency) throw new Error('Money: currency mismatch');
  }
}
