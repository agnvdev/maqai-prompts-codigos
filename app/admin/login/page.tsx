"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getActiveLpMediaMap } from "@/lib/supabase/lpMedia";
import { Brand } from "@/components/ui/Brand";

const SIGN_IN_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("SIGN_IN_TIMEOUT")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    // This page renders before the admin auth guard, so a client-side
    // fetch of the (public, is_active-only) lp_media row is simplest -
    // no need to touch the protected layout's server-side auth flow.
    let cancelled = false;
    getActiveLpMediaMap("logo")
      .then((map) => {
        if (!cancelled) setLogoUrl(map.Logo);
      })
      .catch((err) => console.error("Failed to load logo media:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        SIGN_IN_TIMEOUT_MS
      );

      if (signInError) {
        setError("E-mail ou senha inválidos.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      console.error("Admin login failed:", err);
      const timedOut = err instanceof Error && err.message === "SIGN_IN_TIMEOUT";
      setError(
        timedOut
          ? "A autenticação demorou demais para responder. Verifique sua conexão e tente novamente."
          : "Não foi possível conectar ao serviço de autenticação. Tente novamente em instantes."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-card"
      >
        <div className="flex items-center gap-3">
          <Brand logoUrl={logoUrl} />
          <span className="text-sm font-bold text-foreground">Admin</span>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          Senha
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
