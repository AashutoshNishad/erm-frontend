'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './page.module.css';

/* ================= API CONFIG ================= */

const api = axios.create({
  baseURL: 'http://localhost:3000/v1/erm-project', // 🔁 change if backend uses different port
});

const SUPPLIER_API = '/suppliers';
const ITEM_API = '/items';
const PURCHASE_ORDER_API = '/purchaseOrder';

/* ================= TYPES ================= */

interface Supplier {
  _id: string;
  name: string;
}

interface Item {
  _id: string;
  name: string;
  rate: number;
}

interface PurchaseItem {
  itemId: string;
  name: string;
  quantity: number;
  rate: number;
  discount?: number;
  remark?: string;
}

/* ================= PAGE ================= */

export default function PurchaseOrderPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [itemsMaster, setItemsMaster] = useState<Item[]>([]);

  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [date, setDate] = useState('');
  const [discount, setDiscount] = useState(0);
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);

  /* ========== LOAD SUPPLIERS & ITEMS ========== */
  useEffect(() => {
    api.get(SUPPLIER_API).then(res => setSuppliers(res.data.data));
    api.get(ITEM_API).then(res => setItemsMaster(res.data.data));
  }, []);

  /* ========== ITEM HANDLERS (SAFE) ========== */

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { itemId: '', name: '', quantity: 1, rate: 0 },
    ]);
  };

  const updateItem = (
    index: number,
    field: keyof PurchaseItem,
    value: any,
  ) => {
    setItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  /* ========== SUBMIT ========== */

  const submit = async () => {
    const payload = {
      supplierId,
      supplierName,
      date,
      items,
      discount,
      remark,
    };

    console.log('Payload:', payload); // 🔍 debug

    await api.post(PURCHASE_ORDER_API, payload);
    alert('Purchase Order Created');
  };

  /* ========== UI ========== */

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create Purchase Order</h1>

      {/* Supplier */}
      <div className={styles.field}>
        <label>Supplier</label>
        <select
          value={supplierId}
          onChange={(e) => {
            const s = suppliers.find(x => x._id === e.target.value);
            setSupplierId(s?._id || '');
            setSupplierName(s?.name || '');
          }}
        >
          <option value="">Select Supplier</option>
          {suppliers.map(s => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div className={styles.field}>
        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      <h2 className={styles.subTitle}>Items</h2>

      {items.map((item, index) => (
        <div key={index} className={styles.itemRow}>
          <select
            value={item.itemId}
            onChange={(e) => {
              const it = itemsMaster.find(i => i._id === e.target.value);
              updateItem(index, 'itemId', it?._id || '');
              updateItem(index, 'name', it?.name || '');
              updateItem(index, 'rate', it?.rate || 0);
            }}
          >
            <option value="">Item</option>
            {itemsMaster.map(i => (
              <option key={i._id} value={i._id}>
                {i.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={0}
            placeholder="Qty"
            value={item.quantity}
            onChange={e =>
              updateItem(index, 'quantity', Number(e.target.value))
            }
          />

          <input
            type="number"
            min={0}
            placeholder="Rate"
            value={item.rate}
            onChange={e =>
              updateItem(index, 'rate', Number(e.target.value))
            }
          />

          <input
            type="number"
            min={0}
            placeholder="Discount"
            value={item.discount || ''}
            onChange={e =>
              updateItem(index, 'discount', Number(e.target.value))
            }
          />

          <button
            className={styles.removeBtn}
            onClick={() => removeItem(index)}
          >
            ✕
          </button>
        </div>
      ))}

      <button className={styles.addBtn} onClick={addItem}>
        + Add Item
      </button>

      {/* Purchase Discount */}
      <div className={styles.field}>
        <label>Purchase Discount</label>
        <input
          type="number"
          min={0}
          value={discount}
          onChange={e => setDiscount(Number(e.target.value))}
        />
      </div>

      {/* Remark */}
      <div className={styles.field}>
        <label>Remark</label>
        <textarea
          value={remark}
          onChange={e => setRemark(e.target.value)}
        />
      </div>

      <button className={styles.submitBtn} onClick={submit}>
        Save Purchase Order
      </button>
    </div>
  );
}
