import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Image as ImageIcon, Eye } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface ProgressPost {
  id: string
  content: string
  createdAt: Date
  imageUrl?: string | null
  imageFilename?: string | null
  imageSize?: number | null
  imageMimeType?: string | null
  imageWidth?: number | null
  imageHeight?: number | null
  imageUploadedAt?: Date | null
  streakDay: {
    dayNumber: number
  }
}

interface ProgressPostCardProps {
  post: ProgressPost
  projectName: string
}

export function ProgressPostCard({ post, projectName }: ProgressPostCardProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {formatDate(post.createdAt)}
            </span>
          </div>
          <Badge variant="secondary">
            Day {post.streakDay.dayNumber}
          </Badge>
        </div>
        <CardTitle className="text-lg">{projectName}</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Content */}
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Image Section */}
        {post.imageUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Progress Image</span>
            </div>
            
            <div className="relative group">
              <img
                src={post.imageUrl}
                alt={post.imageFilename || "Progress image"}
                className="w-full h-48 object-cover rounded-lg border cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => setIsImageModalOpen(true)}
              />
              
              {/* Overlay with view button */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsImageModalOpen(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Size
                </Button>
              </div>
            </div>

            {/* Image Metadata */}
            <div className="text-xs text-muted-foreground space-y-1">
              {post.imageFilename && (
                <p>Filename: {post.imageFilename}</p>
              )}
              {post.imageSize && (
                <p>Size: {formatFileSize(post.imageSize)}</p>
              )}
              {post.imageWidth && post.imageHeight && (
                <p>Dimensions: {post.imageWidth} × {post.imageHeight}</p>
              )}
              {post.imageMimeType && (
                <p>Type: {post.imageMimeType}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Image Modal */}
      {post.imageUrl && (
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <div className="relative">
              <img
                src={post.imageUrl}
                alt={post.imageFilename || "Progress image"}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              
              {/* Image Info */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {post.imageFilename && (
                    <div>
                      <span className="font-medium">Filename:</span> {post.imageFilename}
                    </div>
                  )}
                  {post.imageSize && (
                    <div>
                      <span className="font-medium">Size:</span> {formatFileSize(post.imageSize)}
                    </div>
                  )}
                  {post.imageWidth && post.imageHeight && (
                    <div>
                      <span className="font-medium">Dimensions:</span> {post.imageWidth} × {post.imageHeight}
                    </div>
                  )}
                  {post.imageMimeType && (
                    <div>
                      <span className="font-medium">Type:</span> {post.imageMimeType}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
