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

    // ✅ Ensure `auth_token` is present in cookies
    const token = req.cookies.get("auth_token")?.value;
    const userRole = req.cookies.get("user_role")?.value;

    if (!token) {
        console.log("🔴 No token found! Redirecting to login.");
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (adminPaths.includes(req.nextUrl.pathname) && userRole !== "admin") {
        console.log("🔴 Unauthorized! User is not an admin.");
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

// ✅ Apply middleware only to admin pages
export const config = {
    matcher: "/admin_pages/:path*",
};
