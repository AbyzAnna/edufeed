import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - EduFeed",
  description: "Privacy Policy for EduFeed - AI-Powered Study Companion",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last Updated: December 25, 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p className="text-gray-300 leading-relaxed">
            EduFeed (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, and safeguard your information
            when you use our mobile application and web platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>

          <h3 className="text-xl font-medium mb-3 text-purple-400">Information You Provide</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li><strong>Account Information:</strong> Name, email address, profile picture (via Google Sign-In or Apple Sign In)</li>
            <li><strong>Study Materials:</strong> Documents, PDFs, URLs, text content you upload</li>
            <li><strong>Study Data:</strong> Flashcards, quizzes, study sessions, progress tracking</li>
            <li><strong>User Content:</strong> Notes, highlights, questions you create</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 text-purple-400">Automatically Collected Information</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li><strong>Usage Data:</strong> App features you use, time spent studying, interaction patterns</li>
            <li><strong>Device Information:</strong> Device type, operating system version, app version</li>
            <li><strong>Technical Data:</strong> IP address, browser type, crash reports</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 text-purple-400">AI-Generated Content</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li><strong>Document Embeddings:</strong> Vector representations of your uploaded documents (stored securely)</li>
            <li><strong>Chat History:</strong> Conversations with AI assistant about your study materials</li>
            <li><strong>Generated Content:</strong> AI-generated flashcards, study guides, and summaries</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="text-gray-300 mb-3">We use your information to:</p>
          <ol className="list-decimal list-inside text-gray-300 space-y-2">
            <li><strong>Provide Services:</strong> Enable core study features, AI assistance, and content management</li>
            <li><strong>Personalize Experience:</strong> Customize study recommendations and spaced repetition algorithms</li>
            <li><strong>Improve Platform:</strong> Analyze usage patterns to enhance features and fix bugs</li>
            <li><strong>Communication:</strong> Send important updates, study reminders, and notifications</li>
            <li><strong>Security:</strong> Protect against fraud, abuse, and unauthorized access</li>
            <li><strong>Compliance:</strong> Meet legal obligations and enforce our Terms of Service</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Share Your Information</h2>
          <p className="text-gray-300 mb-4">
            <strong>We DO NOT sell your personal information.</strong> We may share information with:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li><strong>Service Providers:</strong> Supabase (database), Cloudflare (AI processing), Google/Apple (authentication)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>With Your Consent:</strong> Any other sharing with your explicit permission</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Storage and Security</h2>
          <h3 className="text-xl font-medium mb-3 text-purple-400">Security Measures</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li>End-to-end encryption for data in transit (TLS/SSL)</li>
            <li>Encrypted database storage</li>
            <li>Secure authentication (OAuth 2.0)</li>
            <li>Regular security audits</li>
            <li>Access controls and monitoring</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 text-purple-400">Data Retention</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
            <li><strong>Deleted Accounts:</strong> Data permanently deleted within 30 days of account deletion</li>
            <li><strong>Study Materials:</strong> You can delete individual items at any time</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Privacy Rights</h2>
          <p className="text-gray-300 mb-3">You have the right to:</p>
          <ol className="list-decimal list-inside text-gray-300 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
            <li><strong>Portability:</strong> Export your study materials and data</li>
            <li><strong>Opt-Out:</strong> Disable certain data collection features</li>
            <li><strong>Withdraw Consent:</strong> Stop processing based on consent</li>
          </ol>
          <p className="text-gray-300 mt-4">
            <strong>How to Exercise Your Rights:</strong> Use Settings → Privacy & Data in the app,
            or contact us at privacy@edufeed.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children&apos;s Privacy</h2>
          <p className="text-gray-300">
            EduFeed is intended for users 13 years and older. We do not knowingly collect
            information from children under 13. If we discover we have collected data from
            a child under 13, we will delete it immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">AI and Machine Learning</h2>
          <h3 className="text-xl font-medium mb-3 text-purple-400">How We Use AI</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li><strong>Document Analysis:</strong> Extract key concepts and generate embeddings</li>
            <li><strong>Content Generation:</strong> Create flashcards, study guides, and summaries</li>
            <li><strong>Chat Assistance:</strong> Answer questions about your study materials</li>
          </ul>
          <p className="text-gray-300">
            <strong>Important:</strong> Your data is NOT used to train AI models. All AI processing
            is temporary and happens on secure infrastructure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
          <p className="text-gray-300">
            We may update this Privacy Policy. Changes will be posted on this page with an
            updated &quot;Last Updated&quot; date. We will notify you via email for material changes.
            Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-300 mb-4">For privacy questions or concerns:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li><strong>Email:</strong> privacy@edufeed.com</li>
            <li><strong>Data Protection Officer:</strong> dpo@edufeed.com</li>
          </ul>
        </section>

        <div className="border-t border-gray-800 pt-8 mt-8">
          <h3 className="text-lg font-medium mb-3 text-purple-400">Summary in Plain English</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>We collect only what&apos;s needed to provide study features</li>
            <li>Your study materials and data are encrypted and secure</li>
            <li>We use AI to help you study, but don&apos;t train models on your data</li>
            <li>We never sell your personal information</li>
            <li>You can access, export, or delete your data anytime</li>
            <li>We&apos;re transparent about how we handle your information</li>
          </ul>
        </div>

        <footer className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>&copy; 2025 EduFeed. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
