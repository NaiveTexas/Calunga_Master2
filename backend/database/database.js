import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const databaseDirectory =
    path.dirname(
        fileURLToPath(import.meta.url)
    );

const databasePath =
    path.join(
        databaseDirectory,
        "calunga.db"
    );

const db =
    new Database(
        databasePath
    );

console.log("SQLite conectado!");
console.log("Banco:", db.name);

export default db;
