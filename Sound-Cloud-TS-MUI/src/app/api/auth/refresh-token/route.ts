import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { refresh_token } = body;

        if (!refresh_token) {
            return NextResponse.json(
                { error: "Missing refresh token" },
                { status: 400 }
            );
        }

        // Call the backend refresh API
        const refreshResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/auth/refresh`,
            {
                headers: {
                    'Cookie': `refresh_token=${refresh_token}`
                },
                withCredentials: true
            }
        );

        if (refreshResponse.data && refreshResponse.data.access_token) {
            // Return the new tokens
            // Note: We cannot directly update NextAuth session cookies from here
            // The axios-instance will use the new token for the current request
            // and the session will be updated when getSession is called again
            return NextResponse.json({
                access_token: refreshResponse.data.access_token,
                refresh_token: refreshResponse.data.refresh_token,
                expires_in: refreshResponse.data.expires_in,
            });
        } else {
            return NextResponse.json(
                { error: "Refresh failed" },
                { status: 401 }
            );
        }

    } catch (error) {
        console.error("Error refreshing token:", error);
        return NextResponse.json(
            { error: "Failed to refresh token" },
            { status: 401 }
        );
    }
}
