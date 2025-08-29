export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Every tool you need to work with PDFs in one place
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! 
            Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
              Start Using Tools
            </button>
            <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
              View All Tools
            </button>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-indigo-200 rounded-full opacity-20"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-200 rounded-full opacity-20"></div>
    </section>
  );
}
