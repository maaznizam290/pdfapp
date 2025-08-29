import Link from "next/link";

export default function Footer() {
  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "Tools", href: "/tools" },
        { name: "FAQ", href: "/faq" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "iLovePDF Desktop", href: "/desktop" },
        { name: "iLovePDF Mobile", href: "/mobile" },
        { name: "iLoveSign", href: "/sign" },
        { name: "iLoveAPI", href: "/api" },
        { name: "iLoveIMG", href: "/img" },
      ],
    },
    {
      title: "Solutions",
      links: [
        { name: "Business", href: "/business" },
        { name: "Education", href: "/education" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Security", href: "/security" },
        { name: "Privacy policy", href: "/privacy" },
        { name: "Terms & conditions", href: "/terms" },
        { name: "Cookies", href: "/cookies" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About us", href: "/about" },
        { name: "Contact us", href: "/contact" },
        { name: "Blog", href: "/blog" },
        { name: "Press", href: "/press" },
      ],
    },
  ];

  const appStores = [
    { name: "Google Play", href: "#", icon: "📱" },
    { name: "App Store", href: "#", icon: "🍎" },
    { name: "Mac Store", href: "#", icon: "💻" },
    { name: "Microsoft Store", href: "#", icon: "🪟" },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Logo and description */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PDF</span>
              </div>
              <span className="text-xl font-bold">PDF Converter</span>
            </div>
            <p className="text-gray-400 mb-6">
              The PDF software trusted by millions of users. Every tool you need to work with PDFs in one place.
            </p>
            
            {/* App stores */}
            <div className="flex flex-wrap gap-2">
              {appStores.map((store, index) => (
                <Link
                  key={index}
                  href={store.href}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  <span>{store.icon}</span>
                  <span>{store.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer sections */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">
                © PDF Converter 2025 ® - Your PDF Editor
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <select className="bg-gray-800 text-gray-300 text-sm rounded-lg px-3 py-2 border border-gray-700">
                <option>English</option>
                <option>Español</option>
                <option>Français</option>
                <option>Deutsch</option>
                <option>Italiano</option>
                <option>Português</option>
                <option>日本語</option>
                <option>Pусский</option>
                <option>한국어</option>
                <option>中文 (简体)</option>
                <option>中文 (繁體)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
