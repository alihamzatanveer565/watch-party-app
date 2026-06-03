-- CreateEnum
CREATE TYPE "RoomVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN "visibility" "RoomVisibility" NOT NULL DEFAULT 'PRIVATE';
