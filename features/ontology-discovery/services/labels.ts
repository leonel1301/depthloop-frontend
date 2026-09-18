const conceptLabels: Record<string, string> = {
  customers: "Clientes",
  orders: "Pedidos",
  products: "Productos",
  order_items: "Líneas de pedido",
  payments: "Pagos",
};

const conceptStories: Record<string, string> = {
  customers: "Personas o empresas que compran. Aquí está quiénes son y cómo contactarlas.",
  orders: "Cada compra. Relaciona a un cliente con lo que pidió y cuánto pagó.",
  products: "El catálogo que se puede vender: código, nombre comercial y precio.",
  order_items: "El detalle de cada pedido: qué producto, cuántas unidades y con qué descuento.",
  payments: "Los cobros asociados a un pedido: cómo se pagó y cuándo se procesó.",
};

const fieldLabels: Record<string, string> = {
  customer_id: "ID de cliente",
  full_name: "Nombre completo",
  email: "Correo electrónico",
  order_id: "ID de pedido",
  order_status: "Estado del pedido",
  total_amount: "Importe total",
  product_id: "ID de producto",
  sku: "Código de producto (SKU)",
  unit_price: "Precio unitario",
  quantity: "Cantidad",
  discount: "Descuento",
  payment_method: "Método de pago",
  processed_at: "Fecha de procesamiento",
};

const semanticLabels: Record<string, string> = {
  unique_identifier: "Sirve para identificar el registro sin ambigüedad",
  person_name: "Nombre de una persona",
  email_address: "Dirección de correo",
  lifecycle_status: "Estado en el ciclo de vida",
  monetary_amount: "Cantidad de dinero",
  stock_keeping_unit: "Código comercial del producto",
  item_quantity: "Número de unidades",
  discount_rate: "Porcentaje o monto de descuento",
  payment_method: "Forma en que se cobró",
  event_datetime: "Momento en que ocurrió",
  table: "Tabla",
  view: "Vista",
};

const fieldGroupBySemantic: Record<string, { id: string; title: string; hint: string }> = {
  unique_identifier: { id: "identity", title: "Identidad", hint: "Cómo distinguir un registro de otro." },
  person_name: { id: "who", title: "Quién es", hint: "Datos de personas o contacto." },
  email_address: { id: "who", title: "Quién es", hint: "Datos de personas o contacto." },
  monetary_amount: { id: "money", title: "Dinero", hint: "Importes que importan al negocio." },
  discount_rate: { id: "money", title: "Dinero", hint: "Importes que importan al negocio." },
  item_quantity: { id: "ops", title: "Operación", hint: "Cantidades y códigos de trabajo diario." },
  stock_keeping_unit: { id: "ops", title: "Operación", hint: "Cantidades y códigos de trabajo diario." },
  lifecycle_status: { id: "class", title: "Clasificación", hint: "Estados o categorías." },
  payment_method: { id: "class", title: "Clasificación", hint: "Estados o categorías." },
  event_datetime: { id: "time", title: "Tiempo", hint: "Cuándo pasó." },
};

export function conceptKey(id: string) {
  const parts = id.split(".");
  return parts[parts.length - 1] || id;
}

export function conceptLabel(id: string, fallback?: string) {
  if (fallback) return fallback;
  const key = conceptKey(id);
  return conceptLabels[key] || key.replace(/_/g, " ");
}

export function conceptSingular(id: string, fallback?: string) {
  const singulars: Record<string, string> = {
    customers: "cliente",
    orders: "pedido",
    products: "producto",
    order_items: "línea de pedido",
    payments: "pago",
  };
  return singulars[conceptKey(id)] || (fallback || conceptLabel(id)).toLowerCase();
}

export function conceptStory(id: string, fieldCount: number) {
  return conceptStories[conceptKey(id)] || `Agrupa ${fieldCount} ${fieldCount === 1 ? "dato" : "datos"} de negocio que DepthLoop encontró en esta fuente.`;
}

export function fieldLabel(name: string) {
  return fieldLabels[name] || name.replace(/_/g, " ");
}

export function humanLabel(value?: string) {
  if (!value) return "Todavía no lo clasificamos";
  return semanticLabels[value] || value.replace(/_/g, " ");
}

export function shortLabel(value?: string) {
  const shorts: Record<string, string> = {
    unique_identifier: "Identificador",
    person_name: "Nombre",
    email_address: "Correo",
    lifecycle_status: "Estado",
    monetary_amount: "Importe",
    stock_keeping_unit: "SKU",
    item_quantity: "Cantidad",
    discount_rate: "Descuento",
    payment_method: "Pago",
    event_datetime: "Fecha",
    table: "Tabla",
    view: "Vista",
  };
  if (!value) return "Sin clasificar";
  return shorts[value] || value.replace(/_/g, " ");
}

export function confidenceCopy(value: number) {
  if (value >= 0.9) return "Lectura clara";
  if (value >= 0.7) return "Conviene confirmar";
  return "Revisar con calma";
}

export function fieldGroup(semanticType?: string) {
  return fieldGroupBySemantic[semanticType || ""] || { id: "other", title: "Otros datos", hint: "Campos útiles que aún no encajan en un grupo." };
}

export function relationSentence(from: string, to: string, cardinality: string, foreignKey?: string, currentId?: string) {
  const fromOne = conceptSingular(from);
  const toMany = to === "order_items" ? "varias líneas de pedido" : `varios ${conceptLabel(to).toLowerCase()}`;
  const fromName = conceptLabel(from);
  const toName = conceptLabel(to);
  const key = foreignKey ? ` Se unen por ${fieldLabel(foreignKey)}.` : "";
  if (cardinality === "1-N") {
    if (currentId === to) return `${toMany.charAt(0).toUpperCase()}${toMany.slice(1)} pertenecen a un mismo ${fromOne}.${key}`;
    return `Cada ${fromOne} puede tener ${toMany}.${key}`;
  }
  if (cardinality === "1-1") return `${fromName} se relaciona uno a uno con ${toName}.${key}`;
  return `${fromName} y ${toName} se relacionan de muchos a muchos.${key}`;
}

export function cardinalityCopy(cardinality: string) {
  if (cardinality === "1-N") return "Uno a varios";
  if (cardinality === "1-1") return "Uno a uno";
  return "Varios a varios";
}
