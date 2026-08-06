import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, password } = body;

    if (!name || !username || !password) {
      return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });
    }

    const normalizedUsername = username.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { username: normalizedUsername } });
    if (existingUser) {
      return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        username: normalizedUsername,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ user: { id: user.id, name: user.name, username: user.username } });
  } catch (error) {
    console.error("Signup error", error);
    return NextResponse.json({ error: "회원가입에 실패했습니다." }, { status: 500 });
  }
}
