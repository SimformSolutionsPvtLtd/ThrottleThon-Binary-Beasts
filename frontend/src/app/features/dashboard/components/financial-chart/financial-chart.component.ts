import {
  Component, inject, effect, ViewChild, ElementRef, OnDestroy, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ForecastStateService } from '../../../../core/services/forecast-state.service';

Chart.register(...registerables);

// Apply dark theme defaults globally once
Chart.defaults.color = '#94A3B8';
Chart.defaults.borderColor = '#334155';
Chart.defaults.font.family = 'Inter, Roboto, sans-serif';

@Component({
  selector: 'ss-financial-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-surface-raised rounded-xl p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-base font-semibold text-content">Financial Impact Comparison</h3>
        @if (state.isForecastLoading()) {
          <span class="text-xs text-content-muted flex items-center gap-1.5">
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse"></span>
            Updating…
          </span>
        }
      </div>

      @if (state.activeScenarios().length < 1) {
        <div class="flex items-center justify-center h-48 text-content-muted text-sm">
          Select at least one scenario to view the chart.
        </div>
      } @else if (state.forecastResults().length === 0) {
        <div class="flex items-center justify-center h-48">
          <div class="text-center">
            <div class="h-4 w-48 bg-surface-overlay rounded shimmer mx-auto mb-3"></div>
            <div class="h-32 w-full bg-surface-overlay rounded shimmer"></div>
          </div>
        </div>
      } @else {
        <div class="relative" style="height: 280px;">
          <canvas #chartCanvas></canvas>
        </div>
      }
    </div>
  `,
})
export class FinancialChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvasRef!: ElementRef<HTMLCanvasElement>;

  readonly state = inject(ForecastStateService);
  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const results = this.state.forecastResults();
      const scenarios = this.state.activeScenarios();
      if (this.chart && results.length && scenarios.length) {
        this.updateChart(results, scenarios.map(s => s.name));
      }
    });
  }

  ngAfterViewInit(): void {
    this.initChart();
    // If data already loaded, draw immediately
    const results = this.state.forecastResults();
    const scenarios = this.state.activeScenarios();
    if (results.length && scenarios.length) {
      this.updateChart(results, scenarios.map(s => s.name));
    }
  }

  private initChart(): void {
    if (!this.chartCanvasRef) return;
    const ctx = this.chartCanvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Project Cost',
            type: 'bar',
            data: [],
            backgroundColor: 'rgba(37,99,235,0.6)',
            borderColor: 'rgba(37,99,235,0.9)',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y',
          },
          {
            label: 'Risk-Adjusted Cost',
            type: 'bar',
            data: [],
            backgroundColor: 'rgba(245,158,11,0.6)',
            borderColor: 'rgba(245,158,11,0.9)',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y',
          },
          {
            label: 'Confidence Score',
            type: 'line',
            data: [],
            borderColor: 'rgba(74,222,128,0.9)',
            backgroundColor: 'rgba(74,222,128,0.1)',
            pointBackgroundColor: 'rgba(74,222,128,1)',
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2,
            tension: 0.3,
            fill: false,
            yAxisID: 'confidence',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 400,
          easing: 'easeInOutQuart',
        },
        plugins: {
          legend: {
            labels: {
              color: '#94A3B8',
              boxWidth: 12,
              padding: 16,
              font: { size: 12 },
            },
          },
          tooltip: {
            backgroundColor: '#1E293B',
            titleColor: '#E2E8F0',
            bodyColor: '#94A3B8',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => {
                const y = ctx.parsed.y ?? 0;
                if (ctx.datasetIndex === 2) {
                  return ` Confidence: ${y.toFixed(1)}%`;
                }
                const lakhs = y / 100000;
                const formatted = lakhs >= 100
                  ? `₹${(lakhs / 100).toFixed(2)}Cr`
                  : `₹${lakhs.toFixed(2)}L`;
                return ` ${ctx.dataset.label}: ${formatted}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#94A3B8', font: { size: 11 } },
            grid: { color: '#334155' },
          },
          y: {
            position: 'left',
            title: {
              display: true,
              text: 'Cost (₹)',
              color: '#94A3B8',
              font: { size: 11 },
            },
            ticks: {
              color: '#94A3B8',
              font: { size: 11 },
              callback: (value) => {
                const v = Number(value);
                const lakhs = v / 100000;
                if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(0)}Cr`;
                return `₹${lakhs.toFixed(0)}L`;
              },
            },
            grid: { color: '#334155' },
          },
          confidence: {
            position: 'right',
            min: 0,
            max: 100,
            title: {
              display: true,
              text: 'Confidence %',
              color: '#94A3B8',
              font: { size: 11 },
            },
            ticks: {
              color: '#94A3B8',
              font: { size: 11 },
              callback: (value) => `${value}%`,
            },
            grid: { drawOnChartArea: false },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(results: { projectCost: number; riskAdjustedCost: number; confidenceScore: number }[], labels: string[]): void {
    if (!this.chart) return;
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = results.map(r => r.projectCost);
    this.chart.data.datasets[1].data = results.map(r => r.riskAdjustedCost);
    this.chart.data.datasets[2].data = results.map(r => r.confidenceScore);
    this.chart.update();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }
}
