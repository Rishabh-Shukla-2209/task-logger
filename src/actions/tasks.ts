"use server";

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function addTask(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role === "ADMIN") {
    throw new Error("Unauthorized")
  }

  const description = formData.get("description") as string
  const time_taken = formData.get("time_taken") as string | null
  const remark = formData.get("remark") as string | null

  if (!description) {
    throw new Error("Missing description")
  }

  await prisma.task.create({
    data: {
      user_id: session.user.id,
      log_date: new Date(),
      description,
      time_taken: time_taken || null,
      remark: remark || null,
      status: "LOGGED",
    },
  })

  revalidatePath("/employee")
}

export async function approveTask(taskId: string, approved: boolean) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") {
    throw new Error("Unauthorized")
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status: approved ? "APPROVED" : "REJECTED" },
  })

  revalidatePath("/manager")
}

export async function editTaskByManager(taskId: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") {
    throw new Error("Unauthorized")
  }

  const managerEdit = formData.get("manager_edit") as string

  if (!managerEdit) {
    throw new Error("Edit content is required")
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      manager_edit: managerEdit,
      edited_by_id: session.user.id,
      edited_at: new Date(),
    },
  })

  revalidatePath("/manager")
}

export async function assignTaskToEmployee(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") {
    throw new Error("Unauthorized")
  }

  const assignedToId = formData.get("assigned_to_id") as string
  const description = formData.get("description") as string
  const dueDate = formData.get("due_date") as string | null

  if (!assignedToId || !description) {
    throw new Error("Missing fields")
  }

  await prisma.taskAssignment.create({
    data: {
      assigned_by_id: session.user.id,
      assigned_to_id: assignedToId,
      description,
      due_date: dueDate ? new Date(dueDate) : null,
    },
  })

  revalidatePath("/manager")
  revalidatePath("/employee/assignments")
}
