import { Test, TestingModule } from '@nestjs/testing';
import { CollegesService } from './colleges.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CollegesService', () => {
  let service: CollegesService;
  let prisma: PrismaService;

  const mockPrisma = {
    college: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    review: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollegesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CollegesService>(CollegesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('compare', () => {
    it('should throw BadRequestException if less than 2 IDs', async () => {
      await expect(service.compare(['1'])).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if more than 3 IDs', async () => {
      await expect(service.compare(['1', '2', '3', '4'])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if some IDs are missing', async () => {
      mockPrisma.college.findMany.mockResolvedValue([{ id: '1' }]);
      await expect(service.compare(['1', '2'])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return comparison data for valid IDs', async () => {
      const mockColleges = [
        {
          id: '1',
          name: 'College A',
          avgPackage: 1000000,
          highestPackage: 5000000,
          placementRate: 90,
          reviews: [{ rating: 4.5 }, { rating: 5 }],
          courses: [{ name: 'CS', degree: 'B.Tech', annualFees: 100000 }],
        },
        {
          id: '2',
          name: 'College B',
          avgPackage: 900000,
          highestPackage: 4000000,
          placementRate: 85,
          reviews: [{ rating: 4.0 }],
          courses: [{ name: 'EE', degree: 'B.Tech', annualFees: 80000 }],
        },
      ];
      mockPrisma.college.findMany.mockResolvedValue(mockColleges);
      const result = await service.compare(['1', '2']);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('rating', 4.75);
      expect(result[0]).toHaveProperty('placements');
      expect(result[0]).toHaveProperty('topCourses');
    });
  });
});