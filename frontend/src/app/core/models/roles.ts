/** Roles that an admin can assign to a tenant member (matches backend seed). */
export const ASSIGNABLE_ROLES: { value: string; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'engineering_manager', label: 'Engineering Manager' },
  { value: 'viewer', label: 'Viewer' },
];

export function roleLabel(name: string): string {
  return ASSIGNABLE_ROLES.find(r => r.value === name)?.label ?? name;
}
