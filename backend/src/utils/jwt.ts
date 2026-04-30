import { sign, verify } from "hono/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ALGORITHM = "HS256";

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
}

export async function signToken(payload: {
  userId: number;
  email: string;
  role: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 7 * 24 * 60 * 60; // 7 days

  return sign(
    {
      ...payload,
      iat: now,
      exp,
    },
    JWT_SECRET,
    ALGORITHM
  );
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const payload = (await verify(token, JWT_SECRET, ALGORITHM)) as unknown as JwtPayload;
  return payload;
}

export { JWT_SECRET };
