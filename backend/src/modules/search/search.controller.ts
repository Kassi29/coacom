import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponse } from './dto/search-results.dto';

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.GENERAL_MANAGER, UserRole.BRANCH_MANAGER)
  async search(
    @Query() query: SearchQueryDto,
    @CurrentUser() user: User,
  ): Promise<SearchResponse> {
    return this.searchService.search(
      query.query,
      query.filter,
      query.branchId,
      user.role,
      user.branchId,
    );
  }
}
