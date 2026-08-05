"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

async function ensureSuperuser() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPERUSER") {
    throw new Error("Unauthorized: Only SUPERUSER can perform this action.")
  }
}

export async function fetchUsers() {
  await ensureSuperuser()
  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      username: true,
      role: true,
      is_active: true,
      created_at: true,
    }
  })
  return users
}

export async function createUser(formData: FormData) {
  await ensureSuperuser()
  
  const username = formData.get("username") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as Role

  if (!username || !password || !role) {
    throw new Error("Missing required fields")
  }

  const existingUser = await prisma.user.findUnique({
    where: { username }
  })

  if (existingUser) {
    throw new Error("Username already exists")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role
    }
  })

  revalidatePath("/superuser")
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  await ensureSuperuser()
  
  await prisma.user.update({
    where: { id: userId },
    data: { 
      is_active: isActive,
      deactivated_at: isActive ? null : new Date()
    }
  })

  revalidatePath("/superuser")
}

export async function updateUserRole(userId: string, newRole: Role) {
  await ensureSuperuser()
  
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  })

  revalidatePath("/superuser")
}

export async function resetUserPassword(userId: string, newPasswordRaw: string) {
  await ensureSuperuser()
  
  if (!newPasswordRaw) {
    throw new Error("Password cannot be empty")
  }

  const hashedPassword = await bcrypt.hash(newPasswordRaw, 10)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })

  revalidatePath("/superuser")
}
