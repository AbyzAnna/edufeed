import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support - EduFeed",
  description: "Get help and support for EduFeed - AI-Powered Study Companion",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Support</h1>
        <p className="text-gray-400 mb-8">We&apos;re here to help you succeed with EduFeed</p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-medium text-purple-400 mb-2">
                How do I create flashcards from a PDF?
              </h3>
              <p className="text-gray-300">
                Open the app, tap the &quot;+&quot; button, select &quot;PDF Document&quot;, and upload your file.
                Our AI will analyze the content and automatically generate flashcards for you.
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-medium text-purple-400 mb-2">
                Can I study YouTube videos?
              </h3>
              <p className="text-gray-300">
                Yes! Paste any YouTube URL and EduFeed will extract the transcript, create summaries,
                and generate study materials from the video content.
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-medium text-purple-400 mb-2">
                How do Video Study Rooms work?
              </h3>
              <p className="text-gray-300">
                Create a study room from the &quot;Study&quot; tab, invite friends via link, and join a video call.
                You can study together, share screens, and discuss study materials in real-time.
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-medium text-purple-400 mb-2">
                Is my data secure?
              </h3>
              <p className="text-gray-300">
                Absolutely. All data is encrypted in transit and at rest. We use secure authentication
                and never sell your personal information. See our Privacy Policy for details.
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-medium text-purple-400 mb-2">
                How do I delete my account?
              </h3>
              <p className="text-gray-300">
                Go to Profile → Settings → Account → Delete Account. All your data will be
                permanently deleted within 30 days.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Contact Us</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-medium text-purple-400 mb-2">General Support</h3>
              <p className="text-gray-300 mb-2">
                For questions about using EduFeed or technical issues:
              </p>
              <a
                href="mailto:support@edufeed.com"
                className="text-purple-400 hover:text-purple-300"
              >
                support@edufeed.com
              </a>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-medium text-purple-400 mb-2">Feature Requests</h3>
              <p className="text-gray-300 mb-2">
                Have an idea to make EduFeed better? We&apos;d love to hear it:
              </p>
              <a
                href="mailto:feedback@edufeed.com"
                className="text-purple-400 hover:text-purple-300"
              >
                feedback@edufeed.com
              </a>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-medium text-purple-400 mb-2">Privacy Concerns</h3>
              <p className="text-gray-300 mb-2">
                For privacy-related questions or data requests:
              </p>
              <a
                href="mailto:privacy@edufeed.com"
                className="text-purple-400 hover:text-purple-300"
              >
                privacy@edufeed.com
              </a>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-medium text-purple-400 mb-2">Business Inquiries</h3>
              <p className="text-gray-300 mb-2">
                For partnerships, press, or business matters:
              </p>
              <a
                href="mailto:hello@edufeed.com"
                className="text-purple-400 hover:text-purple-300"
              >
                hello@edufeed.com
              </a>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Response Times</h2>
          <p className="text-gray-300 mb-4">
            We typically respond to support requests within:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li><strong>General questions:</strong> 24-48 hours</li>
            <li><strong>Technical issues:</strong> 12-24 hours</li>
            <li><strong>Account/billing issues:</strong> 4-12 hours</li>
            <li><strong>Security concerns:</strong> Under 4 hours</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">App Information</h2>
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <p className="text-gray-500">App Name</p>
                <p className="font-medium">EduFeed</p>
              </div>
              <div>
                <p className="text-gray-500">Version</p>
                <p className="font-medium">1.0.0</p>
              </div>
              <div>
                <p className="text-gray-500">Platform</p>
                <p className="font-medium">iOS, Web</p>
              </div>
              <div>
                <p className="text-gray-500">Category</p>
                <p className="font-medium">Education</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500">&copy; 2025 EduFeed. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="/privacy" className="text-gray-400 hover:text-purple-400">
                Privacy Policy
              </a>
              <a href="/terms" className="text-gray-400 hover:text-purple-400">
                Terms of Service
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
