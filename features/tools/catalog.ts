import type { ToolDefinition, ToolId } from "./models";

export const TOOL_CATALOG: readonly ToolDefinition[] = [
  { id: "bar", category: "visual", accent: "ink", tags: ["ranking", "categories"] },
  { id: "line", category: "visual", accent: "slate", tags: ["trends", "time"] },
  { id: "donut", category: "visual", accent: "sand", tags: ["composition", "percentage"] },
  { id: "world-map", category: "geography", accent: "ink", tags: ["logistics", "territory"] },
  { id: "kpi", category: "analysis", accent: "sand", tags: ["indicators", "summary"] },
  { id: "funnel", category: "analysis", accent: "slate", tags: ["conversion", "stages"] },
  { id: "heatmap", category: "analysis", accent: "ink", tags: ["intensity", "patterns"] },
  { id: "timeline", category: "analysis", accent: "sand", tags: ["events", "sequence"] },
  { id: "histogram", category: "visual", accent: "sand", tags: ["distribution", "ranges"] },
  { id: "area", category: "visual", accent: "slate", tags: ["trends", "magnitude"] },
  { id: "scatter", category: "analysis", accent: "ink", tags: ["correlation", "outliers"] },
  { id: "gauge", category: "analysis", accent: "sand", tags: ["goals", "progress"] },
  { id: "treemap", category: "visual", accent: "slate", tags: ["composition", "hierarchy"] },
  { id: "route-map", category: "geography", accent: "ink", tags: ["logistics", "routes"] },
] as const;

export function toolById(id: ToolId) {
  return TOOL_CATALOG.find((tool) => tool.id === id);
}
