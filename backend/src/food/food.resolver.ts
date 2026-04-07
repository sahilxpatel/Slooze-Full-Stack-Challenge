import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Request } from 'express';
import {
  OrderType,
  PaymentMethodType,
  RestaurantType,
  UserType,
} from './dto';
import {
  AddItemInput,
  AddPaymentMethodInput,
  CancelOrderInput,
  CheckoutInput,
  CreateOrderInput,
  DeletePaymentMethodInput,
  RemoveItemInput,
  UpdatePaymentMethodInput,
} from './inputs';
import { FoodService } from './food.service';

@Resolver()
export class FoodResolver {
  constructor(private readonly foodService: FoodService) {}

  private userIdFromReq(req: Request) {
    const raw = req.headers['x-user-id'];
    return Array.isArray(raw) ? raw[0] : raw;
  }

  @Query(() => UserType)
  async me(@Context('req') req: Request) {
    return this.foodService.me(this.userIdFromReq(req));
  }

  @Query(() => [UserType])
  async users(@Context('req') req: Request) {
    const currentUser = await this.foodService.resolveCurrentUser(this.userIdFromReq(req));
    return this.foodService.users(currentUser);
  }

  @Query(() => [RestaurantType])
  async restaurants(@Context('req') req: Request) {
    const currentUser = await this.foodService.resolveCurrentUser(this.userIdFromReq(req));
    return this.foodService.restaurants(currentUser);
  }

  @Query(() => [OrderType])
  async orders(@Context('req') req: Request) {
    const currentUser = await this.foodService.resolveCurrentUser(this.userIdFromReq(req));
    return this.foodService.orders(currentUser);
  }

  @Query(() => [PaymentMethodType])
  async paymentMethods(@Context('req') req: Request) {
    const currentUser = await this.foodService.resolveCurrentUser(this.userIdFromReq(req));
    return this.foodService.paymentMethods(currentUser);
  }

  @Mutation(() => OrderType)
  async createOrder(
    @Context('req') req: Request,
    @Args('input') input: CreateOrderInput,
  ) {
    const currentUser = await this.foodService.resolveCurrentUser(this.userIdFromReq(req));
    return this.foodService.createOrder(currentUser, input);
  }

  @Mutation(() => OrderType)
  async addItemToOrder(
    @Context('req') req: Request,
    @Args('input') input: AddItemInput,
  ) {
    const currentUser = await this.foodService.resolveCurrentUser(this.userIdFromReq(req));
    return this.foodService.addItemToOrder(currentUser, input);
  }

  @Mutation(() => OrderType)
  async removeItemFromOrder(
    @Context('req') req: Request,
    @Args('input') input: RemoveItemInput,
  ) {
    const currentUser = await this.foodService.resolveCurrentUser(this.userIdFromReq(req));
    return this.foodService.removeItemFromOrder(currentUser, input);
  }

  @Mutation(() => OrderType)
  async checkoutOrder(
    @Context('req') req: Request,
    @Args('input') input: CheckoutInput,
  ) {
    const currentUser = await this.foodService.resolveCurrentUser(this.userIdFromReq(req));
    return this.foodService.checkoutOrder(currentUser, input);
  }

  @Mutation(() => OrderType)
  async cancelOrder(
    @Context('req') req: Request,
    @Args('input') input: CancelOrderInput,
  ) {
    const currentUser = await this.foodService.resolveCurrentUser(this.userIdFromReq(req));
    return this.foodService.cancelOrder(currentUser, input);
  }

  @Mutation(() => PaymentMethodType)
  async addPaymentMethod(
    @Context('req') req: Request,
    @Args('input') input: AddPaymentMethodInput,
  ) {
    const currentUser = await this.foodService.resolveCurrentUser(this.userIdFromReq(req));
    return this.foodService.addPaymentMethod(currentUser, input);
  }

  @Mutation(() => PaymentMethodType)
  async updatePaymentMethod(
    @Context('req') req: Request,
    @Args('input') input: UpdatePaymentMethodInput,
  ) {
    const currentUser = await this.foodService.resolveCurrentUser(this.userIdFromReq(req));
    return this.foodService.updatePaymentMethod(currentUser, input);
  }

  @Mutation(() => PaymentMethodType)
  async deletePaymentMethod(
    @Context('req') req: Request,
    @Args('input') input: DeletePaymentMethodInput,
  ) {
    const currentUser = await this.foodService.resolveCurrentUser(this.userIdFromReq(req));
    return this.foodService.deletePaymentMethod(currentUser, input);
  }
}
