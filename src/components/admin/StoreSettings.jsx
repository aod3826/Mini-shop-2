import { useState, useEffect } from 'react'
import { Save, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function StoreSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    fetchSettings()
  }, [])
  
  const fetchSettings = async () => {
    const { data } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()
    
    setSettings(data)
    setLoading(false)
  }
  
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    const { error } = await supabase
      .from('store_settings')
      .update(settings)
      .eq('id', '00000000-0000-0000-0000-000000000001')
    
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      alert('บันทึกการตั้งค่าเรียบร้อย')
    }
    
    setSaving(false)
  }
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">ตั้งค่าร้านค้า</h2>
      
      <form onSubmit={handleSave} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">ชื่อร้าน</label>
          <input
            type="text"
            value={settings.store_name}
            onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">เบอร์โทรร้าน</label>
          <input
            type="tel"
            value={settings.store_phone}
            onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">ที่อยู่ร้าน</label>
          <textarea
            value={settings.store_address}
            onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            rows={3}
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Latitude</label>
            <input
              type="number"
              step="0.000001"
              value={settings.store_lat}
              onChange={(e) => setSettings({ ...settings, store_lat: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Longitude</label>
            <input
              type="number"
              step="0.000001"
              value={settings.store_lng}
              onChange={(e) => setSettings({ ...settings, store_lng: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">การคำนวณค่าจัดส่ง</h3>
          
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="use_distance"
              checked={settings.use_distance_shipping}
              onChange={(e) => setSettings({ ...settings, use_distance_shipping: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="use_distance" className="text-sm">
              คำนวณค่าส่งตามระยะทาง (Haversine Formula)
            </label>
          </div>
          
          {settings.use_distance_shipping ? (
            <div>
              <label className="block text-sm font-medium mb-2">ค่าส่งต่อกิโลเมตร (บาท)</label>
              <input
                type="number"
                step="0.01"
                value={settings.shipping_per_km}
                onChange={(e) => setSettings({ ...settings, shipping_per_km: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">ค่าส่งคงที่ (บาท)</label>
              <input
                type="number"
                step="0.01"
                value={settings.flat_shipping_fee}
                onChange={(e) => setSettings({ ...settings, flat_shipping_fee: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>
        
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">LINE Messaging API</h3>
          
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="line_enabled"
              checked={settings.line_notify_enabled}
              onChange={(e) => setSettings({ ...settings, line_notify_enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="line_enabled" className="text-sm">
              เปิดใช้งานการแจ้งเตือนผ่าน LINE
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Channel Access Token</label>
            <input
              type="password"
              value={settings.line_channel_access_token || ''}
              onChange={(e) => setSettings({ ...settings, line_channel_access_token: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Channel Access Token จาก LINE Developers"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </form>
    </div>
  )
}
