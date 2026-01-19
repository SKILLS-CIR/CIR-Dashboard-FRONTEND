// CIR Work & Responsibility Management System Types

// ==================== Roles & Auth ====================
export type Role = 'ADMIN' | 'MANAGER' | 'STAFF'

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  user?: User
}

export interface JWTPayload {
  userId: string
  role: Role
  departmentId?: string
  subDepartmentId?: string
  iat: number
  exp: number
}

// ==================== User / Employee ====================
export interface User {
  id: string
  email: string
  name: string
  role: Role
  subDepartmentId?: string
  departmentId?: string
  createdAt: string
  updatedAt: string
}

export interface Employee {
  id: string
  email: string
  name: string
  role: Role
  subDepartment?: SubDepartment
  subDepartmentId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateEmployeeDto {
  email: string
  password: string
  name: string
  role: Role
  subDepartmentId?: string
}

export interface UpdateEmployeeDto {
  email?: string
  name?: string
  role?: Role
  subDepartmentId?: string
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

// ==================== Departments ====================
export interface Department {
  id: string
  name: string
  description?: string
  subDepartments?: SubDepartment[]
  createdAt: string
  updatedAt: string
}

export interface CreateDepartmentDto {
  name: string
  description?: string
}

export interface UpdateDepartmentDto {
  name?: string
  description?: string
}

// ==================== Sub-Departments ====================
export interface SubDepartment {
  id: string
  name: string
  description?: string
  departmentId: string
  department?: Department
  employees?: Employee[]
  createdAt: string
  updatedAt: string
}

export interface CreateSubDepartmentDto {
  name: string
  description?: string
  departmentId: string
}

export interface UpdateSubDepartmentDto {
  name?: string
  description?: string
}

// ==================== Responsibilities ====================
export interface Responsibility {
  id: string
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  createdAt: string
  updatedAt: string
}

export interface CreateResponsibilityDto {
  title: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface UpdateResponsibilityDto {
  title?: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

// ==================== Assignments ====================
export interface Assignment {
  id: string
  responsibilityId: string
  responsibility?: Responsibility
  employeeId: string
  employee?: Employee
  assignedById: string
  assignedBy?: Employee
  dueDate?: string
  notes?: string
  status: AssignmentStatus
  createdAt: string
  updatedAt: string
}

export type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'

export interface CreateAssignmentDto {
  responsibilityId: string
  employeeId: string
  dueDate?: string
  notes?: string
}

export interface UpdateAssignmentDto {
  dueDate?: string
  notes?: string
  status?: AssignmentStatus
}

// ==================== Work Submissions ====================
export interface WorkSubmission {
  id: string
  assignmentId: string
  assignment?: Assignment
  employeeId: string
  employee?: Employee
  content: string
  attachments?: string[]
  status: SubmissionStatus
  submittedAt: string
  verifiedAt?: string
  verifiedById?: string
  verifiedBy?: Employee
  rejectionReason?: string
  comments?: Comment[]
  createdAt: string
  updatedAt: string
}

export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED'

export interface CreateWorkSubmissionDto {
  assignmentId: string
  content: string
  attachments?: string[]
}

export interface UpdateWorkSubmissionDto {
  content?: string
  attachments?: string[]
}

export interface VerifySubmissionDto {
  status: 'VERIFIED' | 'REJECTED'
  rejectionReason?: string
}

// ==================== Comments ====================
export interface Comment {
  id: string
  workSubmissionId: string
  employeeId: string
  employee?: Employee
  content: string
  createdAt: string
  updatedAt: string
}

export interface CreateCommentDto {
  workSubmissionId: string
  content: string
}

export interface UpdateCommentDto {
  content: string
}

// ==================== API Response Types ====================
export interface ApiError {
  statusCode: number
  message: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
