"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plane, 
  Train, 
  Bus, 
  Car, 
  Loader2, 
  MapPin, 
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Edit2,
  ArrowRight
} from "lucide-react"

interface ArrivalDetails {
  transportMode: string | null
  arrivalFrom: string | null
  arrivalTo: string | null
  expectedArrivalTime: string | null
  interestedInCarpool: boolean
  arrivalDetailsSubmitted: boolean
}

interface ArrivalDetailsPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  siteName?: string
}

const TRANSPORT_MODES = [
  { 
    id: "flight", 
    label: "Flight", 
    icon: Plane, 
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
    fromPlaceholder: "e.g., Delhi Airport (DEL)",
    toPlaceholder: "e.g., Trivandrum Airport (TRV)"
  },
  { 
    id: "train", 
    label: "Train", 
    icon: Train, 
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/20",
    fromPlaceholder: "e.g., New Delhi Railway Station",
    toPlaceholder: "e.g., Kayamkulam Junction"
  },
  { 
    id: "bus", 
    label: "Bus", 
    icon: Bus, 
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
    fromPlaceholder: "e.g., Bangalore Majestic Bus Stand",
    toPlaceholder: "e.g., Karunagappally Bus Stand"
  },
  { 
    id: "other", 
    label: "Other", 
    icon: Car, 
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
    fromPlaceholder: "",
    toPlaceholder: ""
  },
]

export default function ArrivalDetailsPopup({ 
  isOpen, 
  onClose, 
  onSuccess,
  siteName = "Amritapuri" 
}: ArrivalDetailsPopupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Form state
  const [transportMode, setTransportMode] = useState<string | null>(null)
  const [arrivalFrom, setArrivalFrom] = useState("")
  const [arrivalTo, setArrivalTo] = useState("")
  const [expectedArrivalTime, setExpectedArrivalTime] = useState("")
  const [interestedInCarpool, setInterestedInCarpool] = useState(false)
  
  // Existing data
  const [existingData, setExistingData] = useState<ArrivalDetails | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchExistingDetails()
    }
  }, [isOpen])

  // Update fetchExistingDetails to normalize the transport mode
  const fetchExistingDetails = async () => {
    setIsFetching(true)
    try {
      const response = await fetch("/api/arrival-details")
      if (response.ok) {
        const data = await response.json()
        setExistingData(data)
        
        // Pre-fill form if data exists
        if (data.arrivalDetailsSubmitted) {
          // Normalize transport mode to lowercase for frontend
          setTransportMode(data.transportMode?.toLowerCase() || null)
          setArrivalFrom(data.arrivalFrom || "")
          setArrivalTo(data.arrivalTo || "")
          if (data.expectedArrivalTime) {
            const date = new Date(data.expectedArrivalTime)
            setExpectedArrivalTime(date.toISOString().slice(0, 16))
          }
          setInterestedInCarpool(data.interestedInCarpool || false)
        }
      }
    } catch (error) {
      console.error("Error fetching arrival details:", error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async () => {
    if (!transportMode) {
      setError("Please select a mode of transport")
      return
    }

    if (transportMode !== "other") {
      if (!arrivalFrom.trim()) {
        setError("Please enter your departure location")
        return
      }
      if (!arrivalTo.trim()) {
        setError("Please enter your arrival location")
        return
      }
      if (!expectedArrivalTime) {
        setError("Please select your expected arrival time")
        return
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/arrival-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transportMode,
          arrivalFrom: arrivalFrom.trim(),
          arrivalTo: arrivalTo.trim(),
          expectedArrivalTime,
          interestedInCarpool,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setIsEditing(false)
        setExistingData({
          transportMode,
          arrivalFrom,
          arrivalTo,
          expectedArrivalTime,
          interestedInCarpool,
          arrivalDetailsSubmitted: true,
        })
        
        // Auto close after showing success for "other" mode
        if (transportMode === "other") {
          setTimeout(() => {
            onSuccess?.()
            onClose()
          }, 3000)
        }
      } else {
        setError(data.error || "Failed to save arrival details")
      }
    } catch (error) {
      console.error("Error saving arrival details:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setTransportMode(null)
    setArrivalFrom("")
    setArrivalTo("")
    setExpectedArrivalTime("")
    setInterestedInCarpool(false)
    setError(null)
    setSuccess(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    setIsEditing(false)
    onClose()
  }

  // Update the getTransportIcon function to handle both cases (enum from DB and lowercase from frontend)
  const getTransportIcon = (mode: string | null) => {
    if (!mode) return null
    const normalizedMode = mode.toLowerCase()
    const found = TRANSPORT_MODES.find(t => t.id === normalizedMode)
    if (found) {
      const Icon = found.icon
      return <Icon className={`h-5 w-5 ${found.color}`} />
    }
    return null
  }

  const getSelectedMode = () => {
    return TRANSPORT_MODES.find(t => t.id === transportMode)
  }

  const getLocationLabels = () => {
    switch (transportMode) {
      case "flight": 
        return { from: "Departure Airport", to: "Arrival Airport" }
      case "train": 
        return { from: "Departure Railway Station", to: "Arrival Railway Station" }
      case "bus": 
        return { from: "Departure Bus Stand", to: "Arrival Bus Stand" }
      default: 
        return { from: "Departure Location", to: "Arrival Location" }
    }
  }

  // Show existing data view
  const showExistingDataView = existingData?.arrivalDetailsSubmitted && !isEditing && !success

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {showExistingDataView ? "Your Arrival Details" : "Arrival Details"}
          </DialogTitle>
          <DialogDescription>
            {showExistingDataView 
              ? "Here are your saved travel details. You can edit them if needed."
              : "Help us coordinate transportation by sharing your travel details."
            }
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : showExistingDataView ? (
          // Display existing data
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              {/* Transport Mode */}
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  TRANSPORT_MODES.find(t => t.id === existingData.transportMode)?.bgColor || "bg-gray-100"
                }`}>
                  {getTransportIcon(existingData.transportMode || "")}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mode of Transport</p>
                  <p className="font-semibold capitalize">
                    {existingData.transportMode === "other" ? "Other Transport" : existingData.transportMode}
                  </p>
                </div>
              </div>
              
              {existingData.transportMode !== "other" && (
                <>
                  {/* From → To */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">From</p>
                        <p className="font-medium text-sm">{existingData.arrivalFrom}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">To</p>
                        <p className="font-medium text-sm">{existingData.arrivalTo}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrival Time */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expected Arrival</p>
                      <p className="font-medium">
                        {existingData.expectedArrivalTime 
                          ? new Date(existingData.expectedArrivalTime).toLocaleString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : "Not specified"
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Carpool Interest */}
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      existingData.interestedInCarpool 
                        ? "bg-green-100 dark:bg-green-900/20" 
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}>
                      <Users className={`h-5 w-5 ${
                        existingData.interestedInCarpool 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-gray-400"
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Carpooling</p>
                      <p className="font-medium">
                        {existingData.interestedInCarpool 
                          ? "Interested " 
                          : "Not interested"
                        }
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button onClick={handleEdit} variant="outline" className="w-full gap-2">
              <Edit2 className="h-4 w-4" />
              Edit Details
            </Button>
          </div>
        ) : success && transportMode === "other" ? (
          // Thank you message for "Other" mode
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Thank You! 🎉
              </h3>
              <p className="text-muted-foreground mt-2">
                We wish you safe travels and the best of luck at the ICPC Regionals!
              </p>
            </div>
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                See you at {siteName}! 🚀
              </AlertDescription>
            </Alert>
          </div>
        ) : success ? (
          // Success message for other modes
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Details Saved Successfully!
              </h3>
              <p className="text-muted-foreground mt-2">
                Your arrival details have been saved. You can edit them anytime.
              </p>
            </div>
            {/* {interestedInCarpool && (
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <Users className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  We'll try to connect you with other participants for carpooling!
                </AlertDescription>
              </Alert>
            )} */}
            <Button onClick={handleClose} className="mt-4">
              Done
            </Button>
          </div>
        ) : (
          // Form view
          <div className="space-y-6 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Transport Mode Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Mode of Transport</Label>
              <div className="grid grid-cols-2 gap-3">
                {TRANSPORT_MODES.map((mode) => {
                  const Icon = mode.icon
                  return (
                    <Button
                      key={mode.id}
                      type="button"
                      variant={transportMode === mode.id ? "default" : "outline"}
                      className={`h-20 flex flex-col gap-2 ${
                        transportMode === mode.id 
                          ? "ring-2 ring-primary ring-offset-2" 
                          : ""
                      }`}
                      onClick={() => {
                        setTransportMode(mode.id)
                        setError(null)
                        // Clear fields when switching modes
                        setArrivalFrom("")
                        setArrivalTo("")
                      }}
                    >
                      <Icon className={`h-6 w-6 ${transportMode === mode.id ? "text-white" : mode.color}`} />
                      <span>{mode.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Dynamic fields based on transport mode */}
            {transportMode && transportMode !== "other" && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                {/* From Location - Free Text Input */}
                <div className="space-y-2">
                  <Label htmlFor="arrivalFrom" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {getLocationLabels().from}
                  </Label>
                  <Input
                    id="arrivalFrom"
                    placeholder={getSelectedMode()?.fromPlaceholder || "Enter departure location"}
                    value={arrivalFrom}
                    onChange={(e) => setArrivalFrom(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the name of your departure {transportMode === "flight" ? "airport" : transportMode === "train" ? "railway station" : "bus stand"}
                  </p>
                </div>

                {/* To Location - Free Text Input */}
                <div className="space-y-2">
                  <Label htmlFor="arrivalTo" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {getLocationLabels().to}
                  </Label>
                  <Input
                    id="arrivalTo"
                    placeholder={getSelectedMode()?.toPlaceholder || "Enter arrival location"}
                    value={arrivalTo}
                    onChange={(e) => setArrivalTo(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the name of your arrival {transportMode === "flight" ? "airport" : transportMode === "train" ? "railway station" : "bus stand"} near {siteName}
                  </p>
                </div>

                {/* Visual From → To Display */}
                {arrivalFrom && arrivalTo && (
                  <div className="bg-muted/50 rounded-lg p-3 border border-dashed">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium truncate max-w-[40%]">{arrivalFrom}</span>
                      <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="font-medium truncate max-w-[40%]">{arrivalTo}</span>
                    </div>
                  </div>
                )}

                {/* Expected Arrival Time */}
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime" className="flex items-center gap-2">
                    Expected Arrival Time
                  </Label>
                  <Input
                    id="arrivalTime"
                    type="datetime-local"
                    value={expectedArrivalTime}
                    onChange={(e) => setExpectedArrivalTime(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    When do you expect to arrive at your destination?
                  </p>
                </div>

                {/* Carpool Interest */}
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50 border">
                  <Checkbox
                    id="carpool"
                    checked={interestedInCarpool}
                    onCheckedChange={(checked) => setInterestedInCarpool(checked as boolean)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor="carpool" 
                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
                      <Users className="h-4 w-4 text-blue-500" />
                      I'm interested in carpooling
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll try to connect you with other participants traveling from similar locations at similar times
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Message for "Other" transport */}
            {transportMode === "other" && (
              <div className="py-6 text-center space-y-4 animate-in fade-in-50 duration-300">
                <div className="mx-auto w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Car className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Traveling by your own means?
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No worries! Click submit and we'll wish you safe travels!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!isFetching && !showExistingDataView && !success && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || !transportMode}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}