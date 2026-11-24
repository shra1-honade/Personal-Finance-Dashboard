import "server-only";
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from "plaid/legacy";
import type { AccountBase, Transaction as PlaidTransaction } from "plaid/legacy";
import type { Account, AccountType, Transaction } from "@/lib/types";
import { mapPlaidCategory } from "./plaid-categories";

/**
 * Plaid configuration comes from environment variables (see .env.example):
 *   PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV (sandbox | production)
 * Secrets stay on the server; the browser only ever sees short-lived link tokens.
 */
export function isPlaidConfigured(): boolean {
  return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

export function plaidEnvName(): string {
  const env = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();
  return env === "production" ? "production" : "sandbox";
}

let client: PlaidApi | null = null;
export function plaid(): PlaidApi {
  if (!isPlaidConfigured()) throw new Error("Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET in .env.local.");
  if (!client) {
    client = new PlaidApi(
      new Configuration({
        basePath: PlaidEnvironments[plaidEnvName()],
        baseOptions: {
          headers: {
            "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
            "PLAID-SECRET": process.env.PLAID_SECRET!,
          },
        },
      }),
    );
  }
  return client;
}

/** Turn an axios/Plaid error into a readable message. */
export function plaidErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: { error_code?: string; error_message?: string; display_message?: string } }; message?: string };
  const d = e?.response?.data;
  if (d?.error_code) return `${d.error_code}: ${d.display_message ?? d.error_message ?? ""}`.trim();
  return e?.message ?? "Unknown Plaid error";
}

export function plaidErrorCode(err: unknown): string | undefined {
  return (err as { response?: { data?: { error_code?: string } } })?.response?.data?.error_code;
}

export async function createLinkToken(accessToken?: string): Promise<string> {
  const res = await plaid().linkTokenCreate({
    user: { client_user_id: "self" }, // single-user app
    client_name: "Personal Finance",
    language: "en",
    country_codes: [CountryCode.Us],
    // Update mode (re-authenticate an existing bank) passes the access token instead of products.
    ...(accessToken
      ? { access_token: accessToken }
      : { products: [Products.Transactions], transactions: { days_requested: 730 } }),
    ...(process.env.PLAID_REDIRECT_URI ? { redirect_uri: process.env.PLAID_REDIRECT_URI } : {}),
  });
  return res.data.link_token;
}

export async function exchangePublicToken(publicToken: string) {
  const res = await plaid().itemPublicTokenExchange({ public_token: publicToken });
  return { accessToken: res.data.access_token, itemId: res.data.item_id };
}

function mapAccountType(a: AccountBase): AccountType {
  const sub = (a.subtype ?? "").toString();
  switch (a.type) {
    case "depository":
      return sub === "savings" || sub === "money market" || sub === "cd" || sub === "hsa" ? "savings" : "checking";
    case "credit":
      return "credit";
    case "loan":
      return "loan";
    case "investment":
      if (/crypto/i.test(sub)) return "crypto";
      return /401|403|457|ira|roth|pension|retirement|sep|simple|tsp|keogh/i.test(sub) ? "retirement" : "investment";
    default:
      return "checking";
  }
}

export function mapPlaidAccount(a: AccountBase, itemId: string, institution: string): Account {
  const type = mapAccountType(a);
  const current = a.balances.current ?? a.balances.available ?? 0;
  // Plaid reports what you owe on credit/loan accounts as a positive number.
  const balance = type === "credit" || type === "loan" ? -Math.abs(current) : current;
  return {
    id: a.account_id,
    itemId,
    name: a.name,
    institution,
    type,
    balance,
    mask: a.mask,
    source: "plaid",
  };
}

export function mapPlaidTransaction(t: PlaidTransaction): Transaction {
  return {
    id: t.transaction_id,
    accountId: t.account_id,
    date: t.authorized_date ?? t.date,
    description: t.merchant_name ?? t.name,
    // Plaid: positive = money out. Ours: positive = money in.
    amount: -t.amount,
    category: mapPlaidCategory(t.personal_finance_category?.primary, t.personal_finance_category?.detailed),
    pending: t.pending,
    source: "plaid",
  };
}
