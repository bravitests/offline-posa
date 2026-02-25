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

        const currentProduct = await prisma.product.findUnique({
            where: { id },
        });

        if (!currentProduct) {
            return NextResponse.json({ status: "error", message: "Product not found" }, { status: 404 });
        }

        // Version-gated conflict resolution
        if (incomingVersion !== currentProduct.version) {
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

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name,
                price,
                stock,
                version: currentProduct.version + 1,
            },
        });

        return NextResponse.json({ status: "success", product: updatedProduct });
    } catch (error: any) {
        console.error("Product update error:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
