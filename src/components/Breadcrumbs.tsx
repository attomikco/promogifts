import Link from 'next/link'

type BreadcrumbItem = { label: string; href?: string }

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `https://promogifts.com.mx${item.href}` } : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="border-b border-[var(--light)]/40 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--mid)]">
            {items.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <svg className="h-3 w-3 text-[var(--light)]" viewBox="0 0 12 12" fill="none">
                    <path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {item.href ? (
                  <Link href={item.href} className="transition hover:text-[var(--black)]">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-[var(--black)]">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}
