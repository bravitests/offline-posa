"use client";

import { useEffect, useState } from "react";
import { db, type LocalSale } from "@/lib/db";
import { CurrencyCircleDollar, Storefront, Package } from "@phosphor-icons/react";

export default function ReportsPage() {
    const [sales, setSales] = useState<LocalSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ revenue: 0, items: 0, count: 0 });

    useEffect(() => {
        const load = async () => {
            const data = await db.sales.toArray();
            setSales(data.sort((a, b) => b.createdAt - a.createdAt));
            setStats({
                revenue: data.reduce((s, sale) => s + sale.total, 0),
                items: data.reduce((s, sale) => s + sale.items.reduce((ss, i) => ss + i.qty, 0), 0),
                count: data.length,
            });
            setLoading(false);
        };
        load();
        const iv = setInterval(load, 5000);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="page-wrap">
            <div style={{ marginBottom: "1.75rem" }}>
                <h1 className="page-title">Reports</h1>
                <p className="page-subtitle">All data is generated locally — works fully offline.</p>
            </div>

            {/* Asymmetric stat bento – taste skill: NO 3-equal-columns */}
            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 120, borderRadius: "var(--r-xl)" }} />
                    ))}
                </div>
            ) : (
                <div className="stats-bento">
                    {/* Featured card */}
                    <div className="stat-card">
                        <div className="stat-card-icon"><CurrencyCircleDollar size={22} /></div>
                        <div>
                            <div className="stat-card-label">Total Revenue</div>
                            <div className="stat-card-value">KES {stats.revenue.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-icon"><Storefront size={22} /></div>
                        <div>
                            <div className="stat-card-label">Total Sales</div>
                            <div className="stat-card-value">{stats.count}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-icon"><Package size={22} /></div>
                        <div>
                            <div className="stat-card-label">Items Sold</div>
                            <div className="stat-card-value">{stats.items}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="section-label">Sales History</div>

            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 52, borderRadius: "var(--r-lg)" }} />
                    ))}
                </div>
            ) : sales.length === 0 ? (
                <div className="empty-state" style={{ border: "1px solid var(--border)", borderRadius: "var(--r-xl)" }}>
                    No sales recorded yet. Complete a sale on the POS screen to see data here.
                </div>
            ) : (
                <div className="table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Total</th>
                                <th>M-Pesa</th>
                                <th>Items</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr key={sale.id}>
                                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                                        {new Date(sale.createdAt).toLocaleString()}
                                    </td>
                                    <td className="mono" style={{ fontWeight: 700 }}>KES {sale.total}</td>
                                    <td className="mono" style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                                        {sale.mpesaCode || "—"}
                                    </td>
                                    <td style={{ color: "var(--text-muted)" }}>{sale.items.length}</td>
                                    <td>
                                        <span className={`sync-tag ${sale.synced ? "synced" : "pending"}`}>
                                            {sale.synced ? "Synced" : "Pending"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
