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

interface RevenueBreakdown {
  turf: number;
  coach: number;
  match: number;
  shop: number;
  total: number;
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
  imageUrl?: string;
  imageUrls?: string;
}

interface Category {
  id: string;
  name: string;
}

interface AdminTurf {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
  netsAvailable: number;
  imageUrl?: string;
}

interface AdminCoach {
  id: string;
  name: string;
  specialty: string;
  pricePerSession: number;
  rating: number;
  imageUrl?: string;
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

interface AdminMatch {
  id: string;
  title: string;
  stadiumName: string;
  location: string;
  startTime: string;
  endTime: string;
  pricePerPlayer: number;
  maxCapacity: number;
  status: string;
  players: { role: string; user: { name: string; email: string; phone?: string } }[];
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
  const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || '';
  const MATCH_URL = process.env.NEXT_PUBLIC_MATCH_URL || '';
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [coachBookings, setCoachBookings] = useState<CoachBooking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', stock: '', category: '', description: '' });
  const [productImageUrls, setProductImageUrls] = useState<string[]>([]);
  const [productUploadLoading, setProductUploadLoading] = useState(false);
  const [matchForm, setMatchForm] = useState({ title: '', stadiumName: '', location: '', weather: '', stadiumStats: '', umpireList: '', pricePerPlayer: '', maxCapacity: '26', startTime: '', endTime: '' });
  const [viewPlayersMatch, setViewPlayersMatch] = useState<AdminMatch | null>(null);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);

  // Turfs
  const [adminTurfs, setAdminTurfs] = useState<AdminTurf[]>([]);
  const [showTurfModal, setShowTurfModal] = useState(false);
  const [editTurf, setEditTurf] = useState<AdminTurf | null>(null);
  const [turfForm, setTurfForm] = useState({ name: '', location: '', pricePerHour: '', netsAvailable: '2', imageUrl: '' });
  const [turfUploadLoading, setTurfUploadLoading] = useState(false);

  // Coaches
  const [adminCoaches, setAdminCoaches] = useState<AdminCoach[]>([]);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [editCoach, setEditCoach] = useState<AdminCoach | null>(null);
  const [coachForm, setCoachForm] = useState({ name: '', specialty: '', pricePerSession: '', rating: '4.5', imageUrl: '' });
  const [coachUploadLoading, setCoachUploadLoading] = useState(false);

  // Match inline price edit
  const [editMatchPriceId, setEditMatchPriceId] = useState<string | null>(null);
  const [editMatchPriceVal, setEditMatchPriceVal] = useState('');

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
    const res = await fetch(`${ADMIN_URL}/admin/stats`);
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setRevenueBreakdown(data.revenueBreakdown || null);
      setRecentUsers(data.recentUsers || []);
      setRecentOrders(data.recentOrders || []);
    }
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${ADMIN_URL}/admin/users`);
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${ADMIN_URL}/admin/products`);
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${ADMIN_URL}/admin/bookings`);
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  }, []);

  const loadCoachBookings = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${ADMIN_URL}/admin/coach-bookings`);
    if (res.ok) setCoachBookings(await res.json());
    setLoading(false);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${ADMIN_URL}/admin/orders`);
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, []);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${ADMIN_URL}/admin/matches`);
    if (res.ok) setMatches(await res.json());
    setLoading(false);
  }, []);

  const loadCategories = useCallback(async () => {
    const res = await fetch(`${ADMIN_URL}/admin/categories`);
    if (res.ok) setCategories(await res.json());
  }, []);

  const loadAdminTurfs = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${ADMIN_URL}/admin/turfs`);
    if (res.ok) setAdminTurfs(await res.json());
    setLoading(false);
  }, []);

  const loadAdminCoaches = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${ADMIN_URL}/admin/coaches`);
    if (res.ok) setAdminCoaches(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'overview') { loadOverview(); }
    else if (tab === 'users') { loadUsers(); }
    else if (tab === 'products') { loadProducts(); loadCategories(); }
    else if (tab === 'bookings') { loadBookings(); }
    else if (tab === 'coachBookings') { loadCoachBookings(); }
    else if (tab === 'orders') { loadOrders(); }
    else if (tab === 'matches') { loadMatches(); }
    else if (tab === 'adminTurfs') { loadAdminTurfs(); }
    else if (tab === 'adminCoaches') { loadAdminCoaches(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ── Actions ── */
  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user permanently?')) return;
    await fetch(`${ADMIN_URL}/admin/users`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setUsers(u => u.filter(x => x.id !== id));
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`${ADMIN_URL}/admin/products`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setProducts(p => p.filter(x => x.id !== id));
  };

  const updateBookingStatus = async (id: string, status: string) => {
    await fetch(`${ADMIN_URL}/admin/bookings`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    setBookings(b => b.map(x => x.id === id ? { ...x, status } : x));
  };

  const updateCoachBookingStatus = async (id: string, status: string) => {
    await fetch(`${ADMIN_URL}/admin/coach-bookings`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    setCoachBookings(b => b.map(x => x.id === id ? { ...x, status } : x));
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await fetch(`${ADMIN_URL}/admin/orders`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    setOrders(o => o.map(x => x.id === id ? { ...x, status } : x));
  };

  /* ── Image Upload Helper ── */
  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${ADMIN_URL}/upload`, { method: 'POST', body: fd });
    if (res.ok) { const d = await res.json(); return d.url; }
    return null;
  };

  /* ── Product image multi-upload ── */
  const handleProductImages = async (files: FileList) => {
    setProductUploadLoading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    setProductImageUrls(prev => [...prev, ...urls]);
    setProductUploadLoading(false);
  };

  const saveProduct = async () => {
    const firstImg = productImageUrls[0] || '';
    const allImgs = JSON.stringify(productImageUrls);
    const payload = {
      name: productForm.name,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock),
      category: productForm.category,
      description: productForm.description,
      imageUrl: firstImg,
      imageUrls: allImgs,
    };
    if (editProduct) {
      const res = await fetch(`${ADMIN_URL}/admin/products`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editProduct.id, ...payload }) });
      if (res.ok) { const updated = await res.json(); setProducts(p => p.map(x => x.id === editProduct.id ? updated : x)); }
    } else {
      const res = await fetch(`${ADMIN_URL}/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { const created = await res.json(); setProducts(p => [created, ...p]); }
    }
    setShowProductModal(false);
    setEditProduct(null);
    setProductForm({ name: '', price: '', stock: '', category: '', description: '' });
    setProductImageUrls([]);
  };

  const openEditProduct = (p: Product) => {
    setEditProduct(p);
    setProductForm({ name: p.name, price: String(p.price), stock: String(p.stock), category: p.category || '', description: '' });
    try { setProductImageUrls(JSON.parse(p.imageUrls || '[]')); } catch { setProductImageUrls(p.imageUrl ? [p.imageUrl] : []); }
    setShowProductModal(true);
  };

  /* ── Category actions ── */
  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    const res = await fetch(`${ADMIN_URL}/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategoryName.trim() }) });
    if (res.ok) { const cat = await res.json(); setCategories(prev => [...prev, cat]); setNewCategoryName(''); }
    else { const e = await res.json(); alert(e.error); }
  };

  const deleteCategory = async (id: string) => {
    await fetch(`${ADMIN_URL}/admin/categories`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  /* ── Turf actions ── */
  const handleTurfImage = async (file: File) => {
    setTurfUploadLoading(true);
    const url = await uploadImage(file);
    if (url) setTurfForm(f => ({ ...f, imageUrl: url }));
    setTurfUploadLoading(false);
  };

  const openEditTurf = (t: AdminTurf) => {
    setEditTurf(t);
    setTurfForm({ name: t.name, location: t.location, pricePerHour: String(t.pricePerHour), netsAvailable: String(t.netsAvailable), imageUrl: t.imageUrl || '' });
    setShowTurfModal(true);
  };

  const saveTurf = async () => {
    if (editTurf) {
      const res = await fetch(`${ADMIN_URL}/admin/turfs`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editTurf.id, ...turfForm }) });
      if (res.ok) { const t = await res.json(); setAdminTurfs(prev => prev.map(x => x.id === editTurf.id ? t : x)); }
    } else {
      const res = await fetch(`${ADMIN_URL}/admin/turfs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(turfForm) });
      if (res.ok) { const t = await res.json(); setAdminTurfs(prev => [t, ...prev]); }
    }
    setShowTurfModal(false);
    setEditTurf(null);
    setTurfForm({ name: '', location: '', pricePerHour: '', netsAvailable: '2', imageUrl: '' });
  };

  const deleteTurf = async (id: string) => {
    if (!confirm('Delete this turf? All bookings will be lost.')) return;
    await fetch(`${ADMIN_URL}/admin/turfs?id=${id}`, { method: 'DELETE' });
    setAdminTurfs(prev => prev.filter(t => t.id !== id));
  };

  /* ── Coach actions ── */
  const handleCoachImage = async (file: File) => {
    setCoachUploadLoading(true);
    const url = await uploadImage(file);
    if (url) setCoachForm(f => ({ ...f, imageUrl: url }));
    setCoachUploadLoading(false);
  };

  const openEditCoach = (c: AdminCoach) => {
    setEditCoach(c);
    setCoachForm({ name: c.name, specialty: c.specialty, pricePerSession: String(c.pricePerSession), rating: String(c.rating), imageUrl: c.imageUrl || '' });
    setShowCoachModal(true);
  };

  const saveCoach = async () => {
    if (editCoach) {
      const res = await fetch(`${ADMIN_URL}/admin/coaches`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editCoach.id, ...coachForm }) });
      if (res.ok) { const c = await res.json(); setAdminCoaches(prev => prev.map(x => x.id === editCoach.id ? c : x)); }
    } else {
      const res = await fetch(`${ADMIN_URL}/admin/coaches`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(coachForm) });
      if (res.ok) { const c = await res.json(); setAdminCoaches(prev => [c, ...prev]); }
    }
    setShowCoachModal(false);
    setEditCoach(null);
    setCoachForm({ name: '', specialty: '', pricePerSession: '', rating: '4.5', imageUrl: '' });
  };

  const deleteCoach = async (id: string) => {
    if (!confirm('Delete this coach? All bookings will be lost.')) return;
    await fetch(`${ADMIN_URL}/admin/coaches?id=${id}`, { method: 'DELETE' });
    setAdminCoaches(prev => prev.filter(c => c.id !== id));
  };

  /* ── Match price inline edit ── */
  const saveMatchPrice = async (id: string) => {
    const price = parseFloat(editMatchPriceVal);
    if (isNaN(price) || price < 0) return;
    const res = await fetch(`${ADMIN_URL}/admin/matches`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, pricePerPlayer: price }) });
    if (res.ok) {
      setMatches(prev => prev.map(m => m.id === id ? { ...m, pricePerPlayer: price } : m));
    }
    setEditMatchPriceId(null);
    setEditMatchPriceVal('');
  };

  const navItems = [
    { id: 'overview',      icon: 'fa-chart-pie',      label: 'Overview' },
    { id: 'users',         icon: 'fa-users',           label: 'Users' },
    { id: 'bookings',      icon: 'fa-calendar-check', label: 'Turf Bookings' },
    { id: 'coachBookings', icon: 'fa-user-tie',        label: 'Coach Bookings' },
    { id: 'products',      icon: 'fa-box-open',        label: 'Products' },
    { id: 'orders',        icon: 'fa-receipt',         label: 'Orders' },
    { id: 'matches',       icon: 'fa-trophy',          label: 'Matches' },
    { id: 'adminTurfs',    icon: 'fa-cricket-bat-ball',label: 'Manage Turfs' },
    { id: 'adminCoaches',  icon: 'fa-person-running',  label: 'Manage Coaches' },
  ];

  const deleteMatch = async (id: string) => {
    if (!confirm('Delete this match completely? This drops all enrolled players!')) return;
    await fetch(`${ADMIN_URL}/admin/matches?id=` + id, { method: 'DELETE' });
    setMatches(m => m.filter(x => x.id !== id));
  };

  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${MATCH_URL}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...matchForm,
        startTime: new Date(matchForm.startTime).toISOString(),
        endTime: new Date(matchForm.endTime).toISOString(),
        pricePerPlayer: parseFloat(matchForm.pricePerPlayer),
        maxCapacity: parseInt(matchForm.maxCapacity)
      })
    });
    setShowMatchModal(false);
    setMatchForm({ title: '', stadiumName: '', location: '', weather: '', stadiumStats: '', umpireList: '', pricePerPlayer: '', maxCapacity: '26', startTime: '', endTime: '' });
    loadMatches();
  };

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
                      <div><div className="ad-stat-label">Total Revenue</div><div className="ad-stat-value">₹{stats.revenue.toFixed(2)}</div></div>
                    </div>
                  </div>

                  {/* ── Revenue Pie Chart ── */}
                  {revenueBreakdown && revenueBreakdown.total > 0 && (() => {
                    const slices = [
                      { label: 'Turf Bookings',  value: revenueBreakdown.turf,  color: '#3b82f6', icon: 'fa-cricket-bat-ball' },
                      { label: 'Coach Sessions', value: revenueBreakdown.coach, color: '#a855f7', icon: 'fa-user-tie' },
                      { label: 'Match Entries',  value: revenueBreakdown.match, color: '#f59e0b', icon: 'fa-trophy' },
                      { label: 'Shop Orders',    value: revenueBreakdown.shop,  color: '#10b981', icon: 'fa-box-open' },
                    ].filter(s => s.value > 0);
                    const total = revenueBreakdown.total;
                    const SIZE = 200, CX = 100, CY = 100, R = 80, GAP = 0.03;
                    let cumAngle = -Math.PI / 2;
                    const paths = slices.map(s => {
                      const frac = s.value / total;
                      const sweep = frac * 2 * Math.PI - GAP;
                      const startA = cumAngle + GAP / 2;
                      const endA = startA + sweep;
                      const x1 = CX + R * Math.cos(startA), y1 = CY + R * Math.sin(startA);
                      const x2 = CX + R * Math.cos(endA),   y2 = CY + R * Math.sin(endA);
                      const large = sweep > Math.PI ? 1 : 0;
                      const midA = startA + sweep / 2;
                      const lx = CX + (R + 18) * Math.cos(midA), ly = CY + (R + 18) * Math.sin(midA);
                      const d = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
                      cumAngle += frac * 2 * Math.PI;
                      return { ...s, d, pct: (frac * 100).toFixed(1), lx, ly };
                    });
                    return (
                      <div className="ad-revenue-chart-wrap">
                        <div className="ad-section-header" style={{ marginBottom: '1.25rem' }}>
                          <h2>Revenue Breakdown</h2>
                          <span style={{ color: 'var(--ad-muted)', fontSize: '0.85rem' }}>All sources combined</span>
                        </div>
                        <div className="ad-revenue-chart-body">
                          {/* SVG Donut */}
                          <div className="ad-pie-wrap">
                            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="220" height="220">
                              {paths.map((s, i) => (
                                <path key={i} d={s.d} fill={s.color} opacity="0.9"
                                  style={{ filter: `drop-shadow(0 2px 6px ${s.color}55)`, transition: 'opacity 0.2s' }}
                                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.9')}
                                >
                                  <title>{s.label}: ₹{s.value.toFixed(2)} ({s.pct}%)</title>
                                </path>
                              ))}
                              {/* Donut hole */}
                              <circle cx={CX} cy={CY} r={50} fill="#131c2e" />
                              <text x={CX} y={CY - 7} textAnchor="middle" fill="#f1f5f9" fontSize="11" fontWeight="600" opacity="0.6">TOTAL</text>
                              <text x={CX} y={CY + 12} textAnchor="middle" fill="#f1f5f9" fontSize="14" fontWeight="800">₹{total.toFixed(0)}</text>
                            </svg>
                          </div>
                          {/* Legend + breakdown */}
                          <div className="ad-pie-legend">
                            {slices.map((s, i) => (
                              <div key={i} className="ad-pie-legend-row">
                                <div className="ad-pie-legend-left">
                                  <span className="ad-pie-dot" style={{ background: s.color }}></span>
                                  <div className="ad-pie-legend-icon" style={{ background: `${s.color}22`, color: s.color }}>
                                    <i className={`fa-solid ${s.icon}`}></i>
                                  </div>
                                  <span className="ad-pie-label">{s.label}</span>
                                </div>
                                <div className="ad-pie-legend-right">
                                  <span className="ad-pie-amount">₹{s.value.toFixed(2)}</span>
                                  <span className="ad-pie-pct" style={{ color: s.color }}>{(s.value/total*100).toFixed(1)}%</span>
                                </div>
                              </div>
                            ))}
                            <div className="ad-pie-total-row">
                              <span>Total Revenue</span>
                              <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>₹{total.toFixed(2)}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

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
                                <td><strong>₹{o.totalAmount.toFixed(2)}</strong></td>
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
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="ad-btn ad-btn-outline" onClick={() => setShowCategoryPanel(v => !v)}>
                        <i className="fa-solid fa-tags"></i> Categories
                      </button>
                      <button className="ad-btn ad-btn-primary" onClick={() => { setEditProduct(null); setProductForm({ name: '', price: '', stock: '', category: '', description: '' }); setProductImageUrls([]); setShowProductModal(true); }}>
                        <i className="fa-solid fa-plus"></i> Add Product
                      </button>
                    </div>
                  </div>

                  {/* Category Manager Panel */}
                  {showCategoryPanel && (
                    <div style={{ background: 'var(--ad-card)', border: '1px solid var(--ad-border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--ad-primary)' }}><i className="fa-solid fa-tags me-2"></i>Manage Categories</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addCategory()}
                          placeholder="New category name..."
                          style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--ad-border)', borderRadius: '7px', color: 'var(--ad-text)', fontSize: '0.875rem' }}
                        />
                        <button className="ad-btn ad-btn-primary" onClick={addCategory}><i className="fa-solid fa-plus"></i> Add</button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {categories.length === 0 && <span style={{ color: 'var(--ad-muted)', fontSize: '0.85rem' }}>No categories yet.</span>}
                        {categories.map(c => (
                          <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '4px 10px', borderRadius: '99px', fontSize: '0.8rem' }}>
                            {c.name}
                            <button onClick={() => deleteCategory(c.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}><i className="fa-solid fa-xmark"></i></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead><tr><th>Photo</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
                      <tbody>
                        {products.length === 0 ? (
                          <tr><td colSpan={6}><div className="ad-empty"><i className="fa-solid fa-box-open"></i>No products yet</div></td></tr>
                        ) : products.map(p => {
                          let imgs: string[] = [];
                          try { imgs = JSON.parse(p.imageUrls || '[]'); } catch {}
                          if (!imgs.length && p.imageUrl) imgs = [p.imageUrl];
                          return (
                            <tr key={p.id}>
                              <td>
                                {imgs[0] ? <img src={imgs[0]} alt={p.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--ad-border)' }} /> : <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-image" style={{ opacity: 0.3 }}></i></div>}
                              </td>
                              <td><strong>{p.name}</strong>{imgs.length > 1 && <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: 'var(--ad-muted)' }}>{imgs.length} photos</span>}</td>
                              <td><span className="category-tag" style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{p.category || '—'}</span></td>
                              <td><strong>₹{p.price.toFixed(2)}</strong></td>
                              <td><span className={`pill ${p.stock > 10 ? 'pill-green' : p.stock > 0 ? 'pill-yellow' : 'pill-red'}`}>{p.stock} left</span></td>
                              <td style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="ad-btn ad-btn-outline ad-btn-sm" onClick={() => openEditProduct(p)}><i className="fa-solid fa-pen"></i></button>
                                <button className="ad-btn ad-btn-danger ad-btn-sm" onClick={() => deleteProduct(p.id)}><i className="fa-solid fa-trash"></i></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── MANAGE TURFS ── */}
              {tab === 'adminTurfs' && (
                <div className="animate-in">
                  <div className="ad-section-header">
                    <h2>{adminTurfs.length} Turfs</h2>
                    <button className="ad-btn ad-btn-primary" onClick={() => { setEditTurf(null); setTurfForm({ name: '', location: '', pricePerHour: '', netsAvailable: '2', imageUrl: '' }); setShowTurfModal(true); }}><i className="fa-solid fa-plus"></i> Add Turf</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                    {adminTurfs.length === 0 && <div className="ad-empty"><i className="fa-solid fa-cricket-bat-ball"></i>No turfs yet</div>}
                    {adminTurfs.map(t => (
                      <div key={t.id} style={{ background: 'var(--ad-card)', border: '1px solid var(--ad-border)', borderRadius: '14px', overflow: 'hidden' }}>
                        <div style={{ height: '150px', overflow: 'hidden', position: 'relative' }}>
                          {t.imageUrl ? <img src={t.imageUrl} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-cricket-bat-ball fa-2x" style={{ opacity: 0.3 }}></i></div>}
                        </div>
                        <div style={{ padding: '1rem' }}>
                          <h4 style={{ marginBottom: '0.25rem' }}>{t.name}</h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--ad-muted)', marginBottom: '0.5rem' }}><i className="fa-solid fa-location-dot me-1"></i>{t.location}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--ad-primary)', fontWeight: 700 }}>₹{t.pricePerHour}/hr</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--ad-muted)' }}>{t.netsAvailable} nets</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                            <button className="ad-btn ad-btn-outline ad-btn-sm" style={{ flex: 1 }} onClick={() => openEditTurf(t)}><i className="fa-solid fa-pen"></i> Edit</button>
                            <button className="ad-btn ad-btn-danger ad-btn-sm" style={{ flex: 1 }} onClick={() => deleteTurf(t.id)}><i className="fa-solid fa-trash"></i> Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── MANAGE COACHES ── */}
              {tab === 'adminCoaches' && (
                <div className="animate-in">
                  <div className="ad-section-header">
                    <h2>{adminCoaches.length} Coaches</h2>
                    <button className="ad-btn ad-btn-primary" onClick={() => { setEditCoach(null); setCoachForm({ name: '', specialty: '', pricePerSession: '', rating: '4.5', imageUrl: '' }); setShowCoachModal(true); }}><i className="fa-solid fa-plus"></i> Add Coach</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    {adminCoaches.length === 0 && <div className="ad-empty"><i className="fa-solid fa-person-running"></i>No coaches yet</div>}
                    {adminCoaches.map(c => (
                      <div key={c.id} style={{ background: 'var(--ad-card)', border: '1px solid var(--ad-border)', borderRadius: '14px', overflow: 'hidden' }}>
                        <div style={{ height: '150px', overflow: 'hidden' }}>
                          {c.imageUrl ? <img src={c.imageUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-user-tie fa-2x" style={{ opacity: 0.3 }}></i></div>}
                        </div>
                        <div style={{ padding: '1rem' }}>
                          <h4 style={{ marginBottom: '0.25rem' }}>{c.name}</h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--ad-muted)', marginBottom: '0.5rem' }}>{c.specialty}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--ad-primary)', fontWeight: 700 }}>₹{c.pricePerSession}/session</span>
                            <span style={{ fontSize: '0.78rem', color: '#fbbf24' }}><i className="fa-solid fa-star"></i> {c.rating}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                            <button className="ad-btn ad-btn-outline ad-btn-sm" style={{ flex: 1 }} onClick={() => openEditCoach(c)}><i className="fa-solid fa-pen"></i> Edit</button>
                            <button className="ad-btn ad-btn-danger ad-btn-sm" style={{ flex: 1 }} onClick={() => deleteCoach(c.id)}><i className="fa-solid fa-trash"></i> Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
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
                              <strong>₹{o.totalAmount.toFixed(2)}</strong>
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

              {/* ── MATCHES ── */}
              {tab === 'matches' && (
                <div className="animate-in">
                  <div className="ad-section-header">
                    <h2>{matches.length} Matches</h2>
                    <button className="ad-btn ad-btn-primary" onClick={() => setShowMatchModal(true)}>
                      <i className="fa-solid fa-plus" style={{marginRight: '8px'}}></i>New Match
                    </button>
                  </div>
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead><tr><th>Match Details</th><th>Venue</th><th>Date & Time</th><th>Players</th><th>Price</th><th>Actions</th></tr></thead>
                      <tbody>
                        {matches.length === 0 ? (
                          <tr><td colSpan={6}><div className="ad-empty"><i className="fa-solid fa-trophy"></i>No matches</div></td></tr>
                        ) : matches.map(m => (
                          <tr key={m.id}>
                            <td>
                              <strong>{m.title}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--ad-muted)' }}>Status: <span className={statusPill(m.status)}>{m.status}</span></div>
                            </td>
                            <td>
                              <strong>{m.stadiumName}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--ad-muted)' }}><i className="fa-solid fa-location-dot" style={{marginRight: '4px'}}></i>{m.location}</div>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--ad-text)' }}>
                              <div>{new Date(m.startTime).toLocaleDateString()}</div>
                              <div style={{ color: 'var(--ad-muted)' }}>{new Date(m.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 'bold', color: (m.players?.length ?? 0) >= (m.maxCapacity ?? 26) ? '#ef4444' : '#4ade80' }}>
                                  {m.players?.length ?? 0} / {m.maxCapacity ?? 26}
                                </span>
                                {(m.players?.length ?? 0) > 0 && (
                                  <button
                                    className="ad-eye-btn"
                                    title="View enrolled players"
                                    onClick={() => setViewPlayersMatch(m)}
                                  >
                                    <i className="fa-solid fa-eye"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                            <td><strong>₹{(m.pricePerPlayer ?? 0).toFixed(2)}</strong></td>
                            <td>
                              <button onClick={() => deleteMatch(m.id)} className="ad-btn-icon" title="Delete Match"><i className="fa-solid fa-trash" style={{color: '#ef4444'}}></i></button>
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
          <div className="ad-modal animate-in" style={{ maxWidth: '560px', padding: 0 }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--ad-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--ad-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="ad-field">
                <label>Product Name</label>
                <input value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. SG English Willow" />
              </div>
              <div className="ad-field">
                <label>Description</label>
                <input value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} placeholder="Short product description..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ad-field">
                  <label>Price (₹)</label>
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
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              {/* Multi-image upload */}
              <div className="ad-field">
                <label>Product Photos</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'rgba(59,130,246,0.1)', border: '1.5px dashed rgba(59,130,246,0.4)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#60a5fa' }}>
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  {productUploadLoading ? 'Uploading...' : 'Click to upload photos (multiple allowed)'}
                  <input type="file" multiple accept="image/*" style={{ display: 'none' }}
                    onChange={e => e.target.files && handleProductImages(e.target.files)}
                  />
                </label>
                {productImageUrls.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                    {productImageUrls.map((url, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={url} alt={`photo-${i}`} style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--ad-border)' }} />
                        <button onClick={() => setProductImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', border: 'none', color: '#fff', width: '18px', height: '18px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="ad-modal-footer" style={{ paddingTop: '10px', borderTop: '1px solid var(--ad-border)' }}>
                <button className="ad-btn ad-btn-outline" onClick={() => setShowProductModal(false)}>Cancel</button>
                <button className="ad-btn ad-btn-primary" onClick={saveProduct}>
                  <i className="fa-solid fa-save"></i> {editProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Turf Modal ── */}
      {showTurfModal && (
        <div className="ad-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowTurfModal(false); }}>
          <div className="ad-modal animate-in" style={{ maxWidth: '480px', padding: 0 }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--ad-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editTurf ? 'Edit Turf' : 'Add New Turf'}</h3>
              <button onClick={() => setShowTurfModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--ad-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="ad-field"><label>Turf Name *</label><input required value={turfForm.name} onChange={e => setTurfForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Green Valley Turf" /></div>
              <div className="ad-field"><label>Location *</label><input required value={turfForm.location} onChange={e => setTurfForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Anna Nagar, Chennai" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ad-field"><label>Price/Hour (₹) *</label><input type="number" value={turfForm.pricePerHour} onChange={e => setTurfForm(f => ({ ...f, pricePerHour: e.target.value }))} placeholder="500" /></div>
                <div className="ad-field"><label>Nets Available</label><input type="number" value={turfForm.netsAvailable} onChange={e => setTurfForm(f => ({ ...f, netsAvailable: e.target.value }))} /></div>
              </div>
              <div className="ad-field">
                <label>Photo</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'rgba(59,130,246,0.1)', border: '1.5px dashed rgba(59,130,246,0.4)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#60a5fa' }}>
                  <i className="fa-solid fa-cloud-arrow-up"></i>{turfUploadLoading ? 'Uploading...' : 'Click to upload a photo'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleTurfImage(e.target.files[0])} />
                </label>
                {turfForm.imageUrl && <img src={turfForm.imageUrl} alt="preview" style={{ marginTop: '8px', height: '100px', width: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--ad-border)' }} />}
              </div>
              <div className="ad-modal-footer" style={{ paddingTop: '10px', borderTop: '1px solid var(--ad-border)' }}>
                <button className="ad-btn ad-btn-outline" onClick={() => setShowTurfModal(false)}>Cancel</button>
                <button className="ad-btn ad-btn-primary" onClick={saveTurf} disabled={!turfForm.name || !turfForm.location || !turfForm.pricePerHour}>
                  <i className="fa-solid fa-save"></i> {editTurf ? 'Update Turf' : 'Create Turf'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Coach Modal ── */}
      {showCoachModal && (
        <div className="ad-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCoachModal(false); }}>
          <div className="ad-modal animate-in" style={{ maxWidth: '480px', padding: 0 }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--ad-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editCoach ? 'Edit Coach' : 'Add New Coach'}</h3>
              <button onClick={() => setShowCoachModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--ad-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="ad-field"><label>Coach Name *</label><input required value={coachForm.name} onChange={e => setCoachForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ravi Shastri" /></div>
              <div className="ad-field"><label>Specialty *</label><input required value={coachForm.specialty} onChange={e => setCoachForm(f => ({ ...f, specialty: e.target.value }))} placeholder="e.g. Batting Coach" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ad-field"><label>Price/Session (₹) *</label><input type="number" value={coachForm.pricePerSession} onChange={e => setCoachForm(f => ({ ...f, pricePerSession: e.target.value }))} placeholder="999" /></div>
                <div className="ad-field"><label>Rating (0-5)</label><input type="number" step="0.1" min="0" max="5" value={coachForm.rating} onChange={e => setCoachForm(f => ({ ...f, rating: e.target.value }))} /></div>
              </div>
              <div className="ad-field">
                <label>Photo</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'rgba(168,85,247,0.1)', border: '1.5px dashed rgba(168,85,247,0.4)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#c084fc' }}>
                  <i className="fa-solid fa-cloud-arrow-up"></i>{coachUploadLoading ? 'Uploading...' : 'Click to upload a photo'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleCoachImage(e.target.files[0])} />
                </label>
                {coachForm.imageUrl && <img src={coachForm.imageUrl} alt="preview" style={{ marginTop: '8px', height: '100px', width: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--ad-border)' }} />}
              </div>
              <div className="ad-modal-footer" style={{ paddingTop: '10px', borderTop: '1px solid var(--ad-border)' }}>
                <button className="ad-btn ad-btn-outline" onClick={() => setShowCoachModal(false)}>Cancel</button>
                <button className="ad-btn ad-btn-primary" onClick={saveCoach} disabled={!coachForm.name || !coachForm.specialty || !coachForm.pricePerSession}>
                  <i className="fa-solid fa-save"></i> {editCoach ? 'Update Coach' : 'Create Coach'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Modal */}
      {showMatchModal && (
        <div className="ad-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowMatchModal(false); }}>
          <div className="ad-modal animate-in" style={{ maxWidth: '650px', padding: '0' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--ad-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Create New Match</h3>
              <button onClick={() => setShowMatchModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--ad-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleMatchSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="ad-field">
                <label>Match Title *</label>
                <input required value={matchForm.title} onChange={e => setMatchForm({...matchForm, title: e.target.value})} placeholder="e.g. Weekend League T20" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="ad-field">
                  <label>Stadium Name *</label>
                  <input required value={matchForm.stadiumName} onChange={e => setMatchForm({...matchForm, stadiumName: e.target.value})} placeholder="e.g. Central Park Ground" />
                </div>
                <div className="ad-field">
                  <label>Full Address *</label>
                  <input required value={matchForm.location} onChange={e => setMatchForm({...matchForm, location: e.target.value})} placeholder="e.g. 123 Main St" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="ad-field">
                  <label>Start Time *</label>
                  <input type="datetime-local" required value={matchForm.startTime} onChange={e => setMatchForm({...matchForm, startTime: e.target.value})} />
                </div>
                <div className="ad-field">
                  <label>End Time *</label>
                  <input type="datetime-local" required value={matchForm.endTime} onChange={e => setMatchForm({...matchForm, endTime: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="ad-field">
                  <label>Price Per Player ($) *</label>
                  <input type="number" step="0.01" required value={matchForm.pricePerPlayer} onChange={e => setMatchForm({...matchForm, pricePerPlayer: e.target.value})} />
                </div>
                <div className="ad-field">
                  <label>Max Capacity *</label>
                  <input type="number" required value={matchForm.maxCapacity} onChange={e => setMatchForm({...matchForm, maxCapacity: e.target.value})} title="Usually 26 (11 + 2 subs per team)" />
                </div>
                <div className="ad-field">
                  <label>Weather</label>
                  <input value={matchForm.weather} onChange={e => setMatchForm({...matchForm, weather: e.target.value})} placeholder="Sunny 28°C" />
                </div>
              </div>
              <div className="ad-field">
                <label>Umpire / Judge List</label>
                <input value={matchForm.umpireList} onChange={e => setMatchForm({...matchForm, umpireList: e.target.value})} placeholder="e.g. John Doe (Main), Alex Smith (Square Leg)" />
              </div>
              <div className="ad-field">
                <label>Stadium Stats / Pitch Info</label>
                <textarea rows={2} value={matchForm.stadiumStats} onChange={e => setMatchForm({...matchForm, stadiumStats: e.target.value})} placeholder="e.g. Flat track, good for batting..." style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--ad-border)', borderRadius: '8px', color: 'var(--ad-text)', resize: 'none' }}></textarea>
              </div>
              
              <div style={{ padding: '15px 0 0 0', borderTop: '1px solid var(--ad-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="ad-btn ad-btn-outline" onClick={() => setShowMatchModal(false)}>Cancel</button>
                <button type="submit" className="ad-btn ad-btn-primary"><i className="fa-solid fa-save"></i> Create Match</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Players Modal ── */}
      {viewPlayersMatch && (
        <div className="ad-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setViewPlayersMatch(null); }}>
          <div className="ad-modal animate-in" style={{ maxWidth: '480px', padding: '0' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--ad-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Enrolled Players</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--ad-muted)', marginTop: '2px' }}>{viewPlayersMatch.title}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '3px 10px', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 600 }}>
                  {viewPlayersMatch.players.length} / {viewPlayersMatch.maxCapacity}
                </span>
                <button onClick={() => setViewPlayersMatch(null)} style={{ background: 'transparent', border: 'none', color: 'var(--ad-muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
              </div>
            </div>
            {/* Player list */}
            <div style={{ padding: '16px 24px', maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {viewPlayersMatch.players.length === 0 ? (
                <div className="ad-empty"><i className="fa-solid fa-users-slash"></i>No players enrolled yet</div>
              ) : viewPlayersMatch.players.map((p, i) => (
                <div key={i} className="ad-player-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="ad-player-avatar">{p.user.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ad-muted)' }}>{p.user.email}</div>
                    </div>
                  </div>
                  <span className="ad-player-role">{p.role}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 24px', borderTop: '1px solid var(--ad-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="ad-btn ad-btn-outline" onClick={() => setViewPlayersMatch(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

