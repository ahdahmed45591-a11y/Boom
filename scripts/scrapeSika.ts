/**
 * Boom - Sika Finance BRVM Scraper Tool
 * Scrapes live stock data from https://www.sikafinance.com/marches/aaz
 * and populates the database and mobile application.
 */

import type { StockQuote, StockSector, OrderBookEntry } from '../src/types/index.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COUNTRY_MAP: Record<string, string> = {
  ci: "Côte d'Ivoire",
  sn: 'Sénégal',
  bj: 'Bénin',
  bf: 'Burkina Faso',
  ml: 'Mali',
  tg: 'Togo',
  ne: 'Niger',
};

function guessSector(name: string, symbol: string): StockSector {
  const n = (name + ' ' + symbol).toUpperCase();
  if (n.includes('BANK') || n.includes('BOA') || n.includes('ECOBANK') || n.includes('BICI') || n.includes('CORIS') || n.includes('SIB') || n.includes('SGBC') || n.includes('ORAG')) {
    return 'Banking & Finance';
  }
  if (n.includes('SONATEL') || n.includes('ORANGE') || n.includes('TELECOM') || n.includes('SNTS') || n.includes('ORAC')) {
    return 'Telecom';
  }
  if (n.includes('PALM') || n.includes('SUCR') || n.includes('SAPH') || n.includes('AGRI') || n.includes('SOGB')) {
    return 'Agriculture';
  }
  if (n.includes('CIE') || n.includes('SODECI') || n.includes('TOTAL') || n.includes('VIVO') || n.includes('SHELL')) {
    return 'Energy & Utilities';
  }
  if (n.includes('CFAO') || n.includes('BERNABE') || n.includes('TRACTAFRIC') || n.includes('DISTRI')) {
    return 'Distribution';
  }
  return 'Industry';
}

function generateOrderBook(price: number): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
  const tick = price > 5000 ? 50 : price > 500 ? 10 : 1;
  const bids: OrderBookEntry[] = [
    { price: price - tick, quantity: Math.floor(Math.random() * 400 + 100), ordersCount: Math.floor(Math.random() * 5 + 2) },
    { price: price - tick * 2, quantity: Math.floor(Math.random() * 600 + 200), ordersCount: Math.floor(Math.random() * 7 + 3) },
    { price: price - tick * 3, quantity: Math.floor(Math.random() * 1000 + 300), ordersCount: Math.floor(Math.random() * 10 + 4) },
  ];
  const asks: OrderBookEntry[] = [
    { price: price, quantity: Math.floor(Math.random() * 300 + 100), ordersCount: Math.floor(Math.random() * 4 + 2) },
    { price: price + tick, quantity: Math.floor(Math.random() * 500 + 200), ordersCount: Math.floor(Math.random() * 6 + 3) },
    { price: price + tick * 2, quantity: Math.floor(Math.random() * 900 + 300), ordersCount: Math.floor(Math.random() * 9 + 4) },
  ];
  return { bids, asks };
}

function generateChartData(price: number, previousClose: number) {
  const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
  return times.map((time, idx) => {
    const ratio = (idx + 1) / times.length;
    const interpolated = Math.round(previousClose + (price - previousClose) * ratio);
    return {
      time,
      price: interpolated,
      volume: Math.floor(Math.random() * 3000 + 500),
    };
  });
}

export async function scrapeSikaFinance(): Promise<StockQuote[]> {
  const url = 'https://www.sikafinance.com/marches/aaz';
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP Sika Finance: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const num = (s: string) => parseInt(s.replace(/&#xA0;|\s/g, ''), 10) || 0;
  const regex = /<tr>\s*<td class=["']allf["']><a href=["']\/marches\/cotation_([A-Z0-9]+)\.([a-z]{2})["']>([^<]+)<\/a><\/td>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>[\s\S]*?<b>([^<]+)<\/b><\/td>\s*<td class=["'](?:quote_down2|quote_up2)["']>([^<]+)%<\/td>/gi;

  const stocks: StockQuote[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const symbol = match[1];
    const countryCode = match[2].toLowerCase();
    const name = match[3].trim().replace(/&#xA0;/g, ' ');
    const [open, high, low, volume] = [match[4], match[5], match[6], match[7]].map(num);
    const price = num(match[8]);
    const changePercent = parseFloat(match[9].replace(',', '.').trim());

    if (price <= 0) continue;

    const previousClose = Math.round(price / (1 + changePercent / 100)) || price;
    const change = price - previousClose;
    // ponytail: order book is synthetic (Sika has no depth data); plug a real feed if available
    const { bids, asks } = generateOrderBook(price);
    const chartData = generateChartData(price, previousClose);

    stocks.push({
      symbol,
      name,
      country: COUNTRY_MAP[countryCode] || 'UEMOA',
      sector: guessSector(name, symbol),
      price,
      change,
      changePercent,
      previousClose,
      open: open || previousClose,
      high: high || Math.max(price, previousClose),
      low: low || Math.min(price, previousClose),
      volume,
      marketCap: 0, // not provided by the listing page
      peRatio: 0,
      dividendYield: 0,
      bids,
      asks,
      chartData,
    });
  }

  return stocks;
}

// CLI Execution
async function main() {
  console.log('📡 Scraping en direct des cotations BRVM sur https://www.sikafinance.com/marches/aaz...');
  const quotes = await scrapeSikaFinance();
  console.log(`✅ ${quotes.length} actions BRVM extraites avec succès depuis Sika Finance !`);

  // Sauvegarde dans un fichier json importable
  const targetPath = path.resolve(__dirname, '../src/services/scrapedMarketData.json');
  fs.writeFileSync(targetPath, JSON.stringify(quotes, null, 2), 'utf-8');
  console.log(`💾 Fichier mis à jour : ${targetPath}`);

  // Affichage d'un extrait
  console.log('\n--- Extrait des 5 premières cotations réelles Sika Finance ---');
  for (const q of quotes.slice(0, 5)) {
    console.log(`[${q.symbol}] ${q.name} | ${q.price.toLocaleString('fr-FR')} XOF (${q.changePercent >= 0 ? '+' : ''}${q.changePercent}%) | ${q.country}`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('scrapeSika.ts')) {
  main().catch(err => {
    console.error('❌ Erreur lors du scraping:', err);
    process.exit(1);
  });
}

