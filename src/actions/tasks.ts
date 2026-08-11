"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function addTask(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role === "DIRECTOR") {
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
      time_taken_minutes: time_taken ? parseInt(time_taken, 10) : null,
      remark: remark || null,
      status: session.user.role === "MANAGER" ? "APPROVED" : "LOGGED",
    },
  })

  revalidatePath("/", "layout")
}

export async function editTaskByEmployee(taskId: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  const excludedRoles = ["MANAGER", "DIRECTOR", "SUPERUSER"]
  if (!session || excludedRoles.includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const description = formData.get("description") as string
  const time_taken = formData.get("time_taken") as string | null
  const remark = formData.get("remark") as string | null

  if (!description) {
    throw new Error("Missing description")
  }

  // Concurrency check
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || task.user_id !== session.user.id) {
    throw new Error("Task not found or access denied")
  }

  if (task.status === "APPROVED" || task.status === "REJECTED") {
    return { error: `Task cannot be edited because it has already been ${task.status.toLowerCase()}` }
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      description,
      time_taken_minutes: time_taken ? parseInt(time_taken, 10) : null,
      remark: remark || null,
      status: "LOGGED" // Ensure status remains logged in case it was rejected
    },
  })

  revalidatePath("/", "layout")
  return { success: true }
}

export async function completeAssignedTask(assignmentId: string) {
  const session = await getServerSession(authOptions)
  const excludedRoles = ["MANAGER", "DIRECTOR", "SUPERUSER"]
  if (!session || excludedRoles.includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  await prisma.task.update({
    where: {
      id: assignmentId,
      user_id: session.user.id
    },
    data: { 
      status: "LOGGED",
      log_date: new Date()
    },
  })

  revalidatePath("/", "layout")
}

export async function approveTask(taskId: string, approved: boolean) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MANAGER") {
    throw new Error("Unauthorized")
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error("Task not found")

  let newStatus = approved ? "APPROVED" : "REJECTED"
  if (!approved && task.assigned_by_id) {
    newStatus = "PENDING"
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus as any },
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

  await prisma.task.create({
    data: {
      user_id: assignedToId,
      assigned_by_id: session.user.id,
      description,
      due_date: dueDate ? new Date(dueDate) : null,
      status: "PENDING",
    },
  })

  revalidatePath("/", "layout")
}

