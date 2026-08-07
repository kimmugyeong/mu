import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clubId: string; merchandiseId: string }> }
) {
  const { merchandiseId } = await params;
  try {
    const body = await request.json();
    const dataToUpdate: any = {};

    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.price !== undefined) dataToUpdate.price = Number(body.price);
    if (body.imageUrl !== undefined) dataToUpdate.imageUrl = body.imageUrl;
    if (body.colors !== undefined) dataToUpdate.colors = body.colors;
    if (body.sizes !== undefined) dataToUpdate.sizes = body.sizes;

    const updated = await prisma.merchandise.update({
      where: { id: merchandiseId },
      data: dataToUpdate,
      include: {
        orders: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH merchandise error:", error);
    return NextResponse.json({ error: "상품 수정에 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clubId: string; merchandiseId: string }> }
) {
  const { merchandiseId } = await params;
  try {
    await prisma.merchandise.delete({
      where: { id: merchandiseId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE merchandise error:", error);
    return NextResponse.json({ error: "상품 삭제에 실패했습니다." }, { status: 500 });
  }
}
