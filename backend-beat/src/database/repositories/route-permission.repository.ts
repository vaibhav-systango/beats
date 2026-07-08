import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RoutePermission } from '../entities/route-permission.entity';

@Injectable()
export class RoutePermissionRepository extends Repository<RoutePermission> {
  constructor(dataSource: DataSource) {
    super(RoutePermission, dataSource.createEntityManager());
  }

  async findByRouteAndMethod(
    route: string,
    method: string,
  ): Promise<RoutePermission | null> {
    return this.findOne({
      where: { route, method },
    });
  }
}
