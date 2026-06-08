export type ApiResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[] | string> | string[] | string;
  title?: string;
};

export type PaginatedResult<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type ApiErrorPayload = ApiResponse & {
  status?: number;
};

