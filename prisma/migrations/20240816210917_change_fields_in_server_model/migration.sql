-- CreateTable
CREATE TABLE "server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL DEFAULT 'Unnamed',
    "path" TEXT NOT NULL,
    "cmdline" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "server_id_key" ON "server"("id");
