// Client-safe: no service-role import here, unlike lib/testAccounts.ts.
// Both server code (lib/testAccounts.ts) and "use client" components
// (TestAccountsClient.tsx, this route's error.tsx) import from this
// file instead of duplicating these as literals in two places.
export const TEST_ADMIN_EMAIL = "admin.teste@maqai.local";
export const TEST_CLIENT_EMAIL = "cliente.teste@maqai.local";
export const TEST_SUBSCRIPTION_ID = "manual_test_cliente_001";

export const TEST_ENV_UNAVAILABLE_MESSAGE =
  "Ambiente de teste indisponível: configuração do servidor ausente";
