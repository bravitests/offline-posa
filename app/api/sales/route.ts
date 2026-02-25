import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Handle creating a sale: validate payload, enforce idempotency by `id`, create the sale if new, and decrement product stock.
 *
 * Performs thorough validation of `items`, `total`, `id`, and `createdAt`. If a sale with the provided `id` already exists, the existing sale is returned without modifying stock. When creating a new sale, each item's product is checked for existence and sufficient stock; stock is then decremented with a conditional update to detect concurrent modifications.
 *
 * @param request - The incoming HTTP request containing a JSON body with `id`, `items`, `total`, `mpesaCode`, and `createdAt`.
 * @returns A JSON response object:
 * - On success: `{ status: "success", sale }` (the created or existing sale).
 * - Validation errors: 400 with `{ status: "error", message }`.
 * - Insufficient stock: 409 with `{ status: "error", message }`.
 * - Missing products: 422 with `{ status: "error", message }`.
 * - Other failures: 500 with `{ status: "error", message }`.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, items, total, mpesaCode, createdAt } = body;

        // Validate items before processing
        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { status: "error", message: "items must be a non-empty array" },
                { status: 400 }
            );
        }

        if (typeof total !== "number" || !Number.isFinite(total) || total < 0) {
            return NextResponse.json(
                { status: "error", message: "total must be a finite non-negative number" },
                { status: 400 }
            );
        }

        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { status: "error", message: "id must be a non-empty string" },
                { status: 400 }
            );
        }

        const timestamp = Number(createdAt);
        if (!Number.isFinite(timestamp) || timestamp <= 0) {
            return NextResponse.json(
                { status: "error", message: "createdAt must be a valid timestamp" },
                { status: 400 }
            );
        }

        for (const item of items) {
            if (!item.productId || typeof item.productId !== "string") {
                return NextResponse.json(
                    { status: "error", message: "each item must have a valid productId" },
                    { status: 400 }
                );
            }
            if (typeof item.price !== "number" || !Number.isFinite(item.price) || item.price <= 0) {
                return NextResponse.json(
                    { status: "error", message: "each item price must be a finite positive number" },
                    { status: 400 }
                );
            }
            if (typeof item.qty !== "number" || item.qty <= 0 || !Number.isInteger(item.qty)) {
                return NextResponse.json(
                    { status: "error", message: "each item qty must be a positive integer" },
                    { status: 400 }
                );
            }
        }

        // Sales are append-only. No conflict possible.
        const sale = await prisma.$transaction(async (tx) => {
            // Check for existing sale with this id (idempotency)
            const existingSale = await tx.sale.findUnique({
                where: { id },
                include: { items: true },
            });

            if (existingSale) {
                return existingSale;
            }

            // Create the sale (only if it doesn't exist)
            const newSale = await tx.sale.create({
                data: {
                    id,
                    total,
                    mpesaCode,
                    createdAt: new Date(createdAt),
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            qty: item.qty,
                            price: item.price,
                        })),
                    },
                },
            });

            // Deduct stock (only when creating new sale, not on retries)
            // First validate stock availability, then conditionally update
            for (const item of items) {
                // Fetch current product stock
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) {
                    throw new Error(`Product with id ${item.productId} not found`);
                }

                if (product.stock < item.qty) {
                    throw new Error(
                        `Insufficient stock for product ${item.productId}: available=${product.stock}, requested=${item.qty}`
                    );
                }

                // Conditionally update stock only if sufficient inventory exists
                const updateResult = await tx.product.updateMany({
                    where: {
                        id: item.productId,
                        stock: {
                            gte: item.qty,
                        },
                    },
                    data: {
                        stock: {
                            decrement: item.qty,
                        },
                    },
                });

                if (updateResult.count === 0) {
                    throw new Error(
                        `Stock check failed for product ${item.productId}: concurrent update detected`
                    );
                }
            }

            return newSale;
        });

        return NextResponse.json({ status: "success", sale });
    } catch (error: any) {
        console.error("Sale sync error:", error);
        
        const errorMsg = error.message || "";
        if (errorMsg.includes("Insufficient stock") || errorMsg.includes("Stock check failed")) {
            return NextResponse.json(
                { status: "error", message: "Insufficient stock for one or more items" },
                { status: 409 }
            );
        }
        if (errorMsg.includes("not found")) {
            return NextResponse.json(
                { status: "error", message: "One or more products not found" },
                { status: 422 }
            );
        }
        
        return NextResponse.json(
            { status: "error", message: "Failed to process sale" },
            { status: 500 }
        );
    }
}

/**
 * Retrieve sales, optionally filtered to those created after a provided timestamp.
 *
 * Validates the optional `updatedAfter` query parameter as a non-negative timestamp. If valid or not provided, returns sales including their items; if invalid, returns a 400 error response.
 *
 * @param request - HTTP request; may include `updatedAfter` query parameter (milliseconds since epoch)
 * @returns On success, a JSON array of sales with their `items`. On invalid `updatedAfter`, a JSON error object with `status: "error"` and an explanatory `message` and HTTP status 400.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const updatedAfter = searchParams.get("updatedAfter");

    if (updatedAfter) {
        const timestamp = Number(updatedAfter);
        if (!Number.isFinite(timestamp) || timestamp < 0) {
            return NextResponse.json(
                { status: "error", message: "updatedAfter must be a valid timestamp" },
                { status: 400 }
            );
        }
    }

    const sales = updatedAfter
        ? await prisma.sale.findMany({
            where: {
                createdAt: {
                    gt: new Date(Number(updatedAfter)),
                },
            },
            include: {
                items: true,
            },
        })
        : await prisma.sale.findMany({
            include: {
                items: true,
            },
        });

    return NextResponse.json(sales);
}
