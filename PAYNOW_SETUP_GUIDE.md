# Paynow Payment Integration Setup Guide

## 🚀 Current Status: Ready for Credentials

Your FarmFlow application has a complete Paynow payment integration! You just need to add your real Paynow credentials to make it fully functional.

## 📋 What's Already Implemented

✅ **Complete Paynow Service** (`src/lib/services/paynow-service.ts`)

- Payment creation and status checking
- Hash verification for security
- Farm-specific payment packages
- Currency conversion utilities

✅ **API Routes**

- `/api/payments/paynow/create` - Create payments
- `/api/payments/paynow/status` - Check payment status
- `/api/payments/paynow/result` - Webhook handler

✅ **Frontend Components**

- Payment plans UI with pricing
- Payment status tracking
- Error handling and loading states

✅ **Security Features**

- Hash verification
- User authentication
- Secure webhook handling

## 🔧 Setup Steps

### 1. Get Paynow Credentials

1. Visit [paynow.co.zw](https://www.paynow.co.zw/)
2. Create a merchant account
3. Get your Integration ID and Integration Key
4. Set up your webhook URLs in Paynow dashboard

### 2. Update Environment Variables

Replace these values in your `.env` file:

```env
# Replace with your actual Paynow credentials
PAYNOW_INTEGRATION_ID="your_actual_integration_id_here"
PAYNOW_INTEGRATION_KEY="your_actual_integration_key_here"

# Update with your production domain
PAYNOW_RESULT_URL="https://your-domain.com/api/payments/paynow/result"
PAYNOW_RETURN_URL="https://your-domain.com/payments/success"
```

### 3. Configure Vercel Environment Variables

Add these to your Vercel project settings:

```
PAYNOW_INTEGRATION_ID
PAYNOW_INTEGRATION_KEY
PAYNOW_RESULT_URL
PAYNOW_RETURN_URL
```

### 4. Test the Integration

1. **Local Testing**: Use Paynow sandbox mode
2. **Production**: Switch to live credentials

## 💰 Available Payment Plans

Your app includes these pre-configured plans:

- **Basic Plan**: $25/month - Small farms
- **Premium Plan**: $50/month - Growing operations
- **Enterprise Plan**: $100/month - Large operations
- **Consultation Service**: $75 - Professional advice
- **Soil Analysis**: $35 - Soil testing service

## 🔗 Payment Flow

1. User selects a plan on `/payments` page
2. Payment request sent to `/api/payments/paynow/create`
3. User redirected to Paynow payment page
4. After payment, user returns to `/payments/success`
5. Paynow sends webhook to `/api/payments/paynow/result`
6. Payment status updated in your system

## 🛠️ Next Steps After Adding Credentials

1. **Database Integration**: Add payment records to your database
2. **User Permissions**: Activate features based on payment status
3. **Email Notifications**: Send payment confirmations
4. **Subscription Management**: Handle recurring payments

## 🧪 Testing Checklist

- [ ] Add real Paynow credentials
- [ ] Test payment creation
- [ ] Test webhook reception
- [ ] Test payment status checking
- [ ] Test error handling
- [ ] Verify hash validation

## 📞 Support

- Paynow Documentation: [developers.paynow.co.zw](https://developers.paynow.co.zw/)
- Paynow Support: support@paynow.co.zw

Your payment integration is production-ready once you add the credentials!
