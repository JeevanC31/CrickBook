/* eslint-disable */
'use client';

import React, { useState, useEffect, useCallback } from 'react';

/* ─── Types ──────────────────────────────────────────────────── */
interface Stats {
  users: number;
  turfBookings: number;
  coachBookings: number;
  orders: number;
  revenue: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  specialization?: string;
  createdAt: string;
  _count: { turfBookings: number; coachBookings: number; orders: number };
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
}

interface Booking {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  user: { name: string; email: string };
  turf: { name: string; location: string };
  createdAt: string;
}

interface CoachBooking {
  id: string;
  status: string;
  sessionTime: string;
  user: { name: string; email: string };
  coach: { name: string; specialty: string };
  createdAt: string;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  deliveryAddress?: string;
  discount?: number;
  couponCode?: string;
  createdAt: string;
  user: { name: string; email: string };
  orderItems: { quantity: number; product: { name: string } }[];
}

/* ─── Helpers ────────────────────────────────────────────────── */
const statusPill = (s: string) => {
  const map: Record<string, string> = {
    CONFIRMED: 'pill-green', PENDING: 'pill-yellow',
    CANCELLED: 'pill-red', SHIPPED: 'pill-blue',
    DELIVERED: 'pill-green', SCHEDULED: 'pill-blue',
    COMPLETED: 'pill-green', USER: 'pill-gray', ADMIN: 'pill-blue',
  };
  return `pill ${map[s] || 'pill-gray'}`;
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

import { useRouter } from 'next/navigation';

/* ─── Main Component ─────────────────────────────────────────── */
export default function AdminPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [coachBookings, setCoachBookings] = useState<CoachBooking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', stock: '', category: '' });

  useEffect(() => {
    const adminStr = localStorage.getItem('cricbook_admin');
    if (!adminStr) {
      router.push('/admin/login');
      return;
    }
    setIsHydrated(true);
  }, [router]);

  /* ── Fetch overview ── */
  const loadOverview = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/stats');
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setRecentUsers(data.recentUsers || []);
      setRecentOrders(data.recentOrders || []);
    }
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/products');
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/bookings');
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  }, []);

  const loadCoachBookings = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/coach-bookings');
    if (res.ok) setCoachBookings(await res.json());
    setLoading(false);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/orders');
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (tab === 'overview') { loadOverview(); }
    else if (tab === 'users') { loadUsers(); }
    else if (tab === 'products') { loadProducts(); }
    else if (tab === 'bookings') { loadBookings(); }
    else if (tab === 'coachBookings') { loadCoachBookings(); }
    else if (tab === 'orders') { loadOrders(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ── Actions ── */
  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user permanently?')) return;
    await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setUsers(u => u.filter(x => x.id !== id));
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setProducts(p => p.filter(x => x.id !== id));
  };

  const updateBookingStatus = async (id: string, status: string) => {
    await fetch('/api/admin/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    setBookings(b => b.map(x => x.id === id ? { ...x, status } : x));
  };

  const updateCoachBookingStatus = async (id: string, status: string) => {
    await fetch('/api/admin/coach-bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    setCoachBookings(b => b.map(x => x.id === id ? { ...x, status } : x));
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    setOrders(o => o.map(x => x.id === id ? { ...x, status } : x));
  };

  const saveProduct = async () => {
    const payload = { name: productForm.name, price: parseFloat(productForm.price), stock: parseInt(productForm.stock), category: productForm.category };
    if (editProduct) {
      const res = await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editProduct.id, ...payload }) });
      if (res.ok) { const updated = await res.json(); setProducts(p => p.map(x => x.id === editProduct.id ? updated : x)); }
    } else {
      const res = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { const created = await res.json(); setProducts(p => [created, ...p]); }
    }
    setShowProductModal(false);
    setEditProduct(null);
    setProductForm({ name: '', price: '', stock: '', category: '' });
  };

  const openEditProduct = (p: Product) => {
    setEditProduct(p);
    setProductForm({ name: p.name, price: String(p.price), stock: String(p.stock), category: p.category || '' });
    setShowProductModal(true);
  };

  const navItems = [
    { id: 'overview', icon: 'fa-chart-pie', label: 'Overview' },
    { id: 'users', icon: 'fa-users', label: 'Users' },
    { id: 'bookings', icon: 'fa-calendar-check', label: 'Turf Bookings' },
    { id: 'coachBookings', icon: 'fa-user-tie', label: 'Coach Bookings' },
    { id: 'products', icon: 'fa-box-open', label: 'Products' },
    { id: 'orders', icon: 'fa-receipt', label: 'Orders' },
  ];

  if (!isHydrated) return null;

  const handleLogout = () => {
    localStorage.removeItem('cricbook_admin');
    router.push('/admin/login');
  };

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="ad-sidebar">
        <div className="ad-sidebar-logo">
          <i className="fa-solid fa-cricket-bat-ball"></i>
          CricBook <span>ADMIN</span>
        </div>
        <ul className="ad-nav">
          {navItems.map(n => (
            <li key={n.id} className={tab === n.id ? 'active' : ''} onClick={() => setTab(n.id)}>
              <i className={`fa-solid ${n.icon}`}></i> {n.label}
            </li>
          ))}
        </ul>
        <div className="ad-sidebar-footer">
          <div className="avatar">A</div>
          <div className="meta">
            <strong>Admin</strong>
            <span>CricBook Platform</span>
          </div>
          <button onClick={handleLogout} title="Logout Admin">
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="ad-main">
        <div className="ad-topbar">
          <h1>{navItems.find(n => n.id === tab)?.label || 'Admin'}</h1>
          <div className="ad-topbar-right">
            <span className="ad-badge"><i className="fa-solid fa-circle" style={{ fontSize: '0.5rem', color: '#34d399' }}></i> Live</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--ad-muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="ad-content">
          {loading ? (
            <div className="ad-loading">
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem' }}></i> Loading data...
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {tab === 'overview' && stats && (
                <div className="animate-in">
                  <div className="ad-stats">
                    <div className="ad-stat-card">
                      <div className="ad-stat-icon green"><i className="fa-solid fa-users"></i></div>
                      <div><div className="ad-stat-label">Total Users</div><div className="ad-stat-value">{stats.users}</div></div>
                    </div>
                    <div className="ad-stat-card">
                      <div className="ad-stat-icon blue"><i className="fa-solid fa-calendar-check"></i></div>
                      <div><div className="ad-stat-label">Turf Bookings</div><div className="ad-stat-value">{stats.turfBookings}</div></div>
                    </div>
                    <div className="ad-stat-card">
                      <div className="ad-stat-icon yellow"><i className="fa-solid fa-user-tie"></i></div>
                      <div><div className="ad-stat-label">Coach Sessions</div><div className="ad-stat-value">{stats.coachBookings}</div></div>
                    </div>
                    <div className="ad-stat-card">
                      <div className="ad-stat-icon red"><i className="fa-solid fa-receipt"></i></div>
                      <div><div className="ad-stat-label">Total Orders</div><div className="ad-stat-value">{stats.orders}</div></div>
                    </div>
                    <div className="ad-stat-card">
                      <div className="ad-stat-icon green"><i className="fa-solid fa-indian-rupee-sign"></i></div>
                      <div><div className="ad-stat-label">Total Revenue</div><div className="ad-stat-value">${stats.revenue.toFixed(2)}</div></div>
                    </div>
                  </div>

                  <div className="ad-grid-2">
                    {/* Recent Users */}
                    <div>
                      <div className="ad-section-header"><h2>Recent Users</h2></div>
                      <div className="ad-table-wrap">
                        <table className="ad-table">
                          <thead><tr><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
                          <tbody>
                            {recentUsers.length === 0 ? (
                              <tr><td colSpan={3}><div className="ad-empty"><i className="fa-solid fa-user-slash"></i>No users yet</div></td></tr>
                            ) : recentUsers.map(u => (
                              <tr key={u.id}>
                                <td><strong>{u.name}</strong></td>
                                <td style={{ color: 'var(--ad-muted)', fontSize: '0.8rem' }}>{u.email}</td>
                                <td style={{ color: 'var(--ad-muted)', fontSize: '0.8rem' }}>{fmt(u.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Recent Orders */}
                    <div>
                      <div className="ad-section-header"><h2>Recent Orders</h2></div>
                      <div className="ad-table-wrap">
                        <table className="ad-table">
                          <thead><tr><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                          <tbody>
                            {recentOrders.length === 0 ? (
                              <tr><td colSpan={3}><div className="ad-empty"><i className="fa-solid fa-receipt"></i>No orders yet</div></td></tr>
                            ) : recentOrders.map(o => (
                              <tr key={o.id}>
                                <td><strong>{o.user.name}</strong></td>
                                <td><strong>${o.totalAmount.toFixed(2)}</strong></td>
                                <td><span className={statusPill(o.status)}>{o.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── USERS ── */}
              {tab === 'users' && (
                <div className="animate-in">
                  <div className="ad-section-header">
                    <h2>{users.length} registered users</h2>
                  </div>
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>Name</th><th>Email</th><th>Role</th>
                          <th>Specialization</th><th>Turfs</th><th>Coaches</th><th>Orders</th>
                          <th>Joined</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr><td colSpan={9}><div className="ad-empty"><i className="fa-solid fa-users-slash"></i>No users found</div></td></tr>
                        ) : users.map(u => (
                          <tr key={u.id}>
                            <td><strong>{u.name}</strong></td>
                            <td style={{ color: 'var(--ad-muted)', fontSize: '0.8rem' }}>{u.email}</td>
                            <td><span className={statusPill(u.role)}>{u.role}</span></td>
                            <td>{u.specialization || '—'}</td>
                            <td>{u._count.turfBookings}</td>
                            <td>{u._count.coachBookings}</td>
                            <td>{u._count.orders}</td>
                            <td style={{ color: 'var(--ad-muted)', fontSize: '0.8rem' }}>{fmt(u.createdAt)}</td>
                            <td>
                              <button className="ad-btn ad-btn-danger ad-btn-sm" onClick={() => deleteUser(u.id)}>
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── BOOKINGS ── */}
              {tab === 'bookings' && (
                <div className="animate-in">
                  <div className="ad-section-header"><h2>{bookings.length} turf bookings</h2></div>
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr><th>User</th><th>Turf</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {bookings.length === 0 ? (
                          <tr><td colSpan={5}><div className="ad-empty"><i className="fa-solid fa-calendar-xmark"></i>No bookings yet</div></td></tr>
                        ) : bookings.map(b => (
                          <tr key={b.id}>
                            <td><strong>{b.user.name}</strong><div style={{ fontSize: '0.75rem', color: 'var(--ad-muted)' }}>{b.user.email}</div></td>
                            <td>{b.turf.name}<div style={{ fontSize: '0.75rem', color: 'var(--ad-muted)' }}>{b.turf.location}</div></td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--ad-muted)' }}>{fmt(b.startTime)}</td>
                            <td><span className={statusPill(b.status)}>{b.status}</span></td>
                            <td>
                              <select
                                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--ad-border)', color: 'var(--ad-text)', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.78rem', cursor: 'pointer' }}
                                value={b.status}
                                onChange={e => updateBookingStatus(b.id, e.target.value)}
                              >
                                <option>CONFIRMED</option>
                                <option>PENDING</option>
                                <option>CANCELLED</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── COACH BOOKINGS ── */}
              {tab === 'coachBookings' && (
                <div className="animate-in">
                  <div className="ad-section-header"><h2>{coachBookings.length} coach bookings</h2></div>
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr><th>User</th><th>Coach</th><th>Date & Time</th><th>Status</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {coachBookings.length === 0 ? (
                          <tr><td colSpan={5}><div className="ad-empty"><i className="fa-solid fa-user-slash"></i>No coach bookings yet</div></td></tr>
                        ) : coachBookings.map(b => (
                          <tr key={b.id}>
                            <td><strong>{b.user.name}</strong><div style={{ fontSize: '0.75rem', color: 'var(--ad-muted)' }}>{b.user.email}</div></td>
                            <td>{b.coach.name}<div style={{ fontSize: '0.75rem', color: 'var(--ad-muted)' }}>{b.coach.specialty}</div></td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--ad-muted)' }}>
                              {new Date(b.sessionTime).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td><span className={statusPill(b.status)}>{b.status}</span></td>
                            <td>
                              <select
                                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--ad-border)', color: 'var(--ad-text)', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.78rem', cursor: 'pointer' }}
                                value={b.status}
                                onChange={e => updateCoachBookingStatus(b.id, e.target.value)}
                              >
                                <option>CONFIRMED</option>
                                <option>PENDING</option>
                                <option>CANCELLED</option>
                                <option>COMPLETED</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── PRODUCTS ── */}
              {tab === 'products' && (
                <div className="animate-in">
                  <div className="ad-section-header">
                    <h2>{products.length} products</h2>
                    <button className="ad-btn ad-btn-primary" onClick={() => { setEditProduct(null); setProductForm({ name: '', price: '', stock: '', category: '' }); setShowProductModal(true); }}>
                      <i className="fa-solid fa-plus"></i> Add Product
                    </button>
                  </div>
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
                      <tbody>
                        {products.length === 0 ? (
                          <tr><td colSpan={5}><div className="ad-empty"><i className="fa-solid fa-box-open"></i>No products yet</div></td></tr>
                        ) : products.map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.name}</strong></td>
                            <td><span className="category-tag" style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{p.category || '—'}</span></td>
                            <td><strong>${p.price.toFixed(2)}</strong></td>
                            <td>
                              <span className={`pill ${p.stock > 10 ? 'pill-green' : p.stock > 0 ? 'pill-yellow' : 'pill-red'}`}>
                                {p.stock} left
                              </span>
                            </td>
                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="ad-btn ad-btn-outline ad-btn-sm" onClick={() => openEditProduct(p)}><i className="fa-solid fa-pen"></i></button>
                              <button className="ad-btn ad-btn-danger ad-btn-sm" onClick={() => deleteProduct(p.id)}><i className="fa-solid fa-trash"></i></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── ORDERS ── */}
              {tab === 'orders' && (
                <div className="animate-in">
                  <div className="ad-section-header"><h2>{orders.length} orders</h2></div>
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead><tr><th>Customer & Address</th><th>Order Items</th><th>Total (Discount)</th><th>Status</th><th>Date</th><th>Update</th></tr></thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr><td colSpan={6}><div className="ad-empty"><i className="fa-solid fa-receipt"></i>No orders yet</div></td></tr>
                        ) : orders.map(o => (
                          <tr key={o.id}>
                            <td>
                              <strong>{o.user.name}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--ad-muted)', marginBottom: '4px' }}>{o.user.email}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--ad-text)', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '4px', maxWidth: '180px' }} title={o.deliveryAddress}>
                                {(() => {
                                  if (!o.deliveryAddress) return <><i className="fa-solid fa-truck" style={{marginRight: '4px'}}></i> N/A</>;
                                  try {
                                    const addr = JSON.parse(o.deliveryAddress);
                                    return (
                                      <>
                                        <div style={{ fontWeight: 'bold', color: '#60a5fa', marginBottom: '2px' }}><i className="fa-solid fa-truck" style={{marginRight: '4px'}}></i> Delivery</div>
                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{addr.street}</div>
                                        <div style={{ color: 'var(--ad-muted)' }}>PIN: {addr.pincode} • <i className="fa-solid fa-phone"></i> {addr.phone}</div>
                                      </>
                                    );
                                  } catch (e) {
                                    return (
                                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        <i className="fa-solid fa-truck" style={{marginRight: '4px'}}></i> {o.deliveryAddress}
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--ad-muted)', maxWidth: '200px' }}>
                              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={o.orderItems.map(i => `${i.product.name} ×${i.quantity}`).join(', ')}>
                                {o.orderItems.map(i => `${i.product.name} ×${i.quantity}`).join(', ')}
                              </div>
                            </td>
                            <td>
                              <strong>${o.totalAmount.toFixed(2)}</strong>
                              {o.discount && o.discount > 0 ? (
                                <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '2px' }}>
                                  -{o.discount}% (Code: {o.couponCode})
                                </div>
                              ) : null}
                            </td>
                            <td><span className={statusPill(o.status)}>{o.status}</span></td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--ad-muted)' }}>{fmt(o.createdAt)}</td>
                            <td>
                              <select
                                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--ad-border)', color: 'var(--ad-text)', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.78rem', cursor: 'pointer' }}
                                value={o.status}
                                onChange={e => updateOrderStatus(o.id, e.target.value)}
                              >
                                <option>PENDING</option>
                                <option>SHIPPED</option>
                                <option>OUT_FOR_DELIVERY</option>
                                <option>DELIVERED</option>
                                <option>CANCELLED</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="ad-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowProductModal(false); }}>
          <div className="ad-modal animate-in">
            <h3>{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <div className="ad-field">
              <label>Product Name</label>
              <input value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. SG English Willow" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="ad-field">
                <label>Price ($)</label>
                <input type="number" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="ad-field">
                <label>Stock</label>
                <input type="number" value={productForm.stock} onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="ad-field">
              <label>Category</label>
              <select value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Select category</option>
                <option>Bat</option>
                <option>Ball</option>
                <option>Protection</option>
                <option>Clothing</option>
                <option>Accessories</option>
              </select>
            </div>
            <div className="ad-modal-footer">
              <button className="ad-btn ad-btn-outline" onClick={() => setShowProductModal(false)}>Cancel</button>
              <button className="ad-btn ad-btn-primary" onClick={saveProduct}>
                <i className="fa-solid fa-save"></i> {editProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
