import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Invalid credentials')
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { organization: true }
                })

                if (!user || !user.password) {
                    throw new Error('Invalid credentials')
                }

                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.password
                )

                if (!isCorrectPassword) {
                    throw new Error('Invalid credentials')
                }

                return {
                    id: user.id,
                    email: user.email,
                    organizationId: user.organizationId,
                    organizationName: user.organization.name
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.organizationId = user.organizationId
                token.organizationName = user.organizationName
            }
            return token
        },
        async session({ session, token }) {
            session.user.organizationId = token.organizationId as string
            session.user.organizationName = token.organizationName as string
            return session
        }
    },
    pages: {
        signIn: '/login',
        signUp: '/signup',
    },
    session: {
        strategy: "jwt"
    },
    secret: process.env.NEXTAUTH_SECRET
}