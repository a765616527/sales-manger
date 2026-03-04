import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getPromoterSalesAccountScope(userId: number): Promise<Prisma.SalesAccountWhereInput> {
  const promoterUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      displayName: true,
    },
  });

  if (!promoterUser) {
    return {
      promoterUserId: userId,
    };
  }

  const displayName = promoterUser.displayName?.trim() ?? "";

  if (!displayName) {
    return {
      promoterUserId: userId,
    };
  }

  return {
    OR: [{ promoterUserId: userId }, { promoterUserId: null, promoter: displayName }],
  };
}
