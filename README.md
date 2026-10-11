# Pickle

A shared grocery list and expense-splitting app for households. Housemates keep one list, log what they spend, and see where the money goes.

**Live demo:** https://market-app-topaz.vercel.app

## Features

- **Shared shopping list** – household members join with a shared code and add items with quantity, notes and category. Items are marked as bought once they're in the basket.
- **Expense splitting** – whoever does the shopping logs the amount, and the app splits shared costs between members and keeps track of balances.
- **Spending analytics** – a breakdown of spending by category (produce, dairy, cleaning, hygiene and more), so the household can see where the budget goes.
- **Monthly push notifications** – at the end of each month, every member gets a notification on their phone with the household's total spend.
- **Data export** – the household's list, expenses and members can be exported as a JSON backup.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) with [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [PostgreSQL](https://www.postgresql.org) via [Neon](https://neon.tech) (serverless)
- Web Push notifications ([web-push](https://github.com/web-push-libs/web-push))
- Deployed on [Vercel](https://vercel.com)

## Getting started

```bash
git clone https://github.com/bnousi/pickle.git
cd pickle
npm install
```

Create a `.env.local` file in the project root with your Neon database connection string and VAPID keys for push notifications, then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Author

**Barbara Nousi** – [github.com/bnousi](https://github.com/bnousi)
