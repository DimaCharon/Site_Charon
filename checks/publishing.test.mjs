import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, createHash, createHmac } from "node:crypto";
import { verifyRequest } from "../scripts/apply-owner-packet.mjs";
import {
  canonicalProfile,
  defaultProfile,
  normalizeProfile,
  safeContact,
} from "../shared/profile-schema.mjs";
const key = randomBytes(32).toString("hex");
const now = Date.now();
const profile = { ...defaultProfile, name: "Test identity" };
const base = createHash("sha256")
  .update(canonicalProfile(defaultProfile))
  .digest("hex");
const request = {
  key,
  current: defaultProfile,
  owner: "TestOwner",
  actor: "TestOwner",
  initiator: "TestOwner",
  ref: "refs/heads/main",
  event: "workflow_dispatch",
  repository: "TestOwner/TestSite",
  now,
};
function packet(extra = {}) {
  const body = {
    v: 1,
    repo: request.repository,
    issued: now,
    base,
    profile,
    ...extra,
  };
  const framed =
    "CH1." + Buffer.from(JSON.stringify(body)).toString("base64url");
  return (
    framed +
    "." +
    createHmac("sha256", Buffer.from(key, "hex")).update(framed).digest("hex")
  );
}
test("Подтверждённая правка: меняются только поля профиля", () =>
  assert.deepEqual(verifyRequest({ ...request, packet: packet() }), profile));
test("Нужны владелец, его подтверждение, основная ветка и ручной запуск", () => {
  for (const patch of [
    { actor: "Reader" },
    { initiator: "Reader" },
    { ref: "refs/heads/preview" },
    { event: "push" },
  ])
    assert.throws(() =>
      verifyRequest({ ...request, ...patch, packet: packet() }),
    );
});
test("Сервер отклоняет неподписанные данные и неверный ключ", () => {
  assert.throws(() => verifyRequest({ ...request, packet: "not-a-packet" }));
  assert.throws(() =>
    verifyRequest({
      ...request,
      key: randomBytes(32).toString("hex"),
      packet: packet(),
    }),
  );
});
test("Ограничены срок, адресат и размер пакета", () => {
  for (const p of [
    packet({ issued: now - 16 * 60_000 }),
    packet({ issued: now + 130_000 }),
    packet({ repo: "TestOwner/OtherSite" }),
    "a".repeat(8200),
  ])
    assert.throws(() => verifyRequest({ ...request, packet: p }));
});
test("Черновик не перезаписывает более свежую публикацию", () =>
  assert.throws(
    () => verifyRequest({ ...request, current: profile, packet: packet() }),
    /уже изменился/,
  ));
test("Одинаковая проверка данных в браузере и перед публикацией", () => {
  assert.throws(() =>
    normalizeProfile({ ...defaultProfile, name: "a".repeat(33) }),
  );
  assert.throws(() => normalizeProfile({ ...defaultProfile, unused: true }));
  assert.throws(() =>
    normalizeProfile({
      ...defaultProfile,
      contacts: { ...defaultProfile.contacts, email: "not-an-email" },
    }),
  );
  assert.throws(() =>
    verifyRequest({
      ...request,
      packet: packet({ profile: { ...profile, name: "" } }),
    }),
  );
  assert.equal(safeContact("telegram", "https://example.org/person"), null);
  assert.equal(safeContact("social", "http://example.org/person"), null);
  assert.equal(
    safeContact("email", "preview@example.org"),
    "mailto:preview@example.org",
  );
  assert.equal(
    safeContact("github", "https://github.com/example"),
    "https://github.com/example",
  );
});
