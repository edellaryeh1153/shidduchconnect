"use client";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/login" className="text-sm text-[#6B8E9B] hover:underline mb-6 block">← Back</Link>
        <div className="bg-white rounded-xl p-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-[#1B3A4B] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Terms of Service</h1>
          <div className="prose prose-sm text-gray-600 space-y-4">
            <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">1. Acceptance of Terms</h2>
            <p>By accessing or using ShidduchConnect, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">2. Description of Service</h2>
            <p>ShidduchConnect is a professional matchmaking management platform designed for shadchanim (matchmakers) in the Jewish community. The platform provides tools for managing profiles, tracking matches, and facilitating the shidduch process.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">3. User Accounts</h2>
            <p>Accounts are created by administrators only. You are responsible for maintaining the confidentiality of your login credentials. You must immediately notify us of any unauthorized use of your account.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">4. Acceptable Use</h2>
            <p>You agree to use the platform only for legitimate matchmaking purposes. You will not share, sell, or distribute personal information stored in the platform outside of its intended matchmaking purpose. You will treat all personal data with the utmost respect and confidentiality.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">5. Data Responsibility</h2>
            <p>As a shadchan using this platform, you are responsible for ensuring you have appropriate consent to store and share personal information of the individuals you enter into the system. You must handle all personal data in accordance with applicable privacy laws.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">6. Confidentiality</h2>
            <p>All information stored in ShidduchConnect is strictly confidential. Users must not disclose personal details, match histories, or notes to unauthorized parties. The sharing features within the platform are the only approved method for sharing profile information with other shadchanim.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">7. Limitation of Liability</h2>
            <p>ShidduchConnect is a tool to assist shadchanim. We do not guarantee any outcomes from matches suggested through the platform. The platform is provided "as is" without warranties of any kind.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">8. Termination</h2>
            <p>We reserve the right to suspend or terminate access to the platform at any time for violation of these terms or for any other reason at our discretion.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">9. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>

            <h2 className="text-lg font-semibold text-[#1B3A4B] mt-6">10. Contact</h2>
            <p>For questions about these terms, contact us at support@shidduchconnects.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}