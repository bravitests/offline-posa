"use client";

import { useEffect, useState } from "react";
import { db, type LocalProduct } from "@/lib/db";
import { Plus, PencilSimple, Trash, X } from "@phosphor-icons/react";
import { syncEngine } from "@/lib/sync";
import { v4 as uuidv4 } from "uuid";

export default function InventoryPage() {
    const [products, setProducts] = useState<LocalProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<LocalProduct>>({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: "", price: 0, stock: 0 });

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

    const handleEdit = (product: LocalProduct) => {
        setEditingId(product.id);
        setEditValues({ ...product });
    };

    const saveEdit = async () => {
        if (!editingId || !editValues.name) return;
        try {
            const existingProduct = products.find((p) => p.id === editingId);
            if (!existingProduct) {
                console.error(`Product ${editingId} not found`);
                return;
            }

            const updated: LocalProduct = {
                ...existingProduct,
                name: editValues.name,
                price: editValues.price ?? existingProduct.price,
                stock: editValues.stock ?? existingProduct.stock,
                version: existingProduct.version + 1,
                updatedAt: Date.now(),
            };

            await db.transaction('rw', db.products, db.syncQueue, async (tx) => {
                await tx.products.put(updated);
                await tx.syncQueue.add({
                    id: `update-${updated.id}-${Date.now()}`,
                    type: "PRODUCT_UPDATE",
                    payload: updated,
                    retries: 0,
                    lastAttempt: 0,
                });
            });

            syncEngine?.startSync();
            setEditingId(null);
            setEditValues({});
            setProducts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
        } catch (err) {
            console.error("Product update error:", err);
        }
    };

    const handleAddProduct = async () => {
        if (!newProduct.name || newProduct.price <= 0) return;
        try {
            const product: LocalProduct = {
                id: uuidv4(),
                name: newProduct.name,
                price: newProduct.price,
                stock: newProduct.stock,
                version: 1,
                updatedAt: Date.now(),
            };

            await db.transaction('rw', db.products, db.syncQueue, async (tx) => {
                await tx.products.add(product);
                await tx.syncQueue.add({
                    id: `create-${product.id}-${Date.now()}`,
                    type: "PRODUCT_CREATE",
                    payload: product,
                    retries: 0,
                    lastAttempt: 0,
                });
            });

            syncEngine?.startSync();
            setProducts((prev) => [...prev, product]);
            setShowAddModal(false);
            setNewProduct({ name: "", price: 0, stock: 0 });
        } catch (err) {
            console.error("Product add error:", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this product?")) return;
        try {
            await db.transaction('rw', db.products, db.syncQueue, async (tx) => {
                await tx.products.delete(id);
                await tx.syncQueue.add({
                    id: `delete-${id}-${Date.now()}`,
                    type: "PRODUCT_DELETE",
                    payload: { id },
                    retries: 0,
                    lastAttempt: 0,
                });
            });
            syncEngine?.startSync();
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error("Product delete error:", err);
        }
    };

    return (
        <div className="page-wrap">
            <div className="page-header-row">
                <div>
                    <h1 className="page-title">Inventory</h1>
                    <p className="page-subtitle">Manage stock levels and product pricing.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={16} weight="bold" /> Add Product
                </button>
            </div>

            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 56, borderRadius: "var(--r-lg)" }} />
                    ))}
                </div>
            ) : (
                <div className="table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price (KES)</th>
                                <th>Stock</th>
                                <th>Version</th>
                                <th>Updated</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => {
                                const editing = editingId === product.id;
                                return (
                                    <tr key={product.id}>
                                        <td style={{ fontWeight: 500 }}>
                                            {editing ? (
                                                <input
                                                    className="inline-input"
                                                    value={editValues.name}
                                                    onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                                                />
                                            ) : product.name}
                                        </td>
                                        <td className="mono">
                                            {editing ? (
                                                <input
                                                    className="inline-input mono"
                                                    type="number"
                                                    value={editValues.price}
                                                    onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                                                />
                                            ) : product.price}
                                        </td>
                                        <td>
                                            {editing ? (
                                                <input
                                                    className="inline-input mono"
                                                    type="number"
                                                    value={editValues.stock}
                                                    onChange={(e) => setEditValues({ ...editValues, stock: Number(e.target.value) })}
                                                />
                                            ) : product.stock < 10 ? (
                                                <span className="low-stock-text">{product.stock}</span>
                                            ) : (
                                                <span className="mono">{product.stock}</span>
                                            )}
                                        </td>
                                        <td><span className="version-badge">v{product.version}</span></td>
                                        <td style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>
                                            {new Date(product.updatedAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            {editing ? (
                                                <div className="table-actions">
                                                    <button className="text-link confirm" onClick={saveEdit}>Save</button>
                                                    <button className="text-link cancel" onClick={() => setEditingId(null)}>Cancel</button>
                                                </div>
                                            ) : (
                                                <div className="table-actions">
                                                    <button className="icon-btn" onClick={() => handleEdit(product)} title="Edit">
                                                        <PencilSimple size={16} />
                                                    </button>
                                                    <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(product.id)}>
                                                        <Trash size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Product</h2>
                            <button className="icon-btn" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-field">
                                <label className="form-label">Product Name</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Enter product name"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Price (KES)</label>
                                <input
                                    className="form-input mono"
                                    type="number"
                                    placeholder="0"
                                    value={newProduct.price || ""}
                                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Initial Stock</label>
                                <input
                                    className="form-input mono"
                                    type="number"
                                    placeholder="0"
                                    value={newProduct.stock || ""}
                                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="text-link cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleAddProduct}>
                                <Plus size={16} weight="bold" /> Add Product
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
