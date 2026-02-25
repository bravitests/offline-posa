import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, items, total, mpesaCode, createdAt } = body;

        // Sales are append-only. No conflict possible.
        const sale = await prisma.$transaction(async (tx) => {
            // Create the sale
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

            // Deduct stock
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.qty,
                        },
                        // We increment version on stock deduction too? 
                        // Usually stock deduction from sales is automatic and doesn't conflict with manual price/info edits?
                        // Actually, keep it simple: only manual edits increment the explicit version for UI conflicts.
                    },
                });
            }

            return newSale;
        });

        return NextResponse.json({ status: "success", sale });
    } catch (error: any) {
        console.error("Sale sync error:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const updatedAfter = searchParams.get("updatedAfter");

    const sales = await prisma.sale.findMany({
        where: updatedAfter
            ? {
                createdAt: {
                    gt: new Date(Number(updatedAfter)),
                },
            }
            : {},
        include: {
            items: true,
        },
    });

    return NextResponse.json(sales);
}
