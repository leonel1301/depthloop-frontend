"use client";

import { Bot, Plus } from "lucide-react";

export function AgentRail() {
  return (
    <aside className="agent-rail" aria-label="Agentes">
      <div className="agent-rail-head">
        <span className="agent-mark" aria-hidden="true">
          <Bot size={16} />
        </span>
        <div>
          <h2>Agentes</h2>
          <span>Próximamente</span>
        </div>
      </div>
      <div className="agent-empty">
        <span><Plus size={15} /></span>
        <strong>Tu equipo de apoyo</strong>
        <p>Los agentes que actives aparecerán aquí para ayudarte con tareas específicas.</p>
      </div>
    </aside>
  );
}
