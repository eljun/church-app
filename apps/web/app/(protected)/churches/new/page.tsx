import { ChurchForm } from '@/components/churches/church-form'

export default async function NewChurchPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">Add New Church</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new church record in the system
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border p-6">
        <ChurchForm mode="create" />
      </div>
    </div>
  )
}
