"use client";

import { createContext, useContext } from "react";
import type { AuthSession } from "../services/sessionStore";

type AuthContextValue = {
  session: AuthSession;
  logout: () => void;
  updateSession: (session: AuthSession) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth requiere AuthGate");
  return value;
}

export function useAuthOptional() {
  return useContext(AuthContext);
}
