# Personal Finance Dashboard

A self-hosted personal finance dashboard: accounts, net worth, cash flow, spending by category, budgets, transactions, and recurring charges. Bank data comes from **Plaid**, CSV exports, or built-in sample data. Every card on the dashboard is a **widget** you can add, remove, and write yourself.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Recharts, and SQLite.

## Quick start

```bash
npm install
cp .env.example .env.local   # then add your Plaid keys
npm run dev                  # http://localhost:3000
```

No Plaid keys yet? Run it anyway and click **Try sample data**.

## Connecting banks with Plaid

1. Create a free account at [dashboard.plaid.com](https://dashboard.plaid.com) and copy your **client ID** and **secret** (Developers → Keys).
2. Put them in `.env.local` as `PLAID_CLIENT_ID` and `PLAID_SECRET`.
3. Start with `PLAID_ENV=sandbox`. Click **Connect a bank**, pick any bank, and log in with `user_good` / `pass_good`. You'll get realistic fake data.
4. For your real accounts, request Production access in the Plaid dashboard, use the production secret, and set `PLAID_ENV=production`. Some banks (e.g. Chase) use OAuth and also need `PLAID_REDIRECT_URI` registered in the dashboard.

How it works:

- The browser only ever sees short-lived Plaid **link tokens**. The long-lived **access tokens** stay on the server, in the SQLite database.
- Transactions are fetched with `/transactions/sync` (cursor-based, so each sync only pulls changes, including pending → posted updates and removals). Balances come from `/accounts/get`.
- Click **Sync now** in the header to refresh. If a bank login expires, **Connections & data** shows a **Fix connection** button (Plaid Link update mode).
- Plaid's categories are mapped to this app's categories in `src/server/plaid-categories.ts`. If you re-categorise a transaction by hand, future syncs keep your choice.

## Keep your data private

- `data/finance.db` holds your bank access tokens and transactions. It's git-ignored; don't share it.
- Set `APP_PASSWORD` in `.env.local` whenever the app is reachable from another machine. Every page and API call then requires that password (HTTP Basic auth, any username).

## Adding your own widget

1. Create `src/widgets/MyWidget.tsx`:

   ```tsx
   import { defineWidget, type WidgetProps } from "./types";
   import { spendingByCategory } from "@/lib/selectors";
   import { money } from "@/lib/format";

   function MyWidget({ data, period }: WidgetProps) {
     const dining = spendingByCategory(data, period).find((r) => r.category === "Dining");
     return <div className="text-2xl font-semibold">{money(dining?.amount ?? 0)}</div>;
   }

   export default defineWidget({
     id: "dining-total",          // stable id, saved in your layout
     title: "Dining out",
     description: "Total spent at restaurants in the selected period.",
     size: "sm",                  // sm | md | lg | full
     usesPeriod: true,            // follows the period picker
     component: MyWidget,
   });
   ```

2. Register it in `src/widgets/registry.ts`.

It appears on the dashboard and in **Customize** (show/hide/reorder, saved per browser). Widgets receive all data (`accounts`, `transactions`, `budgets`, linked institutions) plus the selected period, so they need no fetching of their own. Reusable calculations live in `src/lib/selectors.ts`. A widget that throws shows an error in its own card instead of breaking the page.

## Project layout

```
src/
  app/                 pages (dashboard, transactions, settings) and API routes
    api/plaid/         link-token, exchange, sync, items/[itemId]
  components/          app shell, dashboard grid, customize panel, Plaid Link button, CSV import
  widgets/             one file per widget + registry.ts
  lib/                 types, selectors, dates, formatting, CSV parsing, sample data
  server/              SQLite (db.ts, repo.ts), Plaid client and sync
  proxy.ts             optional password gate
```

## Data model

- **Account**: `type` is checking, savings, credit, investment, retirement, loan, or cash. Liabilities are stored as negative balances.
- **Transaction**: positive `amount` = money in, negative = money out. Category `Transfer` is excluded from income and spending (card payments, moving money between your accounts).
- **Budget**: a monthly limit per category.

Net worth history is reconstructed by walking back from today's balances through your transaction history.

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm run lint`
