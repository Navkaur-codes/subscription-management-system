import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { parseFilters, reportCsv } from "@/lib/insights/reports";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s || s.role === "CUSTOMER") return new NextResponse("Forbidden", { status: 403 });
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const filters = parseFilters(sp);
  const csv = await reportCsv(filters);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filters.view}-report.csv"`,
    },
  });
}
