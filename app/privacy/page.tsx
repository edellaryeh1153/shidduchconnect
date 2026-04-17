"use client";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/login" className="text-sm text-[#6B8E9B] hover:underline mb-6 block">← Back</Link>
        <div className="bg-white rounded-xl p-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-[#1B3A4B] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Privacy Policy</h1>
          <div className="prose prose-sm text-gray-600 space-y-4">
            <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">1. Information We Collect</h2>
            <p>ShidduchConnect stores personal information entered by authorized shadchanim for matchmaking purposes. This includes names, ages, contact information, family details, photos, resumes, religious background, and personal preferences. We also collect account information (email, name) for user authentication.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">2. How We Use Information</h2>
            <p>All personal information is used exclusively for the purpose of facilitating shidduchim (matchmaking). Profile data is used to identify compatible matches, track the matchmaking process, and maintain records for shadchanim. We do not use personal data for marketing, advertising, or any purpose unrelated to matchmaking.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">3. Data Storage & Security</h2>
            <p>Data is stored securely using Supabase infrastructure with row-level security policies. All data is encrypted in transit via HTTPS/TLS. Access to personal data is restricted through role-based permissions. Photos and resumes are stored in private, access-controlled storage buckets with expiring access links.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">4. Data Sharing</h2>
            <p>Personal profile data is only visible to the shadchan who created it, unless explicitly shared with another shadchan through the platform's sharing feature. Admins have oversight access for platform management. We never sell, rent, or share personal data with third parties outside the platform.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">5. AI Processing</h2>
            <p>The platform uses AI (powered by Anthropic) to assist with match recommendations and resume reading. Profile data sent to the AI is used solely for generating recommendations within the platform and is not stored or used by the AI provider for training purposes.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">6. Data Retention</h2>
            <p>Profile data is retained as long as the shadchan's account is active. Shadchanim can delete profiles at any time, which permanently removes the profile and associated files. Account deletion removes all user-specific data.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">7. Audit Logging</h2>
            <p>For security purposes, all actions within the platform (logins, profile views, edits, shares) are logged. Audit logs are accessible only to administrators and are retained for security review purposes.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">8. Your Rights</h2>
            <p>You have the right to access, correct, or delete your account data. Contact your administrator or email support@shidduchconnects.com for data-related requests.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">9. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. Changes will be posted on this page with an updated date.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">10. Contact</h2>
            <p>For privacy-related questions or concerns, contact us at support@shidduchconnects.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}