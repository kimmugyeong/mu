import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const user = await prisma.user.findUnique({ where: { username: "testuser123" } });
console.log(JSON.stringify(user));
await prisma.$disconnect();
