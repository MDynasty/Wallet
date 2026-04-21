/**
 * Integration tests for auth + account + transaction flows.
 * Uses an isolated SQLite DB file under /tmp for each test run.
 */
import request from 'supertest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import app from './app';

const TEST_DB = path.join('/tmp', `wallet_test_${Date.now()}.db`);

// Point Prisma at a temporary DB file
process.env.DATABASE_URL = `file:${TEST_DB}`;
process.env.JWT_SECRET = 'test-secret-at-least-64-chars-xxxxxxxxxxxxxxxxxxxxxxxxxx';
process.env.NODE_ENV = 'test';

// Re-import prisma AFTER setting env so it picks up the test URL
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prisma = require('./config/prisma').default;

beforeAll(async () => {
  // Run migrations against the test DB
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: `file:${TEST_DB}` },
    cwd: path.join(__dirname, '../'),
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Auth', () => {
  const USER = { email: 'alice@example.com', password: 'Password1!', firstName: 'Alice', lastName: 'Smith' };
  let token: string;

  test('register', async () => {
    const res = await request(app).post('/auth/register').send(USER);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    token = res.body.token;
  });

  test('register duplicate', async () => {
    const res = await request(app).post('/auth/register').send(USER);
    expect(res.status).toBe(409);
  });

  test('login', async () => {
    const res = await request(app).post('/auth/login').send({ email: USER.email, password: USER.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('login wrong password', async () => {
    const res = await request(app).post('/auth/login').send({ email: USER.email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('get me', async () => {
    // login fresh
    const loginRes = await request(app).post('/auth/login').send({ email: USER.email, password: USER.password });
    token = loginRes.body.token;
    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(USER.email);
  });
});

describe('Accounts + Transactions', () => {
  let token: string;
  let usdAccountId: string;
  let ethAccountId: string;

  beforeAll(async () => {
    const reg = await request(app).post('/auth/register').send({
      email: 'bob@example.com', password: 'Password2!', firstName: 'Bob', lastName: 'Jones',
    });
    token = reg.body.token;
  });

  test('create USD account', async () => {
    const res = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'FIAT', currency: 'USD', label: 'My USD Wallet' });
    expect(res.status).toBe(201);
    expect(res.body.currency).toBe('USD');
    usdAccountId = res.body.id;
  });

  test('create ETH account', async () => {
    const res = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'CRYPTO', currency: 'ETH', label: 'My ETH Wallet' });
    expect(res.status).toBe(201);
    expect(res.body.address).toBeTruthy();
    ethAccountId = res.body.id;
  });

  test('list accounts', async () => {
    const res = await request(app)
      .get('/accounts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('deposit', async () => {
    const res = await request(app)
      .post('/transactions/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ accountId: usdAccountId, amount: '1000' });
    expect(res.status).toBe(201);
  });

  test('balance after deposit', async () => {
    const res = await request(app)
      .get(`/accounts/${usdAccountId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.balance).toBe('1000');
  });

  test('exchange USD → ETH', async () => {
    const res = await request(app)
      .post('/transactions/exchange')
      .set('Authorization', `Bearer ${token}`)
      .send({ fromAccountId: usdAccountId, toAccountId: ethAccountId, amount: '300' });
    expect(res.status).toBe(201);
    expect(res.body.toCurrency).toBe('ETH');
  });

  test('transfer – same account rejected', async () => {
    const res = await request(app)
      .post('/transactions/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({ fromAccountId: usdAccountId, toAccountId: usdAccountId, amount: '9999999' });
    expect(res.status).toBe(400);
  });

  test('list transactions', async () => {
    const res = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});

describe('KYC', () => {
  let token: string;

  beforeAll(async () => {
    const reg = await request(app).post('/auth/register').send({
      email: 'carol@example.com', password: 'Password3!', firstName: 'Carol', lastName: 'White',
    });
    token = reg.body.token;
  });

  test('get initial status', async () => {
    const res = await request(app).get('/kyc').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.kycStatus).toBe('PENDING');
  });

  test('submit KYC', async () => {
    const res = await request(app)
      .post('/kyc/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ docType: 'PASSPORT', docNumber: 'P12345678' });
    expect(res.status).toBe(200);
    expect(res.body.kycStatus).toBe('SUBMITTED');
  });
});
