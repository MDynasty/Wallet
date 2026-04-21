# 💳 Wallet

A full-stack payment wallet supporting **fiat currencies** (USD, EUR, GBP, JPY, SGD) and **crypto** (ETH, BTC) — inspired by MetaMask, PayPal, AliPay, and Stripe.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                │
│  Login · Register · Dashboard · Send · Exchange · KYC   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (proxied in dev)
┌────────────────────────▼────────────────────────────────┐
│               Node.js / Express REST API                │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ ┌────────┐  │
│  │   Auth   │ │ Accounts │ │Transactions │ │  KYC   │  │
│  └──────────┘ └──────────┘ └─────────────┘ └────────┘  │
│          ┌────────────────────────────────┐             │
│          │   Prisma ORM  →  SQLite (dev)  │             │
│          │   (swap for PostgreSQL in prod)│             │
│          └────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Backend (`/backend`)
| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express 4 |
| ORM | Prisma 5 (SQLite for dev, PostgreSQL for prod) |
| Auth | JWT (RS256-ready) + bcrypt |
| Security | Helmet, CORS, rate-limiting |
| Logging | Winston |
| Testing | Jest + Supertest (25 tests) |

### Frontend (`/frontend`)
| Layer | Technology |
|---|---|
| Build | Vite 8 |
| Framework | React 19 + TypeScript |
| Routing | React Router v6 |
| HTTP | Axios |

---

## Features

| Feature | Status |
|---|---|
| User registration & login (JWT) | ✅ |
| Fiat wallets: USD, EUR, GBP, JPY, SGD | ✅ |
| Crypto wallets: ETH (on-chain address), BTC | ✅ |
| Deposit funds (test endpoint) | ✅ |
| Internal transfer between accounts | ✅ |
| Fiat ↔ Crypto exchange with fee | ✅ |
| Transaction history | ✅ |
| KYC submission & status | ✅ |
| Fee calculation (0.1% transfer / 0.5% exchange) | ✅ |
| Input validation | ✅ |
| Rate limiting | ✅ |
| Dashboard UI | ✅ |

---

## Quick Start

### Prerequisites
- Node.js ≥ 20

### Backend

```bash
cd backend
cp .env.example .env          # fill JWT_SECRET with a long random string
npm install
npm run db:migrate            # creates SQLite DB + runs migrations
npm run dev                   # starts on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                   # starts on http://localhost:5173 (proxied to :4000)
```

### Tests

```bash
cd backend && npm test        # 25 unit + integration tests
```

---

## API Reference

All protected endpoints require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/auth/register` | `email, password, firstName, lastName` | Create account |
| POST | `/auth/login` | `email, password` | Get JWT |
| GET | `/auth/me` | — | Current user |

### Accounts

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/accounts` | — | List accounts |
| POST | `/accounts` | `type (FIAT\|CRYPTO), currency, label` | Create account |
| GET | `/accounts/:id` | — | Get account |

### Transactions

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/transactions` | `?accountId=` | List transactions |
| GET | `/transactions/:id` | — | Get transaction |
| POST | `/transactions/deposit` | `accountId, amount` | Deposit (test/admin) |
| POST | `/transactions/transfer` | `fromAccountId, toAccountId, amount, note?` | Transfer (same currency) |
| POST | `/transactions/exchange` | `fromAccountId, toAccountId, amount` | Exchange (e.g. USD↔ETH) |

### KYC

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/kyc` | — | KYC status |
| POST | `/kyc/submit` | `docType, docNumber` | Submit documents |

---

## Data Model

```
User
 ├── id, email, passwordHash, firstName, lastName
 ├── kycStatus: PENDING | SUBMITTED | APPROVED | REJECTED
 └── accounts[]

Account
 ├── id, userId, label
 ├── type: FIAT | CRYPTO
 ├── currency: USD | EUR | GBP | JPY | SGD | ETH | BTC
 ├── balance: string (18 d.p. precision)
 └── address?: string (ETH on-chain address)

Transaction
 ├── id, type: DEPOSIT | WITHDRAWAL | TRANSFER | EXCHANGE
 ├── status: PENDING | COMPLETED | FAILED | REVERSED
 ├── fromAccountId?, toAccountId?
 ├── amount, currency, fee
 └── toAmount?, toCurrency?, exchangeRate?  (exchange only)
```

---

## Security Notes

- Passwords are hashed with bcrypt (cost factor 12).
- JWT tokens are signed with `HS256`; swap to `RS256` in production.
- Balance arithmetic uses string-encoded decimals — no float rounding errors.
- All DB mutations inside Prisma transactions — atomic balance updates.
- **Crypto private keys** — this MVP stores only the ETH *address*. In production, private keys **must** be kept in an HSM or key vault (e.g. AWS KMS, HashiCorp Vault).
- KYC review is manual in this MVP; wire up a provider (Jumio, Onfido) for automated checks.

---

## Production Checklist

- [ ] Switch Prisma datasource to PostgreSQL
- [ ] Store secrets in environment vault (AWS Secrets Manager, etc.)
- [ ] Use RS256 JWT with public/private key pair
- [ ] Replace mock exchange rates with a live oracle (CoinGecko, Chainlink)
- [ ] Integrate HSM for crypto key management
- [ ] Add automated KYC/AML provider
- [ ] Add webhook handler for fiat deposits (Stripe, Plaid)
- [ ] Add on-chain transaction broadcasting for crypto withdrawals
- [ ] Enable HTTPS / TLS termination
- [ ] Add 2FA (TOTP / SMS)

