import { notFound } from 'next/navigation'
import { getChurchById } from '@/lib/queries/churches'
import { ChurchForm } from '@/components/churches/church-form'

interface EditChurchPageProps {
  params: Promise<{ id: string }>
}

export default async function EditChurchPage({ params }: EditChurchPageProps) {
  const { id } = await params

  try {
    const church = await getChurchById(id)

    // Convert church data to match the form's expected format
    const initialData = {
      id: church.id,
      name: church.name,
      field: church.field,
      district: church.district,
      city: church.city,
      province: church.province,
      address: church.address,
      latitude: church.latitude,
      longitude: church.longitude,
      image_url: church.image_url,
      images: church.images || [],
      is_active: church.is_active,
      established_date: church.established_date,
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-primary ">Edit Church</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update church information for {church.name}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-primary/20 p-6">
          <ChurchForm mode="edit" initialData={initialData} />
        </div>
      </div>
    )
  } catch {
    notFound()
  }
}
