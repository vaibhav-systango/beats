import { Injectable } from '@nestjs/common';
import { UserOnboardingDto } from './dto/user-onboarding.dto';
import { UserRepository } from '../../database/repositories/user.repository';
import { EventCategoryRepository } from '../../database/repositories/event-category.repository';
import { UsersConstants } from './constants/users.constants';
import { In } from 'typeorm';
import { UserOnboardingStatus } from '../../common/enums/user.enums';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventCategoryRepository: EventCategoryRepository,
  ) {}

  async onboardUser(userId: string, dto: UserOnboardingDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { categories: true },
    });

    if (!user) {
      throw new Error(UsersConstants.USER_NOT_FOUND);
    }

    const categories = await this.eventCategoryRepository.find({
      where: {
        id: In(dto.categoryIds),
        isDeleted: false,
      },
    });

    if (categories.length !== dto.categoryIds.length) {
      throw new Error(UsersConstants.INVALID_CATEGORIES);
    }

    // Update user properties
    user.fullName = dto.fullName;

    if (dto.email !== undefined) {
      user.email = dto.email;
    }

    if (dto.profileImage !== undefined) {
      user.profileImage = dto.profileImage;
    }

    if (dto.location) {
      user.location = {
        type: 'Point',
        coordinates: [dto.location.longitude, dto.location.latitude],
      };
    }

    user.categories = categories;
    user.onboardingStatus = UserOnboardingStatus.COMPLETED;

    await this.userRepository.save(user);

    return {
      message: UsersConstants.ONBOARDING_SUCCESS,
    };
  }
}
