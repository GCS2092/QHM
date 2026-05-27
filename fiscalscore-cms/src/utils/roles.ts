export function isApiAdmin(user: { role?: { name?: string; type?: string } } | null | undefined): boolean {
  if (!user?.role) return false;
  const name = (user.role.name ?? '').toLowerCase();
  const type = (user.role.type ?? '').toLowerCase();
  return name === 'admin' || name === 'administrator' || type === 'admin';
}
