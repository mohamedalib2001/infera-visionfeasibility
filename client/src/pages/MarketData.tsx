import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  RefreshCw,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

interface EconomicIndicator {
  name: string;
  value: number;
  change: number;
  unit: string;
  source: string;
  lastUpdated: string;
}

interface ExchangeRate {
  currency: string;
  rate: number;
  change: number;
}

interface CommodityPrice {
  name: string;
  price: number;
  change: number;
  unit: string;
}

interface MarketDataResult {
  economicIndicators: EconomicIndicator[];
  exchangeRates: ExchangeRate[];
  commodityPrices: CommodityPrice[];
  gdpTrend: { year: string; gdp: number }[];
  inflationTrend: { month: string; rate: number }[];
}

const MENA_COUNTRIES = [
  { code: "SA", name: "Saudi Arabia", nameAr: "المملكة العربية السعودية" },
  { code: "AE", name: "UAE", nameAr: "الإمارات العربية المتحدة" },
  { code: "EG", name: "Egypt", nameAr: "مصر" },
  { code: "QA", name: "Qatar", nameAr: "قطر" },
  { code: "KW", name: "Kuwait", nameAr: "الكويت" },
  { code: "BH", name: "Bahrain", nameAr: "البحرين" },
  { code: "OM", name: "Oman", nameAr: "عُمان" },
  { code: "JO", name: "Jordan", nameAr: "الأردن" },
  { code: "MA", name: "Morocco", nameAr: "المغرب" },
];

export default function MarketData() {
  const { user } = useAuth();
  const lang = (user?.language || "en") as "en" | "ar";
  const isRtl = lang === "ar";

  const [selectedCountry, setSelectedCountry] = useState("SA");

  const texts = {
    en: {
      title: "Live Market Data",
      subtitle: "Real-time economic indicators for MENA markets",
      selectCountry: "Select Country",
      economicIndicators: "Economic Indicators",
      exchangeRates: "Exchange Rates",
      commodities: "Commodity Prices",
      gdpTrend: "GDP Trend",
      inflationTrend: "Inflation Trend",
      gdp: "GDP",
      gdpGrowth: "GDP Growth",
      inflation: "Inflation Rate",
      unemployment: "Unemployment",
      interestRate: "Interest Rate",
      fdi: "Foreign Direct Investment",
      source: "Source",
      lastUpdated: "Last Updated",
      loading: "Loading market data...",
      noData: "No data available for this country",
      billion: "B",
      trillion: "T",
    },
    ar: {
      title: "بيانات السوق الحية",
      subtitle: "مؤشرات اقتصادية في الوقت الفعلي لأسواق الشرق الأوسط",
      selectCountry: "اختر الدولة",
      economicIndicators: "المؤشرات الاقتصادية",
      exchangeRates: "أسعار الصرف",
      commodities: "أسعار السلع",
      gdpTrend: "اتجاه الناتج المحلي",
      inflationTrend: "اتجاه التضخم",
      gdp: "الناتج المحلي",
      gdpGrowth: "نمو الناتج المحلي",
      inflation: "معدل التضخم",
      unemployment: "البطالة",
      interestRate: "سعر الفائدة",
      fdi: "الاستثمار الأجنبي المباشر",
      source: "المصدر",
      lastUpdated: "آخر تحديث",
      loading: "جاري تحميل بيانات السوق...",
      noData: "لا توجد بيانات لهذه الدولة",
      billion: "مليار",
      trillion: "تريليون",
    },
  };

  const t = texts[lang];

  const { data: marketData, isLoading } = useQuery<MarketDataResult>({
    queryKey: ["/api/market-data", selectedCountry],
  });

  const formatLargeNumber = (value: number) => {
    if (value >= 1000000000000) {
      return `$${(value / 1000000000000).toFixed(1)}${t.trillion}`;
    } else if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}${t.billion}`;
    }
    return `$${value.toLocaleString()}`;
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <span className="flex items-center text-green-600 text-sm">
          <TrendingUp className="w-4 h-4 mr-1" />
          +{change.toFixed(2)}%
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="flex items-center text-red-600 text-sm">
          <TrendingDown className="w-4 h-4 mr-1" />
          {change.toFixed(2)}%
        </span>
      );
    }
    return <span className="text-muted-foreground text-sm">0.00%</span>;
  };

  return (
    <DashboardLayout title={t.title}>
      <div className={`p-6 space-y-6 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
          <Globe className="w-8 h-8 text-primary" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 max-w-xs">
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger data-testid="select-country">
                    <SelectValue placeholder={t.selectCountry} />
                  </SelectTrigger>
                  <SelectContent>
                    {MENA_COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {lang === "ar" ? country.nameAr : country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {t.lastUpdated}: {format(new Date(), "MMM dd, yyyy HH:mm")}
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">{t.loading}</p>
              </div>
            </CardContent>
          </Card>
        ) : marketData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {marketData.economicIndicators?.slice(0, 4).map((indicator) => (
                <Card key={indicator.name}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{indicator.name}</p>
                        <p className="text-2xl font-bold">
                          {indicator.unit === "$"
                            ? formatLargeNumber(indicator.value)
                            : `${indicator.value}${indicator.unit}`}
                        </p>
                      </div>
                      {getChangeIndicator(indicator.change)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t.source}: {indicator.source}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="exchange" className="space-y-4">
              <TabsList className="overflow-x-auto">
                <TabsTrigger value="exchange">{t.exchangeRates}</TabsTrigger>
                <TabsTrigger value="commodities">{t.commodities}</TabsTrigger>
                <TabsTrigger value="gdp">{t.gdpTrend}</TabsTrigger>
                <TabsTrigger value="inflation">{t.inflationTrend}</TabsTrigger>
              </TabsList>

              <TabsContent value="exchange">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.exchangeRates}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {marketData.exchangeRates?.map((rate) => (
                        <div
                          key={rate.currency}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{rate.currency}/USD</p>
                            <p className="text-xl font-bold">{rate.rate.toFixed(4)}</p>
                          </div>
                          {getChangeIndicator(rate.change)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="commodities">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.commodities}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {marketData.commodityPrices?.map((commodity) => (
                        <div
                          key={commodity.name}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{commodity.name}</p>
                            <p className="text-xl font-bold">
                              ${commodity.price.toFixed(2)}
                              <span className="text-sm text-muted-foreground ml-1">
                                /{commodity.unit}
                              </span>
                            </p>
                          </div>
                          {getChangeIndicator(commodity.change)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gdp">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.gdpTrend}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={marketData.gdpTrend}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="year" className="text-xs" />
                          <YAxis
                            tickFormatter={(v) => `$${(v / 1000000000).toFixed(0)}B`}
                            className="text-xs"
                          />
                          <Tooltip
                            formatter={(value: number) => [formatLargeNumber(value), t.gdp]}
                          />
                          <Area
                            type="monotone"
                            dataKey="gdp"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inflation">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.inflationTrend}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={marketData.inflationTrend}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis
                            tickFormatter={(v) => `${v}%`}
                            className="text-xs"
                          />
                          <Tooltip
                            formatter={(value: number) => [`${value}%`, t.inflation]}
                          />
                          <Line
                            type="monotone"
                            dataKey="rate"
                            stroke="hsl(var(--accent))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--accent))" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t.noData}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
