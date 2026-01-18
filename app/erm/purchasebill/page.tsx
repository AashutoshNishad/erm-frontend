'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const api = axios.create({
  baseURL: 'http://localhost:3000/v1/erm-project/',
});

/* ================= TYPES ================= */

interface PurchaseBill {
  _id: string;
  billNumber: string;
  billDate: string;
  supplierId: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'Unpaid' | 'PartiallyPaid' | 'Paid';
}

/* ================= PAGE ================= */

export default function PurchaseBillsDashboard() {
  const router = useRouter();

  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [loading, setLoading] = useState(true);

  /* Filters */
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  /* ================= LOAD BILLS ================= */
  const loadBills = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchase-bill', {
        params: {
          status,
          fromDate,
          toDate,
        },
      });
      setBills(res.data.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  /* ================= UI ================= */
  return (
    <div style={{ padding: 24 }}>
      <h1>Purchase Bills</h1>

      {/* ===== FILTERS ===== */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Unpaid">Unpaid</option>
          <option value="PartiallyPaid">Partially Paid</option>
          <option value="Paid">Paid</option>
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
        />

        <input
          type="date"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
        />

        <button onClick={loadBills}>Apply</button>
      </div>

      {/* ===== TABLE ===== */}
      {loading ? (
        <p>Loading bills...</p>
      ) : bills.length === 0 ? (
        <p>No bills found</p>
      ) : (
        <table
          border={1}
          cellPadding={8}
          style={{ width: '100%', borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              <th>Bill No</th>
              <th>Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {bills.map(bill => (
              <tr key={bill._id}>
                <td>{bill.billNumber}</td>
                <td>{new Date(bill.billDate).toLocaleDateString()}</td>
                <td>₹ {bill.totalAmount}</td>
                <td>₹ {bill.paidAmount}</td>
                <td>₹ {bill.balanceAmount}</td>
                <td>
                  <span
                    style={{
                      color:
                        bill.status === 'Paid'
                          ? 'green'
                          : bill.status === 'PartiallyPaid'
                          ? 'orange'
                          : 'red',
                    }}
                  >
                    {bill.status}
                  </span>
                </td>

                <td>
                  <button
                    onClick={() =>
                      router.push(`/erm/purchasebill/${bill._id}`)
                    }
                  >
                    View
                  </button>

                  {bill.balanceAmount > 0 && (
                    <button
                      style={{ marginLeft: 6 }}
                      onClick={() =>
                        router.push(`/purchase-bills/${bill._id}`)
                      }
                    >
                      Pay
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
