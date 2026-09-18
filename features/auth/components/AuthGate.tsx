"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { bindWorkspaceToBusiness } from "@/features/ontology-discovery/services/workspaceStore";
import { AuthContext } from "../hooks/useAuth";
import { authApi } from "../services/authApi";
import { clearSession, readSession, writeSession, type AuthSession } from "../services/sessionStore";
import { AuthScreen } from "./AuthScreen";

type Props = { children: ReactNode };

export function AuthGate({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const local = readSession();
    if (!local) {
      setReady(true);
      return;
    }
    let cancelled = false;
    authApi
      .me(local.token)
      .then((fresh) => {
        if (cancelled) return;
        writeSession(fresh);
        syncBusiness(fresh);
        setSession(fresh);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "";
        if (/sesión|Inicia sesión|incorrectos/i.test(message)) {
          clearSession();
          setSession(null);
        } else {
          syncBusiness(local);
          setSession(local);
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const accept = (next: AuthSession) => {
    writeSession(next);
    syncBusiness(next);
    setSession(next);
  };

  const logout = () => {
    clearSession();
    setSession(null);
  };

  if (!ready) {
    return (
      <main className="auth-shell auth-booting" aria-label="Cargando DepthLoop">
        <span className="auth-boot-mark"><Image src="/depthloop-icon-v2.png" alt="" width={42} height={42} unoptimized /></span>
        <span className="auth-boot-line"><i /></span>
      </main>
    );
  }
  if (!session) return <AuthScreen onAuthed={accept} />;

  return <AuthContext.Provider value={{ session, logout, updateSession: accept }}>{children}</AuthContext.Provider>;
}

function syncBusiness(session: AuthSession) {
  bindWorkspaceToBusiness(session.business.id);
}
