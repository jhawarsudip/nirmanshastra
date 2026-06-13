import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const cookieStore = await cookies()
  if (cookieStore.get('adminSession')?.value !== 'valid') {
    redirect('/')
  }
  return <AdminDashboard />
}
