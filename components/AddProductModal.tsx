"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { db, type LocalProduct } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { syncEngine } from "@/lib/sync";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (product: LocalProduct) => void;
}

/**
 * Renders a modal form for creating a new product and persists the new product to the local database.
 *
 * The form requires a non-empty product name and numeric price and stock inputs. On successful submission
 * a LocalProduct is created, added to the local products store, a PRODUCT_UPDATE task is enqueued in the
 * sync queue, the global sync engine is triggered (if available), and the provided `onProductAdded` callback
 * is invoked with the created product. The modal closes after a successful add.
 *
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback invoked to close the modal
 * @param onProductAdded - Callback invoked with the newly created LocalProduct after it is persisted
 * @returns The modal JSX element, or `null` when the modal is closed
 */
export default function AddProductModal({ isOpen, onClose, onProductAdded }: AddProductModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !stock) return;

    setSaving(true);
    try {
      const newProduct: LocalProduct = {
        id: uuidv4(),
        name: name.trim(),
        price: Number(price),
        stock: Number(stock),
        version: 1,
        updatedAt: Date.now(),
      };

      await db.transaction('rw', db.products, db.syncQueue, async (tx) => {
        await tx.products.add(newProduct);
        await tx.syncQueue.add({
          id: `create-${newProduct.id}-${crypto.randomUUID()}`,
          type: "PRODUCT_UPDATE",
          payload: newProduct,
          retries: 0,
          lastAttempt: 0,
        });
      });

      syncEngine?.startSync();
      onProductAdded(newProduct);
      setName("");
      setPrice("");
      setStock("");
      onClose();
    } catch (err) {
      console.error("Add product error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Product</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Product Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Sugar 1kg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label className="form-label">Price (KES)</label>
            <input
              className="form-input mono"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Initial Stock</label>
            <input
              className="form-input mono"
              type="number"
              min="0"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Adding..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
