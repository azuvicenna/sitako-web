import type { Component } from 'vue';
import type { UserRole } from '@/types/auth';

export interface SidebarMenuItem {
  title: string;
  path: string;
  icon: Component;
  roles?: UserRole[];
  badge?: string | number;
}

export interface SidebarMenuGroup {
  title?: string;
  roles?: UserRole[];
  items: SidebarMenuItem[];
}
