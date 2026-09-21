"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useLogoUrl } from "@/lib/useLogoUrl";
import { AuthShell } from "@/components/auth/AuthShell";

export default function RecuperarSenhaPage() {
  const logoUrl = useLogoUrl();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/redefinir-senha")}`,
      });

      if (resetError) {
        console.error("Password reset request failed:", resetError);
        setError("Não foi possível enviar o link agora. Tente novamente em instantes.");
        return;
      }

      // Supabase itself never reveals whether the email exists (returns
      // success either way) - the same message covers both cases here,
      // on purpose, to avoid leaking account existence.
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthShell title="Verifique seu e-mail" logoUrl={logoUrl}>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-foreground">
            Se esse e-mail estiver cadastrado, você vai receber um link para redefinir sua senha.
          </p>
          <Link
            href="/login"
            className="mt-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-accent/50"
          >
            Voltar para o login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Esqueci minha senha" subtitle="Enviaremos um link para redefinir sua senha." logoUrl={logoUrl}>
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

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar link"}
        </button>

        <p className="text-center text-xs text-muted">
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Voltar para o login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
