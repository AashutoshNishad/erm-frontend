'use client';

import { useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/v1/erm-project/purchase-bill',
});

type PaymentMethod = 'Cash' | 'Bank' | 'UPI' | 'Cheque';

interface Props {
  billId: string;
  supplierId: string;
  balanceAmount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PayBillForm({
  billId,
  supplierId,
  balanceAmount,
  onSuccess,
  onCancel,
}: Props) {
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const submitPayment = async () => {
    if (!amount || amount <= 0) {
      alert('Enter valid amount');
      return;
    }

    if (amount > balanceAmount) {
      alert(`Amount cannot exceed balance ₹${balanceAmount}`);
      return;
    }

    try {
      setLoading(true);

      await api.post(`/${billId}/pay`, {
        // billId,
        amount,
        type: method,
        transactionId,
        note,
      });

      alert('Payment successful');
      onSuccess();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: 16,
        marginTop: 20,
        background: '#fafafa',
      }}
    >
      <h3>Pay Bill</h3>

      <p><b>Balance:</b> ₹ {balanceAmount}</p>

      <div style={{ marginBottom: 8 }}>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <select
          value={method}
          onChange={e => setMethod(e.target.value as PaymentMethod)}
        >
          <option value="Cash">Cash</option>
          <option value="Bank">Bank</option>
          <option value="UPI">UPI</option>
          <option value="Cheque">Cheque</option>
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="Transaction ID (optional)"
          value={transactionId}
          onChange={e => setTransactionId(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <textarea
          placeholder="Note (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      <div>
        <button onClick={submitPayment} disabled={loading}>
          {loading ? 'Processing...' : 'Pay'}
        </button>
        <button
          onClick={onCancel}
          style={{ marginLeft: 8 }}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
