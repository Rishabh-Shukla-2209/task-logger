import prisma from './src/lib/prisma';

async function main() {
  const targetId = '00d3cbbf-d56f-4dd2-9e03-930f8143be0c';
  
  const user = await prisma.user.findUnique({
    where: { id: targetId }
  });
  
  if (!user) {
    console.error('Target user does not exist!');
    process.exit(1);
  }

  const result = await prisma.callContact.updateMany({
    where: {
      data_owner_id: null
    },
    data: {
      data_owner_id: targetId
    }
  });

  console.log(`Updated ${result.count} contacts to set data_owner_id.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
