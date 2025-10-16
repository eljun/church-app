import { redirect } from 'next/navigation'

export default function SettingsPage() {
  // Redirect directly to user settings
  redirect('/settings/users')
}
