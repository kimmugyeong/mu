import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clubId: string; orderId: string }> }
) {
  const { orderId } = await params;
  try {
    await prisma.merchandiseOrder.delete({
      where: { id: orderId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE order error:", error);
    return NextResponse.json({ error: "신청 내역 삭제에 실패했습니다." }, { status: 500 });
  }
}
