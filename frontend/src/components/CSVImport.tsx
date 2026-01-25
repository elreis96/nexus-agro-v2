import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/api-client";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { format, parse, isValid } from "date-fns";

interface CSVImportProps {
  type: "mercado" | "clima";
}

// Feature flag: Use FastAPI backend or Supabase direct
const USE_FASTAPI = import.meta.env.VITE_USE_FASTAPI === "true";

export function CSVImport({ type }: CSVImportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    errors: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Column mapping - accepts multiple formats
  const columnAliases: Record<string, string[]> = {
    data: ["data", "Date", "date", "data_fk"],
    valor_dolar: ["valor_dolar", "Dolar", "dolar", "USD"],
    valor_jbs: ["valor_jbs", "JBS", "jbs"],
    valor_boi_gordo: ["valor_boi_gordo", "Boi_Gordo", "boi_gordo", "boi"],
    temp_max: ["temp_max", "Temp_Max", "temperatura_max", "temp"],
    chuva_mm: ["chuva_mm", "Chuva_mm", "chuva", "precipitacao"],
    localizacao: ["localizacao", "local", "location", "cidade"],
  };

  // Clean and normalize text
  const cleanText = (text: string): string => {
    return text
      .trim()
      .replace(/^["']|["']$/g, "") // Remove quotes
      .replace(/\s+/g, " "); // Normalize whitespace
  };

  // Parse and clean number with strict validation
  const parseNumber = (value: string): number | null => {
    if (!value || value === "" || value.toLowerCase() === "null") {
      return null;
    }

    // Remove all non-numeric characters except digits, dot, comma, and minus
    const cleaned = cleanText(value)
      .replace(/[^\d.,-]/g, "")
      .trim();

    // Handle different number formats
    let normalized = cleaned;

    // If has both dot and comma, assume dot is thousand separator
    if (cleaned.includes(".") && cleaned.includes(",")) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    }
    // If has only comma, assume it's decimal separator
    else if (cleaned.includes(",")) {
      normalized = cleaned.replace(",", ".");
    }
    // If has multiple dots, remove all but last (thousand separators)
    else if ((cleaned.match(/\./g) || []).length > 1) {
      const parts = cleaned.split(".");
      normalized = parts.slice(0, -1).join("") + "." + parts[parts.length - 1];
    }

    const num = parseFloat(normalized);

    // Validate number is reasonable for database (precision 18, scale 4)
    // Max value: 99,999,999,999,999.9999
    if (isNaN(num) || Math.abs(num) >= 1e14) {
      console.warn(`Invalid number: ${value} -> ${normalized} -> ${num}`);
      return null;
    }

    // Round to 4 decimal places to match database precision
    return Math.round(num * 10000) / 10000;
  };

  // Parse date with multiple format support
  const parseDate = (dateStr: string): string | null => {
    const cleaned = cleanText(dateStr);
    const formats = ["yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "dd-MM-yyyy"];

    for (const fmt of formats) {
      try {
        const parsed = parse(cleaned, fmt, new Date());
        if (isValid(parsed)) {
          return format(parsed, "yyyy-MM-dd");
        }
      } catch {
        continue;
      }
    }
    return null;
  };

  // Find column index by alias
  const findColumn = (headers: string[], targetColumn: string): number => {
    const aliases = columnAliases[targetColumn] || [targetColumn];

    for (const alias of aliases) {
      const index = headers.findIndex(
        (h) => cleanText(h).toLowerCase() === alias.toLowerCase(),
      );
      if (index !== -1) return index;
    }

    return -1;
  };

  // Parse CSV with proper escaping
  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    return lines.map((line) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === "," || char === ";") && !inQuotes) {
          result.push(cleanText(current));
          current = "";
        } else {
          current += char;
        }
      }
      result.push(cleanText(current));
      return result;
    });
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo CSV.",
      });
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      // NEW: Use FastAPI backend if feature flag is enabled
      if (USE_FASTAPI) {
        const result =
          type === "clima"
            ? await apiClient.importClimateData(file)
            : await apiClient.importMarketData(file);

        setResult({
          success: result.records_imported,
          errors: result.records_failed,
        });

        toast({
          title: result.success
            ? "Importação concluída"
            : "Importação com erros",
          description: result.message,
          variant: result.success ? "default" : "destructive",
        });

        return;
      }

      // LEGACY: Supabase direct processing (fallback)
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length < 2) {
        throw new Error("Arquivo CSV vazio ou inválido");
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Find required columns
      const dataIndex = findColumn(headers, "data");

      if (dataIndex === -1) {
        throw new Error("Coluna 'data' não encontrada no arquivo");
      }

      let successCount = 0;
      let errorCount = 0;

      for (const row of dataRows) {
        if (row.length === 0 || row.every((cell) => !cell)) continue;

        const parsedDate = parseDate(row[dataIndex]);
        if (!parsedDate) {
          errorCount++;
          continue;
        }

        try {
          if (type === "mercado") {
            const dolarIndex = findColumn(headers, "valor_dolar");
            const jbsIndex = findColumn(headers, "valor_jbs");
            const boiIndex = findColumn(headers, "valor_boi_gordo");

            if (dolarIndex === -1 || jbsIndex === -1 || boiIndex === -1) {
              throw new Error("Colunas de mercado não encontradas");
            }

            const record = {
              data_fk: parsedDate,
              valor_dolar: parseNumber(row[dolarIndex]),
              valor_jbs: parseNumber(row[jbsIndex]),
              valor_boi_gordo: parseNumber(row[boiIndex]),
            };

            const { error } = await supabase
              .from("fact_mercado")
              .insert(record);

            if (error) throw error;
            successCount++;
          } else {
            const tempIndex = findColumn(headers, "temp_max");
            const chuvaIndex = findColumn(headers, "chuva_mm");
            const locIndex = findColumn(headers, "localizacao");

            if (tempIndex === -1 || chuvaIndex === -1) {
              throw new Error("Colunas climáticas não encontradas");
            }

            const record = {
              data_fk: parsedDate,
              temp_max: parseNumber(row[tempIndex]),
              chuva_mm: parseNumber(row[chuvaIndex]),
              localizacao:
                locIndex !== -1 && row[locIndex]
                  ? cleanText(row[locIndex])
                  : "SP",
            };

            const { error } = await supabase.from("fact_clima").insert(record);

            if (error) throw error;
            successCount++;
          }
        } catch (error) {
          console.error("Error inserting row:", error);
          errorCount++;
        }
      }

      setResult({ success: successCount, errors: errorCount });

      toast({
        title: "Importação concluída",
        description: `${successCount} registros importados, ${errorCount} erros`,
        variant: successCount > 0 ? "default" : "destructive",
      });
    } catch (error) {
      console.error("CSV Import Error:", error);
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const expectedFormat =
    type === "mercado"
      ? "data,valor_dolar,valor_jbs,valor_boi_gordo"
      : "data,chuva_mm,temp_max,localizacao";

  const exampleData =
    type === "mercado"
      ? "2025-01-15,5.12,28.45,315.50\n2025-01-16,5.15,28.80,316.00"
      : "2025-01-15,12.5,32.5,SP\n2025-01-16,0,35.2,SP";

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-accent" />
          <CardTitle>
            {type === "mercado"
              ? "Importar Dados de Mercado"
              : "Importar Dados Climáticos"}
          </CardTitle>
        </div>
        <CardDescription>
          Faça upload de um arquivo CSV com as colunas:{" "}
          {type === "mercado"
            ? "data, valor_dolar, valor_jbs, valor_boi_gordo"
            : "data, chuva_mm, temp_max, localizacao"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full gap-2"
          variant="outline"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Selecionar {type === "mercado" ? "finance.csv" : "weather.csv"}
            </>
          )}
        </Button>

        {result && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">
                {result.success} sucesso
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">{result.errors} erros</span>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-2">
          <p className="font-medium">Formato esperado:</p>
          <pre className="bg-muted/30 p-2 rounded text-[10px] overflow-x-auto">
            {expectedFormat}
            {"\n"}
            {exampleData}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
