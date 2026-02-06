import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/formatters'
import { FileText, AlertCircle, CheckCircle, Info } from 'lucide-react'

const TYPE_CONFIG = {
  order_created: { icon: FileText, color: 'text-primary', label: 'สร้างออเดอร์' },
  payment_verified: { icon: CheckCircle, color: 'text-success', label: 'ตรวจสลิปสำเร็จ' },
  payment_verification_failed: { icon: AlertCircle, color: 'text-danger', label: 'ตรวจสลิปล้มเหลว' },
  line_notification_sent: { icon: CheckCircle, color: 'text-success', label: 'ส่ง LINE สำเร็จ' },
  line_notification_failed: { icon: AlertCircle, color: 'text-danger', label: 'ส่ง LINE ล้มเหลว' }
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchLogs()
  }, [])
  
  const fetchLogs = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    
    setLogs(data || [])
    setLoading(false)
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Activity Logs</h2>
      
      <div className="bg-white rounded-lg shadow-md divide-y">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">ไม่มี Activity Logs</div>
        ) : (
          logs.map(log => {
            const config = TYPE_CONFIG[log.type] || { icon: Info, color: 'text-gray-600', label: log.type }
            const Icon = config.icon
            
            return (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start gap-3">
                  <Icon className={config.color} size={20} />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{config.label}</span>
                      <span className="text-sm text-gray-500">{formatDate(log.created_at)}</span>
                    </div>
                    
                    <p className="text-sm text-gray-700">{log.message}</p>
                    
                    {log.metadata && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          Metadata
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
