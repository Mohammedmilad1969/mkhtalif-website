# EmailJS Setup Guide

This guide will help you set up EmailJS to enable the contact form functionality.

## Step 1: Create an EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (allows 200 emails/month)
3. Verify your email address

## Step 2: Add an Email Service

1. In your EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions
5. **Copy the Service ID** (you'll need this later)

## Step 3: Create an Email Template

1. Go to **Email Templates** in your dashboard
2. Click **Create New Template**
3. Use this template structure:

**Subject:**
```
New Contact Form Submission from {{from_name}}
```

**Content:**
```
Hello,

You have received a new contact form submission:

Name: {{from_name}}
Email: {{from_email}}
Phone: {{phone}}

Message:
{{message}}

---
This email was sent from your website contact form.
```

4. **Copy the Template ID** (you'll need this later)

## Step 4: Get Your Public Key

1. Go to **Account** → **General**
2. Find your **Public Key**
3. **Copy the Public Key** (you'll need this later)

## Step 5: Add Environment Variables

Create or update your `.env` file in the root directory with:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

**Important:** 
- Replace the placeholder values with your actual IDs and keys
- Never commit your `.env` file to Git (it's already in `.gitignore`)
- For production, add these variables in your hosting platform's environment settings

## Step 6: Test the Form

1. Start your development server: `npm run dev`
2. Fill out the contact form on your website
3. Submit the form
4. Check your email inbox for the submission

## Troubleshooting

### Form not sending emails?
- Check that all environment variables are set correctly
- Verify your Service ID, Template ID, and Public Key are correct
- Check the browser console for any error messages
- Make sure your email service is properly connected in EmailJS dashboard

### Getting rate limit errors?
- The free plan allows 200 emails/month
- Upgrade to a paid plan if you need more

### Template variables not working?
- Make sure the variable names in your template match exactly:
  - `{{from_name}}`
  - `{{from_email}}`
  - `{{phone}}`
  - `{{message}}`

## Security Notes

- The Public Key is safe to expose in client-side code
- Never share your Private Key
- EmailJS handles email sending securely on their servers

## Need Help?

- EmailJS Documentation: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- EmailJS Support: Check their website for support options

