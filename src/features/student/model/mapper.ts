// src/features/student/model/mapper.ts

import type { Student } from '@/entities/student/model/types';
import type { StudentApiDto } from '@/features/student/model/contracts';

export function mapApiToStudent(dto: StudentApiDto): Student {
  return {
    id: dto.id,
    fullName: dto.fullName,
    roomNumber: dto.roomNumber,
    faculty: dto.faculty,
    course: dto.course,
    studyGroup: dto.studyGroup,
  };
}
