import {
  ChartArea,
  ChartColumnBig,
  Gauge,
  Layers3,
  Route,
  ScatterChart,
  BarChart3,
  CircleGauge,
  Clock3,
  Donut,
  Filter,
  Globe2,
  Grid3X3,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import type { ToolId } from "../models";

const ICONS: Record<ToolId, LucideIcon> = {
  bar: BarChart3,
  line: LineChart,
  donut: Donut,
  "world-map": Globe2,
  kpi: CircleGauge,
  funnel: Filter,
  heatmap: Grid3X3,
  timeline: Clock3,
  histogram: ChartColumnBig,
  area: ChartArea,
  scatter: ScatterChart,
  gauge: Gauge,
  treemap: Layers3,
  "route-map": Route,
};

export function ToolIcon({ id, size = 17 }: { id: ToolId; size?: number }) {
  const Icon = ICONS[id];
  return <Icon size={size} aria-hidden="true" />;
}
