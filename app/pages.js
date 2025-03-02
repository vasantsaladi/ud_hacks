import { NextResponse } from "next/server";

// Redirect to dashboard by default
export async function GET() {
  return NextResponse.redirect(
    new URL(
      "/focus-planner",
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    )
  );
}

export const pages = [
  { name: "Home", href: "/" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Analytics", href: "/analytics" },
  { name: "Assignments", href: "/assignments" },
  { name: "Focus Planner", href: "/focus-planner" },
  { name: "Smalltalk", href: "/smalltalk" },
];
