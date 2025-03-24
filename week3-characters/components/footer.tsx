import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full py-6 border-t">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 Inspirational Storytelling App. All rights reserved.
          </p>
          <Link href="/settings" className="text-sm text-primary hover:underline">
            API Settings
          </Link>
        </div>
      </div>
    </footer>
  )
}

