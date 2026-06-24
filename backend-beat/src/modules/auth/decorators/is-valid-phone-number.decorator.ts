import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
  isPhoneNumber,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidPhoneNumber', async: false })
export class IsValidPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(phoneNumber: string, args: ValidationArguments) {
    const object = args.object as any;
    const countryCode = object.countryCode;

    if (!countryCode || !phoneNumber) return false;

    // Combine country code and phone number.
    // isPhoneNumber automatically infers the region if the string starts with a '+'
    const cleanCountryCode = countryCode.trim();
    const cleanPhoneNumber = phoneNumber.replace(/[\s-]/g, '');
    const fullNumber = `${cleanCountryCode}${cleanPhoneNumber}`;

    return isPhoneNumber(fullNumber);
  }

  defaultMessage(args: ValidationArguments) {
    return 'The phone number must be a valid number for the specified country code.';
  }
}

export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPhoneNumberConstraint,
    });
  };
}
