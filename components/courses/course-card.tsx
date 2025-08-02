import type { Course } from "@/services/courses-service"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Star, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/course/${course.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <div className="relative h-48 w-full">
          <Image src={course.cover || "/placeholder.svg"} alt={course.title} fill className="object-cover" />
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              {course.level}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
              {course.ratings.average_rating}
            </div>
          </div>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0">
          <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {course.total_video_duration_minutes}min
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {course.total_classes} clases
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
