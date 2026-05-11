import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  organizationName: z.string().min(2)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, organizationName } = signupSchema.parse(body)
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
        defaultLowStockThreshold: 5
      }
    })
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        organizationId: organization.id,
        name: email.split('@')[0]
      }
    })
    
    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}