import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const settingsSchema = z.object({
  defaultLowStockThreshold: z.number().int().min(0)
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organizationId }
  })
  
  return NextResponse.json({
    defaultLowStockThreshold: organization?.defaultLowStockThreshold
  })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await req.json()
    const data = settingsSchema.parse(body)
    
    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { defaultLowStockThreshold: data.defaultLowStockThreshold }
    })
    
    return NextResponse.json({ message: 'Settings updated' })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid settings' }, { status: 400 })
  }
}