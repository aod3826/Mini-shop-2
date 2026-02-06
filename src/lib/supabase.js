import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper: Upload payment slip
export async function uploadPaymentSlip(file, orderId) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${orderId}-${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { data, error } = await supabase.storage
    .from('payments')
    .upload(filePath, file)

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('payments')
    .getPublicUrl(filePath)

  return publicUrl
}

// Helper: Call Edge Function
export async function sendLineNotification(orderData) {
  const { data, error } = await supabase.functions.invoke('line-notify', {
    body: orderData
  })
  
  if (error) throw error
  return data
}
