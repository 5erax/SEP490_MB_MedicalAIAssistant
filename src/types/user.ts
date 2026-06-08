export type UserProfile = {
  id?: string;
  userId?: string;
  identityId?: string;
  email?: string;
  displayName?: string;
  name?: string;
  phoneNumber?: string;
  address?: string;
  gender?: number;
  dateOfBirth?: string | null;
  roles?: string[] | string;
  status?: number;
};

