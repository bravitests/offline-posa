"use client";

import { useEffect, useState, useMemo } from "react";
import { db, type LocalProduct } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { MagnifyingGlass, Plus, Minus, ShoppingCart, CheckCircle, Package } from "@phosphor-icons/react";
import { syncEngine } from "@/lib/sync";

type CartItem = { product: LocalProduct; qty: number };

export default function POSPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mpesaCode, setMpesaCode] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await db.products.toArray();
      setProducts(data);
      setLoading(false);
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  const addToCart = (product: LocalProduct) =>
    setCart((prev) => {
      const found = prev.find((i) => i.product.id === product.id);
      if (found) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });

  const updateQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev.map((i) => i.product.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
        .filter((i) => i.qty > 0)
    );

  const total = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const completeSale = async () => {
    if (!cart.length) return;
    const saleId = uuidv4();
    const saleData = {
      id: saleId,
      total,
      mpesaCode,
      createdAt: Date.now(),
      synced: false,
      items: cart.map((i) => ({ productId: i.product.id, qty: i.qty, price: i.product.price })),
    };
    try {
      // Wrap all writes in a single atomic transaction
      await db.transaction('rw', db.sales, db.products, db.syncQueue, async (tx) => {
        // Add sale
        await tx.sales.add(saleData as any);

        // Update product stock
        for (const i of cart) {
          await tx.products.update(i.product.id, { stock: i.product.stock - i.qty });
        }

        // Add to sync queue
        await tx.syncQueue.add({ id: saleId, type: "SALE", payload: saleData, retries: 0, lastAttempt: 0 });
      });

      // Only start sync after transaction successfully commits
      syncEngine?.startSync();
      setCart([]);
      setMpesaCode("");
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      console.error("Sale completion error:", err);
      // Transaction rolled back on error, database state is consistent
    }
  };

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 className="pos-page-title">Point of Sale</h1>
        <p className="page-subtitle">Tap a product to add it to the current order.</p>
      </div>

      <div className="pos-layout">
        {/* ── Products column ── */}
        <section>
          {/* Search */}
          <div className="search-wrap">
            <MagnifyingGlass size={18} />
            <input
              className="search-input"
              type="text"
              placeholder="Search products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Grid */}
          {loading ? (
            <div className="products-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 140, borderRadius: "var(--r-xl)" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: "4rem" }}>
              <Package size={40} style={{ color: "var(--text-dim)", marginBottom: "0.5rem" }} />
              <span>No products found.</span>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map((product, idx) => (
                <button
                  key={product.id}
                  className="product-card"
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div>
                    <div className="product-card-name">{product.name}</div>
                    <div className="product-card-price mono">KES {product.price}</div>
                  </div>
                  <span className={`product-card-stock ${product.stock < 10 ? "low" : ""}`}>
                    {product.stock > 0 ? `${product.stock} left` : "Out of stock"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Cart column ── */}
        <aside className="cart-panel">
          <div className="cart-header">
            <ShoppingCart size={20} weight="bold" />
            <span>Current Order</span>
            {cartCount > 0 && (
              <div className="cart-count-badge">{cartCount}</div>
            )}
          </div>

          <div className="cart-items-scroll">
            {cart.length === 0 ? (
              <div className="cart-empty-state">
                <ShoppingCart size={36} style={{ color: "var(--text-dim)", marginBottom: "0.25rem" }} />
                <span>No items added yet.</span>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="cart-item-row">
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.product.name}</div>
                    <div className="cart-item-sub">KES {item.product.price} each</div>
                  </div>
                  <div className="cart-qty-control">
                    <button className="cart-qty-btn" onClick={() => updateQty(item.product.id, -1)}>
                      <Minus size={14} />
                    </button>
                    <span className="cart-qty-num">{item.qty}</span>
                    <button className="cart-qty-btn" onClick={() => updateQty(item.product.id, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer">
            <div className="cart-total-row">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-value">KES {total}</span>
            </div>

            <div className="form-field">
              <label className="form-label">M-Pesa Reference</label>
              <input
                className="form-input mono"
                type="text"
                placeholder="e.g. RBS9K2XYZ"
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value)}
              />
            </div>

            <button
              className={`checkout-btn ${isSuccess ? "success" : ""}`}
              onClick={completeSale}
              disabled={cart.length === 0 || isSuccess}
            >
              {isSuccess ? (
                <><CheckCircle size={20} weight="fill" /> Saved!</>
              ) : (
                "Complete Sale"
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
