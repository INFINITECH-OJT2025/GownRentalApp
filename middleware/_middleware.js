// pages/_middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
    const response = NextResponse.next();
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
}

// import { NextResponse } from 'next/server';

// export function middleware(req) {
//     const adminPaths = [
//         "/admin_pages/analytics",
//         "/admin_pages/reports",
//         "/admin_pages/products",
//         "/admin_pages/inventory",
//         "/admin_pages/orders",
//         "/admin_pages/reviews",
//         "/admin_pages/promotional",
//         "/admin_pages/users",
//     ];

//     const token = req.cookies.get("auth_token")?.value;

//     if (!token) {
//         return NextResponse.redirect(new URL("/login", req.url));
//     }

//     try {
//         const jwt = require("jsonwebtoken");
//         const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);

//         if (adminPaths.includes(req.nextUrl.pathname) && decoded.role !== "admin") {
//             return NextResponse.redirect(new URL("/unauthorized", req.url));
//         }
//     } catch (error) {
//         return NextResponse.redirect(new URL("/login", req.url));
//     }

//     return NextResponse.next();
// }

// // ✅ Apply middleware only to admin routes
// export const config = {
//     matcher: "/admin_pages/:path*",
// };
