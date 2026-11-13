/**
 * seed-interactions.js
 *
 * Populates the product_interactions table in product-service/database.sqlite
 * with realistic, clustered e-commerce interaction data for all registered users
 * across all active products.
 *
 * Event types: 'view' (weight 1), 'addtocart' (weight 3), 'transaction' (weight 5).
 *
 * Usage:
 *   node scripts/seed-interactions.js
 */

import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AUTH_DB = path.resolve(__dirname, '../../auth-service/database.sqlite');
const PRODUCT_DB = path.resolve(__dirname, '../database.sqlite');

const authDb = new Sequelize({
  dialect: 'sqlite',
  storage: AUTH_DB,
  logging: false,
});

const productDb = new Sequelize({
  dialect: 'sqlite',
  storage: PRODUCT_DB,
  logging: false,
});

const Interaction = productDb.define(
  'Interaction',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
    },
    event: {
      type: DataTypes.ENUM('view', 'addtocart', 'transaction'),
      allowNull: false,
      field: 'event',
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'timestamp',
    },
  },
  {
    tableName: 'product_interactions',
    timestamps: false,
  }
);

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomTimestamp(daysAgoMax = 30) {
  const now = Date.now();
  const pastOffset = getRandomInt(1, daysAgoMax * 24 * 60 * 60 * 1000);
  return new Date(now - pastOffset);
}

async function main() {
  console.log('==================================================');
  console.log('   SHOPFORGE: SEEDING PRODUCT INTERACTIONS        ');
  console.log('==================================================');

  await Interaction.sync();

  const [users] = await authDb.query('SELECT id, name, email FROM users ORDER BY id ASC');
  console.log('Found ' + users.length + ' registered users in auth database.');

  const [products] = await productDb.query('SELECT id, name, categoryId, price FROM products ORDER BY id ASC');
  console.log('Found ' + products.length + ' catalog products in product database.');

  if (users.length === 0 || products.length === 0) {
    console.error('Error: Users or products table is empty.');
    process.exit(1);
  }

  const existingCount = await Interaction.count();
  if (existingCount > 0) {
    console.log('Clearing ' + existingCount + ' existing interactions for fresh seeding...');
    await Interaction.destroy({ where: {}, truncate: true });
  }

  const productsByCategory = {};
  for (const p of products) {
    const cat = p.categoryId || 1;
    if (!productsByCategory[cat]) productsByCategory[cat] = [];
    productsByCategory[cat].push(p);
  }

  const userAffinities = [
    { primaryCategories: [1, 2], name: 'Tech Enthusiasts' },
    { primaryCategories: [3, 5], name: 'Fashion & Beauty' },
    { primaryCategories: [4, 7], name: 'Home & Fitness' },
    { primaryCategories: [6, 8], name: 'Books, Learning & Toys' },
    { primaryCategories: [1, 3, 4], name: 'General / Lifestyle' },
  ];

  const interactionsToInsert = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const profile = userAffinities[i % userAffinities.length];

    const numProductsInteracted = getRandomInt(12, 24);
    const selectedProductIds = new Set();

    const primaryPool = [];
    for (const catId of profile.primaryCategories) {
      if (productsByCategory[catId]) {
        primaryPool.push(...productsByCategory[catId]);
      }
    }

    while (selectedProductIds.size < Math.min(numProductsInteracted * 0.75, primaryPool.length)) {
      if (primaryPool.length === 0) break;
      const p = getRandomElement(primaryPool);
      selectedProductIds.add(p.id);
    }

    while (selectedProductIds.size < numProductsInteracted) {
      const p = getRandomElement(products);
      selectedProductIds.add(p.id);
    }

    for (const prodId of selectedProductIds) {
      const baseTime = getRandomTimestamp(30);

      const viewCount = getRandomInt(1, 4);
      for (let v = 0; v < viewCount; v++) {
        const viewTime = new Date(baseTime.getTime() + v * getRandomInt(30000, 600000));
        interactionsToInsert.push({
          userId: user.id,
          productId: prodId,
          event: 'view',
          timestamp: viewTime,
        });
      }

      const addToCartChance = Math.random();
      if (addToCartChance < 0.45) {
        const cartTime = new Date(baseTime.getTime() + getRandomInt(600000, 1800000));
        interactionsToInsert.push({
          userId: user.id,
          productId: prodId,
          event: 'addtocart',
          timestamp: cartTime,
        });

        const purchaseChance = Math.random();
        if (purchaseChance < 0.55) {
          const transTime = new Date(cartTime.getTime() + getRandomInt(300000, 3600000));
          interactionsToInsert.push({
            userId: user.id,
            productId: prodId,
            event: 'transaction',
            timestamp: transTime,
          });
        }
      }
    }
  }

  console.log('Generated ' + interactionsToInsert.length + ' total interaction events. Inserting into database...');

  const batchSize = 100;
  for (let b = 0; b < interactionsToInsert.length; b += batchSize) {
    const batch = interactionsToInsert.slice(b, b + batchSize);
    await Interaction.bulkCreate(batch);
  }

  const totalCount = await Interaction.count();
  const [eventCounts] = await productDb.query(
    'SELECT event, COUNT(*) as count FROM product_interactions GROUP BY event'
  );
  const [distinctUsers] = await productDb.query(
    'SELECT COUNT(DISTINCT user_id) as count FROM product_interactions'
  );
  const [distinctProds] = await productDb.query(
    'SELECT COUNT(DISTINCT product_id) as count FROM product_interactions'
  );

  console.log('\n================ SEEDING COMPLETE ================');
  console.log('Total Interaction Records Seeded: ' + totalCount);
  console.log('Unique Users Active:             ' + distinctUsers[0].count + ' / ' + users.length);
  console.log('Unique Products Interacted With: ' + distinctProds[0].count + ' / ' + products.length);
  console.log('\nBreakdown by Event Type:');
  for (const row of eventCounts) {
    const pct = ((row.count / totalCount) * 100).toFixed(1);
    console.log('  - ' + row.event.padEnd(12) + ': ' + row.count + ' (' + pct + '%)');
  }
  console.log('==================================================\n');

  await authDb.close();
  await productDb.close();
}

main().catch((err) => {
  console.error('Fatal error during interaction seeding:', err);
  process.exit(1);
});
