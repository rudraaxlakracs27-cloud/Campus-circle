import { PrismaClient } from "@prisma/client";
import seedDatabase from "../data/store.json" with { type: "json" };
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();
const demoPassword = "campus123";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.eventRsvp.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.postInteraction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.eventPost.deleteMany();
  await prisma.user.deleteMany();
  await prisma.university.deleteMany();

  await prisma.university.createMany({
    data: seedDatabase.universities
  });

  await prisma.user.createMany({
    data: seedDatabase.users.map((user) => ({
      ...user,
      passwordHash: hashPassword(demoPassword),
      interests: JSON.stringify(user.interests)
    }))
  });

  await prisma.eventPost.createMany({
    data: seedDatabase.posts.map((post) => ({
      ...post,
      eventDate: new Date(post.eventDate),
      visibility: post.visibility ?? "PUBLIC",
      createdAt: new Date(post.createdAt)
    }))
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
