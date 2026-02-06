import { useState, useEffect } from 'react'
import { MapPin, Phone, User, MessageSquare, Upload, X } from 'lucide-react'
import { useUserStore } from '../../stores/userStore'
import { useCartStore } from '../../stores/cartStore'
import { useOrderStore } from '../../stores/orderStore'
import { supabase, uploadPaymentSlip, sendLineNotification } from '../../lib/supabase'
import { formatCurrency } from '../../lib/formatters'

export default function CheckoutForm({ onClose, onSuccess }) {
  const { user, profile } = useUserStore()
  const { items, getTotal, clearCart } = useCartStore()
  const { createOrder } = useOrderStore()
  
  const [formData, setFormData] = useState({
    customer_name: profile?.full_name || '',
    customer_phone: profile?.phone || '',
    customer_address: '',
    customer_lat: null,
    customer_lng: null,
    notes: ''
  })
  
  const [shippingFee, setShippingFee] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  
  useEffect(() => {
    calculateShipping()
  }, [formData.customer_lat, formData.customer_lng])
  
  const calculateShipping = async () => {
    if (formData.customer_lat && formData.customer_lng) {
      const { data } = await supabase.rpc('calculate_shipping_fee', {
        p_customer_lat: formData.customer_lat,
        p_customer_lng: formData.customer_lng
      })
      
      setShippingFee(data || 0)
    } else {
      // Fallback to flat rate
      const { data: settings } = await supabase
        .from('store_settings')
        .select('flat_shipping_fee')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single()
      
      setShippingFee(settings?.flat_shipping_fee || 50)
    }
  }
  
  const getCurrentLocation = () => {
    setLoadingLocation(true)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            customer_lat: position.coords.latitude,
            customer_lng: position.coords.longitude
          }))
          setLoadingLocation(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('ไม่สามารถรับตำแหน่งได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง')
          setLoadingLocation(false)
        }
      )
    } else {
      alert('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง')
      setLoadingLocation(false)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const subtotal = getTotal()
      const total = subtotal + shippingFee
      
      const orderData = {
        customer_id: user.id,
        ...formData,
        subtotal,
        shipping_fee: shippingFee,
        total
      }
      
      const orderItems = items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }))
      
      const { data: orderId, error } = await createOrder(orderData, orderItems)
      
      if (error) throw error
      
      // Send LINE notification
      try {
        await sendLineNotification({
          orderId,
          orderNumber: `ORD-${Date.now()}`,
          customerName: formData.customer_name,
          customerPhone: formData.customer_phone,
          total,
          items: orderItems,
          action: 'new_order'
        })
      } catch (lineError) {
        console.error('LINE notification error:', lineError)
      }
      
      clearCart()
      onSuccess(orderId)
      onClose()
      
    } catch (error) {
      console.error('Order creation error:', error)
      alert('เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ')
    } finally {
      setLoading(false)
    }
  }
  
  const subtotal = getTotal()
  const total = subtotal + shippingFee
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">ข้อมูลการสั่งซื้อ</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <User size={18} />
              ชื่อ-นามสกุล *
            </label>
            <input
              type="text"
              required
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Phone size={18} />
              เบอร์โทรศัพท์ *
            </label>
            <input
              type="tel"
              required
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          {/* Address */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <MapPin size={18} />
              ที่อยู่จัดส่ง *
            </label>
            <textarea
              required
              rows={3}
              value={formData.customer_address}
              onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          {/* Location */}
          <div>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={loadingLocation}
              className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              <MapPin size={18} />
              {loadingLocation ? 'กำลังระบุตำแหน่ง...' : 'ระบุตำแหน่งปัจจุบัน (คำนวณค่าส่งแม่นยำ)'}
            </button>
            {formData.customer_lat && (
              <p className="text-sm text-gray-600 mt-2">
                ✓ ได้รับตำแหน่งแล้ว ({formData.customer_lat.toFixed(6)}, {formData.customer_lng.toFixed(6)})
              </p>
            )}
          </div>
          
          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <MessageSquare size={18} />
              หมายเหตุ
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ข้อความถึงร้านค้า (ถ้ามี)"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>ราคาสินค้า</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>ค่าจัดส่ง</span>
              <span>{formatCurrency(shippingFee)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-lg font-bold">
              <span>ยอดรวมทั้งหมด</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
          
          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? 'กำลังสร้างคำสั่งซื้อ...' : 'ยืนยันการสั่งซื้อ'}
          </button>
        </form>
      </div>
    </div>
  )
}
