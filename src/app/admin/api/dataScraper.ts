import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/_common/api/helper/apiClient';
import { devLog } from '@/app/_common/utils/logger';
import {
    ScraperConfig,
    ScraperStats,
    ScraperRunLog,
    ScrapedDataItem,
    RobotsCheckResult,
    DataLakeStats,
    ParsedData
} from '@/app/admin/components/database/types/scraper.types';

const BASE_URL = `${API_BASE_URL}/api/admin/data-scraper`;

const parseJson = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const message = `Request failed with status ${response.status}`;
        throw new Error(message);
    }
    return response.json();
};

const buildQuery = (params: Record<string, string | number | undefined>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
        }
    });
    const query = searchParams.toString();
    return query ? `?${query}` : '';
};

export const fetchScrapers = async (): Promise<ScraperConfig[]> => {
    const response = await apiClient(`${BASE_URL}/scrapers`);
    const data = await parseJson<{ items?: ScraperConfig[] }>(response);
    return data.items ?? [];
};

export const createScraper = async (
    payload: Partial<ScraperConfig>
): Promise<ScraperConfig> => {
    devLog.log('[dataScraperAPI] createScraper payload:', payload);
    const response = await apiClient(`${BASE_URL}/scrapers`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return parseJson<ScraperConfig>(response);
};

export const updateScraper = async (
    scraperId: string,
    payload: Partial<ScraperConfig>
): Promise<ScraperConfig> => {
    const response = await apiClient(`${BASE_URL}/scrapers/${encodeURIComponent(scraperId)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
    return parseJson<ScraperConfig>(response);
};

export const deleteScraper = async (scraperId: string): Promise<void> => {
    const response = await apiClient(
        `${BASE_URL}/scrapers/${encodeURIComponent(scraperId)}`,
        { method: 'DELETE' }
    );
    if (!response.ok) {
        const message = `Failed to delete scraper (${response.status})`;
        throw new Error(message);
    }
};

export const runScraper = async (scraperId: string): Promise<ScraperRunLog> => {
    const response = await apiClient(
        `${BASE_URL}/scrapers/${encodeURIComponent(scraperId)}/run`,
        { method: 'POST' }
    );
    return parseJson<ScraperRunLog>(response);
};

export const testScraper = async (scraperId: string) => {
    const response = await apiClient(
        `${BASE_URL}/scrapers/${encodeURIComponent(scraperId)}/test`,
        { method: 'POST' }
    );
    return parseJson<Record<string, any>>(response);
};

export const checkRobotsTxt = async (
    endpoint: string,
    userAgent?: string
): Promise<RobotsCheckResult> => {
    const response = await apiClient(`${BASE_URL}/scrapers/robots-check`, {
        method: 'POST',
        body: JSON.stringify({ endpoint, userAgent })
    });
    return parseJson<RobotsCheckResult>(response);
};

const normalizeScraperStats = (raw: Record<string, any>): ScraperStats => ({
    scraperId: raw.scraperId ?? raw.scraper_id ?? '',
    totalRuns: raw.totalRuns ?? raw.total_runs ?? 0,
    successfulRuns: raw.successfulRuns ?? raw.successful_runs ?? 0,
    failedRuns: raw.failedRuns ?? raw.failed_runs ?? 0,
    totalDataCollected: raw.totalDataCollected ?? raw.total_data_collected ?? 0,
    totalDataSize: raw.totalDataSize ?? raw.total_data_size ?? 0,
    lastRunAt: raw.lastRunAt ?? raw.last_run_at,
    averageRunTime: raw.averageRunTime ?? raw.average_run_time
});

export const fetchScraperStats = async (scraperId: string): Promise<ScraperStats | null> => {
    const response = await apiClient(
        `${BASE_URL}/scrapers/${encodeURIComponent(scraperId)}/stats`
    );
    if (response.status === 404) {
        return null;
    }
    const raw = await parseJson<Record<string, any>>(response);
    return normalizeScraperStats(raw);
};

export const fetchScraperSummary = async (): Promise<Record<string, any>> => {
    const response = await apiClient(`${BASE_URL}/stats/summary`);
    return parseJson<Record<string, any>>(response);
};

export const fetchScrapedData = async (
    scraperId?: string
): Promise<ScrapedDataItem[]> => {
    const query = buildQuery({ scraperId });
    const response = await apiClient(`${BASE_URL}/datalake/items${query}`);
    const data = await parseJson<{ items?: ScrapedDataItem[] }>(response);
    return data.items ?? [];
};

export const fetchDataLakeStats = async (): Promise<DataLakeStats> => {
    const response = await apiClient(`${BASE_URL}/datalake/stats`);
    const raw = await parseJson<Record<string, any>>(response);
    return {
        totalItems: raw.totalItems ?? raw.total_items ?? 0,
        totalSize: raw.totalSize ?? raw.total_size ?? 0,
        itemsBySourceType: raw.itemsBySourceType ?? raw.items_by_source_type ?? {},
        itemsByParsingMethod: raw.itemsByParsingMethod ?? raw.items_by_parsing_method ?? {},
        recentItems: raw.recentItems ?? raw.recent_items ?? 0
    };
};

export const parseDataItem = async (
    itemId: string,
    method: string
): Promise<ParsedData> => {
    const response = await apiClient(
        `${BASE_URL}/datalake/items/${encodeURIComponent(itemId)}/parse`,
        {
            method: 'POST',
            body: JSON.stringify({ method })
        }
    );
    const raw = await parseJson<Record<string, any>>(response);
    return {
        success: Boolean(raw.success),
        data: raw.data,
        error: raw.error,
        method: raw.method ?? raw.parsingMethod ?? method,
        originalSize: raw.originalSize ?? raw.original_size ?? 0,
        parsedSize: raw.parsedSize ?? raw.parsed_size ?? 0,
        parseTime: raw.parseTime ?? raw.parse_time ?? 0
    };
};
