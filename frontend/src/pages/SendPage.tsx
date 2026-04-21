import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsApi, transactionsApi } from '../api/client';
import type { Account } from '../api/client';

export default function SendPage() {
  const nav = useNavigate();
  const [accounts, setAccounts]         = useState<Account[]>([]);
  const [fromId, setFromId]             = useState('');
  const [toId, setToId]                 = useState('');
  const [amount, setAmount]             = useState('');
  const [note, setNote]                 = useState('');
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    accountsApi.list().then((r) => {
      setAccounts(r.data);
      if (r.data.length > 0) setFromId(r.data[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await transactionsApi.transfer({ fromAccountId: fromId, toAccountId: toId, amount, note });
      setSuccess('Transfer submitted successfully');
      setAmount(''); setNote(''); setToId('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Send Funds</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>From account
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} required>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.label} ({a.currency} {a.balance})</option>
            ))}
          </select>
        </label>
        <label>Destination account ID
          <input value={toId} onChange={(e) => setToId(e.target.value)} placeholder="UUID of recipient account" required />
        </label>
        <label>Amount
          <input type="number" step="any" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label>Note (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send'}</button>
        <button type="button" className="btn-ghost" onClick={() => nav('/')}>Back</button>
      </form>
    </div>
  );
}
