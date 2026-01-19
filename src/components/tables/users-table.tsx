"use client"

import { useState } from "react"
import { Role } from "@prisma/client"

interface User {
  id: string
  email: string
  uid?: string
  role: Role
  createdAt: string
  student?: {
    id: string
    name: string
    clubName: string
    hostelName: string
    roomNo: string
    phoneNumber: string
    isTeamLead: boolean
  }
  teamLead?: {
    id: string
    name: string
    clubName: string
    college?: string
  }
  participant?: {
    id: string
    name: string
    college?: string
  }
  hostelAdmin?: {
    id: string
    name: string
    hostelName: string
  }
}

interface UsersTableProps {
  users: User[]
  onEdit?: (user: User) => void
  onDelete?: (user: User) => void
  onPromote?: (user: User) => void
  onDemote?: (user: User) => void
  showActions?: boolean
  loading?: boolean
}

export default function UsersTable({
  users,
  onEdit,
  onDelete,
  onPromote,
  onDemote,
  showActions = true,
  loading = false
}: UsersTableProps) {
  const [sortField, setSortField] = useState<string>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filterRole, setFilterRole] = useState<Role | "ALL">("ALL")
  const [searchTerm, setSearchTerm] = useState("")

  const getRoleColor = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800"
      case "PARTICIPANT":
        return "bg-green-100 text-green-800"
      
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUserName = (user: User) => {
    if (user.student) return user.student.name
    if (user.teamLead) return user.teamLead.name
    if (user.participant) return user.participant.name
    if (user.hostelAdmin) return user.hostelAdmin.name
    return "N/A"
  }

  const getUserDetails = (user: User) => {
    if (user.student) {
      return {
        primary: user.student.clubName,
        secondary: `${user.student.hostelName} - Room ${user.student.roomNo}`,
        contact: user.student.phoneNumber
      }
    }
    if (user.teamLead) {
      return {
        primary: user.teamLead.clubName,
        secondary: user.teamLead.college || "No college",
        contact: ""
      }
    }
    if (user.participant) {
      return {
        primary: user.participant.college || "No college",
        secondary: "",
        contact: ""
      }
    }
    if (user.hostelAdmin) {
      return {
        primary: user.hostelAdmin.hostelName,
        secondary: "",
        contact: ""
      }
    }
    return { primary: "", secondary: "", contact: "" }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesRole = filterRole === "ALL" || user.role === filterRole
      const matchesSearch = 
        getUserName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.uid && user.uid.toLowerCase().includes(searchTerm.toLowerCase())) ||
        getUserDetails(user).primary.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesRole && matchesSearch
    })
    .sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case "name":
          aValue = getUserName(a)
          bValue = getUserName(b)
          break
        case "email":
          aValue = a.email
          bValue = b.email
          break
        case "role":
          aValue = a.role
          bValue = b.role
          break
        case "createdAt":
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }


  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header with filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-medium text-gray-900">
            Users ({filteredAndSortedUsers.length})
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Role filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as Role | "ALL")}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="participant">participant</option>
              <option value="HOSTEL">Hostel</option>
              <option value="TEAM_LEAD">Team Lead</option>
              <option value="STUDENT">Student</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort("name")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Name
                  {sortField === "name" && (
                    <svg
                      className={`w-4 h-4 transform ${
                        sortDirection === "desc" ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("email")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Email & UID
                  {sortField === "email" && (
                    <svg
                      className={`w-4 h-4 transform ${
                        sortDirection === "desc" ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("role")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Role
                  {sortField === "role" && (
                    <svg
                      className={`w-4 h-4 transform ${
                        sortDirection === "desc" ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th
                onClick={() => handleSort("createdAt")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Created
                  {sortField === "createdAt" && (
                    <svg
                      className={`w-4 h-4 transform ${
                        sortDirection === "desc" ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              {showActions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedUsers.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 6 : 5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                    <p className="text-gray-500 text-lg font-medium">No users found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {searchTerm || filterRole !== "ALL"
                        ? "Try adjusting your search or filter criteria"
                        : "No users have been created yet"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedUsers.map((user) => {
                const details = getUserDetails(user)
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-sm">
                            {getUserName(user).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getUserName(user)}
                          </div>
                          {user.student?.isTeamLead && (
                            <div className="text-xs text-orange-600 font-medium">
                              Promoted from Student
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      {user.uid && (
                        <div className="text-sm text-gray-500">UID: {user.uid}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{details.primary}</div>
                      {details.secondary && (
                        <div className="text-sm text-gray-500">{details.secondary}</div>
                      )}
                      {details.contact && (
                        <div className="text-sm text-gray-500">{details.contact}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    {showActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(user)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              title="Edit user"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {/* {onPromote && canPromote(user) && (
                            <button
                              onClick={() => onPromote(user)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Promote to Team Lead"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                            </button>
                          )}
                          {onDemote && canDemote(user) && (
                            <button
                              onClick={() => onDemote(user)}
                              className="text-orange-600 hover:text-orange-900 transition-colors"
                              title="Demote from Team Lead"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            </button>
                          )} */}
                          {onDelete && user.role !== "ADMIN" && (
                            <button
                              onClick={() => onDelete(user)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete user"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}