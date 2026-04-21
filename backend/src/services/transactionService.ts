import prisma from '../config/prisma';
import { config } from '../config';
import { add, sub, mul, gte } from '../utils/money';

const TXN_STATUS_COMPLETED = 'COMPLETED';
const TXN_STATUS_PENDING   = 'PENDING';
const TXN_TYPE_DEPOSIT   = 'DEPOSIT';
const TXN_TYPE_TRANSFER  = 'TRANSFER';
const TXN_TYPE_EXCHANGE  = 'EXCHANGE';

// ─── helpers ────────────────────────────────────────────────────────────────

function clientError(msg: string) {
  const e = new Error(msg) as Error & { status: number };
  e.status = 400;
  return e;
}

function notFound(msg: string) {
  const e = new Error(msg) as Error & { status: number };
  e.status = 404;
  return e;
}

async function ownsAccount(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw notFound('Account not found or not owned by user');
  return account;
}

// ─── deposit (admin / test endpoint) ────────────────────────────────────────

export async function deposit(userId: string, accountId: string, amount: string) {
  if (!gte(amount, '0.000001')) throw clientError('Amount too small');

  const account = await ownsAccount(userId, accountId);

  const [txn] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        type: TXN_TYPE_DEPOSIT,
        status: TXN_STATUS_COMPLETED,
        toAccountId: accountId,
        amount,
        currency: account.currency,
      },
    }),
    prisma.account.update({
      where: { id: accountId },
      data: { balance: add(account.balance, amount) },
    }),
  ]);

  return txn;
}

// ─── transfer ───────────────────────────────────────────────────────────────

export async function transfer(
  userId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: string,
  note?: string,
) {
  if (!gte(amount, '0.000001')) throw clientError('Amount too small');
  if (fromAccountId === toAccountId) throw clientError('Cannot transfer to the same account');

  const fromAccount = await ownsAccount(userId, fromAccountId);

  const toAccount = await prisma.account.findUnique({ where: { id: toAccountId } });
  if (!toAccount) throw notFound('Destination account not found');

  if (fromAccount.currency !== toAccount.currency) {
    throw clientError('Currency mismatch – use /exchange for cross-currency transfers');
  }

  const fee = mul(amount, config.transferFeePct);
  const totalDebit = add(amount, fee);

  if (!gte(fromAccount.balance, totalDebit)) {
    throw new Error('Insufficient funds');
  }

  const [txn] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        type: TXN_TYPE_TRANSFER,
        status: TXN_STATUS_COMPLETED,
        fromAccountId,
        toAccountId,
        amount,
        currency: fromAccount.currency,
        fee,
        note,
      },
    }),
    prisma.account.update({
      where: { id: fromAccountId },
      data: { balance: sub(fromAccount.balance, totalDebit) },
    }),
    prisma.account.update({
      where: { id: toAccountId },
      data: { balance: add(toAccount.balance, amount) },
    }),
  ]);

  return txn;
}

// ─── exchange ────────────────────────────────────────────────────────────────

/**
 * Swap between a fiat account and a crypto account (or vice-versa).
 * Supported pairs:  USD ↔ ETH  (extend the rate table for more pairs).
 */
export async function exchange(
  userId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: string,         // amount to debit from fromAccount
) {
  if (!gte(amount, '0.000001')) throw clientError('Amount too small');

  const fromAccount = await ownsAccount(userId, fromAccountId);
  const toAccount   = await ownsAccount(userId, toAccountId);

  if (fromAccount.currency === toAccount.currency) {
    throw clientError('Same currency – use /transfer instead');
  }

  // Determine exchange rate  (MVP: USD ↔ ETH only)
  const rate = getExchangeRate(fromAccount.currency, toAccount.currency);

  const fee      = mul(amount, config.exchangeFeePct);
  const netDebit = add(amount, fee);
  const toAmount = mul(sub(amount, fee), rate); // credit amount after fee

  if (!gte(fromAccount.balance, netDebit)) {
    throw new Error('Insufficient funds');
  }

  const [txn] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        type: TXN_TYPE_EXCHANGE,
        status: TXN_STATUS_COMPLETED,
        fromAccountId,
        toAccountId,
        amount,
        currency: fromAccount.currency,
        fee,
        toAmount,
        toCurrency: toAccount.currency,
        exchangeRate: String(rate),
      },
    }),
    prisma.account.update({
      where: { id: fromAccountId },
      data: { balance: sub(fromAccount.balance, netDebit) },
    }),
    prisma.account.update({
      where: { id: toAccountId },
      data: { balance: add(toAccount.balance, toAmount) },
    }),
  ]);

  return txn;
}

// ─── list / get ──────────────────────────────────────────────────────────────

export async function listTransactions(userId: string, accountId?: string) {
  // Verify ownership if filtering by account
  if (accountId) await ownsAccount(userId, accountId);

  const userAccountIds = accountId
    ? [accountId]
    : (await prisma.account.findMany({ where: { userId }, select: { id: true } })).map((a) => a.id);

  return prisma.transaction.findMany({
    where: {
      OR: [
        { fromAccountId: { in: userAccountIds } },
        { toAccountId:   { in: userAccountIds } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function getTransaction(userId: string, txnId: string) {
  const txn = await prisma.transaction.findUnique({ where: { id: txnId } });
  if (!txn) throw notFound('Transaction not found');

  const userAccountIds = (
    await prisma.account.findMany({ where: { userId }, select: { id: true } })
  ).map((a) => a.id);

  const belongs =
    (txn.fromAccountId && userAccountIds.includes(txn.fromAccountId)) ||
    (txn.toAccountId   && userAccountIds.includes(txn.toAccountId));

  if (!belongs) throw notFound('Transaction not found');
  return txn;
}

// ─── rate table ──────────────────────────────────────────────────────────────

function getExchangeRate(from: string, to: string): number {
  const rates: Record<string, number> = {
    'USD/ETH': 1 / config.ethUsdRate,
    'ETH/USD': config.ethUsdRate,
    'EUR/ETH': 1 / (config.ethUsdRate * 0.93),
    'ETH/EUR': config.ethUsdRate * 0.93,
  };
  const key = `${from}/${to}`;
  const rate = rates[key];
  if (!rate) {
    const e = new Error(`Exchange pair ${key} not supported`) as Error & { status: number };
    e.status = 400;
    throw e;
  }
  return rate;
}
