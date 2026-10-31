"use client";
/**
 * Shared Recharts wrappers — the ONLY way pages draw charts.
 * Colours come from --chart-1..6; tooltips follow the theme; animation ≤ 600ms.
 */
import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";

export const CHART_COLORS = [1, 2, 3, 4, 5, 6].map((i) => `var(--chart-${i})`);

type Row = Record<string, string | number | null>;
type Fmt = "money" | "number" | "percent";

const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

function fmt(v: unknown, f: Fmt = "number", short = false): string {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  if (f === "percent") return `${full.format(n)}%`;
  const s = short ? compact.format(n) : full.format(n);
  return f === "money" ? `₹${s}` : s;
}

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;
const ANIM = 600;

function ChartTooltip({ active, payload, label, format }: TooltipContentProps<TooltipValueType, string | number> & { format?: Fmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-xl border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      {label !== undefined && <p className="mb-1 font-medium">{String(label)}</p>}
      {payload.map((p) => (
        <div key={String(p.dataKey ?? p.name)} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
            {p.name}
          </span>
          <span className="num font-medium">{fmt(p.value, format)}</span>
        </div>
      ))}
    </div>
  );
}

/** Area chart with gradient fill. */
export function AreaTrend({
  data,
  xKey,
  yKey,
  label,
  format = "number",
  color = CHART_COLORS[0],
  height = 260,
}: {
  data: Row[];
  xKey: string;
  yKey: string;
  label?: string;
  format?: Fmt;
  color?: string;
  height?: number;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} {...axis} tickMargin={8} minTickGap={16} />
        <YAxis {...axis} width={52} tickFormatter={(v) => fmt(v, format, true)} />
        <Tooltip content={(p) => <ChartTooltip {...p} format={format} />} cursor={{ stroke: "var(--border)" }} />
        <Area
          type="monotone"
          dataKey={yKey}
          name={label ?? yKey}
          stroke={color}
          strokeWidth={2.25}
          fill={`url(#a${id})`}
          animationDuration={ANIM}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Grouped (or stacked) bars. */
export function BarTrend({
  data,
  xKey,
  bars,
  format = "number",
  stacked = false,
  height = 260,
}: {
  data: Row[];
  xKey: string;
  bars: { key: string; label: string; color?: string }[];
  format?: Fmt;
  stacked?: boolean;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} {...axis} tickMargin={8} minTickGap={8} />
        <YAxis {...axis} width={52} tickFormatter={(v) => fmt(v, format, true)} />
        <Tooltip content={(p) => <ChartTooltip {...p} format={format} />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
        {bars.length > 1 && (
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        )}
        {bars.map((b, i) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.label}
            fill={b.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            stackId={stacked ? "s" : undefined}
            radius={stacked && i < bars.length - 1 ? 0 : [6, 6, 0, 0]}
            maxBarSize={36}
            animationDuration={ANIM}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Donut with optional centre label/value and a legend below. */
export function Donut({
  data,
  centerLabel,
  centerValue,
  format = "number",
  height = 220,
}: {
  data: { name: string; value: number; color?: string }[];
  centerLabel?: string;
  centerValue?: string;
  format?: Fmt;
  height?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div>
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={(p) => <ChartTooltip {...p} format={format} />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={2}
              cornerRadius={4}
              stroke="var(--card)"
              strokeWidth={2}
              animationDuration={ANIM}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={d.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {(centerLabel || centerValue) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="num text-xl font-semibold">{centerValue}</span>}
            {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
          </div>
        )}
      </div>
      <ul className="mt-3 space-y-1.5 text-xs">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span className="size-2 shrink-0 rounded-full" style={{ background: d.color ?? CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="num font-medium">
              {fmt(d.value, format)}
              {total > 0 && <span className="ml-1.5 text-muted-foreground">{Math.round((d.value / total) * 100)}%</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tiny trend line for KPI cards. Accepts plain numbers. */
export function Sparkline({
  data,
  color = CHART_COLORS[0],
  height = 36,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const id = useId().replace(/:/g, "");
  const rows = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#s${id})`} isAnimationActive={false} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
