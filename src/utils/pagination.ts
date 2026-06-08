export function withPagination(pageNumber = 1, pageSize = 10) {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  });

  return params.toString();
}

