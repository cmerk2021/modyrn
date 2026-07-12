'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface ActivityPoint {
  label: string;
  automod: number;
  cases: number;
}

interface ActivityChartProps {
  data: ActivityPoint[];
}

/** 14-day message & moderation activity area chart. */
export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Activity</CardTitle>
        <CardDescription>
          Moderation cases and automod events over the last 14 days.
        </CardDescription>
      </CardHeader>
      <div className="h-64 px-2 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="fillAutomod" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillCases" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-warning)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--color-popover-foreground)',
              }}
            />
            <Area
              type="monotone"
              dataKey="automod"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fill="url(#fillAutomod)"
            />
            <Area
              type="monotone"
              dataKey="cases"
              stroke="var(--color-warning)"
              strokeWidth={2}
              fill="url(#fillCases)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
