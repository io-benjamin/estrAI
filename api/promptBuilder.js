const fs = require('fs');
const path = require('path');

function buildPrompt(userMessage, business) {
  const profilePath = path.join(__dirname, '..', 'profiles', `${business}.json`);
  console.log('Looking for profile at:', profilePath);

  if (!fs.existsSync(profilePath)) {
    throw new Error(`Profile for business '${business}' not found at ${profilePath}`);
  }

  const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
  console.log(`Parsed profile data for business: ${profileData.name}`);

  // Build pricing text (internal use only)
  let pricingText = 'Use the following pricing internally if the customer asks about cost:\n';
  if (Array.isArray(profileData.pricing.tiers)) {
    for (const tier of profileData.pricing.tiers) {
      const maxGuestsText = tier.maxGuests ? tier.maxGuests : 'and above';
      pricingText += `- ${tier.minGuests} to ${maxGuestsText} guests: $${tier.pricePerPerson}/person\n  Includes: ${tier.includes.join(', ')}\n`;
    }
  } else {
    pricingText += 'Pricing information is not available.\n';
  }

  const fullPrompt = `
You are a friendly virtual assistant for ${profileData.name}. ${profileData.description}

${pricingText}

Service Areas: ${profileData.service_area.join(', ')}

Tone: ${profileData.tone}

Customer Message:
"${userMessage}"

Reply in a warm, professional tone that reflects a friendly local taco truck.
If you need more details from the customer, kindly ask.
Keep it casual but clear.

⚠️ Do not mention pricing unless the customer specifically asks for it.
When asked, calculate the price using the internal pricing tiers below.
The logic is: if guest count is **51 or more**, use $23/person. If it's **50 or fewer**, use $25/person.
  `.trim();

  console.log('Built prompt preview:', fullPrompt.slice(0, 300) + '...'); // Optional preview

  return fullPrompt;
}

module.exports = buildPrompt;
