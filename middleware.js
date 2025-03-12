import { NextResponse } from "next/server";

export function middleware(req) {
    const adminPaths = [
        "/admin_pages/analytics",
        "/admin_pages/reports",
        "/admin_pages/products",
        "/admin_pages/inventory",
        "/admin_pages/orders",
        "/admin_pages/reviews",
        "/admin_pages/promotional",
        "/admin_pages/users",
    ];

    // ✅ Get token & role from cookies
    const token = req.cookies.get("auth_token")?.value;
    const userRole = req.cookies.get("user_role")?.value;

    // 🔴 If no token, redirect to login
    if (!token) {
        return NextResponse.redirect(new URL("/login", req.url)); // ✅ Redirect to login instead of `/`
    }

    // 🔴 If user is not an admin, redirect to unauthorized page
    if (adminPaths.includes(req.nextUrl.pathname) && userRole !== "admin") {
        return NextResponse.redirect(new URL("/login", req.url)); // ✅ Redirect to unauthorized instead of `/`
    }


    return NextResponse.next();
}

// ✅ Apply middleware only to admin routes
export const config = {
    matcher: "/admin_pages/:path*",
};
