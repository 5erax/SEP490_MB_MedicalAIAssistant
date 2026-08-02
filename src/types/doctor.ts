export type Doctor = {
  id: string;
  fullName?: string;
  academicTitle?: string;
  departmentName?: string;
  specialty?: string;
  yearsOfExperience?: number;
  departmentRoleName?: string;
  departmentRole?: string;
  imageUrl?: string;
  avatarUrl?: string;
  photoUrl?: string;
  [key: string]: unknown;
};
