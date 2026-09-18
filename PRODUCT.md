# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personas de negocio (finanzas, operaciones, producto, dirección). Entran cuando necesitan entender o decidir sobre la empresa y no saben SQL. IT puede conectar fuentes, pero no es el usuario principal.

## Product Purpose

DepthLoop hace posible que una empresa tenga un mapa confirmado de **toda** su data (bases, APIs y servicios), no de una sola base. El trabajo actual del producto es armar y confirmar ese mapa. Preguntar e interpretar viene después, cuando el mapa ya existe.

Éxito: un no-técnico puede ver la data de la empresa en conceptos de negocio y confirmar lo dudoso, sin modelar tablas a mano.

## Positioning

No es un chat sobre SQL ni otro BI. Es la capa de significado de la empresa: conceptos confirmados por negocio, sobre todas las fuentes. Un warehouse o un “pregunta tus tablas” no puede copiar eso si no tiene el mapa validado.

## Operating Context

Flujo de configuración en tres pasos: **Map** (conectar fuentes, leer estructura, confirmar), **Negocio** (glosario, reglas, excepciones; aún placeholder), **Inferir** (preguntas en lenguaje natural; aún placeholder).

Map es una app web con header de producto, fuentes en el chrome, explorador de conceptos y panel de revisión. Conexiones en solo lectura. Tema claro/oscuro. UI en español. Datos de demostración: PostgreSQL `commerce_prod` (clientes, pedidos, productos, líneas, pagos).

## Capabilities and Constraints

Confirmado:

- Conectar varias fuentes (bases y APIs); no escribir en ellas; no almacenar credenciales.
- Mapear a conceptos de negocio y confirmarlos (tabla de revisión).
- Cuando exista Inferir: cada respuesta muestra *n* consultas en lenguaje natural, cada una con su resultado en tabla; el SQL no es el protagonista.

Aún no construido: Negocio e Inferir como producto, fusiones semánticas entre fuentes reales, permisos por fuente, citas de PII.

Terminología fija: Map, Negocio, Inferir, estructura detectada, revisión, concepto.

Abierto: tamaño de empresa, idiomas además de español, y si Inferir será el uso diario una vez el mapa exista.

## Brand Commitments

Nombre **DepthLoop**. Wordmark e icono (`/depthloop-icon-v2.png`). Pasos nombrados Map → Negocio → Inferir. Voz de producto en español, directa, corporativa.

## Evidence on Hand

- Demo mock: ontología retail (`features/ontology-discovery/services/mockOntology.ts`), no datos de clientes reales.
- Activos: `/depthloop-icon-v2.png`, `/og.png`.

No hay testimonios, benchmarks, clientes ni métricas reales. El trabajo futuro no debe inventarlos.

## Product Principles

- Primero el mapa: negocio confirma significado antes de preguntar.
- Toda la data de la empresa, no una base aislada.
- Inferir nunca es una caja negra: cada consulta se ve en lenguaje natural y en tabla.
- Solo lectura: DepthLoop no escribe en los sistemas del cliente ni guarda secretos.
- El usuario de negocio es quien valida; IT habilita, no traduce en Slack.
