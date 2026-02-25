import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const { fullName, phoneNumber, passcode, repeatPasscode } = await request.json();

        if (!fullName || !phoneNumber || !passcode || !repeatPasscode) {
            return NextResponse.json(
                { status: "error", message: "All fields are required" },
                { status: 400 }
            );
        }

        if (passcode !== repeatPasscode) {
            return NextResponse.json(
                { status: "error", message: "Passcodes do not match" },
                { status: 400 }
            );
        }

        if (passcode.length < 4) {
            return NextResponse.json(
                { status: "error", message: "Passcode must be at least 4 characters" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber },
        });

        if (existingUser) {
            return NextResponse.json(
                { status: "error", message: "Phone number already registered" },
                { status: 409 }
            );
        }

        const hashedPasscode = await bcrypt.hash(passcode, 10);

        const user = await prisma.user.create({
            data: {
                fullName,
                phoneNumber,
                passcode: hashedPasscode,
            },
        });

        return NextResponse.json({
            status: "success",
            user: {
                id: user.id,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
            },
        });
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { status: "error", message: error.message || "Registration failed" },
            { status: 500 }
        );
    }
}
