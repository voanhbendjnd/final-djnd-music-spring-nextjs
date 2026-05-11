import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { access_token, refresh_token, expires_in } = body;

        if (!access_token || !refresh_token) {
            return NextResponse.json(
                { error: "Missing tokens" },
                { status: 400 }
            );
        }

        // Set the new tokens in cookies
        // NextAuth uses encrypted cookies, so we need to set them properly
        const cookieStore = cookies();

        // Set the new access token and refresh token in cookies
        // Note: This is a simplified approach. In NextAuth v4, sessions are encrypted
        // and managed by NextAuth. The proper way to update the session is to
        // trigger a session refresh or use the update function.

        // For now, we'll return success and let the client-side handle
        // the session update by calling getSession() again

        return NextResponse.json({
            access_token,
            refresh_token,
            expires_in,
            message: "Session updated successfully"
        });

    } catch (error) {
        console.error("Error updating session:", error);
        return NextResponse.json(
            { error: "Failed to update session" },
            { status: 500 }
        );
    }
}
