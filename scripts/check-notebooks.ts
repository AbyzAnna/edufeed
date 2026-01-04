import { prisma } from '../src/lib/prisma'

async function main() {
  // Check notebooks for abyzovann@icloud.com specifically
  const user = await prisma.user.findFirst({
    where: { email: 'abyzovann@icloud.com' }
  })

  if (!user) {
    console.log('User not found!')
    return
  }

  console.log('User ID:', user.id)
  console.log('Email:', user.email)

  const notebooks = await prisma.notebook.findMany({
    where: { userId: user.id },
    include: {
      NotebookGroup: true,
      _count: { select: { NotebookSource: true, NotebookOutput: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log('\nTotal notebooks:', notebooks.length)

  const grouped = notebooks.filter(n => n.groupId !== null)
  const ungrouped = notebooks.filter(n => n.groupId === null)

  console.log('Grouped:', grouped.length)
  console.log('Ungrouped:', ungrouped.length)

  console.log('\n=== UNGROUPED NOTEBOOKS ===')
  for (const n of ungrouped) {
    console.log('- ' + n.title + ' (sources: ' + n._count.NotebookSource + ', outputs: ' + n._count.NotebookOutput + ')')
  }

  // Check groups
  const groups = await prisma.notebookGroup.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { Notebooks: true } }
    }
  })

  console.log('\n=== NOTEBOOK GROUPS ===')
  for (const g of groups) {
    console.log('- ' + g.name + ' (' + g._count.Notebooks + ' notebooks)')
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
