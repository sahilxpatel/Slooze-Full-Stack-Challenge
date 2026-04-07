import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Country, OrderStatus, Role } from '@prisma/client';

registerEnumType(Role, { name: 'Role' });
registerEnumType(Country, { name: 'Country' });
registerEnumType(OrderStatus, { name: 'OrderStatus' });

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field(() => Role)
  role: Role;

  @Field(() => Country, { nullable: true })
  country: Country | null;
}

@ObjectType()
export class MenuItemType {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  restaurantId: number;
}

@ObjectType()
export class RestaurantType {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field(() => Country)
  country: Country;

  @Field(() => [MenuItemType])
  menuItems: MenuItemType[];
}

@ObjectType()
export class PaymentMethodType {
  @Field(() => ID)
  id: number;

  @Field()
  label: string;

  @Field()
  type: string;

  @Field()
  last4: string;
}

@ObjectType()
export class OrderItemType {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  menuItemId: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  subtotal: number;

  @Field(() => MenuItemType)
  menuItem: MenuItemType;
}

@ObjectType()
export class OrderType {
  @Field(() => ID)
  id: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Float)
  total: number;

  @Field(() => Country)
  country: Country;

  @Field(() => Int)
  userId: number;

  @Field(() => Int)
  restaurantId: number;

  @Field(() => Int, { nullable: true })
  paymentMethodId: number | null;

  @Field()
  createdAt: Date;

  @Field(() => RestaurantType)
  restaurant: RestaurantType;

  @Field(() => [OrderItemType])
  items: OrderItemType[];
}
