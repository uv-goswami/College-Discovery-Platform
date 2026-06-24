import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CompareCollegesSchema = z.object({
  ids: z.string().regex(/^[^,]+(?:,[^,]+){1,2}$/), // 2-3 comma-separated ids
});

export class CompareCollegesDto extends createZodDto(CompareCollegesSchema) {}