export const TOOL_IDS = [
  "bar",
  "line",
  "donut",
  "world-map",
  "globe",
  "kpi",
  "funnel",
  "heatmap",
  "timeline",
  "histogram",
  "area",
  "scatter",
  "gauge",
  "treemap",
  "route-map",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];
export type ToolCategory = "visual" | "geography" | "analysis";

export type ToolDefinition = {
  id: ToolId;
  category: ToolCategory;
  accent: "ink" | "sand" | "slate";
  tags: readonly string[];
};

export type ToolSelection = {
  selectedTools: ToolId[];
  updatedAt: string | null;
};

export type ToolRecommendation = {
  id: ToolId;
  reason: string;
  confidence: number;
};

export function isToolId(value: unknown): value is ToolId {
  return typeof value === "string" && (TOOL_IDS as readonly string[]).includes(value);
}
