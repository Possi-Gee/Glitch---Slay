import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Glitch & Slay',
  description: 'Our privacy policy outlines how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
        <p>
          At Glitch & Slay, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">Information We Collect</h2>
        <p>
          We collect information you provide directly to us, including your name, email address, shipping address, payment information, and order details when you make a purchase or create an account.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To process and fulfill your orders</li>
          <li>To communicate with you about your orders and our services</li>
          <li>To send you marketing communications (with your consent)</li>
          <li>To improve our website and customer experience</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8">Information Sharing</h2>
        <p>
          We do not sell or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website and processing orders (such as payment processors and shipping carriers).
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">Your Rights</h2>
        <p>
          You have the right to access, update, or delete your personal information. You may also opt out of marketing communications at any time by contacting us.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at hello@glitchandslay.com.
        </p>

        <p className="text-sm mt-8">Last updated: January 2025</p>
      </div>
    </div>
  );
}
