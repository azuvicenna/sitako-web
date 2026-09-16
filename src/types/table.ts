export interface PaginationMeta {
  page: number;
  limit: number;
  totalRows: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TableColumn<T = Record<string, unknown>> {
  key: (keyof T & string) | string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}
