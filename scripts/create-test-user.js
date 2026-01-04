// Create test user for automation pipeline
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        // Create test user if not exists
        const user = await prisma.user.upsert({
            where: { id: 'cm5h3822t0000abc123456789' },
            update: {},
            create: {
                id: 'cm5h3822t0000abc123456789',
                email: 'test@whness.com',
                name: 'Test User',
                passwordHash: 'test123'
            }
        })
        console.log('✅ Test user created/verified:', user.id)
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
