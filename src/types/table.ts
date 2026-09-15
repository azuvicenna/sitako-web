export interface PaginationMeta {
  page: number;
  limit: number;
  totalRows: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TableColumn<_T = any> {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}
