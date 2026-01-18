'use client';

import { useEffect, useState } from 'react';
import './suppliers.css';
import SupplierForm from './SupplierForm';

const API_BASE = 'http://localhost:3000/v1/erm-project/suppliers';

type Supplier = {
  id?: string;
  _id?: string;
  code?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [includeInactive, setIncludeInactive] = useState(true); // show inactive in the list
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      // Try to request inactive too. Backend should support ?includeInactive=true
      // If not supported it will likely ignore query and return active only.
      const url = `${API_BASE}${includeInactive ? '?includeInactive=true' : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json && json.success) {
        setSuppliers(json.data || []);
      } else {
        setSuppliers([]);
        const msg = json?.metadata?.message || 'Failed to load suppliers';
        alert(msg);
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error while fetching suppliers');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    // refresh when refreshKey changes (used after actions)
  }, [includeInactive, refreshKey]);

  const getId = (s: Supplier) => s.id || s._id || '';

  const changeStatus = async (s: Supplier, newStatus: string) => {
    const supplierId = getId(s);
    if (!supplierId) return alert('Invalid supplier id');

    const confirmMsg =
      newStatus === 'INACTIVE'
        ? `Are you sure you want to deactivate ${s.name || s.code}?`
        : `Activate ${s.name || s.code}?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_BASE}/${supplierId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json && json.success) {
        // keep item in list but update status locally for snappier UI
        setSuppliers(prev =>
          prev.map(item =>
            getId(item) === supplierId ? { ...item, status: json.data?.status ?? newStatus } : item
          )
        );
        alert('Status updated');
      } else {
        alert(json?.metadata?.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating status');
    }
  };

  const removeSupplier = async (s: Supplier) => {
    const supplierId = getId(s);
    if (!supplierId) return alert('Invalid supplier id');

    if (!confirm(`Permanently delete supplier ${s.name || s.code}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE}/${supplierId}`, {
        method: 'DELETE'
      });
      // many APIs don't support DELETE; handle both patterns
      if (res.status === 204) {
        // no content - removed
        setSuppliers(prev => prev.filter(item => getId(item) !== supplierId));
        alert('Supplier deleted');
        return;
      }
      const json = await res.json();
      if (json && json.success) {
        // backend returned wrapper with deleted item or message
        setSuppliers(prev => prev.filter(item => getId(item) !== supplierId));
        alert('Supplier deleted');
      } else {
        alert(json?.metadata?.message || 'Failed to delete supplier. Maybe DELETE is not supported.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting supplier');
    }
  };

  return (
    <div className="container">
      <h1>Suppliers</h1>

      <div className="controls-row">
        <label>
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={e => setIncludeInactive(e.target.checked)}
          />
          Show inactive suppliers
        </label>

        <button
          className="refresh-btn"
          onClick={() => {
            setRefreshKey(k => k + 1);
          }}
        >
          Refresh
        </button>
      </div>

      <SupplierForm
        key={editingSupplier ? getId(editingSupplier) : 'new'}
        supplier={editingSupplier}
        onSuccess={() => {
          setEditingSupplier(null);
          // refresh list
          setRefreshKey(k => k + 1);
        }}
        onCancel={() => setEditingSupplier(null)}
      />

      {loading ? (
        <p>Loading...</p>
      ) : suppliers.length === 0 ? (
        <p>No suppliers found.</p>
      ) : (
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => {
              const supplierId = getId(s);
              return (
                <tr key={supplierId || Math.random()}>
                  <td>{s.code}</td>
                  <td>{s.name}</td>
                  <td>{s.phone}</td>
                  <td>{s.email}</td>
                  <td>
                    <span className={s.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}>
                      {s.status ?? 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="actions">
                    <button onClick={() => setEditingSupplier(s)}>Edit</button>

                    {s.status === 'ACTIVE' ? (
                      <button className="danger" onClick={() => changeStatus(s, 'INACTIVE')}>
                        Deactivate
                      </button>
                    ) : (
                      <button onClick={() => changeStatus(s, 'ACTIVE')}>Activate</button>
                    )}

                    <button className="danger-outline" onClick={() => removeSupplier(s)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
