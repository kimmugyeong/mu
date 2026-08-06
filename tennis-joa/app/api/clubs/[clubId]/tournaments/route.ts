import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTournamentGroups } from "@/lib/tournament";

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const tournaments = await prisma.monthlyTournament.findMany({ where: { clubId }, orderBy: { eventDate: "desc" }, include: { groups: true } });
  return NextResponse.json(tournaments);
}

export async function POST(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const body = await request.json();
  const tournament = await prisma.monthlyTournament.create({
    data: {
      clubId,
      title: body.title,
      eventDate: new Date(body.eventDate),
      status: body.status ?? "UPCOMING",
      groups: {
        create: buildTournamentGroups(body.players ?? [], 3).map((groupPlayers, index) => ({
          groupName: `${index + 1}그룹`,
          players: {
            create: groupPlayers.map((name: string) => ({ displayName: name })),
          },
        })),
      },
    },
  });
  return NextResponse.json(tournament);
}
