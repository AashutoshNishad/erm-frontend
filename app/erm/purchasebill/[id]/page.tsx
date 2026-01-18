'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';

const api = axios.create({
  baseURL: 'http://localhost:3000/v1/erm-project/',
});

interface BillItem {
  itemId: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface PurchaseBill {
  _id: string;
  billNumber: string;
  billDate: string;
  supplierId: string;
  purchaseOrderId: string;
  items: BillItem[];
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'Unpaid' | 'PartiallyPaid' | 'Paid';
}

interface Payment {
  _id: string;
  amount: number;
  method: string;
  createdAt: string;
}

export default function ViewBillPage() {
  const { id } = useParams();
  const router = useRouter();

  const [bill, setBill] = useState<PurchaseBill | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/purchase-bill/${id}`),
    //   api.get(`/purchase-payments/bill/${id}`),
    ])
      .then(([billRes]) => {
        setBill(billRes.data.data);
        // setPayments(payRes.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading bill...</p>;
  if (!bill) return <p>Bill not found</p>;

  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: 24 }}>
      <h1>Purchase Bill</h1>

      {/* ===== HEADER ===== */}
      <div style={{ marginBottom: 16 }}>
        <p><b>Bill No:</b> {bill.billNumber}</p>
        <p><b>Bill Date:</b> {new Date(bill.billDate).toDateString()}</p>
        <p><b>Status:</b> {bill.status}</p>
      </div>

      {/* ===== ITEMS ===== */}
      <table
        border={1}
        cellPadding={8}
        style={{ width: '100%', borderCollapse: 'collapse' }}
      >
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, i) => (
            <tr key={i}>
              <td>{item.itemId}</td>
              <td>{item.quantity}</td>
              <td>{item.rate}</td>
              <td>{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== TOTALS ===== */}
      <div style={{ marginTop: 16 }}>
        <p>Subtotal: ₹ {bill.subTotal}</p>
        <p>Tax: ₹ {bill.taxAmount}</p>
        <p>Discount: ₹ {bill.discountAmount}</p>
        <h3>Total: ₹ {bill.totalAmount}</h3>
      </div>

      {/* ===== PAYMENT SUMMARY ===== */}
      <div style={{ marginTop: 16 }}>
        <p><b>Paid:</b> ₹ {bill.paidAmount}</p>
        <p><b>Balance:</b> ₹ {bill.balanceAmount}</p>
      </div>

      {/* ===== PAYMENT HISTORY ===== */}
      <div style={{ marginTop: 20 }}>
        <h3>Payment History</h3>
        {payments.length === 0 ? (
          <p>No payments yet</p>
        ) : (
          <ul>
            {payments.map(p => (
              <li key={p._id}>
                {new Date(p.createdAt).toLocaleString()} — ₹{p.amount} ({p.method})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ===== ACTIONS ===== */}
      <div style={{ marginTop: 20 }}>
        <button onClick={() => router.back()}>Back</button>

        {bill.balanceAmount > 0 && (
          <button
            style={{ marginLeft: 8 }}
            onClick={() =>
              router.push(`/purchase-bills/${bill._id}?pay=true`)
            }
          >
            Pay
          </button>
        )}
      </div>
    </div>
  );
}
