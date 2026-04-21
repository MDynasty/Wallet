import prisma from '../config/prisma';

const KYC_APPROVED  = 'APPROVED';
const KYC_SUBMITTED = 'SUBMITTED';
const KYC_REJECTED  = 'REJECTED';

export async function submitKyc(
  userId: string,
  docType: string,
  docNumber: string,
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.kycStatus === KYC_APPROVED) {
    const e = new Error('KYC already approved') as Error & { status: number };
    e.status = 409;
    throw e;
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      kycStatus: KYC_SUBMITTED,
      kycDocType: docType,
      kycDocNumber: docNumber,
      kycSubmittedAt: new Date(),
    },
    select: { id: true, kycStatus: true, kycDocType: true, kycSubmittedAt: true },
  });
}

export async function getKycStatus(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, kycStatus: true, kycDocType: true, kycSubmittedAt: true, kycReviewedAt: true },
  });
}

/** Admin-only: approve or reject a KYC submission */
export async function reviewKyc(targetUserId: string, approved: boolean) {
  return prisma.user.update({
    where: { id: targetUserId },
    data: {
      kycStatus: approved ? KYC_APPROVED : KYC_REJECTED,
      kycReviewedAt: new Date(),
    },
    select: { id: true, kycStatus: true, kycReviewedAt: true },
  });
}
