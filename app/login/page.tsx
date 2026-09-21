"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useLogoUrl } from "@/lib/useLogoUrl";
import { getSafeRedirect } from "@/lib/safeRedirect";
import { AuthShell } from "@/components/auth/AuthShell";

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const logoUrl = useLogoUrl();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectParam = searchParams.get("redirect");
  const signupHref = redirectParam ? `/cadastro?redirect=${encodeURIComponent(redirectParam)}` : "/cadastro";
  const forgotHref = redirectParam
    ? `/recuperar-senha?redirect=${encodeURIComponent(redirectParam)}`
    : "/recuperar-senha";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        SIGN_IN_TIMEOUT_MS
      );

      if (signInError) {
        if (signInError.code === "email_not_confirmed") {
          setError("Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.");
          return;
        }
        // Supabase intentionally returns the same generic error for a
        // wrong password and for a nonexistent email, to avoid leaking
        // which one it was - this message covers both on purpose.
        setError("E-mail ou senha inválidos.");
        return;
      }

      router.replace(getSafeRedirect(redirectParam));
      router.refresh();
    } catch (err) {
      console.error("Login failed:", err);
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
    <AuthShell title="Entrar na MaqDesk" subtitle="Acesse sua biblioteca de prompts." logoUrl={logoUrl}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="flex items-center justify-between text-xs">
          <Link href={forgotHref} className="text-muted transition-colors hover:text-foreground">
            Esqueci minha senha
          </Link>
          <Link href={signupHref} className="font-semibold text-accent hover:underline">
            Criar conta
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
