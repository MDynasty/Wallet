import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { kycApi } from '../api/client';

export default function KycPage() {
  const nav = useNavigate();
  const [status, setStatus]       = useState<string>('PENDING');
  const [docType, setDocType]     = useState('PASSPORT');
  const [docNumber, setDocNumber] = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    kycApi.status().then((r) => setStatus(r.data.kycStatus));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await kycApi.submit({ docType, docNumber });
      setStatus((res.data as { kycStatus: string }).kycStatus);
      setSuccess('KYC submitted – under review.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>KYC Verification</h2>
      <p>Current status: <strong>{status}</strong></p>

      {status !== 'APPROVED' && (
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Document type
            <select value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="PASSPORT">Passport</option>
              <option value="NATIONAL_ID">National ID</option>
              <option value="DRIVERS_LICENSE">Driver's License</option>
            </select>
          </label>
          <label>Document number
            <input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} required />
          </label>
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
          <button type="submit" disabled={loading || status === 'SUBMITTED'}>
            {status === 'SUBMITTED' ? 'Already submitted – awaiting review' : loading ? 'Submitting…' : 'Submit KYC'}
          </button>
        </form>
      )}

      <button type="button" className="btn-ghost" onClick={() => nav('/')}>Back</button>
    </div>
  );
}
