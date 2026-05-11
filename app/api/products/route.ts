import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  quantityOnHand: z.number().int().min(0).default(0),
  costPrice: z.number().optional().nullable(),
  sellingPrice: z.number().optional().nullable(),
  lowStockThreshold: z.number().optional().nullable()
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  
  const products = await prisma.product.findMany({
    where: {
      organizationId: session.user.organizationId,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await req.json()
    const data = productSchema.parse(body)
    
    const existingProduct = await prisma.product.findFirst({
      where: {
        organizationId: session.user.organizationId,
        sku: data.sku
      }
    })
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      )
    }
    
    const product = await prisma.product.create({
      data: {
        ...data,
        organizationId: session.user.organizationId
      }
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}