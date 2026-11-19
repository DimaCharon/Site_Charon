/** Run locally as the authenticated repository owner. A secret is only ever piped
 * to GitHub CLI's stdin. Nothing secret is written to the working tree. */
import { randomBytes, pbkdf2Sync, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
if (process.stdin.isTTY) {
  console.error("Передайте новый код через защищённый stdin. См. SECURITY.md.");
  process.exit(1);
}
let pin = "";
for await (const chunk of process.stdin) {
  pin += chunk;
  if (pin.length > 256) throw new Error("Слишком длинный ввод.");
}
pin = pin.replace(/[\r\n]+$/, "");
if (pin.length < 4 || pin.length > 128 || /[\r\n]/.test(pin))
  throw new Error("Код: от 4 до 128 символов.");
const salt = randomBytes(16),
  iterations = 310000,
  key = pbkdf2Sync(pin, salt, iterations, 32, "sha256");
pin = "";
const verifier = createHash("sha256").update(key).digest("hex");
const result = spawnSync(
  "gh",
  [
    "secret",
    "set",
    "CHARON_OWNER_SIGNING_V1",
    "--repo",
    "DimaCharon/Site_Charon",
  ],
  { input: key.toString("hex"), stdio: ["pipe", "inherit", "inherit"] },
);
key.fill(0);
if (result.error || result.status !== 0)
  throw new Error(
    "Не удалось обновить GitHub Secret. Публичный verifier не изменён.",
  );
await writeFile(
  "src/config/owner-gate.json",
  JSON.stringify(
    { salt: salt.toString("hex"), iterations, verifier },
    null,
    2,
  ) + "\n",
);
console.log(
  "Секрет обновлён. Закоммитьте новый публичный verifier и отправьте его в main. Старые пакеты недействительны.",
);
