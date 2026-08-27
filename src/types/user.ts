export type UserProfile = {
  id?: string;
  userId?: string;
  identityId?: string;
  email?: string;
  displayName?: string;
  name?: string;
  phoneNumber?: string | null;
  address?: string | null;
  gender?: number | string | null;
  dateOfBirth?: string | null;
  roles?: string[] | string;
  status?: number;
};

