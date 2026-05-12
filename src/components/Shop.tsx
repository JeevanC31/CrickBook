'use client';

import React, { useState, useEffect } from 'react';
import './Views.css';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);

  // Fallback data if DB is not connected yet
  const fallbackProducts = [
    { id: '1', name: 'SG English Willow', price: 150.00, imageUrl: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
    { id: '2', name: 'Pro Helmet', price: 45.00 },
    { id: '3', name: 'Leather Ball (Box of 6)', price: 30.00 },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/shop');
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) setProducts(data);
          else setProducts(fallbackProducts);
        } else {
          setProducts(fallbackProducts);
        }
      } catch (e) {
        setProducts(fallbackProducts);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (productId: string) => {
    try {
      // Assuming a mock user ID for now since auth context doesn't expose it
      const userId = 'test-user-id';
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, quantity: 1 }),
      });
      if (res.ok) {
        setCartCount(prev => prev + 1);
        alert('Added to cart!');
      } else {
        // Fallback behavior if DB fails
        setCartCount(prev => prev + 1);
        alert('Added to cart (Local Mode)');
      }
    } catch (e) {
      setCartCount(prev => prev + 1);
      alert('Added to cart (Local Mode)');
    }
  };

  return (
    <div className="animate-fade-in" data-testid="view-shop">
      <div className="shop-header">
        <div className="cart-icon">
          <i className="fa-solid fa-cart-shopping"></i>
          <span className="badge">{cartCount}</span>
        </div>
      </div>
      <div className="grid-container">
        {products.map(product => (
          <div key={product.id} className="product-card glass">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="product-img" />
            ) : (
              <div className="product-img-placeholder"><i className="fa-solid fa-box"></i></div>
            )}
            <h3>{product.name}</h3>
            <p className="product-price">${product.price.toFixed(2)}</p>
            <button 
              className="btn btn-outline w-100 mt-auto"
              onClick={() => handleAddToCart(product.id)}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
