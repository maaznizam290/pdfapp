'use client';

import Link from 'next/link';

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I merge multiple PDF files?",
      answer: "Go to the Merge PDF tool, upload your PDF files, arrange them in the desired order, and click 'Merge PDFs'. Your combined PDF will be downloaded automatically."
    },
    {
      question: "Is there a file size limit?",
      answer: "Yes, individual files should be under 50MB and the total processing should not exceed 100MB. For larger files, consider splitting them first."
    },
    {
      question: "Are my files secure?",
      answer: "Absolutely! All files are processed securely and automatically deleted from our servers immediately after processing. We never store your files permanently."
    },
    {
      question: "What file formats are supported?",
      answer: "We support PDF files for most operations, Word documents (.doc, .docx) for conversion, Excel files (.xlsx) for conversion, PowerPoint files (.pptx) for conversion, and JPG images for PDF conversion."
    },
    {
      question: "Why is my download being blocked by the browser?",
      answer: "This is normal browser security behavior for local development. Simply click 'Keep' when prompted, or ensure you're using HTTPS in production."
    },
    {
      question: "Can I convert PDFs back to Word?",
      answer: "Yes! Use our PDF to Word converter tool. Upload your PDF file and it will be converted to an editable Word document."
    },
    {
      question: "How do I add a password to my PDF?",
      answer: "Use the Protect PDF tool. Upload your PDF, enter a password, set permissions, and download your password-protected PDF."
    },
    {
      question: "What if I forget my PDF password?",
      answer: "Use our Unlock PDF tool to remove password protection from your PDF files."
    },
    {
      question: "Can I crop PDF pages?",
      answer: "Yes! Use the Crop PDF tool to remove unwanted margins or focus on specific content areas of your PDF pages."
    },
    {
      question: "How do I add page numbers to my PDF?",
      answer: "Use the Add Page Numbers tool. Choose the position (bottom-center, bottom-right, etc.) and customize the font size."
    }
  ];

  const tools = [
    { name: 'Merge PDF', description: 'Combine multiple PDFs into one', href: '/merge-pdf' },
    { name: 'Split PDF', description: 'Separate PDF into multiple files', href: '/split-pdf' },
    { name: 'Compress PDF', description: 'Reduce PDF file size', href: '/compress-pdf' },
    { name: 'Word to PDF', description: 'Convert Word documents to PDF', href: '/word-to-pdf' },
    { name: 'PDF to Word', description: 'Convert PDF to Word documents', href: '/pdf-to-word' },
    { name: 'Protect PDF', description: 'Add password protection', href: '/protect-pdf' },
    { name: 'Unlock PDF', description: 'Remove password protection', href: '/unlock-pdf' },
    { name: 'Watermark PDF', description: 'Add text watermarks', href: '/watermark' },
    { name: 'Rotate PDF', description: 'Rotate PDF pages', href: '/rotate-pdf' },
    { name: 'Crop PDF', description: 'Crop PDF pages', href: '/crop-pdf' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get help with our PDF tools. Find answers to common questions and learn how to use our features.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Start Guide */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start Guide</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Your Tool</h3>
                    <p className="text-gray-600">
                      Browse our collection of PDF tools and select the one that meets your needs. 
                      Each tool is designed for a specific task like merging, splitting, or converting PDFs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Files</h3>
                    <p className="text-gray-600">
                      Upload your PDF or document files using the drag-and-drop area or file picker. 
                      You can upload multiple files for operations like merging or splitting.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Configure Settings</h3>
                    <p className="text-gray-600">
                      Adjust any settings specific to your tool, such as page ranges, watermark text, 
                      or output quality. Most tools have default settings that work for most users.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">4</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Process and Download</h3>
                    <p className="text-gray-600">
                      Click the process button and wait for your file to be processed. 
                      Your result will be automatically downloaded when ready.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Tools */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tools</h3>
              <div className="space-y-3">
                {tools.slice(0, 5).map((tool, index) => (
                  <Link
                    key={index}
                    href={tool.href}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{tool.name}</div>
                    <div className="text-sm text-gray-600">{tool.description}</div>
                  </Link>
                ))}
              </div>
              <Link 
                href="/tools"
                className="block mt-4 text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Tools →
              </Link>
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Secure Processing</h4>
                  <p className="text-sm text-green-800">
                    All files are processed securely and automatically deleted after processing. 
                    Your privacy is our priority.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-2">Need More Help?</h4>
              <p className="text-sm text-blue-800 mb-4">
                Can't find what you're looking for? Contact our support team.
              </p>
              <div className="space-y-2 text-sm text-blue-800">
                <div>📧 support@pdftools.com</div>
                <div>⏰ Response within 24 hours</div>
                <div>🌍 Available worldwide</div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Tools */}
        <div className="mt-12 text-center">
          <Link 
            href="/tools"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Start Using PDF Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
