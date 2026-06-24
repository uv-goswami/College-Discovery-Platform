import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const SaveCollegeSchema = z.object({
  collegeId: z.string(),
});

export class SaveCollegeDto extends createZodDto(SaveCollegeSchema) {}