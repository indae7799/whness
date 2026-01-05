/**
 * Test script to verify Google Autocomplete API is working
 * Run with: npx tsx scripts/test-autocomplete.ts
 */

const TEST_SEEDS = [
    "medicare basics",
    "health insurance",
    "medicare eligibility age"
];

async function fetchGoogleSuggest(term: string): Promise<string[]> {
    try {
        const url = `https://www.google.com/complete/search?client=firefox&hl=en&q=${encodeURIComponent(term)}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });

        if (!res.ok) {
            console.error(`❌ HTTP Error: ${res.status} for "${term}"`);
            return [];
        }

        const data = await res.json();
        return data[1] || [];
    } catch (e: any) {
        console.error(`❌ Fetch Error for "${term}":`, e.message);
        return [];
    }
}

async function runTest() {
    console.log("🧪 Testing Google Autocomplete API...\n");
    console.log("=".repeat(60));

    let successCount = 0;
    let failCount = 0;

    for (const seed of TEST_SEEDS) {
        console.log(`\n📝 Testing seed: "${seed}"`);

        const suggestions = await fetchGoogleSuggest(seed);

        if (suggestions.length > 0) {
            console.log(`✅ SUCCESS - Found ${suggestions.length} suggestions:`);
            suggestions.slice(0, 5).forEach((s, i) => {
                console.log(`   ${i + 1}. ${s}`);
            });
            successCount++;
        } else {
            console.log(`❌ FAILED - No suggestions returned`);
            failCount++;
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 300));
    }

    console.log("\n" + "=".repeat(60));
    console.log(`📊 Results: ${successCount} passed, ${failCount} failed`);

    if (failCount > 0) {
        console.log("\n⚠️  Some tests failed. Consider using alternative endpoint:");
        console.log("   - suggestqueries.google.com/complete/search");
        console.log("   - Or adding proxy/rotation");
    } else {
        console.log("\n🎉 All tests passed! Google Autocomplete is working.");
    }
}

runTest();
