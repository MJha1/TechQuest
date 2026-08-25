-- CreateEnum
CREATE TYPE "Interest" AS ENUM ('GAMES', 'SCIENCE', 'STORIES', 'SPORTS', 'ART', 'BUILDING');

-- AlterEnum
BEGIN;
CREATE TYPE "AgeBand_new" AS ENUM ('AGE_8_9', 'AGE_10_11', 'AGE_12');
ALTER TABLE "child" ALTER COLUMN "ageBand" TYPE "AgeBand_new" USING ("ageBand"::text::"AgeBand_new");
ALTER TYPE "AgeBand" RENAME TO "AgeBand_old";
ALTER TYPE "AgeBand_new" RENAME TO "AgeBand";
DROP TYPE "public"."AgeBand_old";
COMMIT;

-- AlterTable
ALTER TABLE "child" ADD COLUMN     "interests" "Interest"[];

