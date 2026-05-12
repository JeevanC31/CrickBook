'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import './Views.css';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  imageUrl?: string;
}

interface CartItem extends Product {
  cartQuantity: number;
}

const COUPONS: Record<string, number> = {
  SAVE2: 2,
  CRIC5: 5,
  PRO8: 8
};

const Shop = () => {
  const { user } = useAppContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout state
  const [addressForm, setAddressForm] = useState({ street: '', landmark: '', pincode: '', phone: '' });
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'processing' | 'success'>('cart');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/shop');
        if (res.ok) {
          const data: Product[] = await res.json();
          setProducts(data);
          
          // Extract unique categories
          const cats = new Set(data.map(p => p.category).filter(Boolean) as string[]);
          setCategories(Array.from(cats));
        }
      } catch (e) {
        console.error("Failed to load products");
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(0, item.cartQuantity + delta);
        return { ...item, cartQuantity: newQ };
      }
      return item;
    }).filter(item => item.cartQuantity > 0));
  };

  const applyCoupon = () => {
    const code = couponCode.toUpperCase().trim();
    if (COUPONS[code]) {
      setAppliedDiscount(COUPONS[code]);
      alert(`Coupon applied! ${COUPONS[code]}% off`);
    } else {
      setAppliedDiscount(0);
      alert('Invalid coupon code');
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      alert('Please log in to complete purchase');
      return;
    }
    if (!addressForm.street.trim() || !addressForm.pincode.trim() || !addressForm.phone.trim()) {
      alert('Please fill out all required address fields (Street, Pincode, Phone)');
      return;
    }

    const compiledAddress = JSON.stringify(addressForm);

    setCheckoutStep('processing');

    try {
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          items: cart.map(item => ({ id: item.id, quantity: item.cartQuantity, price: item.price })),
          deliveryAddress: compiledAddress,
          discountCode: appliedDiscount > 0 ? couponCode.toUpperCase().trim() : null,
          discountPercentage: appliedDiscount,
          finalAmount: calculateTotal()
        }),
      });

      if (res.ok) {
        setCheckoutStep('success');
        setTimeout(() => {
          setCart([]);
          setIsCartOpen(false);
          setCheckoutStep('cart');
          setAddressForm({ street: '', landmark: '', pincode: '', phone: '' });
          setCouponCode('');
          setAppliedDiscount(0);
        }, 2500);
      } else {
        const errorData = await res.json();
        setCheckoutStep('cart');
        alert(`Checkout failed: ${errorData.error}`);
      }
    } catch (e) {
      setCheckoutStep('cart');
      alert('Network error during checkout');
    }
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const cartItemCount = cart.reduce((sum, item) => sum + item.cartQuantity, 0);
  const calculateSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  const calculateTotal = () => {
    const sub = calculateSubtotal();
    return sub - (sub * (appliedDiscount / 100));
  };

  return (
    <div className="animate-fade-in" data-testid="view-shop">
      <div className="shop-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Sports Shop</h2>
          <select 
            className="form-control mt-2" 
            style={{ width: '200px', background: 'rgba(0,0,0,0.3)', color: 'var(--text-main)', border: '1px solid var(--border-glass)' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <button className="cart-icon btn-icon-only" style={{ position: 'relative', width: '50px', height: '50px' }} onClick={() => setIsCartOpen(true)}>
          <i className="fa-solid fa-cart-shopping" style={{ fontSize: '1.2rem' }}></i>
          {cartItemCount > 0 && (
            <span className="badge badge-red" style={{ position: 'absolute', top: -5, right: -5, borderRadius: '50%', padding: '4px 8px' }}>
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      <div className="coaches-grid">
        {filteredProducts.map(product => {
          const cartItem = cart.find(i => i.id === product.id);
          return (
            <div key={product.id} className="coach-card glass" style={{ padding: '1rem' }}>
              {product.imageUrl ? (
                <div style={{ height: '160px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ height: '160px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <i className="fa-solid fa-box fa-3x" style={{ opacity: 0.2 }}></i>
                </div>
              )}
              
              <div style={{ flex: 1 }}>
                <span className="category-tag tag-coach" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                  {product.category || 'Uncategorized'}
                </span>
                <h3 style={{ fontSize: '1.1rem', margin: '0.5rem 0' }}>{product.name}</h3>
                <p className="price-tag" style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  ${product.price.toFixed(2)}
                </p>
                
                {cartItem ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.2rem 0.6rem' }} onClick={() => updateQuantity(product.id, -1)}>-</button>
                    <span>{cartItem.cartQuantity}</span>
                    <button className="btn btn-outline" style={{ padding: '0.2rem 0.6rem' }} onClick={() => updateQuantity(product.id, 1)}>+</button>
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary w-100 mt-3"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                  >
                    <i className="fa-solid fa-cart-plus"></i> Add to Cart
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass animate-scale-up" style={{ maxWidth: '600px', width: '90%' }}>
            <button className="close-btn" onClick={() => setIsCartOpen(false)}>&times;</button>
            
            {checkoutStep === 'cart' && (
              <div className="cart-checkout-container" style={{ padding: '0.5rem' }}>
                <h2 className="mb-4" style={{ 
                  background: 'linear-gradient(90deg, #60a5fa, #a855f7)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <i className="fa-solid fa-cart-shopping" style={{ WebkitTextFillColor: 'initial', color: '#60a5fa' }}></i> Your Cart
                </h2>
                
                {cart.length === 0 ? (
                  <div className="text-center p-5 text-muted" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <i className="fa-solid fa-basket-shopping fa-3x mb-3" style={{ opacity: 0.2 }}></i>
                    <p>Your cart is empty.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Items List */}
                    <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '10px' }} className="cart-items-scroll">
                      {cart.map((item, idx) => (
                        <div key={item.id} style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          padding: '12px 16px', background: 'rgba(255,255,255,0.06)', 
                          borderRadius: '12px', marginBottom: '10px',
                          border: '1px solid rgba(255,255,255,0.05)',
                          transition: 'all 0.3s ease',
                          animationDelay: `${idx * 0.05}s`
                        }} className="animate-fade-in">
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '4px' }}>{item.name}</strong>
                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>${item.price.toFixed(2)} each</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', padding: '2px 6px' }}>
                              <button className="btn-icon-only" style={{ padding: '2px 8px', fontSize: '1rem', color: 'var(--text-main)' }} onClick={() => updateQuantity(item.id, -1)}>-</button>
                              <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{item.cartQuantity}</span>
                              <button className="btn-icon-only" style={{ padding: '2px 8px', fontSize: '1rem', color: 'var(--primary)' }} onClick={() => updateQuantity(item.id, 1)}>+</button>
                            </div>
                            <strong style={{ width: '70px', textAlign: 'right', fontSize: '1.1rem' }}>${(item.price * item.cartQuantity).toFixed(2)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Address Form */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--ad-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block' }}>
                        <i className="fa-solid fa-location-dot me-2"></i>Delivery Details
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                        <textarea 
                          className="form-control" 
                          rows={2} 
                          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', resize: 'none' }}
                          placeholder="Full Street Address *"
                          value={addressForm.street}
                          onChange={e => setAddressForm({...addressForm, street: e.target.value})}
                        ></textarea>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                            placeholder="Landmark (Optional)"
                            value={addressForm.landmark}
                            onChange={e => setAddressForm({...addressForm, landmark: e.target.value})}
                          />
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                            placeholder="Pincode *"
                            value={addressForm.pincode}
                            onChange={e => setAddressForm({...addressForm, pincode: e.target.value})}
                          />
                        </div>
                        <input 
                          type="text" 
                          className="form-control" 
                          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                          placeholder="Phone Number *"
                          value={addressForm.phone}
                          onChange={e => setAddressForm({...addressForm, phone: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Coupons */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(34, 197, 94, 0.15))', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '1.2rem', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '0.95rem', color: '#4ade80', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fa-solid fa-tags"></i> Available Offers
                        </h4>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                        {Object.entries(COUPONS).map(([code, percent]) => (
                          <span 
                            key={code} 
                            className="badge badge-green" 
                            style={{ cursor: 'pointer', padding: '6px 10px', background: 'rgba(74, 222, 128, 0.2)', border: '1px solid rgba(74, 222, 128, 0.4)' }}
                            onClick={() => { setCouponCode(code); }}
                            title="Click to copy to input"
                          >
                            {code} <strong style={{color: '#fff'}}>- {percent}% Off</strong>
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="text" 
                          className="form-control" 
                          style={{ textTransform: 'uppercase', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74, 222, 128, 0.3)', color: '#4ade80', fontWeight: 'bold', letterSpacing: '1px' }}
                          placeholder="ENTER CODE" 
                          value={couponCode}
                          onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        />
                        <button 
                          className="btn" 
                          style={{ background: '#22c55e', color: 'white', fontWeight: 'bold', padding: '0 1.5rem', borderRadius: '6px' }}
                          onClick={applyCoupon}
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    {/* Summary */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '1rem' }}>
                        <span className="text-muted">Subtotal</span>
                        <span>${calculateSubtotal().toFixed(2)}</span>
                      </div>
                      {appliedDiscount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', color: '#4ade80', fontWeight: '500' }}>
                          <span>Discount ({appliedDiscount}%)</span>
                          <span>-${(calculateSubtotal() * (appliedDiscount / 100)).toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', margin: '12px 0' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Total Amount</span>
                        <span style={{ color: '#60a5fa', fontSize: '1.8rem', fontWeight: '800' }}>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <button 
                      className="btn w-100" 
                      style={{ 
                        background: 'linear-gradient(90deg, #ff6b6b, #ff8e53)', 
                        color: 'white', 
                        padding: '1.2rem', 
                        fontSize: '1.2rem', 
                        fontWeight: 'bold',
                        border: 'none',
                        boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}
                      onClick={handleCheckout}
                    >
                      Buy Now <i className="fa-solid fa-arrow-right ms-2"></i>
                    </button>
                  </div>
                )}
              </div>
            )}

            {checkoutStep === 'processing' && (
              <div className="text-center p-5">
                <div className="payment-spinner mx-auto mb-4"></div>
                <h3>Processing Order</h3>
                <p className="text-muted">Securing your items and processing payment...</p>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className="text-center p-5">
                <div className="success-icon animate-bounce mx-auto mb-4" style={{ fontSize: '4rem' }}>✅</div>
                <h2>Order Placed!</h2>
                <p>Your sports items will be delivered to your address soon.</p>
                <p className="text-muted small mt-2">Check &apos;My Orders&apos; for delivery status.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
