import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const SearchCollegesSchema = z.object({
  search: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  minFees: z.coerce.number().optional(),
  maxFees: z.coerce.number().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export class SearchCollegesDto extends createZodDto(SearchCollegesSchema) {}