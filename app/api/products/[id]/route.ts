import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Update a product by id using optimistic concurrency control based on the product's `version`.
 *
 * Expects a JSON request body with `name` (non-empty string), `price` (finite number >= 0), `stock` (non-negative integer),
 * and `version` (number) to perform a conditional update that increments `version` on success.
 *
 * @param params - Route parameters promise resolving to an object with `id` (the product id to update)
 * @returns A JSON response object:
 * - Success (200): `{ status: "success", product }` with the updated product.
 * - Conflict (409): `{ status: "conflict", message, currentVersion, serverData }` when the provided `version` does not match the server version.
 * - Validation error (400): `{ status: "error", message }` for invalid or missing input fields.
 * - Not found (404): `{ status: "error", message }` when the product does not exist.
 * - Server error (500): `{ status: "error", message }` for unexpected failures.
 */
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

        if (typeof incomingVersion !== "number") {
            return NextResponse.json(
                { status: "error", message: "version is required and must be a number" },
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
        return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
    }
}
