'use client';

import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:3000/v1/erm-project/suppliers';

type Supplier = {
  id?: string;
  _id?: string;
  code?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export default function SupplierForm({ supplier, onSuccess, onCancel }: any) {
  const [form, setForm] = useState<Omit<Supplier, 'code'>>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name ?? '',
        email: supplier.email ?? '',
        phone: supplier.phone ?? '',
        address: supplier.address ?? ''
      });
    } else {
      setForm({ name: '', email: '', phone: '', address: '' });
    }
  }, [supplier]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getId = (s: any) => s?.id || s?._id || '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name) {
      alert('Supplier name is required');
      return;
    }

    setSubmitting(true);
    try {
      const url = supplier ? `${API_BASE}/${getId(supplier)}` : API_BASE;
      const method = supplier ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const json = await res.json();
      if (json?.success) {
        alert(supplier ? 'Supplier updated' : 'Supplier created');
        onSuccess && onSuccess(json.data);
        setForm({ name: '', email: '', phone: '', address: '' });
      } else {
        console.log(json);
        
        alert(json?.metadata?.message || 'Failed to save supplier');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-header">
        <h2>{supplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
        {supplier && (
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      {/* Code shown only in edit mode (read-only) */}
      {supplier?.code && (
        <input value={supplier.code} disabled className="readonly" />
      )}

      <input
        name="name"
        placeholder="Supplier Name"
        value={form.name}
        onChange={handleChange}
        required
      />

      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
      />

      <input
        name="phone"
        placeholder="Phone"
        value={form.phone}
        onChange={handleChange}
      />

      <textarea
        name="address"
        placeholder="Address"
        value={form.address}
        onChange={handleChange}
      />

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : supplier ? 'Update Supplier' : 'Create Supplier'}
        </button>

        {!supplier && (
          <span className="hint">Code will be generated automatically</span>
        )}
      </div>
    </form>
  );
}
