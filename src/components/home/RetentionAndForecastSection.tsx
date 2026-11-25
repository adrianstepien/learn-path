import { useState } from 'react';
import { Target } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrueRetentionDto, WorkloadForecastDayDto } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface RetentionAndForecastSectionProps {
  trueRetention?: TrueRetentionDto;
  workloadForecast?: WorkloadForecastDayDto[];
}

const formatShortDate = (isoDate: string, idx: number) => {
  if (idx === 0) return 'Dziś';
  const [, month, day] = isoDate.split('-');
  return `${day}.${month}`;
};

export const RetentionAndForecastSection = ({
  trueRetention,
  workloadForecast = [],
}: RetentionAndForecastSectionProps) => {
  const [range, setRange] = useState<7 | 14>(14);

  const chartData = workloadForecast.slice(0, range).map((d, idx) => ({
    label: formatShortDate(d.date, idx),
    tech: d.techCardsDue,
    vocab: d.vocabCardsDue,
  }));

  const retention = trueRetention?.retentionPercent ?? null;
  const target = trueRetention?.desiredRetentionPercent ?? 90;
  const diff = retention !== null ? Math.round((retention - target) * 10) / 10 : null;

  const statusColor =
    retention === null
      ? 'text-muted-foreground'
      : retention >= target - 3
        ? 'text-success'
        : retention >= target - 8
          ? 'text-warning'
          : 'text-destructive';

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* True Retention (30 dni) */}
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">True Retention (30 dni)</p>
            <p className={cn('mt-2 text-4xl font-bold', statusColor)}>
              {retention !== null ? `${retention.toFixed(1)}%` : '—'}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Target className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cel FSRS</span>
            <span className="font-medium text-foreground">{target}%</span>
          </div>
          {diff !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Odchylenie</span>
              <span className={cn('font-medium', statusColor)}>
                {diff > 0 ? `+${diff}%` : `${diff}%`}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Powtórki (REVIEW)</span>
            <span className="font-medium text-foreground">
              {trueRetention
                ? `${trueRetention.passedReviews} / ${trueRetention.totalReviews}`
                : '0 / 0'}
            </span>
          </div>
        </div>
      </div>

      {/* Prognoza obciążenia 7 / 14 dni */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md lg:col-span-2">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">Prognoza powtórek</h3>
            <p className="text-xs text-muted-foreground">
              Dzień „Dziś” zawiera również zaległe karty
            </p>
          </div>
          <div className="flex rounded-lg border border-border bg-secondary/40 p-0.5 text-xs">
            {([7, 14] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRange(days)}
                className={cn(
                  'rounded-md px-2.5 py-1 font-medium transition-colors',
                  range === days
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {days} dni
              </button>
            ))}
          </div>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="tech" name="Karty wiedzy" stackId="due" fill="hsl(var(--primary))" />
              <Bar
                dataKey="vocab"
                name="Słówka"
                stackId="due"
                fill="hsl(var(--accent))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};