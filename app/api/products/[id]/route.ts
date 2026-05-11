import { NextResponse } from 'next/server'
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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await req.json()
    const data = updateProductSchema.parse(body)
    
    const product = await prisma.product.updateMany({
      where: {
        id: params.id,
        organizationId: session.user.organizationId
      },
      data
    })
    
    if (product.count === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Product updated' })
  } catch (error) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const product = await prisma.product.deleteMany({
    where: {
      id: params.id,
      organizationId: session.user.organizationId
    }
  })
  
  if (product.count === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  
  return NextResponse.json({ message: 'Product deleted' })
}