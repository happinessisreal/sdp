// ─── Password Hashing Utilities ──────────────────────────────────
// Using Bun's built-in password hashing (bcrypt under the hood)

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return Bun.password.verify(password, hash);
}
