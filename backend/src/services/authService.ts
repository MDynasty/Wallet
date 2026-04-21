import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { config } from '../config';

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already registered') as Error & { status: number };
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName },
    select: { id: true, email: true, firstName: true, lastName: true, kycStatus: true, createdAt: true },
  });
  return { user, token: issueToken(user.id) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw unauthorized();

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw unauthorized();

  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token: issueToken(user.id) };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      kycStatus: true, kycDocType: true, kycSubmittedAt: true, createdAt: true,
    },
  });
  return user;
}

function issueToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

function unauthorized() {
  const err = new Error('Invalid credentials') as Error & { status: number };
  err.status = 401;
  return err;
}
