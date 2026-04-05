import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth, ensureAuthReady } from "@/lib/auth";

const handlers = auth ? toNextJsHandler(auth) : null;

function authNotConfigured() {
  return NextResponse.json(
    { error: "Authentication is not configured." },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  if (!handlers || !(await ensureAuthReady())) {
    return authNotConfigured();
  }

  return handlers.GET(request);
}

export async function POST(request: Request) {
  if (!handlers || !(await ensureAuthReady())) {
    return authNotConfigured();
  }

  return handlers.POST(request);
}

export async function PATCH(request: Request) {
  if (!handlers || !(await ensureAuthReady())) {
    return authNotConfigured();
  }

  return handlers.PATCH(request);
}

export async function PUT(request: Request) {
  if (!handlers || !(await ensureAuthReady())) {
    return authNotConfigured();
  }

  return handlers.PUT(request);
}

export async function DELETE(request: Request) {
  if (!handlers || !(await ensureAuthReady())) {
    return authNotConfigured();
  }

  return handlers.DELETE(request);
}
