// ============================================
// LINE MESSAGING API - FLEX MESSAGE SENDER
// Security: Channel Access Token in Environment
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface OrderNotification {
  orderId: string
  orderNumber: string
  customerName: string
  customerPhone: string
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  action?: 'new_order' | 'payment_verified' | 'status_update'
  status?: string
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // Get request body
    const body: OrderNotification = await req.json()
    
    // Fetch store settings for LINE token
    const { data: settings, error: settingsError } = await supabase
      .from('store_settings')
      .select('line_channel_access_token, line_notify_enabled')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()
    
    if (settingsError || !settings?.line_notify_enabled || !settings?.line_channel_access_token) {
      return new Response(
        JSON.stringify({ error: 'LINE notification not configured' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Create Flex Message based on action
    const flexMessage = createFlexMessage(body)
    
    // Send LINE message (Note: You need to configure LINE bot and get user/group ID)
    // For this example, we'll send to a configured admin LINE ID
    // In production, you should store LINE user IDs in the database
    
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.line_channel_access_token}`
      },
      body: JSON.stringify({
        // Replace with actual LINE user ID from database
        to: 'USER_ID_FROM_DATABASE', 
        messages: [flexMessage]
      })
    })
    
    if (!lineResponse.ok) {
      const errorText = await lineResponse.text()
      
      // Log to activity_logs
      await supabase.from('activity_logs').insert({
        type: 'line_notification_failed',
        order_id: body.orderId,
        message: 'Failed to send LINE notification',
        metadata: { error: errorText }
      })
      
      throw new Error(`LINE API error: ${errorText}`)
    }
    
    // Log success
    await supabase.from('activity_logs').insert({
      type: 'line_notification_sent',
      order_id: body.orderId,
      message: `LINE notification sent for ${body.action}`,
      metadata: body
    })
    
    return new Response(
      JSON.stringify({ success: true, orderId: body.orderId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function createFlexMessage(data: OrderNotification) {
  const actionColor = data.action === 'new_order' ? '#17c964' : 
                      data.action === 'payment_verified' ? '#0070f0' : '#f5a524'
  
  const actionText = data.action === 'new_order' ? '🆕 คำสั่งซื้อใหม่' :
                     data.action === 'payment_verified' ? '✅ ชำระเงินแล้ว' : 
                     '📦 อัพเดทสถานะ'
  
  return {
    type: 'flex',
    altText: `${actionText}: ${data.orderNumber}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: actionText,
            weight: 'bold',
            color: '#ffffff',
            size: 'lg'
          }
        ],
        backgroundColor: actionColor,
        paddingAll: '15px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: data.orderNumber,
            weight: 'bold',
            size: 'xl',
            margin: 'none'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: 'ลูกค้า',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: data.customerName,
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5
                  }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: 'โทร',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: data.customerPhone,
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5
                  }
                ]
              },
              {
                type: 'separator',
                margin: 'md'
              },
              {
                type: 'text',
                text: 'รายการสินค้า',
                weight: 'bold',
                size: 'sm',
                margin: 'md'
              },
              ...data.items.map(item => ({
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: `${item.name} x${item.quantity}`,
                    wrap: true,
                    color: '#666666',
                    size: 'xs',
                    flex: 0
                  }
                ]
              })),
              {
                type: 'separator',
                margin: 'md'
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: 'ยอดรวม',
                    weight: 'bold',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: `฿${data.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
                    wrap: true,
                    weight: 'bold',
                    color: actionColor,
                    size: 'sm',
                    flex: 5,
                    align: 'end'
                  }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '🔍 ดูรายละเอียด',
              uri: `${SUPABASE_URL.replace('.supabase.co', '')}/admin#order-${data.orderId}`
            },
            color: actionColor
          },
          ...(data.action === 'new_order' ? [{
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '✅ ยืนยันคำสั่งซื้อ',
              uri: `${SUPABASE_URL.replace('.supabase.co', '')}/admin/confirm/${data.orderId}`
            }
          }] : [])
        ],
        flex: 0
      }
    }
  }
}
