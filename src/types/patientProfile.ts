export type ChronicDisease = {
  localId: string;
  diseaseName: string;
  from: string;
  to: string;
  note: string;
};

export type PatientProfile = {
  id: string;
  userId: string;
  bloodType?: string | null;
  height?: number | string | null;
  weight?: number | string | null;
  allergyNote?: string | null;
  chronicDiseases?: { diseaseName: string; from?: string | null; to?: string | null; note?: string | null }[];
  [key: string]: unknown;
};
