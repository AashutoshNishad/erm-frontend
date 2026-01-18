'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import styles from './page.module.css';

const api = axios.create({
  baseURL: 'http://localhost:3000/v1/erm-project/', // change if needed
});

interface PurchaseOrder {
  _id: string;
  supplierName: string;
  date: string;
  totalAmount: number;
  status: string;
}

export default function PurchaseOrderListPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  useEffect(() => {
    api.get('/purchaseOrder').then(res => setOrders(res.data.data));
  }, []);

  return (
    <div className={styles.container}>
      <h1>Purchase Orders</h1>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Supplier</th>
            <th>Status</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order._id}>
              <td>{order.date}</td>
              <td>{order.supplierName}</td>
              <td>{order.status}</td>
              <td>₹ {order.totalAmount}</td>
              <td>
                <Link href={`/erm/view-purchase-orders/${order._id}`}>
                  View Invoice
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
