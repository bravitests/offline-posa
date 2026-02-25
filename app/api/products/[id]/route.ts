import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, price, stock, version: incomingVersion } = body;

        // Validate incoming payload
        if (typeof name !== "string" || name.trim() === "") {
            return NextResponse.json(
                { status: "error", message: "name must be a non-empty string" },
                { status: 400 }
            );
        }

        if (typeof price !== "number" || price < 0) {
            return NextResponse.json(
                { status: "error", message: "price must be a number >= 0" },
                { status: 400 }
            );
        }

        if (typeof stock !== "number" || stock < 0 || !Number.isInteger(stock)) {
            return NextResponse.json(
                { status: "error", message: "stock must be a non-negative integer" },
                { status: 400 }
            );
        }

        if (incomingVersion !== undefined && typeof incomingVersion !== "number") {
            return NextResponse.json(
                { status: "error", message: "version must be a number if provided" },
                { status: 400 }
            );
        }

        // Atomic conditional update: version-gated with version check in where clause
        const updateResult = await prisma.product.updateMany({
            where: {
                id,
                version: incomingVersion,
            },
            data: {
                name,
                price,
                stock,
                version: {
                    increment: 1,
                },
            },
        });

        // Check if update succeeded (affected rows > 0)
        if (updateResult.count === 0) {
            // Fetch current product to return conflict details
            const currentProduct = await prisma.product.findUnique({
                where: { id },
            });

            if (!currentProduct) {
                return NextResponse.json({ status: "error", message: "Product not found" }, { status: 404 });
            }

            return NextResponse.json(
                {
                    status: "conflict",
                    message: "Conflict detected: product has been updated by another device.",
                    currentVersion: currentProduct.version,
                    serverData: currentProduct,
                },
                { status: 409 }
            );
        }

        // Fetch the updated product to return to client
        const updatedProduct = await prisma.product.findUnique({
            where: { id },
        });

        return NextResponse.json({ status: "success", product: updatedProduct });
    } catch (error: any) {
        console.error("Product update error:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
