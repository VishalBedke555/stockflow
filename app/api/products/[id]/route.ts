import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  quantityOnHand: z.number().int().min(0).optional(),
  costPrice: z.number().optional().nullable(),
  sellingPrice: z.number().optional().nullable(),
  lowStockThreshold: z.number().optional().nullable()
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id } = await context.params
    const body = await request.json()
    const data = updateProductSchema.parse(body)
    
    const product = await prisma.product.updateMany({
      where: {
        id: id,
        organizationId: session.user.organizationId
      },
      data
    })
    
    if (product.count === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Product updated' })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id } = await context.params
    
    const product = await prisma.product.deleteMany({
      where: {
        id: id,
        organizationId: session.user.organizationId
      }
    })
    
    if (product.count === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Product deleted' })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id } = await context.params
    
    const product = await prisma.product.findFirst({
      where: {
        id: id,
        organizationId: session.user.organizationId
      }
    })
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Get error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}