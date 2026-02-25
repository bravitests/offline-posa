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
