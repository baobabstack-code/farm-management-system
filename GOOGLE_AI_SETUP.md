# Google AI ADK Integration Setup

This document explains how to set up and configure the Google AI ADK integration for enhanced farming assistance in your farm management system.

## Overview

The Google AI integration provides:

- **Advanced Chat Assistant**: Context-aware farming advice using Google's Gemini AI
- **Enhanced Analytics**: AI-generated insights for farm operations
- **Smart Recommendations**: Intelligent crop and financial recommendations
- **Natural Language Processing**: Better understanding of farming queries

## Prerequisites

1. **Google AI Studio Account**: Sign up at [Google AI Studio](https://makersuite.google.com/)
2. **API Key**: Generate an API key for Gemini API access
3. **Node.js Environment**: Ensure your farm management system is running

## Step-by-Step Setup

### 1. Obtain Google AI API Key

1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Sign in with your Google account
3. Navigate to "Get API key" section
4. Create a new API key for your project
5. Copy the API key securely

### 2. Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Add your Google AI configuration:

   ```env
   # Google AI Configuration
   GOOGLE_AI_API_KEY="your_actual_api_key_here"
   GOOGLE_AI_MODEL="gemini-1.5-flash"

   # Enable AI features
   AI_ADK_ENABLED="true"
   ENABLE_AI_ADK_CHAT="true"
   ```

### 3. Verify Installation

The Google AI SDK is already installed in your project:

```bash
npm list @google/generative-ai
```

If not installed, run:

```bash
npm install @google/generative-ai
```

### 4. Test the Integration

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to your farm dashboard
3. Open the AI Chat Assistant (chat bubble in bottom right)
4. Ask a farming question like: "What should I do with my tomatoes today?"

### 5. Feature Verification

Check that these AI features are working:

- **Chat Assistant**: Real Google AI responses in chat
- **Analytics**: AI-generated insights on dashboard
- **Crop Recommendations**: Enhanced suggestions
- **Financial Insights**: AI-powered analysis

## Configuration Options

### Model Selection

You can configure different Gemini models:

```env
# Fast and efficient (recommended)
GOOGLE_AI_MODEL="gemini-1.5-flash"

# More capable but slower
GOOGLE_AI_MODEL="gemini-1.5-pro"

# Latest model (if available)
GOOGLE_AI_MODEL="gemini-1.5-pro-latest"
```

### Feature Flags

Control which AI features are enabled:

```env
# Core AI features
AI_ADK_ENABLED="true"                    # Master switch
ENABLE_AI_CHAT_ASSISTANT="true"         # Chat interface
ENABLE_AI_ADK_CHAT="true"               # Google AI for chat

# Analytics features
ENABLE_AI_ANALYTICS="true"              # General insights
ENABLE_AI_CROP_RECOMMENDATIONS="true"   # Crop suggestions
ENABLE_AI_FINANCIAL_INSIGHTS="true"     # Financial analysis
```

## Troubleshooting

### Common Issues

**1. "AI ADK is not enabled" Error**

- Check `GOOGLE_AI_API_KEY` is set correctly
- Verify `AI_ADK_ENABLED="true"` in environment

**2. "Invalid or missing Google AI API key"**

- Confirm API key is valid and active
- Check for extra spaces or quotes in `.env.local`

**3. "Rate limit exceeded"**

- Google AI has usage limits for free tier
- Consider upgrading for higher limits
- Implement request throttling if needed

**4. Chat Falls Back to Simulation**

- Check browser console for API errors
- Verify network connectivity
- Ensure API key has proper permissions

### Debug Mode

Enable detailed logging:

```env
NODE_ENV="development"
```

Check server console for detailed error messages.

### Fallback Behavior

The system is designed to gracefully fallback:

1. **Google AI Available**: Full AI-powered responses
2. **Google AI Error**: Falls back to enhanced rule-based responses
3. **Complete Failure**: Basic rule-based responses ensure system stability

## API Usage and Costs

### Free Tier Limits

- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per month

### Production Considerations

- Monitor usage in [Google Cloud Console](https://console.cloud.google.com/)
- Set up billing alerts
- Consider caching responses for repeated queries
- Implement user-specific rate limiting

## Security Best Practices

1. **Environment Variables**: Never commit API keys to version control
2. **Access Control**: Restrict API key permissions if possible
3. **Rate Limiting**: Implement user-based request limits
4. **Input Validation**: Sanitize user inputs before sending to AI
5. **Error Handling**: Don't expose API errors to end users

## Advanced Configuration

### Custom System Instructions

Modify the farming system instruction in `src/lib/ai/google-ai-service.ts`:

```typescript
private getFarmingSystemInstruction(): string {
  return `You are an expert AI farming assistant specializing in:
  - Your specific farming expertise areas
  - Regional considerations
  - Sustainable practices
  // ... customize as needed
  `;
}
```

### Response Customization

Adjust model parameters for different response styles:

```typescript
const config = {
  temperature: 0.7, // Creativity (0.0-1.0)
  topK: 40, // Token selection diversity
  topP: 0.95, // Nucleus sampling
  maxOutputTokens: 1024, // Response length limit
};
```

## Monitoring and Analytics

Track AI integration performance:

- Response times and success rates
- User satisfaction with AI responses
- API usage and costs
- Feature adoption rates

## Support

For technical issues:

1. Check this documentation
2. Review server logs for errors
3. Consult [Google AI documentation](https://ai.google.dev/docs)
4. Contact your development team

## Updates

The Google AI integration will be updated as new models and features become available. Monitor:

- [Google AI release notes](https://ai.google.dev/docs/release_notes)
- System changelog for integration updates
- Performance improvements and new capabilities

---

**Note**: This integration enhances your farming system with AI capabilities while maintaining full backward compatibility. All features work with or without Google AI enabled.
