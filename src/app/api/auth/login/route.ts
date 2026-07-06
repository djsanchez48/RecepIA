import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || !process.env.ACCESS_PASSWORD) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    if (password !== process.env.ACCESS_PASSWORD) {
      await new Promise((r) => setTimeout(r, 1000));
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    const token = await createSessionToken();

    const response = NextResponse.json({ ok: true });
    response.cookies.set(getAuthCookie(), token, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
}
