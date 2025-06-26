/**
 * HTTP request result codes, mirroring the C implementation
 */
export const RequestCode = {
    FOUND: 'FOUND',
    NOT_FOUND: 'NOT_FOUND',
    UNKNOWN_RESPONSE: 'UNKNOWN_RESPONSE',
    TIMEOUT: 'TIMEOUT',
    ERROR: 'ERROR',
    BAD_ID: 'BAD_ID'
};

/**
 * Result of an API request, including status and response data
 */
class ApiResult {
    constructor(code, data = null) {
        this.code = code;
        this.data = data;
    }
}

/**
 * Helper class for making HTTP requests to external APIs
 * Will be extended to support DOI and arXiv specific endpoints
 */
export class ApiHelper {
    constructor() {
        this.timeout = 20000; // 15 seconds timeout, matching C implementation
    }

    /**
     * Make a GET request to a URL with optional headers and proper error handling.
     *
     * @async
     * @param {string} url - The URL to request.
     * @param {Object} [headers={}] - Optional headers to include in the request. Example: { 'Accept': 'application/json' }
     * @returns {Promise<ApiResult>} The result with appropriate status code and data.
     *
     * @example
     *   const api = new ApiHelper();
     *   const result = await api.fetchUrl('https://example.com/bibtex');
     *   if (result.code === RequestCode.FOUND) {
     *     // Use result.data
     *   }
     */
    async fetchUrl(url, headers = {}) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                method: 'GET',
                headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Handle various response cases
            if (response.ok) {
                const data = await response.text();
                return new ApiResult(RequestCode.FOUND, data);
            } else if (response.status === 404) {
                return new ApiResult(RequestCode.NOT_FOUND);
            } else {
                return new ApiResult(RequestCode.UNKNOWN_RESPONSE);
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                return new ApiResult(RequestCode.TIMEOUT);
            }
            return new ApiResult(RequestCode.ERROR);
        }
    }

    /**
     * Fetch BibTeX from arXiv, using Electron main process proxy if available (to bypass CORS).
     * @param {string} arXivId - The arXiv identifier
     * @returns {Promise<ApiResult>}
     */
    async fetchArXiv(arXivId) {
        const url = 'https://arxiv.org/bibtex/' + arXivId;
        // If running in Electron and proxyFetch is available, use it
        if (window.electronAPI && typeof window.electronAPI.proxyFetch === 'function') {
            try {
                const response = await window.electronAPI.proxyFetch(url);
                if (response.status === 200) {
                    return new ApiResult(RequestCode.FOUND, response.body);
                } else if (response.status === 404) {
                    return new ApiResult(RequestCode.NOT_FOUND);
                } else {
                    return new ApiResult(RequestCode.UNKNOWN_RESPONSE);
                }
            } catch (error) {
                return new ApiResult(RequestCode.ERROR);
            }
        } else {
            // Fallback: try fetch (will fail CORS in browser)
            return this.fetchUrl(url);
        }
    }

    /**
     * Fetch BibTeX from DOI.org, using fetch (CORS is allowed by doi.org)
     * @param {string} doi - The DOI string
     * @returns {Promise<ApiResult>}
     */
    async fetchDOI(doi) {
        const url = 'https://doi.org/' + doi;
        const headers = {'Accept' : 'text/bibliography; style=bibtex; locale=en-GB'};
        return this.fetchUrl(url, headers);
    }
}