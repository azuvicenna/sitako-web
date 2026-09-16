import type { PaginationMeta } from '@/types/table';
import type { MemberUser, LibrarianUser } from '@/types/auth';

export interface MemberListResponse {
  success: boolean;
  message: string;
  data: MemberUser[];
  meta: PaginationMeta;
}

export interface LibrarianListResponse {
  success: boolean;
  message: string;
  data: LibrarianUser[];
  meta: PaginationMeta;
}
