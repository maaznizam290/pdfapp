import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label="PDF Converter">
      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">PDF</span>
      </div>
      <span className="text-xl font-bold text-gray-900">PDF Converter</span>
    </Link>
  );
}
