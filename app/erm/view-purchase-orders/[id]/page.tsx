'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import styles from './invoice.module.css';
import { useRouter } from 'next/navigation';

const api = axios.create({
  baseURL: 'http://localhost:3000/v1/erm-project/',
});

interface Item {
  itemId: string;
  name: string;
  quantity: number;        // orderedQty
  recivedQuantity: number; // backend field name (note spelling)
  rate: number;
  amount: number;
}

interface PurchaseOrder {
  supplierName: string;
  date: string;
  items: Item[];
  amount: number;
  discount: number;
  totalAmount: number;
  remark?: string;
}

export default function InvoicePage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);


  

  // input values are stored as strings to allow empty input
  const [receiveQty, setReceiveQty] = useState<Record<string, string>>({});
  // per-item receiving state (prevents duplicate clicks)
  const [receivingMap, setReceivingMap] = useState<Record<string, boolean>>({});
  // audit UI state
  const [auditOpen, setAuditOpen] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<Record<string, any[]>>({});
  const [auditLoadingMap, setAuditLoadingMap] = useState<Record<string, boolean>>({});

  // Fetch PO on mount / id change
  useEffect(() => {
    if (!id) return;

    const ac = new AbortController();
    setLoading(true);
    setPageError(null);

    api.get(`/purchaseOrder/${id}`, { signal: ac.signal })
      .then(res => {
        setOrder(res.data?.data ?? null);
      })
      .catch(err => {
        if (!axios.isCancel(err)) {
          console.error(err);
          setPageError('Failed to load purchase order');
        }
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [id]);

  // Helpers
  const getRemaining = useCallback((item: Item) => {
    return Math.max(0, item.quantity - item.recivedQuantity);
  }, []);

  const isValidQty = useCallback((raw: string, remaining: number) => {
    if (!raw) return false;
    const n = Number(raw);
    if (!Number.isFinite(n)) return false;
    if (!Number.isInteger(n)) return false;
    if (n <= 0) return false;
    if (n > remaining) return false;
    return true;
  }, []);

  // Receive a single item
  const receiveItem = async (item: Item) => {
    const remaining = getRemaining(item);
    const raw = receiveQty[item.itemId] ?? '';
    if (!isValidQty(raw, remaining)) {
      alert(`Enter a valid quantity (1 - ${remaining})`);
      return;
    }

    const qty = Number(raw);

    // prevent duplicate requests for same item
    if (receivingMap[item.itemId]) return;

    // optimistic UI: mark as receiving
    setReceivingMap(prev => ({ ...prev, [item.itemId]: true }));

    try {
      await api.post(`/purchaseOrder/${id}/receive`, {
        itemId: item.itemId,
        quantity: qty,
        receivedBy: 'user_01',
        action: 'RECEIVE',
      });

      // Update local state without reloading
      setOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(i =>
            i.itemId === item.itemId
              ? { ...i, recivedQuantity: i.recivedQuantity + qty }
              : i
          ),
        };
      });

      // clear input for that item
      setReceiveQty(prev => ({ ...prev, [item.itemId]: '' }));

      // optionally refresh audit for this item if opened
      if (auditOpen === item.itemId) {
        // reload audit
        await loadAudit(item.itemId, true);
      }

      alert('Item received successfully');
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message ?? 'Receive failed';
      alert(msg);
    } finally {
      setReceivingMap(prev => ({ ...prev, [item.itemId]: false }));
    }
  };

  // Load audit - `forceReload` will fetch again even if cached
  const loadAudit = async (itemId: string, forceReload = false) => {
    // toggle when data exists and not forced
    if (!forceReload && auditData[itemId]) {
      setAuditOpen(prev => (prev === itemId ? null : itemId));
      return;
    }

    // prevent duplicate loads
    if (auditLoadingMap[itemId]) return;

    setAuditLoadingMap(prev => ({ ...prev, [itemId]: true }));

    try {
      const res = await api.get(`/purchaseOrder/${id}/receive/${itemId}`);
      const data = res.data?.data ?? [];
      setAuditData(prev => ({ ...prev, [itemId]: Array.isArray(data) ? data : [] }));
      setAuditOpen(itemId);
    } catch (err) {
      console.error(err);
      alert('Failed to load audit for item');
    } finally {
      setAuditLoadingMap(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Input change handler (keeps string state)
  const onQtyChange = (itemId: string, value: string) => {
    // allow empty string, or numeric input only (no leading +/-, allow 0 but isValidated later)
    if (value === '' || /^[0-9\b]+$/.test(value)) {
      setReceiveQty(prev => ({ ...prev, [itemId]: value }));
    }
  };

// inside component
const router = useRouter();

const hasBillableItems = order?.items.some(
  (i: any) => i.recivedQuantity > (i.billedQuantity ?? 0)
);

  if (loading) return <p>Loading invoice...</p>;
  if (pageError) return <p>Error: {pageError}</p>;
  if (!order) return <p>Invoice not found</p>;



  return (
    <div className={styles.invoice}>
      <h1>Purchase Invoice</h1>

      <div className={styles.header}>
        <div><strong>Supplier:</strong> {order.supplierName}</div>
        <div><strong>Date:</strong> {order.date}</div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Ordered</th>
            <th>Received</th>
            <th>Remaining</th>
            <th>Rate</th>
            <th>Amount</th>
            <th>Receive Qty</th>
            <th>Action</th>
            <th>Audit</th>
          </tr>
        </thead>

        <tbody>
          {order.items.map(item => {
            const remaining = getRemaining(item);
            const raw = receiveQty[item.itemId] ?? '';
            const valid = isValidQty(raw, remaining);
            const isReceiving = !!receivingMap[item.itemId];
            const isAuditLoading = !!auditLoadingMap[item.itemId];

            return (
              <tr key={item.itemId}>
                <td style={{ textAlign: 'left' }}>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{item.recivedQuantity}</td>
                <td>{remaining}</td>
                <td>{item.rate}</td>
                <td>{item.amount}</td>

                <td>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={remaining > 0 ? `1 - ${remaining}` : '0'}
                    disabled={remaining === 0 || isReceiving}
                    value={raw}
                    onChange={(e) => onQtyChange(item.itemId, e.target.value)}
                    style={{ width: 80, textAlign: 'center' }}
                  />
                </td>

                <td>
                  <button
                    disabled={!valid || remaining === 0 || isReceiving}
                    onClick={() => receiveItem(item)}
                  >
                    {isReceiving ? 'Receiving...' : 'Receive'}
                  </button>
                </td>

                <td>
                  <button
                    onClick={() => loadAudit(item.itemId)}
                    disabled={isAuditLoading}
                  >
                    {isAuditLoading ? 'Loading...' : auditOpen === item.itemId ? 'Hide' : 'View'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* AUDIT PANEL (shows single open item's history) */}
      {auditOpen && (
        <div className={styles.auditBox}>
          <strong>Receive History for {auditOpen}</strong>
          {auditLoadingMap[auditOpen] ? (
            <p>Loading...</p>
          ) : (
            <>
              {auditData[auditOpen]?.length ? (
                <ul>
                  {auditData[auditOpen].map((a, idx) => (
                    <li key={idx}>
                      {new Date(a.createdAt).toLocaleString()} — {a.action} — Qty: {a.quantity}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No audit records</p>
              )}
            </>
          )}
        </div>
      )}

      <div className={styles.summary}>
        <div>Subtotal: ₹ {order.amount}</div>
        <div>Discount: ₹ {order.discount}</div>
        <div className={styles.total}>
          Total: ₹ {order.totalAmount}
        </div>
      </div>


      {order.remark && (
        <div className={styles.remark}>
          <strong>Remark:</strong> {order.remark}
        </div>
      )}


      <div style={{ marginTop: 20 }}>
  <button
    disabled={!hasBillableItems}
    onClick={() => {
      router.push(`/erm/view-purchase-orders/${id}/create-bill`);
    }}
    style={{
      padding: '10px 16px',
      background: hasBillableItems ? '#16a34a' : '#ccc',
      color: '#fff',
      borderRadius: 6,
      cursor: hasBillableItems ? 'pointer' : 'not-allowed',
    }}
  >
    Generate Bill
  </button>

  {!hasBillableItems && (
    <p style={{ fontSize: 12, color: '#666' }}>
      No received items available for billing
    </p>
  )}
</div>
    </div>
  );
}
