/**
 * Tiny trend line for KPI cells. Plain SVG rendered on the server with a CSS draw-in —
 * no chart library, so pages with KPIs don't ship Recharts. Big charts live in ./charts.
 */
export function Sparkline({
  data,
  color = "var(--chart-1)",
  height = 36,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) return null;
  const W = 100;
  const pad = 2;
  const min = Math.min(...data);
  const span = Math.max(...data) - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const line = `M${pts.join(" L")}`;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible" aria-hidden>
      <path d={`${line} L${W},${height} L0,${height} Z`} fill={color} opacity={0.12} className="spark-fill" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        className="spark-draw"
      />
    </svg>
  );
}
