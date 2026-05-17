import { sendRequest } from "@/utils/api";
import {AuthOptions, Session} from "next-auth";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials";
import {JWT} from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import dayjs from "dayjs";

export const authOptions: AuthOptions = {
    secret: process.env.NEXTAUTH_SECRET as string,
    providers: [
        CredentialsProvider({
            name: "Gmail",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "jsmith" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                const res = await sendRequest<IBackendRes<ILoginRes>>({
                    url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/auth/login`,
                    method:"POST",
                    body:{
                        email: credentials?.username,
                        password: credentials?.password
                    },
                })
                if (res && res.data) {
                    // Any object returned will be saved in `user` property of the JWT
                    return res.data as any
                } else {
                    // If you return null then an error will be displayed advising the user to check their details.
                    throw new Error(res.error != null ? res.message as string : "")

                    // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
                }
            }
        }),
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            authorization: {
                params: {
                    scope: "read:user user:email"
                }
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_ID!,
            clientSecret: process.env.GOOGLE_SECRET!,
            // Bạn có thể thêm authorization để ép người dùng chọn lại tài khoản nếu muốn
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_ID!,
            clientSecret: process.env.FACEBOOK_SECRET!,
            userinfo: {
                params: { fields: "id,name,email,picture" }, // Ép Facebook trả về các trường này
            },
        }),

    ],
    callbacks: {
        async jwt({ token, user, account, profile, trigger, session }) {
            // Initial sign in - set token from login response
            if (trigger === "signIn") {

                if(account?.provider !== "credentials"){
                    const res = await sendRequest<IBackendRes<ILoginRes>>({
                        url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/auth/social-login`,
                        method: "POST",
                        body: {
                            accessToken: account?.access_token,
                            type: account?.provider?.toLocaleUpperCase(),
                        }
                    })
                    if (res.data) {
                        const data = res.data as Session

                        token.access_token = data.access_token;
                        token.refresh_token = data.refresh_token;
                        token.user = data.user;
                        token.access_expire = dayjs(new Date()).add(+(process.env.TOKEN_EXPIRE_NUMBER as string), (process.env.TOKEN_EXPIRE_UNIT as any)).unix()
                        token.error = undefined;
                    }
                } else if(user){

                    const res = user as unknown as ILoginRes;
                    token.access_token = res.access_token;
                    token.refresh_token = res.refresh_token;
                    token.user = res.user;
                    // Unify to use unix seconds
                    token.access_expire = dayjs(new Date()).add(+(process.env.TOKEN_EXPIRE_NUMBER as string), (process.env.TOKEN_EXPIRE_UNIT as any)).unix()
                    token.error = undefined;
                }
                return token;
            }
            // Update session manually
            if (trigger === "update" && session) {
                token.user = {
                    ...token.user,
                    ...session.user,
                };

                return token;
            }
            const isTimeAfter = dayjs(dayjs(new Date())).isAfter(dayjs(dayjs.unix((token.access_expire as number))));
            if(isTimeAfter){
                return refreshAccessToken(token)
            }
            return token;
            // Check if token is expired or about to expire
            // If token is still valid (has more than 1 minute), return it
            // if (token.access_expire && Date.now() < (token.access_expire as number)) {
            //     return token;
            // }

            // Token has expired or is about to expire, refresh it
            // This handles both tokens that are about to expire and already expired
            // return await refreshAccessToken(token);
        },
        async session({ session, token }) {
            if (token) {
                session.user = token.user;
                session.access_token = token.access_token;
                session.refresh_token = token.refresh_token;
                session.expires_in = token.access_expire;
                session.error = token.error;
            }
            return session;
        }
    },
}
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }



async function refreshAccessToken(token: JWT) {
    try {
        if (!token.refresh_token) {
            throw new Error("No refresh token available");
        }

        const res = await sendRequest<IBackendRes<ILoginRes>>({
            url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/auth/refresh`,
            method: 'POST',
            body: {
                refresh_token: token.refresh_token
            }
        });

        if (res && res.data) {
            const data = res.data as Session;
            console.log(">>> Refresh token success");

            return {
                ...token,
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                access_expire: dayjs(new Date()).add(+(process.env.TOKEN_EXPIRE_NUMBER as string), (process.env.TOKEN_EXPIRE_UNIT as any)).unix(),
                error: ""
            }
        }

        return {
            ...token,
            error: "RefreshAccessTokenError",
        }

    } catch (error) {
        console.error(">>> Error in refreshAccessToken:", error);
        return {
            ...token,
            error: "RefreshAccessTokenError"
        }
    }
}