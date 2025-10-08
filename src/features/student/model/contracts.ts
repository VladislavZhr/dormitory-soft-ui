export type StudentApiDto = {
  id: number;
  fullName: string;
  roomNumber: string;
  faculty: string;
  studyGroup: string;
};

export type UpdateStudentRequest = Partial<{
  fullName: string;
  roomNumber: string;
  faculty: string;
  studyGroup: string;
}>;

export type UpdateStudentResponse = StudentApiDto;

export type DeleteStudentResponse = {
  success: boolean;
  message?: string;
};
