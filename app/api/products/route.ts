import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const updatedAfter = searchParams.get("updatedAfter");

    const products = await prisma.product.findMany({
        where: updatedAfter
            ? {
                updatedAt: {
                    gt: new Date(Number(updatedAfter)),
                },
            }
            : {},
    });

    return NextResponse.json(products);
}
