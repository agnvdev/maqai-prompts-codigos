import { getEffectivePaymentConfig, maskSecret } from "@/lib/paymentConfig";
import { PaymentSettingsClient } from "@/components/admin/PaymentSettingsClient";

export default async function AdminPaymentSettingsPage() {
  // requireAdmin() already ran in the parent (protected) layout - this
  // page only ever renders for a logged-in admin.
  //
  // getEffectivePaymentConfig() merges the admin-saved values with the
  // env var fallback, same as checkout/webhook use - so the status
  // shown here always matches what those actually use at request time.
  // Only masked strings and booleans cross into the Client Component
  // below; the real access_token/webhook_secret never leave this
  // server-rendered scope.
  const config = await getEffectivePaymentConfig();

  return (
    <PaymentSettingsClient
      maskedPublicKey={maskSecret(config.publicKey)}
      maskedAccessToken={maskSecret(config.accessToken)}
      maskedWebhookSecret={maskSecret(config.webhookSecret)}
      mercadoPagoConfigured={!!config.publicKey && !!config.accessToken}
      webhookConfigured={!!config.webhookSecret}
    />
  );
}
