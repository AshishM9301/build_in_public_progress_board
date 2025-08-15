"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, Target, Award } from "lucide-react"
import { api } from "@/trpc/react"

export function BadgeShowcase() {
  const { data: badgeProgress } = api.badge.getBadgeProgress.useQuery()
  const { data: recentBadges } = api.badge.getRecentBadges.useQuery()

  if (!badgeProgress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Badges
          </CardTitle>
          <CardDescription>Loading badges...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const earnedBadges = badgeProgress.badgeProgress.filter(b => b.isEarned)
  const upcomingBadges = badgeProgress.badgeProgress.filter(b => !b.isEarned && b.isEligible)
  const lockedBadges = badgeProgress.badgeProgress.filter(b => !b.isEarned && !b.isEligible)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Badges & Achievements
        </CardTitle>
        <CardDescription>
          {earnedBadges.length} of {badgeProgress.totalBadges} earned
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800">Overall Progress</span>
            </div>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {Math.round((earnedBadges.length / badgeProgress.totalBadges) * 100)}%
            </Badge>
          </div>
          <Progress 
            value={(earnedBadges.length / badgeProgress.totalBadges) * 100} 
            className="h-2 bg-amber-200"
          />
        </div>

        {/* Recently Earned Badges */}
        {recentBadges && recentBadges.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Recently Earned</div>
            <div className="space-y-2">
              {recentBadges.slice(0, 3).map((userBadge) => (
                <div key={userBadge.id} className="flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-200">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Award className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-green-800 text-sm">
                      {userBadge.badge?.name}
                    </div>
                    <div className="text-xs text-green-600 truncate">
                      {userBadge.badge?.description}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    {new Date(userBadge.earnedAt).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Badges */}
        {upcomingBadges.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Almost There!</div>
            <div className="space-y-2">
              {upcomingBadges.slice(0, 2).map((badge) => (
                <div key={badge.badge.id} className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800 text-sm">
                        {badge.badge.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {badge.progress}/{badge.badge.criteria}
                    </Badge>
                  </div>
                  <div className="text-xs text-blue-600 mb-2">
                    {badge.badge.description}
                  </div>
                  <Progress 
                    value={(badge.progress / badge.badge.criteria) * 100} 
                    className="h-1.5 bg-blue-200"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Badges Preview */}
        {lockedBadges.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Future Goals</div>
            <div className="grid grid-cols-2 gap-2">
              {lockedBadges.slice(0, 4).map((badge) => (
                <div key={badge.badge.id} className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-center">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-1">
                    <Trophy className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="text-xs font-medium text-gray-600 truncate">
                    {badge.badge.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {badge.badge.criteria} days
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badge Stats */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Current Streak</div>
              <div className="text-muted-foreground">{badgeProgress.currentStreak} days</div>
            </div>
            <div>
              <div className="font-medium">Next Badge</div>
              <div className="text-muted-foreground">
                {upcomingBadges.length > 0 
                  ? upcomingBadges[0].badge.name 
                  : "All earned!"
                }
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
