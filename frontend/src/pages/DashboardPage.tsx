import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { accountsApi, transactionsApi } from '../api/client';
import type { Account, Transaction } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [accounts, setAccounts]       = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([accountsApi.list(), transactionsApi.list()])
      .then(([a, t]) => { setAccounts(a.data); setTransactions(t.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="center">Loading…</p>;

  const totalUsd = accounts
    .filter((a) => a.currency === 'USD')
    .reduce((s, a) => s + parseFloat(a.balance), 0);

  return (
    <div className="dashboard">
      <header className="dash-header">
        <h1>💳 Wallet</h1>
        <div className="dash-user">
          <span>👤 {user?.firstName} {user?.lastName}</span>
          <Link to="/kyc" className="pill">KYC: {user?.kycStatus}</Link>
          <button onClick={() => { logout(); nav('/'); }} className="btn-ghost">Sign out</button>
        </div>
      </header>

      <div className="dash-summary">
        <div className="summary-card">
          <span className="summary-label">Total USD balance</span>
          <span className="summary-amount">${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="dash-actions">
          <Link to="/accounts/new" className="btn-primary">＋ New Account</Link>
          <Link to="/transactions/send" className="btn-secondary">↗ Send</Link>
          <Link to="/transactions/exchange" className="btn-secondary">⇄ Exchange</Link>
        </div>
      </div>

      <section className="section">
        <h2>Accounts</h2>
        {accounts.length === 0 ? (
          <p className="empty">No accounts yet. <Link to="/accounts/new">Create one</Link>.</p>
        ) : (
          <div className="card-grid">
            {accounts.map((a) => (
              <div key={a.id} className="account-card">
                <span className="account-label">{a.label}</span>
                <span className="account-currency">{a.currency}</span>
                <span className="account-balance">{a.balance}</span>
                {a.address && <span className="account-address">{a.address.slice(0, 12)}…</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Recent transactions</h2>
        {transactions.length === 0 ? (
          <p className="empty">No transactions yet.</p>
        ) : (
          <table className="txn-table">
            <thead>
              <tr>
                <th>Type</th><th>Amount</th><th>Fee</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 20).map((t) => (
                <tr key={t.id}>
                  <td>{t.type}</td>
                  <td>{t.amount} {t.currency}{t.toAmount ? ` → ${t.toAmount} ${t.toCurrency}` : ''}</td>
                  <td>{t.fee}</td>
                  <td><span className={`status-${t.status.toLowerCase()}`}>{t.status}</span></td>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
