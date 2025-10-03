// Quick AI Test
const { getFeatureFlags } = require('./src/lib/feature-flags.ts');

console.log('🤖 AI Features Status:');
console.log('======================');

const flags = getFeatureFlags();
Object.entries(flags).forEach(([key, value]) => {
  console.log(`${value ? '✅' : '❌'} ${key}: ${value}`);
});

console.log('\n📋 Next Steps:');
console.log('1. Add your Google AI API key to .env.local');
console.log('2. Run: npm run dev');
console.log('3. Test AI features in your dashboard');
