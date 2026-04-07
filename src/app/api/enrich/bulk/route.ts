import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Product } from '@/lib/types'

const BATCH_SIZE = 5

function getAnthropic() {
  return new Anthropic()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const limit = Math.min(body.limit ?? BATCH_SIZE, 20)

    // Fetch unenriched published products
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_published', true)
      .is('ai_enriched_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const products = (data ?? []) as Product[]
    if (products.length === 0) {
      return NextResponse.json({ enriched: 0, message: 'No hay productos pendientes' })
    }

    const anthropic = getAnthropic()
    let enriched = 0
    const errors: string[] = []

    for (const product of products) {
      try {
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system:
            'Eres un experto en marketing y SEO de artículos promocionales en México. Generas contenido de alta calidad en español mexicano para fichas de producto, optimizado para motores de búsqueda.',
          messages: [
            {
              role: 'user',
              content: `Genera contenido SEO para este artículo promocional:

Nombre: ${product.name}
SKU: ${product.sku}
Categoría: ${product.category}
Precio: $${product.price} MXN
${product.dimensions ? `Dimensiones: ${product.dimensions}` : ''}
${product.material ? `Material: ${product.material}` : ''}

Responde SOLO con JSON válido (sin markdown, sin backticks) con estas claves exactas:
{
  "description": "descripción SEO de 150-200 palabras en español",
  "short_desc": "descripción corta de máximo 20 palabras en español",
  "meta_title": "título meta de máximo 60 caracteres en español",
  "meta_desc": "meta descripción de máximo 155 caracteres en español",
  "keywords": ["6-8 keywords en español"],
  "use_cases": ["4-5 casos de uso en español"],
  "selling_points": ["4-5 puntos de venta en español"]
}`,
            },
          ],
        })

        const text =
          message.content[0].type === 'text' ? message.content[0].text : ''

        let parsed
        try {
          parsed = JSON.parse(text)
        } catch {
          const match = text.match(/\{[\s\S]*\}/)
          if (match) parsed = JSON.parse(match[0])
        }

        if (parsed) {
          await supabaseAdmin
            .from('products')
            .update({
              ai_description: parsed.description,
              ai_short_desc: parsed.short_desc,
              ai_meta_title: parsed.meta_title,
              ai_meta_desc: parsed.meta_desc,
              ai_keywords: parsed.keywords,
              ai_use_cases: parsed.use_cases,
              ai_selling_points: parsed.selling_points,
              ai_enriched_at: new Date().toISOString(),
            })
            .eq('id', product.id)

          enriched++
        }
      } catch (err) {
        errors.push(`${product.sku}: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    }

    // Count remaining
    const { count: remaining } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .is('ai_enriched_at', null)

    return NextResponse.json({
      enriched,
      errors: errors.length > 0 ? errors : undefined,
      remaining: remaining ?? 0,
    })
  } catch (err) {
    console.error('Bulk enrich error:', err)
    return NextResponse.json(
      { error: 'Error en enriquecimiento masivo' },
      { status: 500 }
    )
  }
}
