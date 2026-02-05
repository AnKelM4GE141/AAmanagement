export default function SignLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <span className="text-lg font-bold text-slate-900">AA Portal</span>
            <span className="ml-3 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Document Signing
            </span>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
