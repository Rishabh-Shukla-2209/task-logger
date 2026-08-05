import prisma from "../src/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  console.log("Starting password migration...")

  const users = await prisma.user.findMany()
  let hashedCount = 0
  let skippedCount = 0

  for (const user of users) {
    // Basic heuristic: bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long.
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")) {
      console.log(`Skipping user ${user.username}, already hashed.`)
      skippedCount++
      continue
    }

    console.log(`Hashing password for user: ${user.username}...`)
    const hashedPassword = await bcrypt.hash(user.password, 10)
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })
    hashedCount++
  }

  console.log(`\nMigration complete.`)
  console.log(`Hashed: ${hashedCount} users.`)
  console.log(`Skipped: ${skippedCount} users.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
