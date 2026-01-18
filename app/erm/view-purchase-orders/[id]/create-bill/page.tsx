'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';

const api = axios.create({
  baseURL: 'http://localhost:3000/v1/erm-project/',
});

interface POItem {
  itemId: string;
  name: string;
  rate: number;
  recivedQuantity: number;
  billedQuantity: number;
}

interface PurchaseOrder {
  supplierName: string;
  items: POItem[];
}

export default function CreateBillPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const [billQty, setBillQty] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  /* ================= LOAD PURCHASE ORDER ================= */
  useEffect(() => {
    api.get(`/purchaseOrder/${id}`)
      .then(res => setOrder(res.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  /* ================= BILLABLE ITEMS ================= */
  const billableItems = useMemo(() => {
    if (!order) return [];
    return order.items.filter(
      i => i.recivedQuantity > i.billedQuantity,
    );
  }, [order]);

  /* ================= CREATE BILL ================= */
  const createBill = async () => {
    if (!billNumber) {
      alert('Bill number required');
      return;
    }

    const items = billableItems
      .map(i => ({
        itemId: i.itemId,
        quantity: billQty[i.itemId] || 0,
      }))
      .filter(i => i.quantity > 0);

    if (!items.length) {
      alert('Enter at least one bill quantity');
      return;
    }

    try {
      setSaving(true);

      await api.post('/purchase-bill', {
        purchaseOrderId: id,
        billNumber,
        billDate,
        items,
      });

      alert('Bill created successfully');
      router.push(`/purchase-orders/${id}`);
    } catch (err: any) {
        console.log(err);
      alert(err?.response?.data?.message || 'Failed to create bill');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!order) return <p>Purchase Order not found</p>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: 'auto' }}>
      <h1>Create Purchase Bill</h1>

      <p><b>Supplier:</b> {order.supplierName}</p>

      {/* ===== BILL HEADER ===== */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div>
          <label>Bill Number</label><br />
          <input
            value={billNumber}
            onChange={e => setBillNumber(e.target.value)}
            placeholder="Supplier Invoice No"
          />
        </div>

        <div>
          <label>Bill Date</label><br />
          <input
            type="date"
            value={billDate}
            onChange={e => setBillDate(e.target.value)}
          />
        </div>
      </div>

      {/* ===== ITEMS TABLE ===== */}
      <table
        border={1}
        cellPadding={8}
        style={{ width: '100%', borderCollapse: 'collapse' }}
      >
        <thead>
          <tr>
            <th>Item</th>
            <th>Received</th>
            <th>Billed</th>
            <th>Billable</th>
            <th>Rate</th>
            <th>Bill Qty</th>
          </tr>
        </thead>

        <tbody>
          {billableItems.map(item => {
            const billable =
              item.recivedQuantity - item.billedQuantity;

            return (
              <tr key={item.itemId}>
                <td>{item.name}</td>
                <td>{item.recivedQuantity}</td>
                <td>{item.billedQuantity}</td>
                <td>{billable}</td>
                <td>{item.rate}</td>

                <td>
                  <input
                    type="number"
                    min={0}
                    max={billable}
                    value={billQty[item.itemId] || ''}
                    onChange={e =>
                      setBillQty({
                        ...billQty,
                        [item.itemId]: Number(e.target.value),
                      })
                    }
                    style={{ width: 80 }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ===== ACTIONS ===== */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={createBill}
          disabled={saving}
          style={{
            padding: '10px 18px',
            background: '#16a34a',
            color: '#fff',
            borderRadius: 6,
          }}
        >
          {saving ? 'Creating...' : 'Create Bill'}
        </button>

        <button
          onClick={() => router.back()}
          style={{ marginLeft: 10 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
