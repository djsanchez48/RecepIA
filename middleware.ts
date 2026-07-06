import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, getAuthCookie } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/acceso",
  "/api/auth/login",
  "/manifest.json",
  "/sw.js",
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/icons/")) return true;
  if (pathname.endsWith(".svg") || pathname.endsWith(".png") || pathname.endsWith(".ico")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const cookieName = getAuthCookie();
  const token = request.cookies.get(cookieName)?.value;

  if (token && await verifySessionToken(token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const loginUrl = new URL("/acceso", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
