export type StudentApiDto = {
  id: number;
  fullName: string;
  roomNumber: string;
  faculty: string;
  course: number;
  studyGroup: string;
};

export type UpdateStudentRequest = Partial<{
  fullName: string;
  roomNumber: string;
  faculty: string;
  course: number;
  studyGroup: string;
}>;

export type UpdateStudentResponse = StudentApiDto;
