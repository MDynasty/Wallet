import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsApi, transactionsApi } from '../api/client';
import type { Account } from '../api/client';

export default function ExchangePage() {
  const nav = useNavigate();
  const [accounts, setAccounts]   = useState<Account[]>([]);
  const [fromId, setFromId]       = useState('');
  const [toId, setToId]           = useState('');
  const [amount, setAmount]       = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    accountsApi.list().then((r) => {
      setAccounts(r.data);
      if (r.data.length > 1) { setFromId(r.data[0].id); setToId(r.data[1].id); }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await transactionsApi.exchange({ fromAccountId: fromId, toAccountId: toId, amount });
      setSuccess(`Exchanged ${res.data.amount} ${res.data.currency} → ${res.data.toAmount} ${res.data.toCurrency}`);
      setAmount('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Exchange failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Exchange</h2>
      <p className="hint">Swap between fiat and crypto (e.g. USD ↔ ETH). A 0.5% fee applies.</p>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>From account
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} required>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.label} ({a.currency} {a.balance})</option>
            ))}
          </select>
        </label>
        <label>To account
          <select value={toId} onChange={(e) => setToId(e.target.value)} required>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.label} ({a.currency} {a.balance})</option>
            ))}
          </select>
        </label>
        <label>Amount to convert
          <input type="number" step="any" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Exchanging…' : 'Exchange'}</button>
        <button type="button" className="btn-ghost" onClick={() => nav('/')}>Back</button>
      </form>
    </div>
  );
}
