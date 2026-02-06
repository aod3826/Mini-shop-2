import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useUserStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,
  
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      set({ user: session.user, profile, loading: false })
    } else {
      set({ loading: false })
    }
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        set({ user: session.user, profile })
      } else {
        set({ user: null, profile: null })
      }
    })
  },
  
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },
  
  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        role: 'customer'
      })
    }
    
    return { data, error }
  },
  
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  }
}))
