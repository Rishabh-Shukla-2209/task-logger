const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')
const dotenv = require('dotenv')

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CATEGORIES = [
  { value: "Laptop", group: "COMPUTE" },
  { value: "Desktop", group: "COMPUTE_DESKTOP" },
  { value: "TFT", group: "DISPLAY" },
  { value: "Printer", group: "PRINTER" },
  { value: "RAM", group: "STORAGE_RAM" },
  { value: "SSD", group: "STORAGE_DISK" },
  { value: "HDD", group: "STORAGE_DISK" },
  { value: "Peripheral", group: "PERIPHERAL" },
  { value: "Other", group: "OTHER" }
]

const GENERATIONS = ["NA", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th", "13th", "14th"]
const PROCESSORS = ["NA", "i3", "i5", "i7", "Ryzen 3", "Ryzen 5", "Ryzen 7", "M1", "M2", "M3"]
const DESKTOP_TYPES = ["NA", "Tiny", "SFF", "Flat", "Tower", "All-in-One"]
const RAM_TYPES = ["NA", "DDR3", "DDR4", "DDR5"]
const STORAGE_TYPES = ["NA", "SATA", "M.2", "NVMe"]

// Optional common makes/models to pre-seed
const MAKES = ["HP", "Dell", "Lenovo", "Apple", "Acer", "Asus", "Samsung"]

async function main() {
  console.log('Seeding options...')
  let totalCreated = 0

  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]
    try {
      await prisma.lineItemOption.upsert({
        where: { type_value: { type: 'CATEGORY', value: c.value } },
        update: { field_group: c.group, sort_order: i },
        create: { type: 'CATEGORY', value: c.value, field_group: c.group, sort_order: i }
      })
      totalCreated++
    } catch (e) {
      console.error(e)
    }
  }

  const arrays = [
    { type: 'GENERATION', data: GENERATIONS },
    { type: 'PROCESSOR', data: PROCESSORS },
    { type: 'DESKTOP_TYPE', data: DESKTOP_TYPES },
    { type: 'RAM_TYPE', data: RAM_TYPES },
    { type: 'STORAGE_TYPE', data: STORAGE_TYPES },
    { type: 'MAKE', data: MAKES }
  ]

  for (const arr of arrays) {
    for (let i = 0; i < arr.data.length; i++) {
      try {
        await prisma.lineItemOption.upsert({
          where: { type_value: { type: arr.type, value: arr.data[i] } },
          update: { sort_order: i },
          create: { type: arr.type, value: arr.data[i], sort_order: i }
        })
        totalCreated++
      } catch (e) {
        console.error(e)
      }
    }
  }

  console.log(`Seeded ${totalCreated} options.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
