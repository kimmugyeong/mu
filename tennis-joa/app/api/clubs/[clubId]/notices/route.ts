import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const notices = await prisma.clubNotice.findMany({
    where: { clubId },
    orderBy: [{ isImportant: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(notices);
}

export async function POST(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const body = await request.json();
  const notice = await prisma.clubNotice.create({
    data: {
      clubId,
      title: body.title,
      content: body.content,
      isImportant: Boolean(body.isImportant),
      authorId: body.authorId ?? null,
    },
  });
  return NextResponse.json(notice);
}
