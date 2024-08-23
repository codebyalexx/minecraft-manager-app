-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL DEFAULT 'Unnamed',
    "path" TEXT NOT NULL,
    "cmdline" TEXT NOT NULL,
    "autoStart" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Server" ("cmdline", "id", "label", "path") SELECT "cmdline", "id", "label", "path" FROM "Server";
DROP TABLE "Server";
ALTER TABLE "new_Server" RENAME TO "Server";
CREATE UNIQUE INDEX "Server_id_key" ON "Server"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
