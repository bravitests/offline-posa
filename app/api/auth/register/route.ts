import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

/**
 * Handle registration requests by validating input, creating a new user, and returning the created user's basic info.
 *
 * Validates that `fullName`, `phoneNumber`, `passcode`, and `repeatPasscode` are present, that the passcodes match and meet a minimum length, and that the phone number is not already registered. On success, creates the user with a hashed passcode.
 *
 * @param request - Incoming Request whose JSON body must include `fullName`, `phoneNumber`, `passcode`, and `repeatPasscode`
 * @returns A NextResponse JSON object. On success: `{ status: "success", user: { id, fullName, phoneNumber } }`. On validation or conflict: `{ status: "error", message }` with HTTP status 400 or 409. On unexpected failure: `{ status: "error", message }` with HTTP status 500.
 */
export async function POST(request: Request) {
    try {
        let { fullName, phoneNumber, passcode, repeatPasscode } = await request.json();

        // Type validation and normalization
        if (typeof fullName !== "string" || typeof phoneNumber !== "string" || 
            typeof passcode !== "string" || typeof repeatPasscode !== "string") {
            return NextResponse.json(
                { status: "error", message: "All fields must be strings" },
                { status: 400 }
            );
        }

        fullName = fullName.trim();
        phoneNumber = phoneNumber.replace(/\D/g, "");
        passcode = passcode.trim();
        repeatPasscode = repeatPasscode.trim();

        // Validation after normalization
        if (!fullName || !phoneNumber || !passcode || !repeatPasscode) {
            return NextResponse.json(
                { status: "error", message: "All fields are required" },
                { status: 400 }
            );
        }

        if (phoneNumber.length !== 10) {
            return NextResponse.json(
                { status: "error", message: "Phone number must be exactly 10 digits" },
                { status: 400 }
            );
        }

        if (passcode.length < 4) {
            return NextResponse.json(
                { status: "error", message: "Passcode must be at least 4 characters" },
                { status: 400 }
            );
        }

        if (passcode !== repeatPasscode) {
            return NextResponse.json(
                { status: "error", message: "Passcodes do not match" },
                { status: 400 }
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
        
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { status: "error", message: "Phone number already registered" },
                { status: 409 }
            );
        }
        
        return NextResponse.json(
            { status: "error", message: "Registration failed" },
            { status: 500 }
        );
    }
}
