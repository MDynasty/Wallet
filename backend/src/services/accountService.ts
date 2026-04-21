import { ethers } from 'ethers';
import prisma from '../config/prisma';

const SUPPORTED_FIAT    = ['USD', 'EUR', 'GBP', 'JPY', 'SGD'];
const SUPPORTED_CRYPTO  = ['ETH', 'BTC'];

export type AccountType = 'FIAT' | 'CRYPTO';

export async function createAccount(
  userId: string,
  type: AccountType,
  currency: string,
  label: string,
) {
  currency = currency.toUpperCase();

  if (type === 'FIAT' && !SUPPORTED_FIAT.includes(currency)) {
    throw clientError(`Unsupported fiat currency. Supported: ${SUPPORTED_FIAT.join(', ')}`);
  }
  if (type === 'CRYPTO' && !SUPPORTED_CRYPTO.includes(currency)) {
    throw clientError(`Unsupported crypto currency. Supported: ${SUPPORTED_CRYPTO.join(', ')}`);
  }

  let address: string | undefined;
  if (type === 'CRYPTO' && currency === 'ETH') {
    const wallet = ethers.Wallet.createRandom();
    address = wallet.address;
    // NOTE: In production the private key must be stored in an HSM / key vault,
    // never in the application database.
  }

  return prisma.account.create({
    data: { userId, type, currency, label, address },
    select: { id: true, label: true, type: true, currency: true, balance: true, address: true, createdAt: true },
  });
}

export async function listAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId },
    select: { id: true, label: true, type: true, currency: true, balance: true, address: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getAccount(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
    select: { id: true, label: true, type: true, currency: true, balance: true, address: true, createdAt: true },
  });
  if (!account) throw notFound('Account not found');
  return account;
}

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
