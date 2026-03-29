import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Product } from '@/lib/types'

function getAnthropic() {
  return new Anthropic()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let productInfo: {
      name: string
      sku: string
      category: string
      price: number
      dimensions?: string
      material?: string
    }

    if (body.productId) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', body.productId)
        .single()
      if (error || !data) {
        return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
      }
      const product = data as Product
      productInfo = {
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        dimensions: product.dimensions ?? undefined,
        material: product.material ?? undefined,
      }
    } else {
      productInfo = body
    }

    const anthropic = getAnthropic()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system:
        'Eres un experto en marketing y SEO de artículos promocionales en México. Generas contenido de alta calidad en español mexicano para fichas de producto, optimizado para motores de búsqueda.',
      messages: [
        {
          role: 'user',
          content: `Genera contenido SEO para este artículo promocional:

Nombre: ${productInfo.name}
SKU: ${productInfo.sku}
Categoría: ${productInfo.category}
Precio: $${productInfo.price} MXN
${productInfo.dimensions ? `Dimensiones: ${productInfo.dimensions}` : ''}
${productInfo.material ? `Material: ${productInfo.material}` : ''}

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

    let enriched
    try {
      enriched = JSON.parse(text)
    } catch {
      // Try to extract JSON from the response
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        enriched = JSON.parse(match[0])
      } else {
        return NextResponse.json(
          { error: 'No se pudo parsear la respuesta de IA' },
          { status: 500 }
        )
      }
    }

    // If productId provided, save to DB
    if (body.productId) {
      await supabaseAdmin
        .from('products')
        .update({
          ai_description: enriched.description,
          ai_short_desc: enriched.short_desc,
          ai_meta_title: enriched.meta_title,
          ai_meta_desc: enriched.meta_desc,
          ai_keywords: enriched.keywords,
          ai_use_cases: enriched.use_cases,
          ai_selling_points: enriched.selling_points,
          ai_enriched_at: new Date().toISOString(),
        })
        .eq('id', body.productId)
    }

    return NextResponse.json(enriched)
  } catch (err) {
    console.error('Enrich error:', err)
    return NextResponse.json(
      { error: 'Error al enriquecer el producto' },
      { status: 500 }
    )
  }
}
