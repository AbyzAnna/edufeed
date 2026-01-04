import { prisma } from '../src/lib/prisma'

/**
 * Merge notebooks from abyzovann@gmail.com into abyzovann@icloud.com
 * This transfers all notebooks while preserving sources, outputs, and other relations
 */
async function main() {
  const sourceEmail = 'abyzovann@gmail.com'
  const targetEmail = 'abyzovann@icloud.com'

  console.log('=== ACCOUNT MERGE ===')
  console.log('From:', sourceEmail)
  console.log('To:', targetEmail)

  // Get both users
  const sourceUser = await prisma.user.findFirst({
    where: { email: sourceEmail }
  })

  const targetUser = await prisma.user.findFirst({
    where: { email: targetEmail }
  })

  if (!sourceUser) {
    console.error('Source user not found!')
    return
  }

  if (!targetUser) {
    console.error('Target user not found!')
    return
  }

  console.log('\nSource User ID:', sourceUser.id)
  console.log('Target User ID:', targetUser.id)

  // Get notebooks to transfer
  const notebooks = await prisma.notebook.findMany({
    where: { userId: sourceUser.id },
    include: {
      NotebookSource: true,
      NotebookOutput: true,
      NotebookChat: true,
      _count: {
        select: {
          NotebookSource: true,
          NotebookOutput: true,
          NotebookChat: true
        }
      }
    }
  })

  console.log('\nNotebooks to transfer:', notebooks.length)
  for (const n of notebooks) {
    console.log('- ' + n.title + ' (sources: ' + n._count.NotebookSource + ', outputs: ' + n._count.NotebookOutput + ')')
  }

  // Confirm before proceeding
  console.log('\n⚠️  This will transfer all notebooks from ' + sourceEmail + ' to ' + targetEmail)
  console.log('Run with --confirm to execute the transfer')

  if (!process.argv.includes('--confirm')) {
    console.log('\nDry run complete. No changes made.')
    return
  }

  // Transfer notebooks
  console.log('\n=== TRANSFERRING ===')

  for (const notebook of notebooks) {
    console.log('Transferring: ' + notebook.title)

    await prisma.notebook.update({
      where: { id: notebook.id },
      data: { userId: targetUser.id }
    })
  }

  // Also transfer any notebook groups
  const groups = await prisma.notebookGroup.findMany({
    where: { userId: sourceUser.id }
  })

  if (groups.length > 0) {
    console.log('\nTransferring ' + groups.length + ' notebook groups...')
    for (const group of groups) {
      await prisma.notebookGroup.update({
        where: { id: group.id },
        data: { userId: targetUser.id }
      })
    }
  }

  // Verify transfer
  const newCount = await prisma.notebook.count({
    where: { userId: targetUser.id }
  })

  console.log('\n=== TRANSFER COMPLETE ===')
  console.log('Total notebooks for ' + targetEmail + ': ' + newCount)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
