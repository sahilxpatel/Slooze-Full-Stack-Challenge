import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Country, OrderStatus, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class FoodService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userIdHeader: string | undefined) {
    const user = await this.resolveCurrentUser(userIdHeader);
    return user;
  }

  async users(currentUser: User) {
    this.assertAdmin(currentUser);
    return this.prisma.user.findMany({ orderBy: { id: 'asc' } });
  }

  async restaurants(currentUser: User) {
    return this.prisma.restaurant.findMany({
      where: this.countryScope(currentUser),
      include: { menuItems: true },
      orderBy: { id: 'asc' },
    });
  }

  async orders(currentUser: User) {
    return this.prisma.order.findMany({
      where: this.orderScope(currentUser),
      include: {
        restaurant: { include: { menuItems: true } },
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async paymentMethods(currentUser: User) {
    if (currentUser.role === Role.MEMBER) {
      throw new ForbiddenException('Members cannot access payment methods');
    }

    return this.prisma.paymentMethod.findMany({
      where: { userId: currentUser.id },
      orderBy: { id: 'asc' },
    });
  }

  async createOrder(currentUser: User, input: CreateOrderInput) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    this.assertCountryAccess(currentUser, restaurant.country);

    return this.prisma.order.create({
      data: {
        userId: currentUser.id,
        restaurantId: restaurant.id,
        country: restaurant.country,
      },
      include: {
        restaurant: { include: { menuItems: true } },
        items: { include: { menuItem: true } },
      },
    });
  }

  async addItemToOrder(currentUser: User, input: AddItemInput) {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.assertOrderAccess(currentUser, order.userId, order.country);

    if (order.status !== OrderStatus.DRAFT) {
      throw new ForbiddenException('Only draft orders can be modified');
    }

    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: input.menuItemId },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    if (menuItem.restaurantId !== order.restaurantId) {
      throw new ForbiddenException('Menu item does not belong to this order restaurant');
    }

    await this.prisma.orderItem.upsert({
      where: {
        orderId_menuItemId: {
          orderId: order.id,
          menuItemId: menuItem.id,
        },
      },
      create: {
        orderId: order.id,
        menuItemId: menuItem.id,
        quantity: input.quantity,
        unitPrice: menuItem.price,
      },
      update: {
        quantity: {
          increment: input.quantity,
        },
      },
    });

    await this.refreshOrderTotal(order.id);
    return this.getOrderById(order.id);
  }

  async removeItemFromOrder(currentUser: User, input: RemoveItemInput) {
    this.assertCanCheckout(currentUser);

    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.assertOrderAccess(currentUser, order.userId, order.country);

    if (order.status !== OrderStatus.DRAFT) {
      throw new ForbiddenException('Only draft orders can be modified');
    }

    const orderItem = await this.prisma.orderItem.findUnique({
      where: {
        orderId_menuItemId: {
          orderId: order.id,
          menuItemId: input.menuItemId,
        },
      },
    });

    if (!orderItem) {
      throw new NotFoundException('Order item not found');
    }

    await this.prisma.orderItem.delete({ where: { id: orderItem.id } });
    await this.refreshOrderTotal(order.id);
    return this.getOrderById(order.id);
  }

  async checkoutOrder(currentUser: User, input: CheckoutInput) {
    this.assertCanCheckout(currentUser);

    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.assertOrderAccess(currentUser, order.userId, order.country);

    if (!order.items.length) {
      throw new ForbiddenException('Cannot checkout an empty order');
    }

    if (order.status !== OrderStatus.DRAFT) {
      throw new ForbiddenException('Only draft orders can be checked out');
    }

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: input.paymentMethodId },
    });

    if (!paymentMethod || paymentMethod.userId !== currentUser.id) {
      throw new ForbiddenException('Payment method is invalid for the current user');
    }

    await this.refreshOrderTotal(order.id);

    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethodId: paymentMethod.id,
        status: OrderStatus.PLACED,
      },
      include: {
        restaurant: { include: { menuItems: true } },
        items: { include: { menuItem: true } },
      },
    });
  }

  async cancelOrder(currentUser: User, input: CancelOrderInput) {
    this.assertCanCheckout(currentUser);

    const order = await this.prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.assertOrderAccess(currentUser, order.userId, order.country);

    return this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELED },
      include: {
        restaurant: { include: { menuItems: true } },
        items: { include: { menuItem: true } },
      },
    });
  }

  async addPaymentMethod(currentUser: User, input: AddPaymentMethodInput) {
    this.assertAdmin(currentUser);

    return this.prisma.paymentMethod.create({
      data: {
        userId: currentUser.id,
        label: input.label,
        type: input.type,
        last4: input.last4,
      },
    });
  }

  async updatePaymentMethod(currentUser: User, input: UpdatePaymentMethodInput) {
    this.assertAdmin(currentUser);

    const method = await this.prisma.paymentMethod.findUnique({
      where: { id: input.paymentMethodId },
    });

    if (!method || method.userId !== currentUser.id) {
      throw new NotFoundException('Payment method not found');
    }

    return this.prisma.paymentMethod.update({
      where: { id: method.id },
      data: {
        label: input.label,
        type: input.type,
        last4: input.last4,
      },
    });
  }

  async deletePaymentMethod(currentUser: User, input: DeletePaymentMethodInput) {
    this.assertAdmin(currentUser);

    const method = await this.prisma.paymentMethod.findUnique({
      where: { id: input.paymentMethodId },
    });

    if (!method || method.userId !== currentUser.id) {
      throw new NotFoundException('Payment method not found');
    }

    return this.prisma.paymentMethod.delete({ where: { id: method.id } });
  }

  async resolveCurrentUser(userIdHeader?: string) {
    if (!userIdHeader) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    const userId = Number(userIdHeader);
    if (!Number.isInteger(userId)) {
      throw new UnauthorizedException('x-user-id must be a numeric id');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private countryScope(user: User) {
    if (user.role === Role.ADMIN) {
      return {};
    }

    return { country: user.country as Country };
  }

  private orderScope(user: User) {
    if (user.role === Role.ADMIN) {
      return {};
    }

    if (user.role === Role.MANAGER) {
      return { country: user.country as Country };
    }

    return {
      userId: user.id,
      country: user.country as Country,
    };
  }

  private assertAdmin(user: User) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can perform this action');
    }
  }

  private assertCanCheckout(user: User) {
    if (user.role === Role.MEMBER) {
      throw new ForbiddenException('Members cannot checkout or cancel orders');
    }
  }

  private assertCountryAccess(user: User, country: Country) {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (!user.country || user.country !== country) {
      throw new ForbiddenException('User cannot access resources outside assigned country');
    }
  }

  private assertOrderAccess(user: User, orderOwnerId: number, country: Country) {
    this.assertCountryAccess(user, country);

    if (user.role === Role.MEMBER && orderOwnerId !== user.id) {
      throw new ForbiddenException('Members can only access their own orders');
    }
  }

  private async refreshOrderTotal(orderId: number) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    const total = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

    await this.prisma.order.update({
      where: { id: orderId },
      data: { total },
    });
  }

  private async getOrderById(orderId: number) {
    return this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        restaurant: { include: { menuItems: true } },
        items: { include: { menuItem: true } },
      },
    });
  }
}
