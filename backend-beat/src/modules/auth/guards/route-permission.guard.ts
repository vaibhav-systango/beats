import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ROUTE_PERMISSION_ERRORS } from '../constants/auth.constants';
import { RoutePermissionRepository } from '../../../database/repositories/route-permission.repository';
import { RoleRepository } from '../../../database/repositories/role.repository';

@Injectable()
export class RoutePermissionGuard implements CanActivate {
  constructor(
    private readonly routePermissionRepository: RoutePermissionRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user, method, route } = request;

    const path = route?.path;
    const httpMethod = method.toUpperCase();

    const routePerm = await this.routePermissionRepository.findByRouteAndMethod(
      path,
      httpMethod,
    );

    if (!routePerm) return true; // if no permissions required, allow access

    const requiredPermissionIds: string[] = routePerm.permissionIds;

    // fetch user permissions
    const userPermissionIds: string[] =
      await this.roleRepository.getPermissionIdsByRoleId(user.roleId);

    // check if user has all required permissions
    const hasAllPermissions = requiredPermissionIds.every((pid) =>
      userPermissionIds.includes(pid),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(ROUTE_PERMISSION_ERRORS.PERMISSION_DENIED);
    }

    return true;
  }
}
