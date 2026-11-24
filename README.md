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

## The dashboard

The default layout mirrors Claude's Personal Finance view: category tracker, top merchants, daily review, spending by category, investments, cash flow, cash and investments, insights, loans and cards, upcoming bills, recent transactions, budget, spending this month and subscriptions. Net worth, net worth over time and income vs spending are available from **Add widget**.

- **Add widget** opens a gallery. Some widgets (like the category tracker) can be added more than once, each with its own settings.
- Drag a card by its handle (⠿) to reorder it, or focus the handle and use Space, arrow keys, Space. Remove a card with ×.
- The layout is saved in the database, so it follows you across devices.

Bills, subscriptions and paychecks are detected from your history (`src/lib/recurring.ts`): the same payee at a steady weekly, biweekly, monthly, quarterly or yearly interval. Insights are plain rules in `insights()` in `src/lib/selectors.ts`; add your own there.

## Adding your own widget

1. Create `src/widgets/MyWidget.tsx`:

   ```tsx
   import { defineWidget, type WidgetProps } from "./types";
   import { totalSpending } from "@/lib/selectors";
   import { money } from "@/lib/format";

   type Settings = { category: string };

   function MyWidget({ data, period, settings }: WidgetProps<Settings>) {
     return <div className="text-2xl font-semibold">{money(totalSpending(data, period, settings.category))}</div>;
   }

   export default defineWidget<Settings>({
     id: "category-total",              // stable id, saved in your layout
     title: (s) => `${s.category} total`,
     description: "Total spent in one category this month.",
     allowMultiple: true,               // optional: can be added more than once
     defaultSettings: { category: "Food and drink" },
     component: MyWidget,
   });
   ```

2. Register it in `src/widgets/registry.ts`. Set `defaultVisible: false` if it should only appear in the gallery.

Widgets receive all data (`accounts`, `transactions`, `budgets`, linked institutions), the current month as `period`, and their own `settings` plus `updateSettings()`. Reusable calculations live in `src/lib/selectors.ts` and `src/lib/recurring.ts`. A widget that throws shows an error in its own card instead of breaking the page.

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
- **Transaction**: positive `amount` = money in, negative = money out. Categories follow Plaid's names (Food and drink, Shopping, Loan payments, …). `Transfer` (card payments, moving money between your own accounts) is excluded from income and spending.
- **Budget**: a monthly limit per category, plus an optional `All spending` limit for the whole month.

Net worth history is reconstructed by walking back from today's balances through your transaction history.

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm run lint`
