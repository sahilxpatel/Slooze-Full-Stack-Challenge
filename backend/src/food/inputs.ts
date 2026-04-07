import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, Length, Min } from 'class-validator';

@InputType()
export class CreateOrderInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  restaurantId: number;
}

@InputType()
export class AddItemInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  orderId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  menuItemId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;
}

@InputType()
export class RemoveItemInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  orderId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  menuItemId: number;
}

@InputType()
export class CheckoutInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  orderId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  paymentMethodId: number;
}

@InputType()
export class CancelOrderInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  orderId: number;
}

@InputType()
export class AddPaymentMethodInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  label: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  type: string;

  @Field()
  @Length(4, 4)
  last4: string;
}

@InputType()
export class UpdatePaymentMethodInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  paymentMethodId: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  label: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  type: string;

  @Field()
  @Length(4, 4)
  last4: string;
}

@InputType()
export class DeletePaymentMethodInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  paymentMethodId: number;
}
