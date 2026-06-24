import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SavedService } from './saved.service';
import { SaveCollegeDto } from './dto/save-college.dto';
import { SaveComparisonDto } from './dto/save-comparison.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class SavedController {
  constructor(private savedService: SavedService) {}

  // Saved Colleges
  @Get('saved-colleges')
  async getSavedColleges(@CurrentUser() user: { userId: string }) {
    return this.savedService.getSavedColleges(user.userId);
  }

  @Post('saved-colleges')
  async saveCollege(@CurrentUser() user: { userId: string }, @Body() dto: SaveCollegeDto) {
    return this.savedService.saveCollege(user.userId, dto.collegeId);
  }

  @Delete('saved-colleges/:collegeId')
  async removeSavedCollege(@CurrentUser() user: { userId: string }, @Param('collegeId') collegeId: string) {
    return this.savedService.removeSavedCollege(user.userId, collegeId);
  }

  // Saved Comparisons
  @Get('saved-comparisons')
  async getSavedComparisons(@CurrentUser() user: { userId: string }) {
    return this.savedService.getSavedComparisons(user.userId);
  }

  @Post('saved-comparisons')
  async saveComparison(@CurrentUser() user: { userId: string }, @Body() dto: SaveComparisonDto) {
    return this.savedService.saveComparison(user.userId, dto.collegeIds);
  }

  @Delete('saved-comparisons/:comparisonId')
  async removeSavedComparison(@CurrentUser() user: { userId: string }, @Param('comparisonId') comparisonId: string) {
    return this.savedService.removeSavedComparison(user.userId, comparisonId);
  }
}