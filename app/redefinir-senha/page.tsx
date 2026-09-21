"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useLogoUrl } from "@/lib/useLogoUrl";
import { AuthShell } from "@/components/auth/AuthShell";

export default function RedefinirSenhaPage() {
  const logoUrl = useLogoUrl();

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // By the time this page loads, app/auth/callback/route.ts has
    // already exchanged the recovery link's code for a session (cookies
    // are set server-side there) - this just confirms it landed.
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) {
        setHasSession(!!data.user);
        setCheckingSession(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        console.error("Password update failed:", updateError);
        setError("Não foi possível atualizar sua senha. Tente solicitar um novo link.");
        return;
      }

      // The recovery session only exists to make this one change -
      // sign out afterward so the user comes back through a normal login.
      await supabase.auth.signOut();
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <AuthShell title="Redefinir senha" logoUrl={logoUrl}>
        <p className="text-center text-sm text-muted">Carregando...</p>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell title="Senha atualizada" logoUrl={logoUrl}>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-foreground">Sua senha foi atualizada com sucesso.</p>
          <Link
            href="/login"
            className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-all duration-200 hover:brightness-105"
          >
            Voltar para o login
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (!hasSession) {
    return (
      <AuthShell title="Link inválido ou expirado" logoUrl={logoUrl}>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted">Esse link de redefinição não é mais válido. Solicite um novo.</p>
          <Link
            href="/recuperar-senha"
            className="mt-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-accent/50"
          >
            Solicitar novo link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Definir nova senha" logoUrl={logoUrl}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          Nova senha
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          Confirmar nova senha
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </AuthShell>
  );
}
