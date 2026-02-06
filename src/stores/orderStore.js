import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useOrderStore = create((set, get) => ({
  orders: [],
  loading: false,
  
  fetchOrders: async (userId = null) => {
    set({ loading: true })
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          product_price,
          quantity,
          subtotal
        )
      `)
      .order('created_at', { ascending: false })
    
    if (userId) {
      query = query.eq('customer_id', userId)
    }
    
    const { data, error } = await query
    
    if (!error) {
      set({ orders: data })
    }
    
    set({ loading: false })
    return { data, error }
  },
  
  createOrder: async (orderData, items) => {
    const { data, error } = await supabase.rpc('create_order_with_items', {
      p_order_data: orderData,
      p_items: items
    })
    
    if (!error) {
      await get().fetchOrders(orderData.customer_id)
    }
    
    return { data, error }
  },
  
  updateOrderStatus: async (orderId, status) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId)
      .select()
      .single()
    
    if (!error) {
      set({
        orders: get().orders.map(order =>
          order.id === orderId ? { ...order, ...data } : order
        )
      })
    }
    
    return { data, error }
  }
}))
