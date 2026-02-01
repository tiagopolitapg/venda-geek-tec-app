// Sistema de permissões por role
export const checkPermission = (user, action, resource) => {
  const role = user?.user_role || user?.role || 'viewer';
  
  const permissions = {
    admin: {
      products: ['create', 'read', 'update', 'delete'],
      clients: ['create', 'read', 'update', 'delete'],
      sales: ['create', 'read', 'update', 'delete'],
    },
    operator: {
      products: ['read'],
      clients: ['create', 'read', 'update'],
      sales: ['create', 'read', 'update'],
    },
    viewer: {
      products: ['read'],
      clients: ['read'],
      sales: ['read'],
    },
  };
  
  return permissions[role]?.[resource]?.includes(action) || false;
};

export const canCreate = (user, resource) => checkPermission(user, 'create', resource);
export const canUpdate = (user, resource) => checkPermission(user, 'update', resource);
export const canDelete = (user, resource) => checkPermission(user, 'delete', resource);
export const canRead = (user, resource) => checkPermission(user, 'read', resource);