import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Handles POST /api/auth/login requests by authenticating a user with a phone number and passcode.
 *
 * @returns A JSON NextResponse with one of:
 * - Success: `{ status: "success", user: { id, fullName, phoneNumber } }`
 * - Validation error: `{ status: "error", message: "Phone number and passcode are required" }` with HTTP 400
 * - Authentication error: `{ status: "error", message: "Invalid phone number or passcode" }` with HTTP 401
 * - Server error: `{ status: "error", message }` with HTTP 500
 */
export async function POST(request: Request) {
    try {
        const { phoneNumber, passcode } = await request.json();

        if (!phoneNumber || !passcode) {
            return NextResponse.json(
                { status: "error", message: "Phone number and passcode are required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { phoneNumber },
        });

        if (!user) {
            return NextResponse.json(
                { status: "error", message: "Invalid phone number or passcode" },
                { status: 401 }
            );
        }

        const isValid = await bcrypt.compare(passcode, user.passcode);

        if (!isValid) {
            return NextResponse.json(
                { status: "error", message: "Invalid phone number or passcode" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            status: "success",
            user: {
                id: user.id,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
            },
        });
    } catch (error: any) {
        console.error("Login error:", error);
        return NextResponse.json(
            { status: "error", message: "Login failed" },
            { status: 500 }
        );
    }
}
