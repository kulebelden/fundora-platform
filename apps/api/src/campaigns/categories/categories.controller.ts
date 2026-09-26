import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { CategorySummary } from '../interfaces/campaign-response';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategoriesService } from './categories.service';

@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() dto: CreateCategoryDto): Promise<CategorySummary> {
    return this.categoriesService.create(dto);
  }

  @Get()
  async findAll(): Promise<CategorySummary[]> {
    return this.categoriesService.findAll();
  }
}
