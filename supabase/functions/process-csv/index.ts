// Supabase Edge Function para processar CSV
// Deploy: supabase functions deploy process-csv

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    
    const text = await file.text()
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const records = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      
      if (type === 'mercado') {
        records.push({
          data_fk: cleanDate(values[0]),
          valor_dolar: cleanNumber(values[1]),
          valor_jbs: cleanNumber(values[2]),
          valor_boi_gordo: cleanNumber(values[3])
        })
      } else {
        records.push({
          data_fk: cleanDate(values[0]),
          chuva_mm: cleanNumber(values[1]),
          temp_max: cleanNumber(values[2]),
          localizacao: values[3] || 'SP'
        })
      }
    }
    
    const table = type === 'mercado' ? 'fact_mercado' : 'fact_clima'
    const { error } = await supabase.from(table).insert(records)
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ success: records.length, errors: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function cleanNumber(val: string): number | null {
  if (!val) return null
  const cleaned = val.replace(/[^\d.,-]/g, '').replace('.', '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : Math.round(num * 10000) / 10000
}

function cleanDate(val: string): string {
  // Implementar parsing de data
  return val.trim()
}
