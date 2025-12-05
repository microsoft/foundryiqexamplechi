import { redirect } from 'next/navigation'

// This route has been deprecated in favor of /knowledge. Redirect permanently.
export default function Page() {
  redirect('/knowledge')
  return null
}