import type { OntologyDiscoveryResult } from "../models/ontology";

export const mockOntology: OntologyDiscoveryResult = {
  id: "ont-retail-001",
  entities: [
    {
      id: "customers", name: "Customers", type: "table", confidence: 0.96,
      attributes: [
        { id: "customer_id", name: "customer_id", dataType: "uuid", semanticType: "unique_identifier", confidence: 0.98, nullable: false },
        { id: "full_name", name: "full_name", dataType: "varchar", semanticType: "person_name", confidence: 0.88, nullable: false },
        { id: "email", name: "email", dataType: "varchar", semanticType: "email_address", confidence: 0.97, nullable: false },
      ], relations: [],
    },
    {
      id: "orders", name: "Orders", type: "table", confidence: 0.93,
      attributes: [
        { id: "order_id", name: "order_id", dataType: "uuid", semanticType: "unique_identifier", confidence: 0.98, nullable: false },
        { id: "order_status", name: "order_status", dataType: "varchar", semanticType: "lifecycle_status", confidence: 0.74, nullable: false },
        { id: "total_amount", name: "total_amount", dataType: "decimal", semanticType: "monetary_amount", confidence: 0.86, nullable: false },
      ], relations: [],
    },
    {
      id: "products", name: "Products", type: "table", confidence: 0.91,
      attributes: [
        { id: "product_id", name: "product_id", dataType: "uuid", semanticType: "unique_identifier", confidence: 0.98, nullable: false },
        { id: "sku", name: "sku", dataType: "varchar", semanticType: "stock_keeping_unit", confidence: 0.67, nullable: false },
        { id: "unit_price", name: "unit_price", dataType: "decimal", semanticType: "monetary_amount", confidence: 0.94, nullable: false },
      ], relations: [],
    },
    {
      id: "order_items", name: "Order Items", type: "table", confidence: 0.87,
      attributes: [
        { id: "quantity", name: "quantity", dataType: "int", semanticType: "item_quantity", confidence: 0.78, nullable: false },
        { id: "discount", name: "discount", dataType: "decimal", semanticType: "discount_rate", confidence: 0.62, nullable: true },
      ], relations: [],
    },
    {
      id: "payments", name: "Payments", type: "table", confidence: 0.72,
      attributes: [
        { id: "payment_method", name: "payment_method", dataType: "varchar", semanticType: "payment_method", confidence: 0.83, nullable: false },
        { id: "processed_at", name: "processed_at", dataType: "timestamp", semanticType: "event_datetime", confidence: 0.95, nullable: true },
      ], relations: [],
    },
  ],
  relations: [
    { id: "rel-customer-orders", from: "customers", to: "orders", cardinality: "1-N", foreignKey: "customer_id", confidence: 0.97 },
    { id: "rel-orders-items", from: "orders", to: "order_items", cardinality: "1-N", foreignKey: "order_id", confidence: 0.95 },
    { id: "rel-products-items", from: "products", to: "order_items", cardinality: "1-N", foreignKey: "product_id", confidence: 0.92 },
    { id: "rel-orders-payments", from: "orders", to: "payments", cardinality: "1-N", foreignKey: "order_id", confidence: 0.78 },
  ],
  // Snapshot estable para que SSR y la primera hidratación del cliente coincidan.
  // Los análisis reales reemplazan esta fecha con la respuesta del backend.
  metadata: { analyzedAt: "2026-09-16T18:59:00-05:00", totalConfidence: 0.87, pendingConfirmations: 9 },
};
