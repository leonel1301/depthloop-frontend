import type { ToolId } from "@/features/tools/models";

export type InferMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  steps?: Array<{
    index: number;
    title: string;
    reason: string;
    sql?: string | null;
    table: {
      columns: string[];
      rows: Array<Array<string | number | boolean | null>>;
      rowCount: number;
      truncated: boolean;
    };
    error?: string | null;
  }>;
  pending?: boolean;
  preferredTools?: ToolId[];
};

export type InferThread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: InferMessage[];
};
