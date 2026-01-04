
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'

async function checkSystem() {
    console.log("\n🔍 Starting System Check...\n");

    // 1. Check Database Connection
    console.log("👉 Checking Database Connection...");
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        const userCount = await prisma.user.count(); // Simple query
        console.log(`✅ Database Connected! User count: ${userCount}`);
    } catch (e) {
        console.error("❌ Database Connection Failed:", e);
        process.exit(1); // Fail hard if DB is down
    } finally {
        await prisma.$disconnect();
    }

    // 2. Check OpenAI Connection
    console.log("\n👉 Checking OpenAI Connection...");
    if (!process.env.OPENAI_API_KEY) {
        console.error("❌ OPENAI_API_KEY is missing in environment variables.");
        process.exit(1);
    }

    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const models = await openai.models.list();
        console.log(`✅ OpenAI Connected! Validated key. Found ${models.data.length} models.`);
    } catch (e: any) {
        console.error("❌ OpenAI Connection Failed:", e.message);
        // Don't exit here, as DB is the main blocker we just fixed
    }

    console.log("\n✨ System Check Complete!");
}

checkSystem();
