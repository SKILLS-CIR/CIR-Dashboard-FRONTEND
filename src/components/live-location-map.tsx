"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  MapPin, 
  Users, 
  Loader2, 
  Navigation, 
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Locate,
  WifiOff,
  Monitor,
  Route,
  X,
  ChevronRight
} from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import Leaflet components (no SSR)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
)
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
)

// Component to update map center dynamically - ONLY when triggered
const MapCenterUpdater = dynamic(
  () => import("react-leaflet").then((mod) => {
    const { useMap } = mod
    const React = require('react')
    
    return function MapCenterUpdaterInner({ center, zoom, shouldUpdate }: { center: [number, number]; zoom: number; shouldUpdate: boolean }) {
      const map = useMap()
      const hasUpdatedRef = React.useRef(false)
      
      React.useEffect(() => {
        if (shouldUpdate && !hasUpdatedRef.current) {
          map.setView(center, zoom)
          hasUpdatedRef.current = true
        } else if (!shouldUpdate) {
          hasUpdatedRef.current = false
        }
      }, [map, center, zoom, shouldUpdate])
      return null
    }
  }),
  { ssr: false }
)

// Enhanced custom marker icon creator with better avatar styling
const createCustomIcon = (initial: string, avatarUrl?: string, isMe: boolean = false) => {
  if (typeof window === 'undefined') return null
  
  const L = require('leaflet')
  
  const borderColor = isMe ? '#3b82f6' : '#ef4444'
  const bgColor = isMe ? '#3b82f6' : '#ef4444'
  const pulseColor = isMe ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.3)'
  
  const iconHtml = avatarUrl 
    ? `<div class="marker-container" style="position: relative;">
        <div style="
          width: 44px; 
          height: 44px; 
          border-radius: 50%; 
          border: 3px solid ${borderColor}; 
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 0 0 2px white;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          z-index: 2;
        ">
          <img 
            src="${avatarUrl}" 
            style="width: 100%; height: 100%; object-fit: cover;" 
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
          />
          <div style="
            display: none; 
            width: 100%; 
            height: 100%; 
            background: ${bgColor}; 
            color: white; 
            font-weight: bold; 
            font-size: 14px; 
            align-items: center; 
            justify-content: center;
            position: absolute;
            top: 0;
            left: 0;
          ">${initial}</div>
        </div>
        ${isMe ? `<div style="
          position: absolute;
          top: -4px;
          left: -4px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: ${pulseColor};
          animation: pulse 2s ease-in-out infinite;
          z-index: 1;
        "></div>` : ''}
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid ${borderColor};
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
        "></div>
      </div>`
    : `<div class="marker-container" style="position: relative;">
        <div style="
          width: 44px; 
          height: 44px; 
          border-radius: 50%; 
          background: linear-gradient(135deg, ${bgColor} 0%, ${isMe ? '#2563eb' : '#dc2626'} 100%);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 15px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          position: relative;
          z-index: 2;
        ">${initial}</div>
        ${isMe ? `<div style="
          position: absolute;
          top: -4px;
          left: -4px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: ${pulseColor};
          animation: pulse 2s ease-in-out infinite;
          z-index: 1;
        "></div>` : ''}
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid ${isMe ? '#3b82f6' : '#ef4444'};
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
        "></div>
      </div>`
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker-icon',
    iconSize: [44, 54],
    iconAnchor: [22, 54],
    popupAnchor: [0, -54]
  })
}

interface UserLocation {
  id: string
  participantId: string
  participantName: string
  avatarUrl?: string
  teamName?: string
  latitude: number
  longitude: number
  siteName: string
  updatedAt: string
}

interface RouteStep {
  instruction: string
  distance: number
  duration: number
  maneuver: string
}

interface RouteInfo {
  coordinates: [number, number][]
  distance: number
  duration: number
  steps: RouteStep[]
}

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629, zoom: 5 }

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${Math.round(seconds)} sec`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function LiveLocationMap() {
  const { data: session } = useSession()
  const [locations, setLocations] = useState<UserLocation[]>([])
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [userSite, setUserSite] = useState<string>("Unknown")
  const [isAdmin, setIsAdmin] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_CENTER.zoom)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [isMobile, setIsMobile] = useState(true)
  const [lowAccuracyWarning, setLowAccuracyWarning] = useState(false)
  const [shouldRecenter, setShouldRecenter] = useState(false)
  const [shouldUpdateMap, setShouldUpdateMap] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [customIcons, setCustomIcons] = useState<Record<string, any>>({})
  
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [showDirections, setShowDirections] = useState(false)
  
  const watchIdRef = useRef<number | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const routeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const currentUserId = session?.user?.id

  // Filter out current user from server locations - ALWAYS
  const otherUsersLocations = useMemo(() => {
    if (!currentUserId) return locations
    return locations.filter(loc => loc.participantId !== currentUserId)
  }, [locations, currentUserId])

  // Create a stable key for icons
  const otherUsersKey = useMemo(() => {
    return otherUsersLocations.map(l => l.id).sort().join(',')
  }, [otherUsersLocations])

  // Load Leaflet CSS and fix icons
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(isMobileDevice())
      
      if (!document.getElementById("custom-marker-styles")) {
        const style = document.createElement("style")
        style.id = "custom-marker-styles"
        style.textContent = `
          .custom-marker-icon {
            background: transparent !important;
            border: none !important;
          }
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.6;
            }
            50% {
              transform: scale(1.15);
              opacity: 0.3;
            }
          }
          .leaflet-popup-content-wrapper {
            border-radius: 12px !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          }
          .leaflet-popup-tip {
            box-shadow: none !important;
          }
        `
        document.head.appendChild(style)
      }
      
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.id = "leaflet-css"
        document.head.appendChild(link)
      }

      import("leaflet").then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        })
        setLeafletLoaded(true)
      })

      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          setLocationPermission(result.state as 'prompt' | 'granted' | 'denied')
          result.onchange = () => {
            setLocationPermission(result.state as 'prompt' | 'granted' | 'denied')
          }
        }).catch(() => {})
      }
    }
  }, [])

  // Create custom icons
  useEffect(() => {
    if (!leafletLoaded || otherUsersLocations.length === 0) return
    
    const icons: Record<string, any> = {}
    otherUsersLocations.forEach(loc => {
      icons[loc.id] = createCustomIcon(getInitials(loc.participantName), loc.avatarUrl, false)
    })
    setCustomIcons(icons)
  }, [leafletLoaded, otherUsersKey])

  // Fetch route from OSRM
  const fetchRoute = useCallback(async (
    fromLat: number, 
    fromLng: number, 
    toLat: number, 
    toLng: number
  ): Promise<RouteInfo | null> => {
    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`
      
      const response = await fetch(url)
      if (!response.ok) return null
      
      const data = await response.json()
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) return null
      
      const route = data.routes[0]
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]]
      )
      
      const steps: RouteStep[] = []
      if (route.legs && route.legs[0] && route.legs[0].steps) {
        route.legs[0].steps.forEach((step: any) => {
          if (step.maneuver && step.maneuver.instruction) {
            steps.push({
              instruction: step.maneuver.instruction,
              distance: step.distance,
              duration: step.duration,
              maneuver: step.maneuver.type + (step.maneuver.modifier ? `-${step.maneuver.modifier}` : '')
            })
          }
        })
      }
      
      return { coordinates, distance: route.distance, duration: route.duration, steps }
    } catch (err) {
      console.error("Failed to fetch route:", err)
      return null
    }
  }, [])

  // Start navigation
  const startNavigation = useCallback(async (targetUser: UserLocation) => {
    if (!myLocation) {
      setError("Please start sharing your location first to navigate")
      return
    }
    
    setSelectedUser(targetUser)
    setIsLoadingRoute(true)
    setShowDirections(true)
    
    const route = await fetchRoute(
      myLocation.lat, myLocation.lng, 
      targetUser.latitude, targetUser.longitude
    )
    
    setRouteInfo(route)
    setIsLoadingRoute(false)
    
    if (route) {
      const allLats = route.coordinates.map(c => c[0])
      const allLngs = route.coordinates.map(c => c[1])
      const centerLat = (Math.max(...allLats) + Math.min(...allLats)) / 2
      const centerLng = (Math.max(...allLngs) + Math.min(...allLngs)) / 2
      setMapCenter({ lat: centerLat, lng: centerLng })
      
      const maxSpread = Math.max(
        Math.max(...allLats) - Math.min(...allLats),
        Math.max(...allLngs) - Math.min(...allLngs)
      )
      
      if (maxSpread > 0.1) setMapZoom(12)
      else if (maxSpread > 0.01) setMapZoom(14)
      else if (maxSpread > 0.001) setMapZoom(16)
      else setMapZoom(17)
      
      setShouldUpdateMap(true)
      setTimeout(() => setShouldUpdateMap(false), 100)
    }
  }, [myLocation, fetchRoute])

  // Stop navigation
  const stopNavigation = useCallback(() => {
    setSelectedUser(null)
    setRouteInfo(null)
    setShowDirections(false)
    if (routeUpdateIntervalRef.current) {
      clearInterval(routeUpdateIntervalRef.current)
      routeUpdateIntervalRef.current = null
    }
  }, [])

  // Update route when navigating
  useEffect(() => {
    if (!selectedUser || !myLocation || !isSharing) return
    
    const updateRoute = async () => {
      const updatedTarget = otherUsersLocations.find(l => l.id === selectedUser.id)
      if (updatedTarget) {
        const route = await fetchRoute(
          myLocation.lat, myLocation.lng,
          updatedTarget.latitude, updatedTarget.longitude
        )
        if (route) {
          setRouteInfo(route)
          setSelectedUser(updatedTarget)
        }
      }
    }
    
    routeUpdateIntervalRef.current = setInterval(updateRoute, 10000)
    
    return () => {
      if (routeUpdateIntervalRef.current) {
        clearInterval(routeUpdateIntervalRef.current)
        routeUpdateIntervalRef.current = null
      }
    }
  }, [selectedUser?.id, myLocation?.lat, myLocation?.lng, isSharing, fetchRoute, otherUsersLocations])

  // Fetch locations
  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch("/api/location")
      if (response.ok) {
        const data = await response.json()
        const locs = data.locations || []
        
        setLocations(locs)
        setUserSite(data.userSite || "Unknown")
        setIsAdmin(data.isAdmin || false)
        setCanShare(data.canShare !== false)
        setLastUpdate(new Date())
        
        // Filter out current user for initial map centering
        const filteredLocs = currentUserId 
          ? locs.filter((loc: UserLocation) => loc.participantId !== currentUserId)
          : locs
        
        if (isFirstLoad && filteredLocs.length > 0) {
          const avgLat = filteredLocs.reduce((sum: number, loc: UserLocation) => sum + loc.latitude, 0) / filteredLocs.length
          const avgLng = filteredLocs.reduce((sum: number, loc: UserLocation) => sum + loc.longitude, 0) / filteredLocs.length
          setMapCenter({ lat: avgLat, lng: avgLng })
          setMapZoom(filteredLocs.length === 1 ? 16 : 12)
          setIsFirstLoad(false)
          setShouldUpdateMap(true)
          setTimeout(() => setShouldUpdateMap(false), 100)
        }
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err)
    } finally {
      setIsLoading(false)
    }
  }, [isFirstLoad, currentUserId])

  // Poll for updates
  useEffect(() => {
    fetchLocations()
    pollIntervalRef.current = setInterval(fetchLocations, 3000)
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current) }
  }, [fetchLocations])

  // Recenter when walking
  useEffect(() => {
    if (myLocation && shouldRecenter && !selectedUser) {
      setMapCenter({ lat: myLocation.lat, lng: myLocation.lng })
      setShouldUpdateMap(true)
      setTimeout(() => setShouldUpdateMap(false), 100)
    }
  }, [myLocation, shouldRecenter, selectedUser])

  // Update server location
  const updateServerLocation = useCallback(async (lat: number, lng: number) => {
    try {
      await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      })
    } catch (err) {
      console.error("Failed to update location:", err)
    }
  }, [])

  // Get location with strategies
  const tryGetLocation = useCallback((
    attempt: number,
    onSuccess: (lat: number, lng: number, accuracy: number) => void,
    onFail: (msg: string) => void
  ) => {
    const strategies: PositionOptions[] = [
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 },
      { enableHighAccuracy: true, timeout: 45000, maximumAge: 30000 },
      { enableHighAccuracy: false, timeout: 60000, maximumAge: 60000 },
    ]

    const options = strategies[Math.min(attempt, strategies.length - 1)]

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        if (accuracy && accuracy > 500) setLowAccuracyWarning(true)
        else setLowAccuracyWarning(false)
        onSuccess(latitude, longitude, accuracy || 0)
      },
      (err) => {
        if (attempt < strategies.length - 1) {
          setTimeout(() => tryGetLocation(attempt + 1, onSuccess, onFail), 1000)
        } else {
          let message = "Failed to get your location."
          switch (err.code) {
            case 1: message = "Location permission denied."; setLocationPermission('denied'); break
            case 2: message = "Location unavailable."; break
            case 3: message = "Location request timed out."; break
          }
          onFail(message)
        }
      },
      options
    )
  }, [])

  // Start sharing
  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported")
      return
    }

    setError(null)
    setIsGettingLocation(true)
    setLowAccuracyWarning(false)

    tryGetLocation(0,
      (latitude, longitude, accuracy) => {
        setMyLocation({ lat: latitude, lng: longitude, accuracy })
        updateServerLocation(latitude, longitude)
        setIsSharing(true)
        setIsGettingLocation(false)
        setLocationPermission('granted')
        setError(null)
        
        setMapCenter({ lat: latitude, lng: longitude })
        setMapZoom(17)
        setShouldUpdateMap(true)
        setTimeout(() => setShouldUpdateMap(false), 100)
        
        if (isMobile) setShouldRecenter(true)

        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords
            setMyLocation({ lat, lng, accuracy: acc })
            updateServerLocation(lat, lng)
            if (acc && acc > 500) setLowAccuracyWarning(true)
          },
          () => {},
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
        )

        updateIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords
              setMyLocation({ lat, lng, accuracy: acc })
              updateServerLocation(lat, lng)
            },
            () => {},
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
          )
        }, 15000)
      },
      (errorMessage) => {
        setError(errorMessage)
        setIsGettingLocation(false)
      }
    )
  }, [tryGetLocation, updateServerLocation, isMobile])

  // Stop sharing
  const stopSharing = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }

    setIsSharing(false)
    setMyLocation(null)
    setShouldRecenter(false)
    setLowAccuracyWarning(false)
    stopNavigation()

    try { await fetch("/api/location", { method: "DELETE" }) } catch {}
  }, [stopNavigation])

  const centerOnMe = useCallback(() => {
    if (myLocation) {
      setMapCenter({ lat: myLocation.lat, lng: myLocation.lng })
      setMapZoom(18)
      setShouldUpdateMap(true)
      setTimeout(() => setShouldUpdateMap(false), 100)
    }
  }, [myLocation])

  const toggleRecenter = useCallback(() => {
    const newValue = !shouldRecenter
    setShouldRecenter(newValue)
    if (newValue && myLocation) {
      setMapCenter({ lat: myLocation.lat, lng: myLocation.lng })
      setMapZoom(17)
      setShouldUpdateMap(true)
      setTimeout(() => setShouldUpdateMap(false), 100)
    }
  }, [shouldRecenter, myLocation])

  const centerOnAll = useCallback(() => {
    const allLocs = myLocation 
      ? [...otherUsersLocations.map(l => ({ lat: l.latitude, lng: l.longitude })), { lat: myLocation.lat, lng: myLocation.lng }]
      : otherUsersLocations.map(l => ({ lat: l.latitude, lng: l.longitude }))
    
    if (allLocs.length > 0) {
      const avgLat = allLocs.reduce((sum, loc) => sum + loc.lat, 0) / allLocs.length
      const avgLng = allLocs.reduce((sum, loc) => sum + loc.lng, 0) / allLocs.length
      setMapCenter({ lat: avgLat, lng: avgLng })
      
      const spread = Math.max(
        Math.max(...allLocs.map(l => l.lat)) - Math.min(...allLocs.map(l => l.lat)),
        Math.max(...allLocs.map(l => l.lng)) - Math.min(...allLocs.map(l => l.lng))
      )
      
      if (allLocs.length === 1) setMapZoom(16)
      else if (spread > 1) setMapZoom(8)
      else if (spread > 0.1) setMapZoom(12)
      else if (spread > 0.01) setMapZoom(14)
      else setMapZoom(16)
      
      setShouldUpdateMap(true)
      setTimeout(() => setShouldUpdateMap(false), 100)
    }
  }, [myLocation, otherUsersLocations])

  const centerOnUser = useCallback((loc: UserLocation) => {
    setMapCenter({ lat: loc.latitude, lng: loc.longitude })
    setMapZoom(18)
    setShouldUpdateMap(true)
    setTimeout(() => setShouldUpdateMap(false), 100)
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current)
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (routeUpdateIntervalRef.current) clearInterval(routeUpdateIntervalRef.current)
    }
  }, [])

  // Memoize my icon
  const myIcon = useMemo(() => {
    if (!leafletLoaded || !myLocation) return null
    return createCustomIcon(
      session?.user?.name ? getInitials(session.user.name) : 'ME', 
      session?.user?.image || undefined,
      true
    )
  }, [leafletLoaded, myLocation, session?.user?.name, session?.user?.image])

  // Count active users: other users + me (only if sharing)
  const totalActiveUsers = otherUsersLocations.length + (isSharing ? 1 : 0)

  if (!leafletLoaded || isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Navigation className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Live Location</CardTitle>
              <CardDescription className="text-xs">
                {isAdmin ? "All sites" : userSite}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {totalActiveUsers}
            </Badge>
            {lastUpdate && (
              <Badge variant="secondary" className="text-xs hidden sm:flex">
                <RefreshCw className="h-3 w-3 mr-1" />
                {lastUpdate.toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Alerts */}
        <div className="px-4 space-y-2">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm flex items-center justify-between">
                <span className="truncate flex-1">{error}</span>
                <Button variant="outline" size="sm" onClick={startSharing} disabled={isGettingLocation} className="h-7 ml-2 flex-shrink-0">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {lowAccuracyWarning && isSharing && (
            <Alert className="py-2">
              <Monitor className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Low accuracy detected. Use mobile for better GPS.
              </AlertDescription>
            </Alert>
          )}

          {locationPermission === 'denied' && canShare && !error && (
            <Alert className="py-2">
              <WifiOff className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Location blocked. Enable in browser settings.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Navigation Panel */}
        {selectedUser && (
          <div className="mx-4 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Route className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200 truncate">
                  To {selectedUser.participantName}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={stopNavigation} className="h-7 w-7 p-0 flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {isLoadingRoute ? (
              <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating...
              </div>
            ) : routeInfo ? (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                  {formatDistance(routeInfo.distance)}
                </Badge>
                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                  {formatDuration(routeInfo.duration)}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setShowDirections(!showDirections)} className="h-6 text-xs ml-auto">
                  {showDirections ? "Hide" : "Steps"}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-red-600 mt-2">Route failed</p>
            )}
            
            {showDirections && routeInfo && routeInfo.steps.length > 0 && (
              <ScrollArea className="h-24 mt-2">
                <div className="space-y-1">
                  {routeInfo.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800 rounded text-xs">
                      <ChevronRight className="h-3 w-3 text-blue-600 flex-shrink-0" />
                      <span className="flex-1 truncate">{step.instruction}</span>
                      <span className="text-muted-foreground flex-shrink-0">{formatDistance(step.distance)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Share Controls */}
        <div className="px-4 py-3">
          {canShare ? (
            <div className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSharing ? 'bg-green-500' : 'bg-muted'}`}>
                  <MapPin className={`h-4 w-4 ${isSharing ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {isGettingLocation ? "Getting location..." : isSharing ? "Sharing" : "Share location"}
                  </p>
                  {isSharing && myLocation && (
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {myLocation.lat.toFixed(4)}, {myLocation.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isSharing && myLocation && (
                  <>
                    <Button variant={shouldRecenter ? "default" : "ghost"} size="sm" onClick={toggleRecenter} className="h-8 w-8 p-0">
                      <Navigation className={`h-4 w-4 ${shouldRecenter ? "" : "text-muted-foreground"}`} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={centerOnMe} className="h-8 w-8 p-0">
                      <Locate className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant={isSharing ? "destructive" : "default"}
                  size="sm"
                  onClick={isSharing ? stopSharing : startSharing}
                  disabled={isGettingLocation}
                  className="h-8 px-3"
                >
                  {isGettingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isSharing ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">View only</span>
            </div>
          )}
        </div>

        {/* Main Layout: Sidebar + Map */}
        <div className="flex flex-col lg:flex-row h-[400px] sm:h-[450px]">
          {/* Sidebar - Users List */}
          <div className={`${showSidebar ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-60 xl:w-64 border-t lg:border-t-0 lg:border-r bg-muted/20 max-h-[200px] lg:max-h-none`}>
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-sm font-medium">Active Users</span>
              <Button variant="ghost" size="sm" onClick={centerOnAll} className="h-7 w-7 p-0">
                <Users className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {/* My Location - Only show when actively sharing */}
                {isSharing && myLocation && (
                  <>
                    <div 
                      className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      onClick={centerOnMe}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-9 w-9 border-2 border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800">
                          <AvatarImage src={session?.user?.image || undefined} />
                          <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
                            {session?.user?.name ? getInitials(session.user.name) : 'ME'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">You</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Sharing</p>
                      </div>
                    </div>
                    {otherUsersLocations.length > 0 && <Separator className="my-2" />}
                  </>
                )}
                
                {/* Other Users - Already filtered */}
                {otherUsersLocations.map((loc) => (
                  <div 
                    key={loc.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.id === loc.id 
                        ? 'bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-300' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => centerOnUser(loc)}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-9 w-9 border-2 border-red-400 ring-2 ring-red-100 dark:ring-red-900/30">
                        <AvatarImage src={loc.avatarUrl} />
                        <AvatarFallback className="bg-red-500 text-white text-xs font-bold">
                          {getInitials(loc.participantName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{loc.participantName}</p>
                      <p className="text-xs text-muted-foreground truncate">{loc.siteName}</p>
                    </div>
                    {myLocation && (
                      <Button 
                        variant={selectedUser?.id === loc.id ? "default" : "ghost"}
                        size="sm" 
                        className="h-7 w-7 p-0 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          selectedUser?.id === loc.id ? stopNavigation() : startNavigation(loc)
                        }}
                      >
                        <Route className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {/* Empty states */}
                {!isSharing && otherUsersLocations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active users</p>
                    <p className="text-xs mt-1">Share your location to appear</p>
                  </div>
                )}

                {isSharing && otherUsersLocations.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-xs">No other users online</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Map */}
          <div className="flex-1 relative min-h-[250px]">
            {/* <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 left-2 z-[1000] lg:hidden h-8 shadow-md"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Users className="h-4 w-4 mr-1" />
              {totalActiveUsers}
            </Button> */}

            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={mapZoom}
              className="h-full w-full"
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapCenterUpdater 
                center={[mapCenter.lat, mapCenter.lng]} 
                zoom={mapZoom} 
                shouldUpdate={shouldUpdateMap}
              />
              
              {/* Route line */}
              {routeInfo && routeInfo.coordinates.length > 1 && (
                <Polyline
                  positions={routeInfo.coordinates}
                  pathOptions={{
                    color: "#3b82f6",
                    weight: 5,
                    opacity: 0.8,
                    dashArray: "10, 10"
                  }}
                />
              )}
              
              {/* My location - BLUE marker - Only when sharing */}
              {isSharing && myLocation && (
                <>
                  <Circle
                    center={[myLocation.lat, myLocation.lng]}
                    radius={Math.min(myLocation.accuracy || 30, 100)}
                    pathOptions={{ 
                      color: "#3b82f6", 
                      fillColor: "#3b82f6", 
                      fillOpacity: 0.15,
                      weight: 2
                    }}
                  />
                  {myIcon && (
                    <Marker position={[myLocation.lat, myLocation.lng]} icon={myIcon}>
                      <Popup>
                        <div className="text-center p-1">
                          <div className="flex items-center justify-center mb-2">
                            <Avatar className="h-12 w-12 border-2 border-blue-500">
                              <AvatarImage src={session?.user?.image || undefined} />
                              <AvatarFallback className="bg-blue-500 text-white font-bold">
                                {session?.user?.name ? getInitials(session.user.name) : 'ME'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <p className="font-semibold text-blue-600">You</p>
                          <p className="text-xs text-gray-500 font-mono mt-1">
                            {myLocation.lat.toFixed(6)}, {myLocation.lng.toFixed(6)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </>
              )}

              {/* Other users - RED markers */}
              {otherUsersLocations.map((loc) => (
                customIcons[loc.id] && (
                  <Marker 
                    key={loc.id} 
                    position={[loc.latitude, loc.longitude]}
                    icon={customIcons[loc.id]}
                  >
                    <Popup>
                      <div className="text-center p-1 min-w-[140px]">
                        <div className="flex items-center justify-center mb-2">
                          <Avatar className="h-12 w-12 border-2 border-red-400">
                            <AvatarImage src={loc.avatarUrl} />
                            <AvatarFallback className="bg-red-500 text-white font-bold">
                              {getInitials(loc.participantName)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <p className="font-semibold text-sm">{loc.participantName}</p>
                        {loc.teamName && <p className="text-xs text-gray-500">{loc.teamName}</p>}
                        <p className="text-xs text-gray-500">{loc.siteName}</p>
                        <p className="text-xs text-gray-400 mt-1 font-mono">
                          {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Footer Legend */}
        <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-blue-500 ring-2 ring-blue-200" />
              <span>You</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-200" />
              <span>Others</span>
            </div>
          </div>
          <span className="hidden sm:inline">Updates every 3s</span>
        </div>
      </CardContent>
    </Card>
  )
}