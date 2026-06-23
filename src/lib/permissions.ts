import {
  UserProfile,
  PermissionAction
} from '../domain/types';

function hasLegacyModuleAccess(
  profile: UserProfile,
  module: string
): boolean {
  return profile.permissions?.includes(module) || false;
}

export function canAccessModule(
  profile: UserProfile | null | undefined,
  module: string
): boolean {
  if (!profile || profile.active === false) {
    return false;
  }

  if (profile.isAdmin) {
    return true;
  }

  const modulePermissions = profile.permissionsActions?.[module];

  if (modulePermissions) {
    return modulePermissions.view === true;
  }

  return hasLegacyModuleAccess(profile, module);
}

export function canDoAction(
  profile: UserProfile | null | undefined,
  module: string,
  action: PermissionAction
): boolean {
  if (!profile || profile.active === false) {
    return false;
  }

  if (profile.isAdmin) {
    return true;
  }

  const modulePermissions = profile.permissionsActions?.[module];

  if (modulePermissions) {
    return modulePermissions[action] === true;
  }

  const hasLegacyAccess = hasLegacyModuleAccess(profile, module);

  if (!hasLegacyAccess) {
    return false;
  }

  return action === 'view';
}

export function canView(
  profile: UserProfile | null | undefined,
  module: string
): boolean {
  return canDoAction(profile, module, 'view');
}

export function canCreate(
  profile: UserProfile | null | undefined,
  module: string
): boolean {
  return canDoAction(profile, module, 'create');
}

export function canEdit(
  profile: UserProfile | null | undefined,
  module: string
): boolean {
  return canDoAction(profile, module, 'edit');
}

export function canDelete(
  profile: UserProfile | null | undefined,
  module: string
): boolean {
  return canDoAction(profile, module, 'delete');
}

export function canApprove(
  profile: UserProfile | null | undefined,
  module: string
): boolean {
  return canDoAction(profile, module, 'approve');
}

export function canCancel(
  profile: UserProfile | null | undefined,
  module: string
): boolean {
  return canDoAction(profile, module, 'cancel');
}

export function canExport(
  profile: UserProfile | null | undefined,
  module: string
): boolean {
  return canDoAction(profile, module, 'export');
}

export function isAdmin(
  profile: UserProfile | null | undefined
): boolean {
  return !!profile?.isAdmin && profile.active !== false;
}