export type ConfirmationStatus = "pending" | "confirmed" | "rejected";

export type ConfirmationItem = {
  itemId: string;
  entityId: string;
  itemType: "entity" | "attribute" | "relation";
  suggestion: {
    name: string;
    type: string;
    confidence: number;
    context?: string;
    table?: string;
    column?: string;
  };
  status: ConfirmationStatus;
  corrections?: Record<string, string>;
};
