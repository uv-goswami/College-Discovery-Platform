// src/college/colleges.service.ts
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CollegesService {
  private readonly logger = new Logger(CollegesService.name);
  private readonly SIMILARITY_THRESHOLD = 0.15;

  constructor(private prisma: PrismaService) {}

  /**
   * Search colleges with filters and offset pagination.
   * Priority: ILIKE (exact/substring) → if no results, Fuzzy (pg_trgm).
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

      // No search term → use the normal Prisma query (fast)
      if (!search || search.trim().length === 0) {
        return this.searchWithoutFuzzy(filters);
      }

      const searchTerm = search.trim();
      const offset = (page - 1) * limit;

      // -------------------------------------------------------------
      // Step 1: Try ILIKE (case‑insensitive substring) with all filters
      // -------------------------------------------------------------
      const whereIlike: any = {};
      if (state) whereIlike.state = state;
      if (city) whereIlike.city = city;
      if (minFees !== undefined) whereIlike.annualFees = { gte: minFees };
      if (maxFees !== undefined) whereIlike.annualFees = { ...whereIlike.annualFees, lte: maxFees };

      whereIlike.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } },
        { state: { contains: searchTerm, mode: 'insensitive' } },
      ];

      const [ilikeColleges, ilikeTotal] = await Promise.all([
        this.prisma.college.findMany({
          where: whereIlike,
          skip: offset,
          take: limit,
          orderBy: { name: 'asc' },
          include: { reviews: { select: { rating: true } } },
        }),
        this.prisma.college.count({ where: whereIlike }),
      ]);

      if (ilikeColleges.length > 0) {
        // Compute ratings and strip reviews
        let data = ilikeColleges.map((college) => {
          const rating =
            college.reviews.length > 0
              ? college.reviews.reduce((sum, r) => sum + r.rating, 0) / college.reviews.length
              : 0;
          const { reviews, ...rest } = college;
          return { ...rest, rating };
        });

        if (minRating !== undefined) {
          data = data.filter((c) => c.rating >= minRating);
        }

        return {
          data,
          meta: {
            total: ilikeTotal,
            page,
            limit,
            totalPages: Math.ceil(ilikeTotal / limit),
          },
        };
      }

      // -------------------------------------------------------------
      // Step 2: No ILIKE results → fallback to fuzzy (pg_trgm)
      // -------------------------------------------------------------
      const threshold = this.SIMILARITY_THRESHOLD;

      // Build fuzzy SQL with parameter binding
      let sql = Prisma.sql`
        SELECT id
        FROM public."College"
        WHERE (
          similarity(name, ${searchTerm}) > ${threshold}
          OR similarity(city, ${searchTerm}) > ${threshold}
          OR similarity(state, ${searchTerm}) > ${threshold}
        )
      `;

      // Add optional filters
      if (state) sql = Prisma.sql`${sql} AND state = ${state}`;
      if (city) sql = Prisma.sql`${sql} AND city = ${city}`;
      if (minFees !== undefined) sql = Prisma.sql`${sql} AND annual_fees >= ${minFees}`;
      if (maxFees !== undefined) sql = Prisma.sql`${sql} AND annual_fees <= ${maxFees}`;

      // Order by highest similarity, limit, offset
      sql = Prisma.sql`
        ${sql}
        ORDER BY GREATEST(
          similarity(name, ${searchTerm}),
          similarity(city, ${searchTerm}),
          similarity(state, ${searchTerm})
        ) DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      const fuzzyIds = await this.prisma.$queryRaw<{ id: string }[]>(sql);
      const ids = fuzzyIds.map((row) => row.id);

      if (ids.length === 0) {
        return {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        };
      }

      // Fetch full data with reviews
      const fuzzyColleges = await this.prisma.college.findMany({
        where: { id: { in: ids } },
        include: { reviews: { select: { rating: true } } },
      });

      // Preserve the order from the fuzzy query
      const idOrderMap = new Map<string, number>();
      ids.forEach((id, index) => idOrderMap.set(id, index));
      fuzzyColleges.sort((a, b) => (idOrderMap.get(a.id) ?? 0) - (idOrderMap.get(b.id) ?? 0));

      // Compute ratings
      let data = fuzzyColleges.map((college) => {
        const rating =
          college.reviews.length > 0
            ? college.reviews.reduce((sum, r) => sum + r.rating, 0) / college.reviews.length
            : 0;
        const { reviews, ...rest } = college;
        return { ...rest, rating };
      });

      if (minRating !== undefined) {
        data = data.filter((c) => c.rating >= minRating);
      }

      // Count total for pagination using the same fuzzy conditions
      let countSql = Prisma.sql`
        SELECT COUNT(*) as count
        FROM public."College"
        WHERE (
          similarity(name, ${searchTerm}) > ${threshold}
          OR similarity(city, ${searchTerm}) > ${threshold}
          OR similarity(state, ${searchTerm}) > ${threshold}
        )
      `;
      if (state) countSql = Prisma.sql`${countSql} AND state = ${state}`;
      if (city) countSql = Prisma.sql`${countSql} AND city = ${city}`;
      if (minFees !== undefined) countSql = Prisma.sql`${countSql} AND annual_fees >= ${minFees}`;
      if (maxFees !== undefined) countSql = Prisma.sql`${countSql} AND annual_fees <= ${maxFees}`;

      const countResult = await this.prisma.$queryRaw<{ count: bigint }[]>(countSql);
      const total = Number(countResult[0].count);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error in search method:', error);
      throw error;
    }
  }

  /**
   * Non‑fuzzy search (used when no search term is provided).
   */
  private async searchWithoutFuzzy(filters: {
    search?: string;
    state?: string;
    city?: string;
    minFees?: number;
    maxFees?: number;
    minRating?: number;
    page: number;
    limit: number;
  }) {
    const { state, city, minFees, maxFees, minRating, page, limit } = filters;
    const where: any = {};

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
        include: { reviews: { select: { rating: true } } },
      }),
      this.prisma.college.count({ where }),
    ]);

    let data = colleges.map((college) => {
      const rating =
        college.reviews.length > 0
          ? college.reviews.reduce((sum, r) => sum + r.rating, 0) / college.reviews.length
          : 0;
      const { reviews, ...rest } = college;
      return { ...rest, rating };
    });

    if (minRating !== undefined) {
      data = data.filter((c) => c.rating >= minRating);
    }

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // -----------------------------------------------------------------
  // The following methods (compare, findById, getReviews) remain unchanged
  // -----------------------------------------------------------------

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
            take: 3,
          },
          reviews: { select: { rating: true } },
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