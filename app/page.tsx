import Link from 'next/link'
import ProductGrid from '@/components/ProductGrid'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-indigo-600">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
              Buy & Sell Habesha Dresses
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-xl text-indigo-100">
              Find beautiful traditional dresses or sell your own
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50"
              >
                Get Started
              </Link>
              <Link
                href="#products"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-400"
              >
                Browse Dresses
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Latest Dresses</h2>
        <ProductGrid />
      </div>
    </div>
  )
}
