'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import './items.css';

const API = 'http://localhost:3000/v1/erm-project';

interface Item {
  _id: string;
  code: string;
  name: string;
  unit: string;
  description?: string;
  category?: string;
  status?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    code: '',
    name: '',
    unit: '',
    description: '',
    category: '',
  });

  const [newCategory, setNewCategory] = useState('');

  /* ------------ LOAD DATA (FIXED FORMAT) ------------ */

  const loadItems = async () => {
    const res = await axios.get(`${API}/items`);
    console.log(res);
    
    setItems(Array.isArray(res.data?.data) ? res.data.data : []);
  };

  const loadCategories = async () => {
    const res = await axios.get(`${API}/items/categories/get`);
    console.log(res.data.data);
    
    setCategories(Array.isArray(res.data?.data) ? res.data.data : []);
  };

  useEffect(() => {
    Promise.all([loadItems(), loadCategories()]).finally(() =>
      setLoading(false)
    );
  }, []);

  /* ------------ CREATE CATEGORY ------------ */

  const createCategory = async () => {
    if (!newCategory.trim()) return;

    await axios.post(`${API}/items/categories/create`, {
      name: newCategory,
      status: 'ACTIVE',
    });

    setNewCategory('');
    await loadCategories();
  };

  /* ------------ CREATE ITEM ------------ */

  const createItem = async () => {
    await axios.post(`${API}/items`, form);
    setForm({ code: '', name: '', unit: '', description: '', category: '' });
    await loadItems();
  };

  /* ------------ DELETE ITEM ------------ */

  const deleteItem = async (id: string) => {
    console.log(id);
    
    if (!confirm('Delete this item?')) return;
    await axios.delete(`${API}/items/${id}`);
    await loadItems();
  };

  /* ------------ TOGGLE STATUS ------------ */

  const toggleStatus = async (item: Item) => {
    const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await axios.patch(`${API}/items/${item._id}/status`, { status: newStatus });
    await loadItems();
  };

  if (loading) return <p className="loading">Loading...</p>;

  return (
    <div className="container">
      <h1>Item Management</h1>

      {/* -------- ADD ITEM CARD -------- */}
      <div className="card">
        <h2>Add Item</h2>

        <div className="form-grid">
          <input placeholder="Item Code" value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })} />

          <input placeholder="Item Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <input placeholder="Unit" value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })} />

          <select value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <textarea placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <button className="btn primary" onClick={createItem}>
          Create Item
        </button>
      </div>

      {/* -------- ADD CATEGORY -------- */}
      <div className="card small">
        <h3>Add Category</h3>
        <input
          placeholder="Category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button className="btn secondary" onClick={createCategory}>
          Add Category
        </button>
      </div>

      {/* -------- ITEMS TABLE -------- */}
      <div className="card">
        <h2>Items List</h2>

        {items.length === 0 ? (
          <p>No items found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Unit</th>
                {/* <th>Category</th> */}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>{item.unit}</td>
                  {/* <td>{item.category || '-'}</td> */}
                  <td>
                    <span className={`badge ${item.status?.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn ghost" onClick={() => toggleStatus(item)}>
                      Toggle
                    </button>
                    <button className="btn danger" onClick={() => deleteItem(item._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
