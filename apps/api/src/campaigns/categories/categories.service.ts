import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignCategory } from '../../modules/campaigns/entities/campaign-category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategorySummary } from '../interfaces/campaign-response';
import { slugify } from '../utils/slug';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CampaignCategory)
    private readonly categories: Repository<CampaignCategory>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<CategorySummary> {
    const slug = slugify(dto.name);
    await this.categories
      .createQueryBuilder()
      .setLock('pessimistic_write')
      .where('slug = :slug', { slug })
      .getOne();

    const existing = await this.categories.findOne({ where: { slug } });
    if (existing) {
      throw new Error('A category with this name already exists');
    }

    const category = await this.categories.save(
      this.categories.create({ name: dto.name, slug, description: dto.description ?? null }),
    );

    return this.toSummary(category);
  }

  async findAll(): Promise<CategorySummary[]> {
    const categories = await this.categories.find();
    return categories.map(this.toSummary);
  }

  private toSummary(category: CampaignCategory): CategorySummary {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
    };
  }
}
