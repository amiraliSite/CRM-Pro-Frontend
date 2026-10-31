"use client";

import * as React from "react";
import { useCrmStore, type AuthUser } from "@/lib/crm/store";
import { apiUrl } from "@/lib/api-base";

export const TOKEN_KEY = "crm_token";

export function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function authedFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = getToken();
  return fetch(apiUrl(url), {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}

/** Boots the auth session once on app mount. */
export function useAuthBoot() {
  const { setAuthState, setUser } = useCrmStore();

  React.useEffect(() => {
    let cancelled = false;

    async function boot() {
      const token = getToken();
      if (!token) {
        if (!cancelled) setAuthState("guest");
        return;
      }
      try {
        const res = await fetch(apiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("unauthorized");
        const data = (await res.json()) as { user: AuthUser };
        if (!cancelled) {
          setUser(data.user);
          setAuthState("authed");
        }
      } catch {
        clearToken();
        if (!cancelled) {
          setUser(null);
          setAuthState("guest");
        }
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [setAuthState, setUser]);
}

/** Handles a successful login response. */
export function completeLogin(token: string, user: AuthUser) {
  setToken(token);
  const { setUser, setAuthState } = useCrmStore.getState();
  setUser(user);
  setAuthState("authed");
}

/**
 * Full logout: closes the attendance session (check-out) on the server
 * (best-effort), then clears the local token. After this the guest flow
 * (welcome slides → login) takes over.
 */
export async function requestLogout(): Promise<void> {
  try {
    const token = getToken();
    if (token) {
      await fetch(apiUrl("/api/auth/logout"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        keepalive: true,
      }).catch(() => undefined);
    }
  } finally {
    clearToken();
    const { setUser, setAuthState } = useCrmStore.getState();
    setUser(null);
    setAuthState("guest");
  }
}
