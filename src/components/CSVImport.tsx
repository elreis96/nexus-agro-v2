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

interface MercadoRow {
  data: string;
  valor_dolar: number | null;
  valor_jbs: number | null;
  valor_boi_gordo: number | null;
}

interface ClimaRow {
  data: string;
  chuva_mm: number | null;
  temp_max: number | null;
  localizacao: string | null;
}

export function CSVImport({ type }: CSVImportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    errors: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const expectedColumns =
    type === "mercado"
      ? ["data", "valor_dolar", "valor_jbs", "valor_boi_gordo"]
      : ["data", "chuva_mm", "temp_max", "localizacao"];

  const parseCSV = (text: string): string[][] => {
    const lines = text.trim().split("\n");
    return lines.map((line) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === "," || char === ";") && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const parseDate = (dateStr: string): string | null => {
    // Try different date formats
    const formats = ["yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "dd-MM-yyyy"];

    for (const fmt of formats) {
      try {
        const parsed = parse(dateStr, fmt, new Date());
        if (isValid(parsed)) {
          return format(parsed, "yyyy-MM-dd");
        }
      } catch {
        continue;
      }
    }
    return null;
  };

  const parseNumber = (value: string): number | null => {
    if (!value || value === "" || value === "null" || value === "NULL") {
      return null;
    }
    // Handle Brazilian number format (comma as decimal separator)
    const normalized = value.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(normalized);
    return isNaN(num) ? null : num;
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
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length < 2) {
        throw new Error(
          "O arquivo CSV deve ter pelo menos uma linha de cabeçalho e uma de dados.",
        );
      }

      const headers = rows[0].map((h) => h.toLowerCase().trim());

      // Map alternative column names
      const columnMap: Record<string, string[]> = {
        data: ["data", "date"],
        valor_dolar: ["valor_dolar", "dolar"],
        valor_jbs: ["valor_jbs", "jbs"],
        valor_boi_gordo: ["valor_boi_gordo", "boi_gordo"],
        chuva_mm: ["chuva_mm"],
        temp_max: ["temp_max"],
        localizacao: ["localizacao", "local", "location"],
      };

      // Find actual column names in the CSV
      const findColumn = (possibleNames: string[]): number => {
        for (const name of possibleNames) {
          const index = headers.indexOf(name);
          if (index !== -1) return index;
        }
        return -1;
      };

      // Validate required columns exist
      const requiredColumns =
        type === "mercado"
          ? ["data", "valor_dolar", "valor_jbs", "valor_boi_gordo"]
          : ["data", "chuva_mm", "temp_max"];

      const missingColumns: string[] = [];
      for (const col of requiredColumns) {
        if (findColumn(columnMap[col]) === -1) {
          missingColumns.push(col);
        }
      }

      if (missingColumns.length > 0) {
        throw new Error(`Colunas faltando: ${missingColumns.join(", ")}`);
      }

      const dataIndex = findColumn(columnMap["data"]);
      let successCount = 0;
      let errorCount = 0;

      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < headers.length) continue;

        const dateStr = row[dataIndex];
        const parsedDate = parseDate(dateStr);

        if (!parsedDate) {
          errorCount++;
          continue;
        }

        try {
          if (type === "mercado") {
            const record = {
              data_fk: parsedDate,
              valor_dolar: parseNumber(
                row[findColumn(columnMap["valor_dolar"])],
              ),
              valor_jbs: parseNumber(row[findColumn(columnMap["valor_jbs"])]),
              valor_boi_gordo: parseNumber(
                row[findColumn(columnMap["valor_boi_gordo"])],
              ),
            };

            const { error } = await supabase
              .from("fact_mercado")
              .upsert(record, { onConflict: "data_fk" });

            if (error) throw error;
            successCount++;
          } else {
            const locIndex = findColumn(columnMap["localizacao"]);
            const record = {
              data_fk: parsedDate,
              chuva_mm: parseNumber(row[findColumn(columnMap["chuva_mm"])]),
              temp_max: parseNumber(row[findColumn(columnMap["temp_max"])]),
              localizacao: locIndex !== -1 ? row[locIndex] || "SP" : "SP",
            };

            const { error } = await supabase
              .from("fact_clima")
              .upsert(record, { onConflict: "data_fk" });

            if (error) throw error;
            successCount++;
          }
        } catch {
          errorCount++;
        }
      }

      setResult({ success: successCount, errors: errorCount });

      toast({
        title: "Importação concluída",
        description: `${successCount} registros importados, ${errorCount} erros.`,
      });
    } catch (error) {
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

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          {type === "mercado"
            ? "Importar Dados de Mercado"
            : "Importar Dados Climáticos"}
        </CardTitle>
        <CardDescription>
          Faça upload de um arquivo CSV com as colunas:{" "}
          {expectedColumns.join(", ")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id={`csv-upload-${type}`}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Selecionar {type === "mercado" ? "finance.csv" : "weather.csv"}
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <span>{result.success} sucesso</span>
            </div>
            {result.errors > 0 && (
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span>{result.errors} erros</span>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Formato esperado:</strong>
          </p>
          {type === "mercado" ? (
            <code className="block p-2 bg-muted rounded text-xs">
              data,valor_dolar,valor_jbs,valor_boi_gordo
              <br />
              2025-01-15,5.12,28.45,315.50
              <br />
              2025-01-16,5.15,28.80,316.00
            </code>
          ) : (
            <code className="block p-2 bg-muted rounded text-xs">
              data,chuva_mm,temp_max,localizacao
              <br />
              2025-01-15,12.5,32.5,SP
              <br />
              2025-01-16,0,35.2,SP
            </code>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
