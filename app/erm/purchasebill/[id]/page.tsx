'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import PayBillForm from './pay/page';

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

interface PaymentHistory {
  _id: string;
  amount: number;
  type: string;
  createdAt: string;
}

export default function ViewBillPage() {
  const { id } = useParams();
  const router = useRouter();

  const [showPayForm, setShowPayForm] = useState(false);
  const [bill, setBill] = useState<PurchaseBill | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBill = async () => {
    const res = await api.get(`/purchase-bill/${id}`);
    setBill(res.data.data);
  };

  const loadPaymentHistory = async () => {
    const res = await api.get(`/purchase-bill/${id}/pay`);
    setPaymentHistory(res.data.data || []);
  };

  useEffect(() => {
    Promise.all([loadBill(), loadPaymentHistory()])
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading bill...</p>;
  if (!bill) return <p>Bill not found</p>;

  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: 24 }}>
      <h1>Purchase Bill</h1>

      {/* HEADER */}
      <div style={{ marginBottom: 16 }}>
        <p><b>Bill No:</b> {bill.billNumber}</p>
        <p><b>Bill Date:</b> {new Date(bill.billDate).toDateString()}</p>
        <p><b>Status:</b> {bill.status}</p>
      </div>

      {/* ITEMS */}
      <table border={1} cellPadding={8} style={{ width: '100%' }}>
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

      {/* TOTALS */}
      <div style={{ marginTop: 16 }}>
        <p>Subtotal: ₹ {bill.subTotal}</p>
        <p>Tax: ₹ {bill.taxAmount}</p>
        <p>Discount: ₹ {bill.discountAmount}</p>
        <h3>Total: ₹ {bill.totalAmount}</h3>
      </div>

      {/* PAYMENT SUMMARY */}
      <div style={{ marginTop: 16 }}>
        <p><b>Paid:</b> ₹ {bill.paidAmount}</p>
        <p><b>Balance:</b> ₹ {bill.balanceAmount}</p>
      </div>

      {/* ACTIONS */}
      <div style={{ marginTop: 20 }}>
        <button onClick={() => router.back()}>Back</button>

        {bill.balanceAmount > 0 && (
          <button
            style={{ marginLeft: 8 }}
            onClick={() => setShowPayForm(true)}
          >
            Pay
          </button>
        )}
      </div>

      {/* PAY FORM */}
      {showPayForm && bill.balanceAmount > 0 && (
        <PayBillForm
          billId={bill._id}
          supplierId={bill.supplierId}
          balanceAmount={bill.balanceAmount}
          onCancel={() => setShowPayForm(false)}
          onSuccess={async () => {
            setShowPayForm(false);
            await Promise.all([loadBill(), loadPaymentHistory()]);
          }}
        />
      )}

      {/* PAYMENT HISTORY */}
      <div style={{ marginTop: 32 }}>
        <h3>Payment History</h3>

        {paymentHistory.length === 0 ? (
          <p>No payments yet</p>
        ) : (
          <table border={1} cellPadding={8} style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map(p => (
                <tr key={p._id}>
                  <td>{new Date(p.createdAt).toLocaleString()}</td>
                  <td>₹ {p.amount}</td>
                  <td>{p.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
