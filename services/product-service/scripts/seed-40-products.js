import dotenv from "dotenv";
dotenv.config();

import sequelize from "../src/config/db.js";
import Product from "../src/feature/product/product.model.js";
import ProductImage from "../src/feature/product/productImage.model.js";
import outboxService from "../src/outbox-service/outbox.service.js";

const newProducts = [
    // ─── Electronics (Category 1) ─────────────────────────────────────────────
    {
        name: "Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)",
        description: "Up to 2x more Active Noise Cancellation. Transparency mode lets you comfortably hear and interact with the world around you. All-new Adaptive Audio intelligently tailors noise control to your environment.",
        price: 365000.00,
        stock: 45,
        vendorId: 3,
        categoryId: 1,
        imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80"
    },
    {
        name: "Anker 737 Power Bank (PowerCore 24K) 140W Portable Charger",
        description: "Equipped with the latest Power Delivery 3.1 and bi-directional technology to quickly recharge the portable charger or get a 140W ultra-powerful charge for phones, tablets, and laptops.",
        price: 185000.00,
        stock: 30,
        vendorId: 4,
        categoryId: 1,
        imageUrl: "https://images.unsplash.com/photo-1609592424109-dd9892f1d6b0?w=800&q=80"
    },
    {
        name: "JBL Flip 6 Waterproof Portable Bluetooth Speaker with Powerful Sound",
        description: "Eco-friendly packaging. Louder, more powerful sound with 2-way speaker system designed to deliver loud, crystal clear, powerful sound. IP67 waterproof and dustproof with 12 hours of playtime.",
        price: 145000.00,
        stock: 50,
        vendorId: 3,
        categoryId: 1,
        imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80"
    },
    {
        name: "Dell UltraSharp 27-inch 4K UHD USB-C Hub Monitor (U2723QE)",
        description: "Brilliant color clarity with IPS Black technology and 4K resolution. Connect effortlessly with versatile connectivity including USB-C with 90W power delivery, RJ45 Ethernet, and DP 1.4.",
        price: 780000.00,
        stock: 18,
        vendorId: 4,
        categoryId: 1,
        imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80"
    },
    {
        name: "Kindle Paperwhite (16GB) 6.8-inch Display with Adjustable Warm Light",
        description: "Now with a 6.8” display and thinner borders, adjustable warm light, up to 10 weeks of battery life, and 20% faster page turns. Waterproof reading so you're free to read anywhere.",
        price: 195000.00,
        stock: 25,
        vendorId: 5,
        categoryId: 1,
        imageUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=800&q=80"
    },

    // ─── Computers & Accessories (Category 2) ──────────────────────────────────
    {
        name: "Logitech MX Mechanical Wireless Illuminated Keyboard (Tactile Quiet)",
        description: "Low-profile mechanical switches deliver next-level typing feel. Smart backlighting automatically illuminates keys the moment your hands approach and adjusts to changing lighting conditions.",
        price: 245000.00,
        stock: 28,
        vendorId: 3,
        categoryId: 2,
        imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80"
    },
    {
        name: "Samsung T7 Shield 2TB Portable SSD (Up to 1,050MB/s, Rugged IP65)",
        description: "Transfer huge files in seconds with USB 3.2 Gen 2; PCIe NVMe technology delivers blazing sequential read/write speeds of up to 1,050/1,000 MB/s. Tough, fast, and compact.",
        price: 260000.00,
        stock: 40,
        vendorId: 4,
        categoryId: 2,
        imageUrl: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80"
    },
    {
        name: "CalDigit TS4 Thunderbolt 4 Dock (18 Ports, 98W Charging)",
        description: "The leader in Thunderbolt docks. 18 ports of extreme connectivity for Mac & PC including 2.5 Gigabit Ethernet, SD 4.0 card reader, 3x Thunderbolt 4 ports, and 8x USB ports.",
        price: 520000.00,
        stock: 12,
        vendorId: 4,
        categoryId: 2,
        imageUrl: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=800&q=80"
    },
    {
        name: "BenQ ScreenBar Halo LED Monitor Light with Wireless Controller",
        description: "Back-light and front-light design for eye-care. Auto-dimming sensor, adjustable color temperature (2700K-6500K), and zero screen glare for ultimate productivity.",
        price: 215000.00,
        stock: 35,
        vendorId: 5,
        categoryId: 2,
        imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80"
    },
    {
        name: "Elgato Stream Deck MK.2 – 15 Customizable LCD Keys for Creators",
        description: "Trigger actions in apps, launch social posts, adjust audio, turn on lights, and much more with one-touch tactile control. Detachable stand and interchangeable faceplates.",
        price: 180000.00,
        stock: 22,
        vendorId: 3,
        categoryId: 2,
        imageUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&q=80"
    },

    // ─── Home & Kitchen (Category 3) ──────────────────────────────────────────
    {
        name: "Ninja AF101 Air Fryer that Crisps, Roasts, Reheats & Dehydrates (4-Quart)",
        description: "Now you can easily achieve that crispy, golden texture with up to 75% less fat than traditional frying methods. Wide temperature range of 105°F to 400°F.",
        price: 135000.00,
        stock: 50,
        vendorId: 5,
        categoryId: 3,
        imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80"
    },
    {
        name: "Nespresso VertuoPlus Coffee and Espresso Machine by De'Longhi",
        description: "Single-serve coffee maker with Centrifusion technology. Brews 4 cup sizes at the touch of a button with rich crema. Includes welcome set of Vertuo capsules.",
        price: 240000.00,
        stock: 20,
        vendorId: 4,
        categoryId: 3,
        imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80"
    },
    {
        name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker (6-Quart)",
        description: "Pressure cook, slow cook, rice cooker, yogurt maker, steamer, sauté pan and food warmer. 13 customizable Smart Programs for quick one-touch meals.",
        price: 125000.00,
        stock: 45,
        vendorId: 5,
        categoryId: 3,
        imageUrl: "https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=800&q=80"
    },
    {
        name: "Dyson V15 Detect Cordless Vacuum Cleaner with Laser Illumination",
        description: "Intelligently optimizes suction and run time. Laser reveals microscopic dust on hard floors. Piezo sensor counts and measures the size of dust particles.",
        price: 920000.00,
        stock: 10,
        vendorId: 3,
        categoryId: 3,
        imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80"
    },
    {
        name: "Lodge Pre-Seasoned Cast Iron Skillet with Silicone Hot Handle Holder (10.25-Inch)",
        description: "Heirloom-quality cast iron that lasts for generations. Perfect for searing, sautéing, baking, broiling, braising, or grilling over campfire or oven.",
        price: 45000.00,
        stock: 60,
        vendorId: 5,
        categoryId: 3,
        imageUrl: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&q=80"
    },

    // ─── Fashion & Apparel (Category 4) ───────────────────────────────────────
    {
        name: "Nike Air Force 1 '07 Triple White Classic Sneaker",
        description: "The radiance lives on in the Nike Air Force 1 '07, the b-ball icon that puts a fresh spin on what you know best: stitched overlays, bold accents and classic court cushioning.",
        price: 155000.00,
        stock: 35,
        vendorId: 3,
        categoryId: 4,
        imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80"
    },
    {
        name: "Levi's Men's 511 Slim Fit Stretch Denim Jeans",
        description: "A modern slim with room to move. Added stretch for all-day comfort. Sits below your waist with a slim leg from hip to ankle. Classic 5-pocket styling.",
        price: 65000.00,
        stock: 50,
        vendorId: 4,
        categoryId: 4,
        imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&q=80"
    },
    {
        name: "Ray-Ban Classic Polarized Aviator Sunglasses (Gold/Green G-15)",
        description: "Timeless styling meets supreme optical clarity. Crystal lenses block 100% of UVA/UVB rays. High-durability metal frame with comfortable silicone nose pads.",
        price: 185000.00,
        stock: 25,
        vendorId: 3,
        categoryId: 4,
        imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80"
    },
    {
        name: "Fossil Grant Chronograph Luggage Brown Leather Watch",
        description: "Inspired by vintage clocks, Roman numerals and dark brown leather band create an artistic balance. Stopwatch function and water resistant up to 50 meters.",
        price: 165000.00,
        stock: 30,
        vendorId: 4,
        categoryId: 4,
        imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80"
    },
    {
        name: "The North Face Resolve 2 Waterproof Hooded Rain Jacket",
        description: "DryVent 2L waterproof, breathable, seam-sealed shell with mesh lining. 100% windproof fabric keeps you protected in downpours and mountain winds.",
        price: 120000.00,
        stock: 28,
        vendorId: 5,
        categoryId: 4,
        imageUrl: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&q=80"
    },

    // ─── Sports & Outdoors (Category 5) ───────────────────────────────────────
    {
        name: "Hydro Flask 32 oz Wide Mouth Vacuum Insulated Water Bottle with Flex Cap",
        description: "TempShield insulation keeps beverages cold up to 24 hours and hot up to 12 hours. Pro-grade 18/8 stainless steel ensures pure taste and no flavor transfer.",
        price: 48000.00,
        stock: 65,
        vendorId: 5,
        categoryId: 5,
        imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80"
    },
    {
        name: "Garmin Forerunner 265 Running Smartwatch with AMOLED Display",
        description: "Train brilliantly with colorful AMOLED touchscreen, morning report, training readiness score, wrist-based running dynamics, and up to 13 days of battery life.",
        price: 540000.00,
        stock: 15,
        vendorId: 3,
        categoryId: 5,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
    },
    {
        name: "Bowflex SelectTech 552 Adjustable Dumbbells (Pair)",
        description: "Adjusts from 5 to 52.5 lbs in 2.5 lb increments. Replaces 15 pairs of dumbbells with a single turn of a dial, saving space in your home gym.",
        price: 495000.00,
        stock: 14,
        vendorId: 4,
        categoryId: 5,
        imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80"
    },
    {
        name: "Manduka PRO Yoga and Pilates Mat (6mm High Density Cushion)",
        description: "The #1 recommended mat by yoga teachers worldwide. Unmatched density and joint protection with non-slip textured finish and lifetime guarantee.",
        price: 110000.00,
        stock: 35,
        vendorId: 5,
        categoryId: 5,
        imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80"
    },
    {
        name: "Coleman Sundome 4-Person Camping Tent with WeatherTec System",
        description: "WeatherTec system with patented welded floors and inverted seams to keep you dry. Sets up in 10 minutes with snag-free continuous pole sleeves.",
        price: 130000.00,
        stock: 20,
        vendorId: 5,
        categoryId: 5,
        imageUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80"
    },

    // ─── Beauty & Personal Care (Category 6) ──────────────────────────────────
    {
        name: "Dior Sauvage Eau De Toilette Spray for Men (3.4 oz / 100ml)",
        description: "A radically fresh composition, dictated by a name that has the ring of a manifesto. Raw and noble all at once, with Calabrian bergamot and ambroxan.",
        price: 195000.00,
        stock: 30,
        vendorId: 3,
        categoryId: 6,
        imageUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80"
    },
    {
        name: "CeraVe Moisturizing Cream with Hyaluronic Acid & Ceramides (19 oz)",
        description: "Developed with dermatologists. Provides 24-hour hydration and helps restore the protective skin barrier with three essential ceramides (1, 3, 6-II).",
        price: 28000.00,
        stock: 80,
        vendorId: 4,
        categoryId: 6,
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80"
    },
    {
        name: "Philips Sonicare DiamondClean Smart 9500 Electric Toothbrush",
        description: "Removes up to 10x more plaque and improves gum health up to 7x in just 2 weeks. Connected app tracks progress and provides real-time coaching.",
        price: 290000.00,
        stock: 18,
        vendorId: 4,
        categoryId: 6,
        imageUrl: "https://images.unsplash.com/photo-1559591937-e1032c575084?w=800&q=80"
    },
    {
        name: "Dyson Supersonic Hair Dryer (Iron/Fuchsia) with 5 Styling Attachments",
        description: "Engineered for fast drying with no extreme heat. Intelligent heat control protects your hair's natural shine with quiet acoustic tuning.",
        price: 580000.00,
        stock: 12,
        vendorId: 3,
        categoryId: 6,
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80"
    },
    {
        name: "The Ordinary Niacinamide 10% + Zinc 1% High-Strength Serum (30ml)",
        description: "A high-strength vitamin and mineral blemish formula that reduces the appearance of skin blemishes and signs of congestion for balanced sebum activity.",
        price: 14500.00,
        stock: 100,
        vendorId: 5,
        categoryId: 6,
        imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80"
    },

    // ─── Gaming & Consoles (Category 7) ───────────────────────────────────────
    {
        name: "Sony DualSense Edge Wireless Controller for PlayStation 5",
        description: "Built with high performance and personalization in mind. Changeable stick caps, remappable back buttons, and adjustable trigger stops.",
        price: 280000.00,
        stock: 25,
        vendorId: 3,
        categoryId: 7,
        imageUrl: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80"
    },
    {
        name: "Nintendo Switch – OLED Model with White Joy-Con",
        description: "Features a vibrant 7-inch OLED screen with vivid colors and crisp contrast. Enhanced audio, wide adjustable stand, and 64GB of internal storage.",
        price: 430000.00,
        stock: 20,
        vendorId: 4,
        categoryId: 7,
        imageUrl: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=80"
    },
    {
        name: "SteelSeries Arctis Nova Pro Wireless Multi-System Gaming Headset",
        description: "Almighty Audio with Nova Pro Acoustic System and Premium High Fidelity Drivers. Active Noise Cancellation with Transparency Mode and dual hot-swap batteries.",
        price: 445000.00,
        stock: 16,
        vendorId: 4,
        categoryId: 7,
        imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80"
    },
    {
        name: "Xbox Wireless Controller – Carbon Black with Hybrid D-pad",
        description: "Experience the modernized design with sculpted surfaces and refined geometry for enhanced comfort during gameplay. Textured grip on triggers and bumpers.",
        price: 85000.00,
        stock: 45,
        vendorId: 5,
        categoryId: 7,
        imageUrl: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=800&q=80"
    },
    {
        name: "Logitech G502 HERO High Performance Wired Gaming Mouse (25K Sensor)",
        description: "HERO 25K gaming sensor delivers sub-micron accuracy up to 25,600 DPI with zero smoothing, filtering or acceleration. 11 customizable buttons and tunable weights.",
        price: 68000.00,
        stock: 55,
        vendorId: 3,
        categoryId: 7,
        imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80"
    },

    // ─── Books & Media (Category 8) ───────────────────────────────────────────
    {
        name: "Atomic Habits by James Clear: An Easy & Proven Way to Build Good Habits",
        description: "The #1 New York Times bestseller. Over 15 million copies sold. Learn how tiny changes can lead to remarkable, transformative results in life and career.",
        price: 18500.00,
        stock: 90,
        vendorId: 5,
        categoryId: 8,
        imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80"
    },
    {
        name: "The Psychology of Money by Morgan Housel: Timeless Lessons on Wealth",
        description: "Doing well with money isn't necessarily about what you know. It's about how you behave. 19 short stories exploring the strange ways people think about money.",
        price: 16500.00,
        stock: 75,
        vendorId: 4,
        categoryId: 8,
        imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80"
    },
    {
        name: "Deep Work: Rules for Focused Success in a Distracted World by Cal Newport",
        description: "One of the most valuable skills in our economy is becoming increasingly rare. If you master this skill, you'll achieve extraordinary results in less time.",
        price: 17000.00,
        stock: 60,
        vendorId: 5,
        categoryId: 8,
        imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80"
    },
    {
        name: "Designing Data-Intensive Applications by Martin Kleppmann",
        description: "The definitive guide to the architecture of data systems. Understand the pros and cons of technologies for processing and storing data in modern distributed software.",
        price: 48000.00,
        stock: 40,
        vendorId: 3,
        categoryId: 8,
        imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80"
    },
    {
        name: "Sony WH-CH520 Wireless Bluetooth On-Ear Headphones (50-Hour Battery)",
        description: "Lightweight build with up to 50 hours of battery life and quick charging. Multi-point connection allows quick switching between two Bluetooth devices.",
        price: 72000.00,
        stock: 50,
        vendorId: 3,
        categoryId: 1,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
    }
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log("Connected to database");

        let count = 0;
        for (const item of newProducts) {
            // Check if product with same name already exists
            const existing = await Product.findOne({ where: { name: item.name } });
            if (existing) {
                console.log(`- Skipping "${item.name}" (already exists)`);
                continue;
            }

            const transaction = await sequelize.transaction();
            try {
                const prod = await Product.create({
                    vendorId: item.vendorId,
                    categoryId: item.categoryId,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    stock: item.stock,
                    status: "active"
                }, { transaction });

                await ProductImage.create({
                    productId: prod.id,
                    imageUrl: item.imageUrl,
                    isPrimary: true
                }, { transaction });

                // Outbox event so order-service replica gets it
                await outboxService.createOutboxEvent(
                    "ProductCreated",
                    {
                        id: prod.id,
                        vendorId: prod.vendorId,
                        categoryId: prod.categoryId,
                        name: prod.name,
                        description: prod.description,
                        price: Number(prod.price),
                        stock: Number(prod.stock),
                        status: prod.status,
                        imageUrl: item.imageUrl,
                        images: [{ imageUrl: item.imageUrl, isPrimary: true }]
                    },
                    transaction
                );

                await transaction.commit();
                count++;
                console.log(`+ Added product #${prod.id}: ${prod.name} (₦${prod.price.toLocaleString("en-NG")})`);
            } catch (err) {
                await transaction.rollback();
                console.error(`Error adding ${item.name}:`, err.message);
            }
        }

        console.log(`\nSuccessfully seeded ${count} new products!`);
        const total = await Product.count();
        console.log(`Total products in catalog: ${total}`);
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
