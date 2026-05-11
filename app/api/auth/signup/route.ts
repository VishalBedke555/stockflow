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
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          defaultLowStockThreshold: 5
        }
      })
      
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          organizationId: organization.id,
          name: email.split('@')[0]
        }
      })
      
      return { user, organization }
    })
    
    return NextResponse.json(
      { message: 'User created successfully', userId: result.user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    
    if (error instanceof z.ZodError) {
      // Fix: Use error.format() or error.issues instead of error.errors
      return NextResponse.json(
        { error: error.issues.map(issue => issue.message).join(', ') },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}