// app/api/gas/route.ts (Next.js app router)
import { NextRequest, NextResponse } from "next/server";

const BASE_URL =
  process.env.GAS_BASE_URL ??
  process.env.NEXT_PUBLIC_GAS_BASE_URL ??
  "";
const API_KEY =
  process.env.GAS_API_KEY ??
  process.env.NEXT_PUBLIC_GAS_API_KEY ??
  "";

function buildUrl(reqUrl: string) {
  const inUrl = new URL(reqUrl);
  const action = inUrl.searchParams.get("action") || "ping";

  const outUrl = new URL(BASE_URL);
  outUrl.searchParams.set("action", action);
  if (API_KEY) outUrl.searchParams.set("key", API_KEY);

  // ส่ง query อื่นๆ ต่อให้ GAS ด้วย (เช่น classId)
  inUrl.searchParams.forEach((v, k) => {
    if (k !== "action") outUrl.searchParams.set(k, v);
  });

  return outUrl.toString();
}

export async function GET(req: NextRequest) {
  if (!BASE_URL) {
    return NextResponse.json(
      { success: false, error: "GAS_BASE_URL is not configured" },
      { status: 500 },
    );
  }
  const url = buildUrl(req.url);
  const res = await fetch(url, { method: "GET" });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  if (!BASE_URL) {
    return NextResponse.json(
      { success: false, error: "GAS_BASE_URL is not configured" },
      { status: 500 },
    );
  }
  const url = buildUrl(req.url);
  const body = await req.text(); // JSON string เดิมจากฝั่ง client
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // เพื่อให้ GAS อ่านได้
    body,
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
