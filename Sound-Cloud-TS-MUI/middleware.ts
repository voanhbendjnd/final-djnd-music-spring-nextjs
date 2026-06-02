// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    // Hàm này sẽ chạy sau khi user đã xác thực (đã có token)
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const token = req.nextauth.token;

        // Ép kiểu role từ token (vì mặc định next-auth định nghĩa role là string hoặc tùy chỉnh)
        const userRole = token?.role as string | undefined;

        // 1. Chặn các trang Quản trị (Dashboard) nếu không phải ADMIN
        if (pathname.startsWith("/dashboard") && userRole !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
        }

        // 2. Chặn trang Upload nếu không phải CREATOR hoặc ADMIN
        // if (pathname.startsWith("/track/upload") && userRole !== "CREATOR" && userRole !== "ADMIN") {
        //     return NextResponse.redirect(new URL("/unauthorized", req.url));
        // }

        // Cho phép đi tiếp nếu thỏa mãn các điều kiện trên
        return NextResponse.next();
    },
    {
        pages: {
            signIn: '/auth/signin'
        },
        callbacks: {
            // Hàm kiểm tra xem user có quyền vào các đường dẫn trong matcher không
            authorized: ({ token, req }) => {
                // Nếu không có token -> Bắt buộc phải login (NextAuth tự chuyển hướng về /auth/signin)
                if (!token) return false;

                // Nếu có token rồi, trả về true để nhảy vào hàm middleware xử lý Role ở phía trên
                return true;
            }
        }
    }
);
// must be login
export const config = {
    matcher: [
        "/playlist/:path*",
        "/like/:path*",
        "/track/upload/:path*",
        "/dashboard/:path*"
    ]
};