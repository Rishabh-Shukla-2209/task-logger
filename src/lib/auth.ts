import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "./prisma"
import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "username" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }
        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        })
        if (!user || !user.is_active) return null

        // Use bcrypt to compare the hashed password
        const passwordMatch = await bcrypt.compare(credentials.password, user.password)
        if (passwordMatch) {
          return {
            id: user.id,
            name: user.username,
            role: user.role
          }
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as Role
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login', // We will create this page
    signOut: '/signout', // Custom signout page
  }
}
