"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { bindWorkspaceToBusiness } from "@/features/ontology-discovery/services/workspaceStore";
import { LocaleProvider, useI18n } from "@/features/i18n";
import { AuthContext } from "../hooks/useAuth";
import { authApi } from "../services/authApi";
import { clearSession, readSession, writeSession, type AuthSession } from "../services/sessionStore";
import { OntologyProvider } from "@/features/ontology-discovery/hooks";
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
        if (/sesión|Inicia sesión|incorrectos|sign in|session/i.test(message)) {
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

  return (
    <LocaleProvider sessionLocale={session?.user.language}>
      <AuthGateBody ready={ready} session={session} accept={accept} logout={logout}>
        {children}
      </AuthGateBody>
    </LocaleProvider>
  );
}

function AuthGateBody({
  ready,
  session,
  accept,
  logout,
  children,
}: {
  ready: boolean;
  session: AuthSession | null;
  accept: (session: AuthSession) => void;
  logout: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();

  if (!ready) {
    return (
      <main className="auth-shell auth-booting" aria-label={t("common.loadingApp")}>
        <span className="auth-boot-mark"><Image src="/nuudo-icon.png" alt="" width={42} height={42} unoptimized /></span>
        <span className="auth-boot-line"><i /></span>
      </main>
    );
  }
  if (!session) return <AuthScreen onAuthed={accept} />;

  return (
    <AuthContext.Provider value={{ session, logout, updateSession: accept }}>
      <OntologyProvider>
        {children}
      </OntologyProvider>
    </AuthContext.Provider>
  );
}

function syncBusiness(session: AuthSession) {
  bindWorkspaceToBusiness(session.business.id);
}
