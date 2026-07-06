import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getAuthCookie, delay } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await delay(1000);

  try {
    const { password } = await req.json();

    if (!password || !process.env.ACCESS_PASSWORD) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    const validPassword = process.env.ACCESS_PASSWORD;

    const encoder = new TextEncoder();
    const pwBuf = encoder.encode(password);
    const validBuf = encoder.encode(validPassword);

    if (pwBuf.length !== validBuf.length) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    let equal = true;
    for (let i = 0; i < pwBuf.length; i++) {
      if (pwBuf[i] !== validBuf[i]) equal = false;
    }

    if (!equal) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    const token = await createSessionToken();

    const response = NextResponse.json({ ok: true });
    response.cookies.set(getAuthCookie(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
}
