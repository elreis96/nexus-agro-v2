import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertEmailRequest {
  alerts: {
    title: string;
    description: string;
    level: 'info' | 'warning' | 'critical';
    category: string;
  }[];
  recipientEmail: string;
  recipientName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          error: "Email service not configured",
          message: "RESEND_API_KEY is required. Please add it in the secrets configuration."
        }),
        { 
          status: 503, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const { alerts, recipientEmail, recipientName }: AlertEmailRequest = await req.json();

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No alerts provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Recipient email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Filter only critical alerts
    const criticalAlerts = alerts.filter(a => a.level === 'critical');
    
    if (criticalAlerts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No critical alerts to send" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Build email HTML
    const alertsHtml = criticalAlerts.map(alert => `
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 12px; border-radius: 4px;">
        <h3 style="margin: 0 0 8px 0; color: #dc2626; font-size: 16px;">${alert.title}</h3>
        <p style="margin: 0; color: #374151; font-size: 14px;">${alert.description}</p>
        <span style="display: inline-block; margin-top: 8px; font-size: 12px; color: #6b7280; text-transform: uppercase;">
          ${alert.category}
        </span>
      </div>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Alertas Críticos - AgroData Nexus</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #d4af37; font-size: 24px;">⚠️ Alertas Críticos</h1>
            <p style="margin: 8px 0 0; color: #9ca3af; font-size: 14px;">AgroData Nexus - Verde Futuro Capital</p>
          </div>
          
          <div style="padding: 24px;">
            <p style="color: #374151; font-size: 14px; margin-bottom: 20px;">
              Olá${recipientName ? ` ${recipientName}` : ''},
            </p>
            <p style="color: #374151; font-size: 14px; margin-bottom: 20px;">
              Foram detectados <strong>${criticalAlerts.length}</strong> alerta(s) crítico(s) que requerem sua atenção:
            </p>
            
            ${alertsHtml}
            
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <a href="${Deno.env.get("SITE_URL") || "https://agrodata.lovable.app"}/dashboard" 
                 style="display: inline-block; background: #d4af37; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Ver Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 16px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              © 2026 Verde Futuro Capital - AgroData Nexus
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "AgroData Nexus <alerts@resend.dev>",
      to: [recipientEmail],
      subject: `⚠️ ${criticalAlerts.length} Alerta(s) Crítico(s) - AgroData Nexus`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse.data }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending alert email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
