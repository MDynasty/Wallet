import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsApi } from '../api/client';

export default function NewAccountPage() {
  const nav = useNavigate();
  const [type, setType]         = useState<'FIAT' | 'CRYPTO'>('FIAT');
  const [currency, setCurrency] = useState('USD');
  const [label, setLabel]       = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const fiatOptions   = ['USD', 'EUR', 'GBP', 'JPY', 'SGD'];
  const cryptoOptions = ['ETH', 'BTC'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await accountsApi.create({ type, currency, label });
      nav('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const options = type === 'FIAT' ? fiatOptions : cryptoOptions;

  return (
    <div className="auth-container">
      <h2>New Account</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>Account type
          <select value={type} onChange={(e) => { setType(e.target.value as 'FIAT' | 'CRYPTO'); setCurrency(e.target.value === 'FIAT' ? 'USD' : 'ETH'); }}>
            <option value="FIAT">Fiat</option>
            <option value="CRYPTO">Crypto</option>
          </select>
        </label>
        <label>Currency
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {options.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Label
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. My USD Wallet" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create'}</button>
        <button type="button" className="btn-ghost" onClick={() => nav('/')}>Cancel</button>
      </form>
    </div>
  );
}
