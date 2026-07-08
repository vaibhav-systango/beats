import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleRepository extends Repository<Role> {
  constructor(dataSource: DataSource) {
    super(Role, dataSource.createEntityManager());
  }

  async getPermissionIdsByRoleId(roleId: string): Promise<string[]> {
    const role = await this.findOne({
      where: { id: roleId },
      relations: { permissions: true },
    });

    if (!role || !role.permissions) return [];

    return role.permissions.map((permission) => permission.id);
  }
}
