import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Breadcrumbs from '@/components/Breadcrumbs'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes sobre Artículos Promocionales',
  description:
    'Resolvemos tus dudas sobre artículos promocionales: cantidades mínimas, personalización, tiempos de entrega, formas de pago y más. Promogifts México.',
  alternates: { canonical: 'https://promogifts.com.mx/preguntas-frecuentes' },
}

const FAQS = [
  {
    q: '¿Cuál es la cantidad mínima de pedido?',
    a: 'La cantidad mínima varía según el producto, pero generalmente es de 50 a 100 piezas. Algunos artículos premium pueden tener mínimos más bajos. Consulta la ficha de cada producto para ver el mínimo exacto o contáctanos para opciones especiales.',
  },
  {
    q: '¿Cómo funciona la personalización con mi logo?',
    a: 'Aceptamos logos en formatos vectoriales (AI, EPS, SVG, PDF) para obtener la mejor calidad de impresión. El método de personalización depende del material: serigrafía, tampografía, grabado láser, sublimación o bordado. Te asesoramos sobre la mejor técnica para tu producto.',
  },
  {
    q: '¿Cuánto tiempo tarda la entrega?',
    a: 'El tiempo estándar de producción es de 10 a 15 días hábiles una vez aprobada la muestra digital. Para pedidos urgentes ofrecemos servicio express de 5 a 7 días hábiles con un cargo adicional. Envíos a toda la República Mexicana con rastreo incluido.',
  },
  {
    q: '¿Qué formas de pago aceptan?',
    a: 'Aceptamos transferencia bancaria, depósito en efectivo, tarjeta de crédito y débito, PayPal y pago contra entrega en CDMX. Para pedidos mayores ofrecemos crédito a 30 días con previa aprobación. Emitimos factura fiscal CFDI.',
  },
  {
    q: '¿Puedo ver una muestra antes de hacer mi pedido?',
    a: 'Sí, ofrecemos muestras físicas para que evalúes la calidad del producto antes de confirmar tu pedido. Las muestras tienen un costo que se descuenta de tu pedido final. También enviamos muestras digitales (mockups) sin costo para que apruebes el diseño.',
  },
  {
    q: '¿Hacen envíos a todo México?',
    a: 'Sí, realizamos envíos a toda la República Mexicana a través de paqueterías reconocidas como DHL, FedEx, Estafeta y Redpack. El costo de envío se calcula según el volumen y destino. Para pedidos grandes en CDMX y área metropolitana el envío puede ser sin costo.',
  },
  {
    q: '¿Qué formato debe tener mi logo para la personalización?',
    a: 'Para obtener los mejores resultados, tu logo debe estar en formato vectorial (AI, EPS, SVG o PDF). Si solo cuentas con una imagen en PNG o JPG de alta resolución (mínimo 300 DPI), podemos vectorizarlo por ti con un costo adicional mínimo.',
  },
  {
    q: '¿Ofrecen servicio urgente o express?',
    a: 'Sí, contamos con servicio express para pedidos urgentes. Podemos entregar en 5 a 7 días hábiles dependiendo del producto y la cantidad. Este servicio tiene un cargo adicional del 20-30% sobre el precio regular. Consulta disponibilidad.',
  },
  {
    q: '¿Emiten factura fiscal?',
    a: 'Sí, emitimos factura fiscal CFDI con todos los requisitos del SAT. Puedes solicitar tu factura al momento de tu pedido o hasta 30 días después. Necesitamos tu RFC, razón social, domicilio fiscal, régimen fiscal y uso de CFDI.',
  },
  {
    q: '¿Pueden personalizar productos con diferentes diseños en un mismo pedido?',
    a: 'Sí, es posible incluir diferentes diseños o variaciones de logo en un mismo pedido. Cada variación adicional puede tener un costo extra por setup de impresión. Es ideal para empresas con múltiples marcas o divisiones.',
  },
  {
    q: '¿Qué tipos de productos promocionales manejan?',
    a: 'Manejamos más de 1,000 productos en categorías como bolígrafos y plumas, termos y tazas, tecnología, mochilas y bolsas, artículos de oficina, llaveros, sets corporativos y productos de temporada navideña. Explora nuestro catálogo completo.',
  },
  {
    q: '¿Cuál es el proceso de compra?',
    a: 'El proceso es simple: 1) Selecciona tus productos y solicita cotización. 2) Recibe tu propuesta en menos de 24 horas. 3) Aprueba el mockup digital con tu logo. 4) Realiza tu pago. 5) Producción de 10-15 días. 6) Entrega con rastreo.',
  },
  {
    q: '¿Ofrecen descuentos por volumen?',
    a: 'Sí, ofrecemos precios escalonados: mientras mayor sea tu pedido, menor es el precio por unidad. Los descuentos aplican automáticamente según la cantidad. Para pedidos de más de 1,000 piezas podemos negociar precios especiales.',
  },
  {
    q: '¿Puedo combinar varios productos en un solo pedido?',
    a: 'Absolutamente. Puedes armar kits o paquetes combinando diferentes productos. Esto es muy popular para regalos corporativos de fin de año, welcome kits para empleados o eventos empresariales. Ofrecemos empaque personalizado.',
  },
  {
    q: '¿Tienen garantía en sus productos?',
    a: 'Todos nuestros productos cuentan con garantía de calidad. Si recibes un artículo con defecto de fábrica o la personalización no cumple con lo aprobado, hacemos la reposición sin costo. Tu satisfacción es nuestra prioridad.',
  },
]

export default function FAQPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Nav />
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Preguntas Frecuentes' }]} />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-bold text-[var(--black)] sm:text-4xl">
            Preguntas Frecuentes
          </h1>
          <p className="mt-3 text-lg text-[var(--mid)]">
            Todo lo que necesitas saber sobre nuestros artículos promocionales.
          </p>

          <div className="mt-10 space-y-8">
            {FAQS.map((faq, i) => (
              <div key={i} className="border-b border-[var(--light)]/60 pb-8">
                <h2 className="text-lg font-semibold text-[var(--black)]">{faq.q}</h2>
                <p className="mt-3 leading-relaxed text-[var(--mid)]">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl bg-[var(--brand-pale)] p-8 text-center">
            <h2 className="text-xl font-bold text-[var(--black)]">¿Tienes otra pregunta?</h2>
            <p className="mt-2 text-[var(--mid)]">Estamos para ayudarte.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link href="/contacto" className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]">
                Contáctanos
              </Link>
              <a href="https://wa.me/525530297582?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n" target="_blank" rel="noopener noreferrer" className="rounded-full border border-[var(--brand)] px-6 py-3 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand-pale)]">
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
