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
class ApiHelper {
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

    async fetchArXiv(arXivId) {
        url = 'https://arxiv.org/bibtex/' + arXivId;
        return this.fetchUrl(url)
    }

    async fetchDOI(doi) {
        url = 'https://doi.org/' + doi;
        headers = {'Accept' : 'text/bibliography; style=bibtex; locale=en-GB'}
        return this.fetchUrl(url, headers)
    }

}

export default ApiHelper;
