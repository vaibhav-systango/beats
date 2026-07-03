import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../../common/enums/user.enums';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByPhoneAndRole(
    phoneNumber: string,
    roleName: UserRole,
  ): Promise<User | null> {
    return this.findOne({
      where: { phoneNumber: phoneNumber, role: { name: roleName } },
      relations: { role: true },
    });
  }

  async findActiveEmailsByRole(roleName: UserRole): Promise<string[]> {
    const users = await this.find({
      where: {
        role: { name: roleName },
        isActive: true,
      },
      relations: { role: true },
    });
    return users
      .map((user) => user.email?.trim())
      .filter((email): email is string => !!email);
  }
}
