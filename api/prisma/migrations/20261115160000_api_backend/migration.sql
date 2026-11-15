ALTER TABLE "Book" RENAME COLUMN "copiesAvailable" TO "totalCopies";
ALTER TABLE "Book" DROP COLUMN "publishedYear";
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
