import { supabaseAdmin } from '@/lib/supabase/admin'
import LeadStatusButtons from '@/components/admin/LeadStatusButtons'
import type { QuoteItem } from '@/lib/email'

const PER_PAGE = 100

type Lead = {
  id: string
  name?: string | null
  company?: string | null
  email: string
  phone?: string | null
  product_name?: string | null
  quantity?: number | null
  items?: QuoteItem[] | null
  message?: string | null
  status: string
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  new: { label: 'Nuevo', className: 'bg-blue-100 text-blue-700' },
  followed_up: { label: 'Seguimiento', className: 'bg-amber-100 text-amber-700' },
  replied: { label: 'Respondido', className: 'bg-green-100 text-green-700' },
  closed: { label: 'Cerrado', className: 'bg-gray-100 text-gray-500' },
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function productCell(lead: Lead): string {
  if (Array.isArray(lead.items) && lead.items.length > 0) {
    return lead.items.map((i) => `${i.name}${i.quantity ? ` (${i.quantity})` : ''}`).join(', ')
  }
  return lead.product_name ?? '—'
}

export default async function AdminLeadsPage() {
  const { data } = await supabaseAdmin
    .from('quote_requests')
    .select('id, name, company, email, phone, product_name, quantity, items, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(PER_PAGE)

  const leads = (data ?? []) as Lead[]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--black)]">Leads / Cotizaciones</h1>
        <p className="mt-1 text-sm text-[var(--mid)]">
          Últimas {leads.length} solicitudes recibidas
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--light)]/60 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--light)]/40 bg-[var(--pale)]">
              <th className="px-4 py-3 font-medium text-[var(--mid)]">Fecha</th>
              <th className="px-4 py-3 font-medium text-[var(--mid)]">Cliente</th>
              <th className="px-4 py-3 font-medium text-[var(--mid)]">Empresa</th>
              <th className="px-4 py-3 font-medium text-[var(--mid)]">Producto(s)</th>
              <th className="px-4 py-3 font-medium text-[var(--mid)]">Cant.</th>
              <th className="px-4 py-3 font-medium text-[var(--mid)]">Estado</th>
              <th className="px-4 py-3 font-medium text-[var(--mid)]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => {
              const st = STATUS_LABELS[lead.status] ?? STATUS_LABELS.new
              return (
                <tr
                  key={lead.id}
                  className={`border-b border-[var(--light)]/30 align-top ${i % 2 === 1 ? 'bg-[var(--pale)]/50' : ''}`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--mid)]">{fmtDate(lead.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--black)]">{lead.name || '—'}</div>
                    <a href={`mailto:${lead.email}`} className="text-xs text-[var(--brand)] hover:underline">
                      {lead.email}
                    </a>
                    {lead.phone && <div className="text-xs text-[var(--mid)]">{lead.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-[var(--mid)]">{lead.company || '—'}</td>
                  <td className="max-w-xs px-4 py-3 text-[var(--black)]">{productCell(lead)}</td>
                  <td className="px-4 py-3 text-[var(--mid)]">{lead.quantity ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <LeadStatusButtons id={lead.id} status={lead.status} />
                  </td>
                </tr>
              )
            })}
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--mid)]">
                  Aún no hay solicitudes de cotización.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
