import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const updatedAfter = searchParams.get("updatedAfter");

    // Validate updatedAfter parameter if present
    if (updatedAfter !== null) {
        const timestamp = Number(updatedAfter);
        if (!Number.isFinite(timestamp)) {
            return NextResponse.json(
                { status: "error", message: "updatedAfter must be a valid numeric timestamp" },
                { status: 400 }
            );
        }
    }

    const products = await prisma.product.findMany({
        where: updatedAfter
            ? {
                updatedAt: {
                    gte: new Date(Number(updatedAfter)),
                },
            }
            : {},
        orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    });

    // Note: Clients must deduplicate records with the same updatedAt timestamp
    // to handle partial syncs correctly (items at boundary may be reshipped)
    return NextResponse.json(products);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, name, price, stock } = body;

        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { status: "error", message: "id is required" },
                { status: 400 }
            );
        }
        if (typeof name !== "string" || name.trim() === "") {
            return NextResponse.json(
                { status: "error", message: "name must be a non-empty string" },
                { status: 400 }
            );
        }
        if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
            return NextResponse.json(
                { status: "error", message: "price must be a finite number >= 0" },
                { status: 400 }
            );
        }
        if (typeof stock !== "number" || stock < 0 || !Number.isInteger(stock)) {
            return NextResponse.json(
                { status: "error", message: "stock must be a non-negative integer" },
                { status: 400 }
            );
        }

        // Upsert for idempotency — if already exists, just return it
        const product = await prisma.product.upsert({
            where: { id },
            update: {},
            create: {
                id,
                name: name.trim(),
                price,
                stock,
                version: 1,
            },
        });

        return NextResponse.json({ status: "success", product });
    } catch (error: any) {
        console.error("Product create error:", error);
        // Handle unique constraint on name
        if (error.code === "P2002") {
            return NextResponse.json(
                { status: "error", message: "A product with this name already exists" },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { status: "error", message: "Failed to create product" },
            { status: 500 }
        );
    }
}
