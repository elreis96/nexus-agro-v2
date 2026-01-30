import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Cloud, TrendingUp, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';

interface RealtimeWeather {
  current: {
    temperature: number;
    precipitation: number;
    weather_code: number;
    time: string;
  };
  location: {
    name: string;
  };
}

interface RealtimeMarket {
  timestamp: string;
  market: {
    dolar: { value: number; source: string };
    jbs: { value: number; source: string };
    boi_gordo: { value: number; source: string };
  };
}

export function RealtimeDataPanel() {
  const [weather, setWeather] = useState<RealtimeWeather | null>(null);
  const [market, setMarket] = useState<RealtimeMarket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchRealtimeData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Buscando dados em tempo real...');
      // Disparar coleta combinada no backend
      const combined = await apiClient.refreshRealtime();
      console.log('✅ Dados recebidos:', combined);

      setWeather(combined.weather);
      setMarket(combined.market);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Erro ao buscar dados em tempo real:', error);
      setError('Não foi possível carregar clima e cotações em tempo real agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchRealtimeData();
      }, 5 * 60 * 1000); // 5 minutos

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Buscar dados inicialmente
  useEffect(() => {
    fetchRealtimeData();
  }, []);

  const getWeatherIcon = (code: number) => {
    // WMO Weather codes
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '☁️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '🌨️';
    if (code <= 82) return '⛈️';
    return '🌩️';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dados em Tempo Real</h3>
          <p className="text-sm text-muted-foreground">
            {lastUpdate ? (
              <>Última atualização: {format(lastUpdate, 'dd/MM/yyyy HH:mm:ss')}</>
            ) : (
              'Carregando...'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 Auto (5min)' : 'Manual'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRealtimeData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-red-500">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Erro ao carregar dados</p>
                <p className="text-xs text-red-400 mt-1">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Verifique a conexão com o backend e tente novamente em instantes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Card de Clima */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cloud className="h-5 w-5 text-blue-500" />
              Clima Atual - Mato Grosso
              <Badge variant="outline" className="ml-auto">
                OpenMeteo API
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weather ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-4xl">
                    {getWeatherIcon(weather.current.weather_code)}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      {weather.current.temperature.toFixed(1)}°C
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Temperatura
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Precipitação</span>
                    <span className="font-semibold">
                      {weather.current.precipitation.toFixed(1)} mm
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  📍 {weather.location.name}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Carregando dados climáticos...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Mercado */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Cotações de Mercado
              <Badge variant="outline" className="ml-auto">
                Live APIs
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {market ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <div>
                    <div className="text-sm text-muted-foreground">Dólar (USD/BRL)</div>
                    <div className="text-xs text-muted-foreground/70">{market.market.dolar.source}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      R$ {market.market.dolar.value.toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <div>
                    <div className="text-sm text-muted-foreground">JBS (JBSS3.SA)</div>
                    <div className="text-xs text-muted-foreground/70">{market.market.jbs.source}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      R$ {market.market.jbs.value.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Boi Gordo (R$/@)</div>
                    <div className="text-xs text-muted-foreground/70">{market.market.boi_gordo.source}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-orange-600">
                      R$ {market.market.boi_gordo.value.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Carregando cotações...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Avisos */}
      <Card className="border-orange-500/30 bg-orange-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">ℹ️ Sobre as fontes de dados:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Clima</strong>: OpenMeteo API (grátis, sem necessidade de chave)</li>
                <li><strong>Dólar</strong>: Banco Central do Brasil (PTAX oficial)</li>
                <li><strong>JBS</strong>: Yahoo Finance (cotação B3 em tempo real)</li>
                <li><strong>Boi Gordo</strong>: CEPEA/USP (não tem API pública - usa cache)</li>
              </ul>
              <p className="pt-2 text-xs">
                💡 <strong>Dica</strong>: Ative "Auto (5min)" para atualização automática a cada 5 minutos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
