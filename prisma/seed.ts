import prisma from "../lib/prisma";

const products = [
    { name: "Unga Jogoo 2kg", price: 180, stock: 50 },
    { name: "Kimbo 1kg", price: 320, stock: 30 },
    { name: "Royco Cubes 12pk", price: 45, stock: 100 },
    { name: "Sugar 1kg", price: 160, stock: 40 },
    { name: "Milk 500ml", price: 65, stock: 60 },
    { name: "Bread 400g", price: 60, stock: 25 },
    { name: "Cooking Oil 1L", price: 280, stock: 20 },
    { name: "Salt 500g", price: 35, stock: 80 },
    { name: "Soap Bar", price: 120, stock: 45 },
    { name: "Tea Leaves 100g", price: 90, stock: 55 },
];

async function main() {
    console.log("Seeding products...");
    for (const product of products) {
        await prisma.product.upsert({
            where: { name: product.name },
            update: {},
            create: {
                name: product.name,
                price: product.price,
                stock: product.stock,
                version: 1,
            },
        });
    }
    console.log("Seeding complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
