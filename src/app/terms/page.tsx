import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - EduFeed",
  description: "Terms of Service for EduFeed - AI-Powered Study Companion",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last Updated: December 25, 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-300 leading-relaxed">
            By accessing or using EduFeed (&quot;the Service&quot;), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use our Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="text-gray-300 leading-relaxed">
            EduFeed is an AI-powered educational platform that helps users create study materials
            from various content sources including PDFs, web pages, YouTube videos, and text.
            Features include flashcard generation, AI chat assistance, video study rooms, and more.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>You must be at least 13 years old to use the Service</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You must provide accurate and complete information when creating an account</li>
            <li>You may not share your account credentials with others</li>
            <li>You are responsible for all activities that occur under your account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
          <p className="text-gray-300 mb-4">When you upload content to EduFeed:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>You retain ownership of your content</li>
            <li>You grant us a license to process, store, and display your content to provide the Service</li>
            <li>You represent that you have the right to upload the content</li>
            <li>You agree not to upload content that is illegal, harmful, or infringes on others&apos; rights</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Prohibited Uses</h2>
          <p className="text-gray-300 mb-4">You agree not to:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Use the Service for any illegal purpose</li>
            <li>Upload copyrighted material without permission</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Use the Service to distribute malware or harmful content</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Use automated tools to scrape or extract data from the Service</li>
            <li>Impersonate other users or entities</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. AI-Generated Content</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            EduFeed uses artificial intelligence to generate study materials. You acknowledge that:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>AI-generated content may contain errors or inaccuracies</li>
            <li>You should verify important information from authoritative sources</li>
            <li>AI-generated content is provided &quot;as is&quot; without warranties</li>
            <li>We are not responsible for decisions made based on AI-generated content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Video Study Rooms</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            When using video study rooms:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>You must behave respectfully towards other participants</li>
            <li>You may not record or distribute video/audio without consent</li>
            <li>You agree to follow any rules set by room hosts</li>
            <li>We may moderate or remove users who violate these terms</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
          <p className="text-gray-300 leading-relaxed">
            The Service and its original content, features, and functionality are owned by EduFeed
            and are protected by international copyright, trademark, and other intellectual property laws.
            You may not copy, modify, or distribute our content without permission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
          <p className="text-gray-300 leading-relaxed">
            We may terminate or suspend your account at any time for violations of these terms.
            You may delete your account at any time through the app settings.
            Upon termination, your right to use the Service will immediately cease.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Disclaimer of Warranties</h2>
          <p className="text-gray-300 leading-relaxed">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND.
            WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
          <p className="text-gray-300 leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, EDUFEED SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES RESULTING FROM YOUR USE OF
            THE SERVICE.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
          <p className="text-gray-300 leading-relaxed">
            We reserve the right to modify these terms at any time. We will notify users of
            significant changes via email or in-app notification. Continued use of the Service
            after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
          <p className="text-gray-300 leading-relaxed">
            These terms shall be governed by and construed in accordance with applicable laws,
            without regard to conflict of law principles.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
          <p className="text-gray-300">
            If you have questions about these Terms of Service, please contact us at:
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
            <li><strong>Email:</strong> legal@edufeed.com</li>
            <li><strong>Support:</strong> support@edufeed.com</li>
          </ul>
        </section>

        <footer className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>&copy; 2025 EduFeed. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
