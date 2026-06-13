import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'inr', standalone: true })
export class CurrencyInrPipe implements PipeTransform {
  transform(value: number): string {
    if (value == null) return '₹0';
    if (value >= 10_000_000) {
      return `₹${(value / 10_000_000).toFixed(1)}Cr`;
    }
    if (value >= 100_000) {
      return `₹${(value / 100_000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  }
}
