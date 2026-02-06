import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 24 }) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="animate-spin text-primary" size={size} />
    </div>
  )
}
