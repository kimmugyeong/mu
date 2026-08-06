import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clubs);
  } catch (error) {
    console.error("Get clubs error", error);
    return NextResponse.json({ error: "클럽 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address, city, description, contactPhone, contactEmail } = body;

    const club = await prisma.club.create({
      data: {
        name,
        address,
        city,
        description,
        contactPhone,
        contactEmail,
      },
    });

    return NextResponse.json(club);
  } catch (error) {
    console.error("Create club error", error);
    return NextResponse.json({ error: "클럽 생성에 실패했습니다." }, { status: 500 });
  }
}
