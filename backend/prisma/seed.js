"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.paymentMethod.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$executeRawUnsafe('DELETE FROM sqlite_sequence;');
    const nick = await prisma.user.create({
        data: { name: 'Nick Fury', role: client_1.Role.ADMIN },
    });
    const captainMarvel = await prisma.user.create({
        data: { name: 'Captain Marvel', role: client_1.Role.MANAGER, country: client_1.Country.INDIA },
    });
    const captainAmerica = await prisma.user.create({
        data: { name: 'Captain America', role: client_1.Role.MANAGER, country: client_1.Country.AMERICA },
    });
    await prisma.user.createMany({
        data: [
            { name: 'Thanos', role: client_1.Role.MEMBER, country: client_1.Country.INDIA },
            { name: 'Thor', role: client_1.Role.MEMBER, country: client_1.Country.INDIA },
            { name: 'Travis', role: client_1.Role.MEMBER, country: client_1.Country.AMERICA },
        ],
    });
    await prisma.paymentMethod.createMany({
        data: [
            { userId: nick.id, label: 'Nick Corporate Visa', type: 'CARD', last4: '4242' },
            { userId: captainMarvel.id, label: 'Marvel Team Card', type: 'CARD', last4: '1111' },
            { userId: captainAmerica.id, label: 'America Team Card', type: 'CARD', last4: '2222' },
        ],
    });
    await prisma.restaurant.create({
        data: {
            name: 'Mumbai Masala Hub',
            country: client_1.Country.INDIA,
            menuItems: {
                create: [
                    { name: 'Paneer Tikka Bowl', price: 8.5 },
                    { name: 'Butter Chicken Wrap', price: 9.25 },
                    { name: 'Masala Fries', price: 4.75 },
                ],
            },
        },
    });
    await prisma.restaurant.create({
        data: {
            name: 'New York Deli Works',
            country: client_1.Country.AMERICA,
            menuItems: {
                create: [
                    { name: 'Classic Cheeseburger', price: 11.5 },
                    { name: 'Chicken Caesar Salad', price: 9.5 },
                    { name: 'Loaded Nachos', price: 7.0 },
                ],
            },
        },
    });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map