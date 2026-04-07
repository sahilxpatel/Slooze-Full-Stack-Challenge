"use client";

import { ApolloClient, HttpLink, InMemoryCache, gql } from "@apollo/client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Role = "ADMIN" | "MANAGER" | "MEMBER";

type AppUser = {
  id: number;
  name: string;
  role: Role;
  country?: "INDIA" | "AMERICA" | null;
};

type Restaurant = {
  id: number;
  name: string;
  country: "INDIA" | "AMERICA";
  menuItems: Array<{ id: number; name: string; price: number }>;
};

type Order = {
  id: number;
  status: "DRAFT" | "PLACED" | "CANCELED";
  total: number;
  country: "INDIA" | "AMERICA";
  paymentMethodId?: number | null;
  restaurant: { id: number; name: string };
  items: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    menuItem: { id: number; name: string };
  }>;
};

type PaymentMethod = {
  id: number;
  label: string;
  type: string;
  last4: string;
};

const SEEDED_USERS: Array<{ id: number; name: string }> = [
  { id: 1, name: "Nick Fury (Admin)" },
  { id: 2, name: "Captain Marvel (Manager India)" },
  { id: 3, name: "Captain America (Manager America)" },
  { id: 4, name: "Thanos (Member India)" },
  { id: 5, name: "Thor (Member India)" },
  { id: 6, name: "Travis (Member America)" },
];

const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      role
      country
    }
  }
`;

const RESTAURANTS_QUERY = gql`
  query Restaurants {
    restaurants {
      id
      name
      country
      menuItems {
        id
        name
        price
      }
    }
  }
`;

const ORDERS_QUERY = gql`
  query Orders {
    orders {
      id
      status
      total
      country
      paymentMethodId
      restaurant {
        id
        name
      }
      items {
        id
        quantity
        unitPrice
        menuItem {
          id
          name
        }
      }
    }
  }
`;

const PAYMENT_METHODS_QUERY = gql`
  query PaymentMethods {
    paymentMethods {
      id
      label
      type
      last4
    }
  }
`;

const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
    }
  }
`;

const ADD_ITEM_MUTATION = gql`
  mutation AddItemToOrder($input: AddItemInput!) {
    addItemToOrder(input: $input) {
      id
    }
  }
`;

const REMOVE_ITEM_MUTATION = gql`
  mutation RemoveItemFromOrder($input: RemoveItemInput!) {
    removeItemFromOrder(input: $input) {
      id
    }
  }
`;

const CHECKOUT_MUTATION = gql`
  mutation CheckoutOrder($input: CheckoutInput!) {
    checkoutOrder(input: $input) {
      id
    }
  }
`;

const CANCEL_MUTATION = gql`
  mutation CancelOrder($input: CancelOrderInput!) {
    cancelOrder(input: $input) {
      id
    }
  }
`;

const ADD_PAYMENT_MUTATION = gql`
  mutation AddPaymentMethod($input: AddPaymentMethodInput!) {
    addPaymentMethod(input: $input) {
      id
    }
  }
`;

const UPDATE_PAYMENT_MUTATION = gql`
  mutation UpdatePaymentMethod($input: UpdatePaymentMethodInput!) {
    updatePaymentMethod(input: $input) {
      id
    }
  }
`;

const DELETE_PAYMENT_MUTATION = gql`
  mutation DeletePaymentMethod($input: DeletePaymentMethodInput!) {
    deletePaymentMethod(input: $input) {
      id
    }
  }
`;

export default function Home() {
  const [selectedUserId, setSelectedUserId] = useState<number>(1);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const apiUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }

    if (typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.hostname}:4000/graphql`;
    }

    return "http://localhost:4000/graphql";
  }, []);

  const client = useMemo(
    () =>
      new ApolloClient({
        link: new HttpLink({
          uri: apiUrl,
          headers: { "x-user-id": String(selectedUserId) },
          fetch,
        }),
        cache: new InMemoryCache(),
      }),
    [apiUrl, selectedUserId],
  );

  const refresh = async () => {
    setLoading(true);
    setMessage("");
    try {
      const meRes = await client.query<{ me: AppUser }>({
        query: ME_QUERY,
        fetchPolicy: "no-cache",
      });
      if (!meRes.data?.me) {
        throw new Error("Unable to load current user");
      }
      setCurrentUser({
        ...meRes.data.me,
        id: Number(meRes.data.me.id),
      });

      const restaurantsRes = await client.query<{ restaurants: Restaurant[] }>({
        query: RESTAURANTS_QUERY,
        fetchPolicy: "no-cache",
      });
      setRestaurants(
        (restaurantsRes.data?.restaurants ?? []).map((restaurant) => ({
          ...restaurant,
          id: Number(restaurant.id),
          menuItems: restaurant.menuItems.map((menuItem) => ({
            ...menuItem,
            id: Number(menuItem.id),
          })),
        })),
      );

      const ordersRes = await client.query<{ orders: Order[] }>({
        query: ORDERS_QUERY,
        fetchPolicy: "no-cache",
      });
      setOrders(
        (ordersRes.data?.orders ?? []).map((order) => ({
          ...order,
          id: Number(order.id),
          total: Number(order.total),
          paymentMethodId: order.paymentMethodId == null ? null : Number(order.paymentMethodId),
          restaurant: {
            ...order.restaurant,
            id: Number(order.restaurant.id),
          },
          items: order.items.map((item) => ({
            ...item,
            id: Number(item.id),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            menuItem: {
              ...item.menuItem,
              id: Number(item.menuItem.id),
            },
          })),
        })),
      );

      if (meRes.data.me.role !== "MEMBER") {
        const payRes = await client.query<{ paymentMethods: PaymentMethod[] }>({
          query: PAYMENT_METHODS_QUERY,
          fetchPolicy: "no-cache",
        });
        const normalizedPaymentMethods = (payRes.data?.paymentMethods ?? []).map((paymentMethod) => ({
            ...paymentMethod,
            id: Number(paymentMethod.id),
          }));

        setPaymentMethods(normalizedPaymentMethods);
        setSelectedPaymentMethodId((current) => {
          if (!normalizedPaymentMethods.length) {
            return null;
          }

          if (current && normalizedPaymentMethods.some((method) => method.id === current)) {
            return current;
          }

          return normalizedPaymentMethods[0].id;
        });
      } else {
        setPaymentMethods([]);
        setSelectedPaymentMethodId(null);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [client]);

  const createOrder = async (restaurantId: number) => {
    await client.mutate({
      mutation: CREATE_ORDER_MUTATION,
      variables: { input: { restaurantId: Number(restaurantId) } },
    });
    await refresh();
  };

  const addItem = async (orderId: number, menuItemId: number) => {
    await client.mutate({
      mutation: ADD_ITEM_MUTATION,
      variables: {
        input: {
          orderId: Number(orderId),
          menuItemId: Number(menuItemId),
          quantity: 1,
        },
      },
    });
    await refresh();
  };

  const removeItem = async (orderId: number, menuItemId: number) => {
    await client.mutate({
      mutation: REMOVE_ITEM_MUTATION,
      variables: {
        input: {
          orderId: Number(orderId),
          menuItemId: Number(menuItemId),
        },
      },
    });
    await refresh();
  };

  const checkoutOrder = async (orderId: number) => {
    if (!paymentMethods.length) {
      setMessage("No payment methods available for this user.");
      return;
    }

    const paymentMethodId =
      selectedPaymentMethodId && paymentMethods.some((method) => method.id === selectedPaymentMethodId)
        ? selectedPaymentMethodId
        : paymentMethods[0].id;

    await client.mutate({
      mutation: CHECKOUT_MUTATION,
      variables: {
        input: {
          orderId: Number(orderId),
          paymentMethodId: Number(paymentMethodId),
        },
      },
    });
    await refresh();
  };

  const cancelOrder = async (orderId: number) => {
    await client.mutate({
      mutation: CANCEL_MUTATION,
      variables: { input: { orderId: Number(orderId) } },
    });
    await refresh();
  };

  const addPaymentMethod = async () => {
    await client.mutate({
      mutation: ADD_PAYMENT_MUTATION,
      variables: { input: { label: "New Admin Card", type: "CARD", last4: "9090" } },
    });
    await refresh();
  };

  const updatePaymentMethod = async (paymentMethodId: number) => {
    await client.mutate({
      mutation: UPDATE_PAYMENT_MUTATION,
      variables: {
        input: {
          paymentMethodId: Number(paymentMethodId),
          label: "Updated Admin Card",
          type: "CARD",
          last4: "8080",
        },
      },
    });
    await refresh();
  };

  const deletePaymentMethod = async (paymentMethodId: number) => {
    await client.mutate({
      mutation: DELETE_PAYMENT_MUTATION,
      variables: {
        input: {
          paymentMethodId: Number(paymentMethodId),
        },
      },
    });
    await refresh();
  };

  const menuByRestaurant = useMemo(() => {
    const map = new Map<number, Restaurant>();
    restaurants.forEach((restaurant) => map.set(restaurant.id, restaurant));
    return map;
  }, [restaurants]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-10">
      <section className="hero rounded-2xl p-6 md:p-8">
        <div className="mb-2 flex items-center gap-3">
          <Image src="/slooze-logo.png" alt="Slooze logo" width={34} height={34} priority />
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-700">SLOOZE</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-5xl">Role-Based Food Ordering Console</h1>
        <p className="mt-2 text-slate-700">
          RBAC + country-scoped access (India and America) with GraphQL and Apollo Client.
        </p>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          <label htmlFor="user-select" className="text-sm font-medium text-slate-800">
            Login as seeded user
          </label>
          <select
            id="user-select"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(Number(event.target.value))}
          >
            {SEEDED_USERS.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <button className="btn" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-700">
          Active user: <strong>{currentUser?.name ?? "-"}</strong> | Role: <strong>{currentUser?.role ?? "-"}</strong> |
          Country: <strong>{currentUser?.country ?? "Global"}</strong>
        </p>

        {message ? <p className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{message}</p> : null}
        {loading ? <p className="mt-3 text-sm text-slate-600">Loading...</p> : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <div className="panel-header">
            <h2>Restaurants and Menu</h2>
          </div>
          <div className="panel-body">
            {restaurants.map((restaurant) => (
              <article key={restaurant.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                    <p className="text-sm text-slate-600">{restaurant.country}</p>
                  </div>
                  <button className="btn" onClick={() => void createOrder(restaurant.id)}>
                    Create Order
                  </button>
                </div>
                <ul className="mt-3 space-y-2">
                  {restaurant.menuItems.map((item) => (
                    <li key={item.id} className="menu-row">
                      <span>{item.name}</span>
                      <span>${item.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Orders</h2>
          </div>
          <div className="panel-body">
            {orders.length === 0 ? <p className="text-sm text-slate-600">No orders yet.</p> : null}
            {orders.map((order) => (
              <article key={order.id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">
                    #{order.id} - {order.restaurant.name}
                  </h3>
                  <span className="badge">{order.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">Country: {order.country}</p>
                <p className="text-sm text-slate-800">Total: ${order.total.toFixed(2)}</p>

                <ul className="mt-2 space-y-2">
                  {order.items.map((item) => (
                    <li key={item.id} className="menu-row">
                      <span>{item.menuItem.name} x {item.quantity}</span>
                      <div className="flex items-center gap-2">
                        <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                        {order.status === "DRAFT" && currentUser?.role !== "MEMBER" ? (
                          <button
                            className="btn-danger"
                            onClick={() => void removeItem(order.id, item.menuItem.id)}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>

                {order.status === "DRAFT" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(menuByRestaurant.get(order.restaurant.id)?.menuItems ?? []).map((menuItem) => (
                      <button
                        key={menuItem.id}
                        className="btn-secondary"
                        onClick={() => void addItem(order.id, menuItem.id)}
                      >
                        + {menuItem.name}
                      </button>
                    ))}
                    {currentUser?.role !== "MEMBER" ? (
                      <>
                        <button className="btn" onClick={() => void checkoutOrder(order.id)}>
                          Checkout
                        </button>
                        <button className="btn-danger" onClick={() => void cancelOrder(order.id)}>
                          Cancel
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      {currentUser?.role !== "MEMBER" ? (
        <section className="panel">
          <div className="panel-header">
            <h2>
              {currentUser?.role === "ADMIN"
                ? "Payment Methods (Admin: Full Access)"
                : "Payment Methods (Manager: View & Use)"}
            </h2>
            {currentUser?.role === "ADMIN" ? (
              <button className="btn" onClick={() => void addPaymentMethod()}>
                Add Method
              </button>
            ) : null}
          </div>
          <div className="panel-body">
            {paymentMethods.length ? (
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="checkout-payment-method">
                  Checkout will use this card
                </label>
                <select
                  id="checkout-payment-method"
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={selectedPaymentMethodId ?? ""}
                  onChange={(event) => setSelectedPaymentMethodId(Number(event.target.value))}
                >
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.label} ({method.type}) •••• {method.last4}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-slate-600">No payment methods found for this user.</p>
            )}

            {paymentMethods.map((method) => (
              <article key={method.id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{method.label}</h3>
                    <p className="text-sm text-slate-600">
                      {method.type} ending in {method.last4}
                    </p>
                  </div>
                  {currentUser?.role === "ADMIN" ? (
                    <>
                      <button className="btn-secondary" onClick={() => void updatePaymentMethod(method.id)}>
                        Quick Update
                      </button>
                      <button className="btn-danger" onClick={() => void deletePaymentMethod(method.id)}>
                        Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
