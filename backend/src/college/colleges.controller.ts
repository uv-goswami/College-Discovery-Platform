import { Controller, Get, Query, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { SearchCollegesDto } from './dto/search-colleges.dto';
import { CompareCollegesDto } from './dto/compare-colleges.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('colleges')
export class CollegesController {
  constructor(private collegesService: CollegesService) {}

  @Get()
  async search(@Query() query: SearchCollegesDto) {
    const { search, state, city, minFees, maxFees, minRating, page, limit } = query;
    return this.collegesService.search({
      search,
      state,
      city,
      minFees,
      maxFees,
      minRating,
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Get('compare')
  async compare(@Query() query: CompareCollegesDto) {
    const ids = query.ids.split(',').map(id => id.trim());
    if (ids.length < 2 || ids.length > 3) {
      throw new BadRequestException({ code: 'INVALID_PARAM', message: 'Must provide 2-3 college ids' });
    }
    return this.collegesService.compare(ids);
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    const college = await this.collegesService.findById(id);
    if (!college) throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'College not found' });
    return college;
  }

  @Get(':id/reviews')
  async getReviews(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.collegesService.getReviews(id, query.page, query.limit);
  }
}