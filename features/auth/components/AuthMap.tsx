import { Boxes, Check, Database, FileJson, ShieldCheck } from "lucide-react";
import Image from "next/image";

export function AuthMap() {
  return (
    <div className="auth-map" aria-hidden="true">
      <div className="auth-map-grid" />

      <div className="auth-map-line auth-map-line-sales"><i /></div>
      <div className="auth-map-line auth-map-line-clients"><i /></div>
      <div className="auth-map-line auth-map-line-ops"><i /></div>
      <div className="auth-map-line auth-map-line-result"><i /></div>

      <div className="auth-data-node auth-data-node-sales">
        <span className="auth-data-icon"><Database size={15} /></span>
        <span><strong>Ventas</strong><small>Base de datos</small></span>
        <Check size={13} className="auth-data-check" />
      </div>

      <div className="auth-data-node auth-data-node-clients">
        <span className="auth-data-icon"><FileJson size={15} /></span>
        <span><strong>Clientes</strong><small>API conectada</small></span>
        <Check size={13} className="auth-data-check" />
      </div>

      <div className="auth-data-node auth-data-node-ops">
        <span className="auth-data-icon"><Boxes size={15} /></span>
        <span><strong>Operaciones</strong><small>Datos internos</small></span>
        <Check size={13} className="auth-data-check" />
      </div>

      <div className="auth-map-core">
        <span className="auth-map-core-mark">
          <Image src="/depthloop-icon-v2.png" alt="" width={42} height={42} unoptimized />
        </span>
        <span className="auth-map-core-copy">
          <small>Mapa de empresa</small>
          <strong>Información conectada</strong>
        </span>
        <span className="auth-map-core-status"><i /> Conectado</span>
        <span className="auth-map-core-progress"><i /></span>
        <span className="auth-map-core-meta">Conceptos confirmados</span>
      </div>

      <div className="auth-map-result">
        <span className="auth-map-result-icon"><ShieldCheck size={17} /></span>
        <span><strong>Visión unificada</strong><small>Lista para tu equipo</small></span>
      </div>
    </div>
  );
}
