import { Role } from "@prisma/client"
import prisma from "../src/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  const username = "superuser"
  const plainPassword = "superuser123"

  const existing = await prisma.user.findUnique({ where: { username } })

  if (existing) {
    console.log(`User '${username}' already exists. Elevating to SUPERUSER.`)
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: Role.SUPERUSER }
    })
  } else {
    console.log(`Creating new SUPERUSER account: '${username}'`)
    const hashedPassword = await bcrypt.hash(plainPassword, 10)
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: Role.SUPERUSER
      }
    })
  }

  console.log(`Successfully configured SUPERUSER account.`)
  console.log(`Username: ${username}`)
  console.log(`Password: ${plainPassword} (only if newly created)`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
