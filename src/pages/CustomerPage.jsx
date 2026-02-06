import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Header from '../components/shared/Header'
import ProductCard from '../components/customer/ProductCard'
import CartDrawer from '../components/customer/CartDrawer'
import CheckoutForm from '../components/customer/CheckoutForm'
import LoadingSpinner from '../components/shared/LoadingSpinner'

export default function CustomerPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  
  useEffect(() => {
    fetchProducts()
  }, [])
  
  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    setProducts(data || [])
    setLoading(false)
  }
  
  if (loading) return <LoadingSpinner />
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCartClick={() => setCartOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">สินค้าทั้งหมด</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            ยังไม่มีสินค้า
          </div>
        )}
      </main>
      
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false)
          setCheckoutOpen(true)
        }}
      />
      
      {checkoutOpen && (
        <CheckoutForm
          onClose={() => setCheckoutOpen(false)}
          onSuccess={(orderId) => {
            alert('สร้างคำสั่งซื้อสำเร็จ!')
          }}
        />
      )}
    </div>
  )
}
