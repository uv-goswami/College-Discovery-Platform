import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const SaveComparisonSchema = z.object({
  collegeIds: z.array(z.string()).min(2).max(3),
});

export class SaveComparisonDto extends createZodDto(SaveComparisonSchema) {}