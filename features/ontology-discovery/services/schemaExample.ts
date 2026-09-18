import type { SchemaSnapshot } from "../models/ontology";

export const EXAMPLE_SCHEMA: SchemaSnapshot = {
  source: {
    id: "commerce-prod",
    name: "commerce_prod",
    engine: "postgresql",
  },
  schemas: [
    {
      name: "public",
      tables: [
        {
          name: "customers",
          type: "table",
          comment: "Clientes registrados en la plataforma.",
          columns: [
            { name: "customer_id", dataType: "uuid", nullable: false, primaryKey: true, unique: true },
            { name: "email", dataType: "varchar(320)", nullable: false, unique: true },
          ],
          foreignKeys: [],
          indexes: [{ name: "customers_email_key", columns: ["email"], unique: true }],
        },
        {
          name: "orders",
          type: "table",
          comment: "Pedidos realizados por clientes.",
          columns: [
            { name: "order_id", dataType: "uuid", nullable: false, primaryKey: true, unique: true },
            { name: "customer_id", dataType: "uuid", nullable: false },
            { name: "total_amount", dataType: "numeric(12,2)", nullable: false },
          ],
          foreignKeys: [
            {
              name: "orders_customer_id_fkey",
              columns: ["customer_id"],
              referencedSchema: "public",
              referencedTable: "customers",
              referencedColumns: ["customer_id"],
            },
          ],
          indexes: [],
        },
      ],
    },
  ],
};

export const EXAMPLE_SCHEMA_TEXT = JSON.stringify(EXAMPLE_SCHEMA, null, 2);
