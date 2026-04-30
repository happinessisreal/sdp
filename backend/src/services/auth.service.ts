import { prisma } from "../db/index.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors.js";
import type { RegisterInput, LoginInput } from "../validators/auth.validator.js";

export class AuthService {
  /**
   * Register a new user with the appropriate role-specific profile.
   * Creates User + Student/Teacher record in a single transaction.
   */
  async register(data: RegisterInput) {
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        // Automatically create the role-specific profile
        ...(data.role === "STUDENT" && {
          student: {
            create: {
              enrollment_date: new Date(),
            },
          },
        }),
        ...(data.role === "TEACHER" && {
          teacher: {
            create: {},
          },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  /**
   * Authenticate a user and return a JWT token.
   */
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValidPassword = await verifyPassword(data.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
      token,
    };
  }

  /**
   * Get the current user's profile with role-specific data.
   */
  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        student: {
          select: {
            id: true,
            enrollment_date: true,
          },
        },
        teacher: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    return user;
  }
}

export const authService = new AuthService();
