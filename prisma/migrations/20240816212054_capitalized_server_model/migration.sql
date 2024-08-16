/*
  Warnings:

  - You are about to drop the `server` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "server";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL DEFAULT 'Unnamed',
    "path" TEXT NOT NULL,
    "cmdline" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Server_id_key" ON "Server"("id");
