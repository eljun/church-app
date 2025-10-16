import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Home, Users, FileText, MessageSquare, Book, Newspaper, User2 } from 'lucide-react'

interface MissionaryReportStatsCardsProps {
  stats: {
    totalReports: number
    totalBibleStudies: number
    totalHomeVisits: number
    totalSeminars: number
    totalConferences: number
    totalPublicLectures: number
    totalPamphlets: number
    totalBooks: number
    totalMagazines: number
    totalYouthAnchor: number
  }
}

export function MissionaryReportStatsCards({ stats }: MissionaryReportStatsCardsProps) {
  const totalLiterature = stats.totalPamphlets + stats.totalBooks + stats.totalMagazines
  const totalOutreach = stats.totalSeminars + stats.totalConferences + stats.totalPublicLectures

  const cards = [
    {
      title: 'Total Reports',
      value: stats.totalReports,
      icon: FileText,
      description: 'Reports submitted',
    },
    {
      title: 'Bible Studies',
      value: stats.totalBibleStudies,
      icon: BookOpen,
      description: 'Studies conducted',
    },
    {
      title: 'Home Visits',
      value: stats.totalHomeVisits,
      icon: Home,
      description: 'Visits made',
    },
    {
      title: 'Outreach Events',
      value: totalOutreach,
      icon: Users,
      description: `${stats.totalSeminars} seminars, ${stats.totalConferences} conferences, ${stats.totalPublicLectures} lectures`,
    },
    {
      title: 'Literature Distributed',
      value: totalLiterature,
      icon: Book,
      description: `${stats.totalPamphlets} pamphlets, ${stats.totalBooks} books, ${stats.totalMagazines} magazines`,
    },
    {
      title: 'Youth Anchor',
      value: stats.totalYouthAnchor,
      icon: User2,
      description: 'Youth activities',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
