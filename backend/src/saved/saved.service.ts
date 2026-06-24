import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedService {
  constructor(private prisma: PrismaService) {}

  // ---------- Colleges ----------
  async getSavedColleges(userId: string) {
    const saved = await this.prisma.savedCollege.findMany({
      where: { userId },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            type: true,
            annualFees: true,
            logoUrl: true,
            reviews: { select: { rating: true } },
          },
        },
      },
    });
    // Compute rating for each college
    return saved.map(s => {
      const college = s.college;
      const rating = college.reviews.length > 0
        ? college.reviews.reduce((sum, r) => sum + r.rating, 0) / college.reviews.length
        : 0;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { reviews, ...collegeWithoutReviews } = college;
      return {
        id: s.id,
        savedAt: s.createdAt,
        college: { ...collegeWithoutReviews, rating },
      };
    });
  }

  async saveCollege(userId: string, collegeId: string) {
    // Check if college exists
    const college = await this.prisma.college.findUnique({ where: { id: collegeId } });
    if (!college) throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'College not found' });

    // Check if already saved
    const existing = await this.prisma.savedCollege.findUnique({
      where: { userId_collegeId: { userId, collegeId } },
    });
    if (existing) throw new ConflictException({ code: 'ALREADY_SAVED', message: 'College already saved' });

    const saved = await this.prisma.savedCollege.create({
      data: { userId, collegeId },
      select: { id: true, collegeId: true, createdAt: true },
    });
    return {
      id: saved.id,
      collegeId: saved.collegeId,
      savedAt: saved.createdAt,
    };
  }

  async removeSavedCollege(userId: string, collegeId: string) {
    const existing = await this.prisma.savedCollege.findUnique({
      where: { userId_collegeId: { userId, collegeId } },
    });
    if (!existing) throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Saved college not found' });
    await this.prisma.savedCollege.delete({ where: { id: existing.id } });
    return null;
  }

  // ---------- Comparisons ----------
  async getSavedComparisons(userId: string) {
    const comparisons = await this.prisma.savedComparison.findMany({
      where: { userId },
      select: { id: true, collegeIds: true, createdAt: true },
    });
    return comparisons.map(c => ({
      id: c.id,
      savedAt: c.createdAt,
      collegeIds: c.collegeIds as string[],
    }));
  }

  async saveComparison(userId: string, collegeIds: string[]) {
    if (collegeIds.length < 2 || collegeIds.length > 3) {
      throw new BadRequestException({ code: 'INVALID_PARAM', message: 'Must provide 2-3 college ids' });
    }

    // Check all colleges exist
    const colleges = await this.prisma.college.findMany({
      where: { id: { in: collegeIds } },
    });
    if (colleges.length !== collegeIds.length) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'One or more colleges not found' });
    }

    // Check if same comparison already saved (order independent? We'll check exact array order)
    // For simplicity, we'll treat as unique if same ordered array.
    // Could be improved with sorting, but we keep straightforward.
    const existing = await this.prisma.savedComparison.findFirst({
      where: {
        userId,
        collegeIds: { equals: collegeIds },
      },
    });
    if (existing) throw new ConflictException({ code: 'ALREADY_SAVED', message: 'Comparison already saved' });

    const saved = await this.prisma.savedComparison.create({
      data: {
        userId,
        collegeIds,
      },
      select: { id: true, collegeIds: true, createdAt: true },
    });
    return {
      id: saved.id,
      collegeIds: saved.collegeIds as string[],
      savedAt: saved.createdAt,
    };
  }

  async removeSavedComparison(userId: string, comparisonId: string) {
    const existing = await this.prisma.savedComparison.findFirst({
      where: { id: comparisonId, userId },
    });
    if (!existing) throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Saved comparison not found' });
    await this.prisma.savedComparison.delete({ where: { id: existing.id } });
    return null;
  }
}