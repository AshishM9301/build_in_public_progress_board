"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle, Circle, XCircle, TrendingUp } from "lucide-react"
import { api } from "@/trpc/react"
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns"

export function StreakCalendar() {
  const { data: streakCalendar } = api.streak.getStreakCalendar.useQuery()
  const { data: streakProgress } = api.streak.getStreakProgress.useQuery()

  if (!streakCalendar || !streakProgress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Streak Calendar
          </CardTitle>
          <CardDescription>Loading streak calendar...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))

  const getDayStatus = (date: Date) => {
    const day = streakCalendar.weeks.flat().find(d => 
      isSameDay(new Date(d.targetDate), date)
    )
    
    if (!day) return 'future'
    if (day.isPosted) return 'posted'
    if (day.isToday) return 'today'
    if (day.isPast && !day.isPosted) return 'missed'
    return 'future'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'missed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'today':
        return <Circle className="h-4 w-4 text-blue-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-300" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'today':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Streak Calendar
        </CardTitle>
        <CardDescription>
          Track your daily posting progress
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Streak Summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium">Current Streak</div>
              <div className="text-sm text-muted-foreground">
                {streakProgress.currentStreak} days
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {streakProgress.progressPercentage}%
          </Badge>
        </div>

        {/* Week Calendar */}
        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="p-2">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((date, index) => {
              const status = getDayStatus(date)
              const isCurrentDay = isToday(date)
              
              return (
                <div
                  key={index}
                  className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-colors ${
                    isCurrentDay ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium mb-1">
                      {format(date, 'd')}
                    </div>
                    {getStatusIcon(status)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Legend</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Posted</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-3 w-3 text-red-500" />
              <span>Missed</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 text-blue-600" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 text-gray-300" />
              <span>Future</span>
            </div>
          </div>
        </div>

        {/* Streak Stats */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Longest Streak</div>
              <div className="text-muted-foreground">{streakProgress.longestStreak} days</div>
            </div>
            <div>
              <div className="font-medium">Total Posts</div>
              <div className="text-muted-foreground">{streakProgress.totalPosts}</div>
            </div>
            <div>
              <div className="font-medium">Challenges Completed</div>
              <div className="text-muted-foreground">{streakProgress.challengesCompleted}</div>
            </div>
            <div>
              <div className="font-medium">Remaining Days</div>
              <div className="text-muted-foreground">{streakProgress.remainingDays}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {streakProgress.isCompleted && (
          <div className="pt-2 border-t">
            <Button className="w-full" variant="outline">
              Start New Challenge
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
