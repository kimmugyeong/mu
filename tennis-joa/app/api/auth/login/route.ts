import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "아이디와 비밀번호를 입력해주세요." }, { status: 400 });
    }

    const normalizedUsername = username.toLowerCase();
    let user = await prisma.user.findUnique({ where: { username: normalizedUsername } });
    if (!user && normalizedUsername === "admin") {
      const adminPassword = await bcrypt.hash("admin1234", 10);
      user = await prisma.user.create({
        data: {
          name: "관리자",
          username: "admin",
          password: adminPassword,
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "잘못된 사용자 정보입니다." }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ error: "잘못된 사용자 정보입니다." }, { status: 401 });
    }

    const isAdmin = normalizedUsername === "admin";
    return NextResponse.json({
      user: {
        id: user.id === "admin" || normalizedUsername === "admin" ? "admin" : user.id,
        name: user.name,
        username: user.username,
        role: isAdmin ? "admin" : "user",
        isAdmin,
      },
    });
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json({ error: "로그인에 실패했습니다." }, { status: 500 });
  }
}
