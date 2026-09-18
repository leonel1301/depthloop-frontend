"use client";

import { useAuthOptional } from "../hooks/useAuth";
import { initials } from "../services/sessionStore";

export function CompanyBrand({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  const auth = useAuthOptional();
  if (!auth) return null;
  const name = auth.session.business.name;
  const logo = auth.session.business.logoUrl;
  return (
    <a className={`company-brand ${compact ? "compact" : ""}`} href={href} aria-label={name} title={name}>
      {logo ? (
        <span className="company-mark">
          <img src={logo} alt="" />
        </span>
      ) : compact ? (
        <span className="company-mark company-mark-initials" aria-hidden="true">{initials(name)}</span>
      ) : null}
      {compact ? null : <strong className="company-name">{name}</strong>}
    </a>
  );
}
