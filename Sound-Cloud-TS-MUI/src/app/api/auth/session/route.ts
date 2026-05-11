import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session) {
            return NextResponse.json(
                { error: "No session found" },
                { status: 401 }
            );
        }

        return NextResponse.json(session);
    } catch (error) {
        console.error("Error getting session:", error);
        return NextResponse.json(
            { error: "Failed to get session" },
            { status: 500 }
        );
    }
}

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

        // Note: NextAuth sessions are encrypted and managed by NextAuth.
        // We cannot directly update the session cookies from the client side.
        // The proper way is to trigger a session refresh which will cause
        // the JWT callback to run and update the tokens.
        
        // For now, we'll return the new tokens and let the client-side
        // handle the immediate request retry. The session will be updated
        // on the next getSession call or page refresh.

        return NextResponse.json({
            access_token,
            refresh_token,
            expires_in,
            message: "Tokens received. Session will be updated on next refresh."
        });

    } catch (error) {
        console.error("Error updating session:", error);
        return NextResponse.json(
            { error: "Failed to update session" },
            { status: 500 }
        );
    }
}
