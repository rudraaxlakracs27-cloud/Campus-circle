CREATE TABLE IF NOT EXISTS "EventRsvp" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRsvp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EventRsvp_postId_userId_key" ON "EventRsvp"("postId", "userId");
CREATE INDEX IF NOT EXISTS "EventRsvp_userId_createdAt_idx" ON "EventRsvp"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "EventRsvp_postId_status_idx" ON "EventRsvp"("postId", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'EventRsvp_postId_fkey'
  ) THEN
    ALTER TABLE "EventRsvp"
      ADD CONSTRAINT "EventRsvp_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "EventPost"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'EventRsvp_userId_fkey'
  ) THEN
    ALTER TABLE "EventRsvp"
      ADD CONSTRAINT "EventRsvp_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
