"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/lib/plans";

interface MercadoPagoCardTokenParams {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

interface MercadoPagoCardTokenResult {
  id: string;
}

interface MercadoPagoInstance {
  createCardToken(params: MercadoPagoCardTokenParams): Promise<MercadoPagoCardTokenResult>;
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}

const MP_SDK_SRC = "https://sdk.mercadopago.com/js/v2";

// Card data never touches our server - createCardToken() runs entirely
// client-side against Mercado Pago and only the resulting token id is
// sent to /api/checkout/create-subscription. Number/CVV are never
// stored anywhere, not even in this component's own state longer than
// the current render.
export function CheckoutForm({
  plan,
  userEmail,
  userName,
}: {
  plan: Plan;
  userEmail: string | null;
  userName: string | null;
}) {
  const router = useRouter();
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  const mpRef = useRef<MercadoPagoInstance | null>(null);
  // Lazy initial check instead of an effect: if the SDK global already
  // exists (e.g. a prior mount already loaded it), reflect that in the
  // very first render instead of setting state from inside an effect.
  const [sdkReady, setSdkReady] = useState(
    () => typeof window !== "undefined" && !!window.MercadoPago && !!publicKey
  );
  const [sdkError, setSdkError] = useState(!publicKey);

  const [cardholderName, setCardholderName] = useState(userName ?? "");
  const [cardNumber, setCardNumber] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [email] = useState(userEmail ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    if (window.MercadoPago) {
      mpRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${MP_SDK_SRC}"]`);
    const script = existing ?? document.createElement("script");
    if (!existing) {
      script.setAttribute("src", MP_SDK_SRC);
      document.head.appendChild(script);
    }

    function handleLoad() {
      if (!publicKey || !window.MercadoPago) {
        setSdkError(true);
        return;
      }
      mpRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      setSdkReady(true);
    }

    function handleError() {
      setSdkError(true);
    }

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, [publicKey]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || !mpRef.current) return;
    setError(null);
    setLoading(true);

    try {
      const tokenResult = await mpRef.current.createCardToken({
        cardNumber: cardNumber.replace(/\s+/g, ""),
        cardholderName,
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear,
        securityCode,
        identificationType: "CPF",
        identificationNumber: identificationNumber.replace(/\D+/g, ""),
      });

      const res = await fetch("/api/checkout/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.id,
          cardTokenId: tokenResult.id,
          payerEmail: email,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Não foi possível concluir o pagamento. Verifique os dados do cartão.");
        return;
      }

      router.push("/checkout/sucesso");
    } catch (err) {
      console.error("Checkout failed:", err);
      setError("Não foi possível processar o cartão. Confira os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sdkError) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
        O pagamento está temporariamente indisponível. Tente novamente em instantes.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
        Nome no cartão
        <input
          type="text"
          required
          autoComplete="cc-name"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
        Número do cartão
        <input
          type="text"
          inputMode="numeric"
          required
          autoComplete="cc-number"
          maxLength={19}
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
        />
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          Mês
          <input
            type="text"
            inputMode="numeric"
            required
            placeholder="MM"
            maxLength={2}
            autoComplete="cc-exp-month"
            value={expirationMonth}
            onChange={(e) => setExpirationMonth(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          Ano
          <input
            type="text"
            inputMode="numeric"
            required
            placeholder="AAAA"
            maxLength={4}
            autoComplete="cc-exp-year"
            value={expirationYear}
            onChange={(e) => setExpirationYear(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          CVV
          <input
            type="text"
            inputMode="numeric"
            required
            maxLength={4}
            autoComplete="cc-csc"
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
        CPF do titular
        <input
          type="text"
          inputMode="numeric"
          required
          maxLength={14}
          value={identificationNumber}
          onChange={(e) => setIdentificationNumber(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
        />
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading || !sdkReady}
        className="mt-2 rounded-xl bg-accent px-8 py-4 text-sm font-extrabold uppercase tracking-wide text-accent-foreground shadow-[0_0_0_1px_rgba(245,197,24,0.35),0_20px_40px_-16px_rgba(245,197,24,0.45)] transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Processando..." : `Assinar por ${plan.priceLabel}`}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-muted">
        Pagamento processado com segurança pelo Mercado Pago. A MaqDesk nunca armazena os dados do
        seu cartão.
      </p>
    </form>
  );
}
