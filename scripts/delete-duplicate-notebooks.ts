import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const notebooksToDelete = [
  "9312940f-6acb-4363-938f-996e19682c7c",
  "148f57d1-c332-4da5-b5c5-b8ba7339fbd4",
  "f6f473f2-a8f1-4bc3-8a20-6656ff457f6e",
  "d580a006-0cdf-4fe2-a21c-98c589f60b5a",
  "3c26e439-15f8-4030-8279-37586de3dfb0",
  "7618953d-c800-4d52-8af6-ecbe393e3e9b",
  "9ff3dd40-5cbb-4be2-b783-51b50f6ee030",
  "6f407d5f-4fa7-4f4d-aa8e-bc93a96e1331",
  "42f48541-8311-4953-9e0d-26156b6dae28",
  "fa4f34dc-2249-46ca-a856-7ffbcd0b056c",
  "27b41ddc-80bf-45df-b3fe-74adea0e53ed",
  "d962ceaa-2ad5-442c-a52a-e2929f1de9c4",
  "d95e4666-0e64-4d44-8dc7-9f1287997a2c",
  "1fe5a0c7-f2dc-4fe6-b690-e12598bb21c8",
  "55d300ed-c8ca-46ea-bfeb-a77e0d8bd524",
  "67b2f23d-7f88-4cec-8457-4a0a23f3db4c",
  "2ef3bc5f-837f-4b56-aa15-a96b2715911d",
  "aae432af-1628-4116-b928-5b1750e02a36",
  "0a4ecb77-3c4f-482e-a3cb-aa62cbaffaf1",
  "3539baaa-9098-44ef-8d7e-be57b45851cc",
  "9237f14e-203d-4ecc-9b45-e59f1db3d65a",
  "8afe6da6-03fd-4af6-b424-c8e5f8600fd2",
  "6006d1df-31c9-42ec-bf65-7fb1d8a74327",
  "d7c8d9f1-ccbb-42ca-ba03-63aacee1206e",
  "bdad7de5-b208-4729-910c-914cf418ac8c",
  "7ad72822-fa61-447e-adc2-239fdd0ddc1e",
  "386fe852-43f6-4ab3-a76b-b8db5fdaafa7",
  "05dc2d12-9e82-473d-9f4d-d81e43b16cb3",
  "83026a9a-f188-4323-a9ef-0a40461e0fdf",
  "d5bef406-c9e7-4781-bfed-b80615e50dff",
  "7747ed9c-d5fc-407a-9cd9-5322ae7acc90",
  "01c882e3-d6cd-4cc5-b592-8932c10e183e",
  "b040263e-7365-476f-8f49-ef188f50519e",
  "eba3cc16-d642-4d0f-92b8-3174325da464",
  "2dbb9ab4-0117-4aa3-b203-79d1dcdbfa30",
  "a5acbf07-825d-4950-ab23-2c22b2cbe1c2",
  "4fa5f3ef-fb5e-4783-bc97-6ab308a2e9ed",
  "7c5b0b2a-541d-436f-96dc-817b09b2ec8c",
  "1ef9df65-8453-4aff-acb1-ede15a91461b",
  "75982fd6-11e0-463b-a02b-ec042ce49c7d"
];

async function deleteDuplicateNotebooks() {
  console.log(`Deleting ${notebooksToDelete.length} duplicate notebooks...`);

  // Delete notebooks (cascading will handle related records)
  const result = await prisma.notebook.deleteMany({
    where: {
      id: { in: notebooksToDelete },
    },
  });

  console.log(`\nDeleted ${result.count} notebooks.`);

  // Verify remaining notebooks for this user
  const user = await prisma.user.findUnique({
    where: { email: 'abyzovann@icloud.com' },
  });

  if (user) {
    const remainingCount = await prisma.notebook.count({
      where: { userId: user.id },
    });
    console.log(`Remaining notebooks for user: ${remainingCount}`);
  }

  await prisma.$disconnect();
}

deleteDuplicateNotebooks().catch(console.error);
