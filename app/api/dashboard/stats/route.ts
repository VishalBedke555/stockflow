import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    include: {
      products: true
    }
  })
  
  const totalProducts = organization?.products.length || 0;
  const totalQuantity = organization?.products.reduce((sum:any, p:any) => sum + p.quantityOnHand, 0) || 0;
  
  const defaultThreshold = organization?.defaultLowStockThreshold || 5
  
  const lowStockProducts = organization?.products.filter(p => {
    const threshold = p.lowStockThreshold ?? defaultThreshold
    return p.quantityOnHand <= threshold
  }) || []
  
  return NextResponse.json({
    totalProducts,
    totalQuantity,
    lowStockProducts: lowStockProducts.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      quantityOnHand: p.quantityOnHand,
      lowStockThreshold: p.lowStockThreshold ?? defaultThreshold
    }))
  })
}