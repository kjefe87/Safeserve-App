import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// Called by the dashboard's <form method="post">, so respond with a redirect
// (303 turns the POST into a GET of /login) instead of raw JSON.
export async function POST(request) {
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
