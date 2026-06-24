// src/college/colleges.service.ts
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class CollegesService {
  private readonly logger = new Logger(CollegesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Search colleges with filters and offset pagination.
   * Rating is computed on the fly from reviews; minRating filter is applied in memory.
   * For production, consider storing a computed rating column.
   */
  async search(filters: {
    search?: string;
    state?: string;
    city?: string;
    minFees?: number;
    maxFees?: number;
    minRating?: number;
    page: number;
    limit: number;
  }) {
    try {
      const { search, state, city, minFees, maxFees, minRating, page, limit } = filters;
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { state: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (state) where.state = state;
      if (city) where.city = city;
      if (minFees !== undefined) where.annualFees = { gte: minFees };
      if (maxFees !== undefined) where.annualFees = { ...where.annualFees, lte: maxFees };

      const skip = (page - 1) * limit;
      const [colleges, total] = await Promise.all([
        this.prisma.college.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
          include: {
            reviews: { select: { rating: true } },
          },
        }),
        this.prisma.college.count({ where }),
      ]);

      // Compute average rating for each college and strip the reviews array
      let data = colleges.map((college) => {
        const rating =
          college.reviews.length > 0
            ? college.reviews.reduce((sum, r) => sum + r.rating, 0) / college.reviews.length
            : 0;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { reviews, ...rest } = college;
        return { ...rest, rating };
      });

      // Apply minRating filter in memory (we fetch all needed records)
      // For large datasets, consider adding a stored rating column and filter in DB.
      if (minRating !== undefined) {
        data = data.filter((c) => c.rating >= minRating);
      }

      const totalPages = Math.ceil(total / limit);
      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error('Error in search method:', error);
      throw error;
    }
  }

  /**
   * Compare 2–3 colleges side‑by‑side.
   */
  async compare(ids: string[]) {
    try {
      if (ids.length < 2 || ids.length > 3) {
        throw new BadRequestException({
          code: 'INVALID_PARAM',
          message: 'Must provide between 2 and 3 college IDs',
        });
      }

      const colleges = await this.prisma.college.findMany({
        where: { id: { in: ids } },
        include: {
          courses: {
            select: { name: true, degree: true, annualFees: true },
            take: 3, // top 3 courses
          },
          reviews: {
            select: { rating: true },
          },
        },
      });

      if (colleges.length !== ids.length) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: 'One or more colleges not found',
        });
      }

      return colleges.map((college) => {
        const rating =
          college.reviews.length > 0
            ? college.reviews.reduce((sum, r) => sum + r.rating, 0) / college.reviews.length
            : 0;
        const { reviews, courses, ...rest } = college;
        return {
          ...rest,
          rating,
          placements: {
            averagePackage: college.avgPackage,
            highestPackage: college.highestPackage,
            placementRate: college.placementRate,
          },
          topCourses: courses.map((c) => ({
            name: c.name,
            degree: c.degree,
            annualFees: c.annualFees,
          })),
        };
      });
    } catch (error) {
      this.logger.error('Error in compare method:', error);
      throw error;
    }
  }

  /**
   * Get detailed information for a single college, including courses and 5 latest reviews.
   */
  async findById(id: string) {
    try {
      const college = await this.prisma.college.findUnique({
        where: { id },
        include: {
          courses: true,
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!college) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: 'College not found',
        });
      }

      const rating =
        college.reviews.length > 0
          ? college.reviews.reduce((sum, r) => sum + r.rating, 0) / college.reviews.length
          : 0;
      const { reviews, courses, ...rest } = college;

      return {
        ...rest,
        rating,
        placements: {
          averagePackage: college.avgPackage,
          highestPackage: college.highestPackage,
          placementRate: college.placementRate,
        },
        courses,
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
        })),
      };
    } catch (error) {
      this.logger.error(`Error in findById for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get paginated reviews for a college (offset pagination).
   */
  async getReviews(collegeId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { collegeId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: { collegeId } }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}