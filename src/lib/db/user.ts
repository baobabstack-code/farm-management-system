import { prisma } from "@/lib/prisma";
import { User, UserWithPassword } from "@/types";
import bcrypt from "bcryptjs";

export class UserService {
  static async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  static async findByEmail(email: string): Promise<UserWithPassword | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  static async findByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  static async create(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async update(
    id: string,
    data: Partial<{ username: string; email: string }>
  ): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
