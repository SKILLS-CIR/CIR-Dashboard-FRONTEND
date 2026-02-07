// lib/validations/auth.ts

import { z } from "zod"

// Login schemas for different user types
export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const participantLoginSchema = z.object({
  uid: z.string().min(1, "UID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const studentLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

// Generic login schema
export const loginSchema = z.object({
  role: z.enum(["ADMIN", "PARTICIPANT"]),
  email: z.string().optional(),
  uid: z.string().optional(),
  password: z.string().min(1, "Password is required"),
}).superRefine((data, ctx) => {
  // ADMIN requires email only
  if (data.role === "ADMIN") {
    if (!data.email || data.email.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required for Admin",
        path: ["email"],
      })
    }
  }
  // PARTICIPANT requires both email AND UID
  if (data.role === "PARTICIPANT") {
    if (!data.email || data.email.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required for Participant",
        path: ["email"],
      })
    }
    if (!data.uid || data.uid.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "UID is required for Participant",
        path: ["uid"],
      })
    }
  }
})


// participant/Hostel/Security user creation schema (by admin)
export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  uid: z.string().min(1, "UID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["PARTICIPANT"]),
  name: z.string().min(1, "Name is required"),
  college: z.string().optional(),
  hostelName: z.string().min(1, "Hostel name is required"),
  wifiusername: z.string().min(1, "WiFi username is required"),
  wifiPassword: z.string().min(1, "WiFi password is required"),
  hostelLocation: z.string().url("Invalid URL format").optional().or(z.literal("")),
  contactNumber: z.string().regex(/^[0-9]{10}$/, "Contact number must be 10 digits"),
}).refine((data) => {
  // college is not required for participant or SECURITY - it's optional

  return true
}, {
  message: "Missing required fields for the selected role",
})