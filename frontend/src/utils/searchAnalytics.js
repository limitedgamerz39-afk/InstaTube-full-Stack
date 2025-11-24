// Simple search analytics utility
class SearchAnalytics {
  constructor() {
    this.searchHistory = JSON.parse(localStorage.getItem('searchAnalytics') || '[]');
  }

  // Track search query
  trackSearch(query, resultsCount, timeTaken) {
    const searchEvent = {
      query: query.toLowerCase(),
      resultsCount,
      timeTaken,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };

    this.searchHistory.push(searchEvent);
    
    // Keep only last 100 search events
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(-100);
    }

    localStorage.setItem('searchAnalytics', JSON.stringify(this.searchHistory));
  }

  // Get popular search terms
  getPopularSearches(limit = 10) {
    const termCount = {};
    
    this.searchHistory.forEach(event => {
      termCount[event.query] = (termCount[event.query] || 0) + 1;
    });

    return Object.entries(termCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([term, count]) => ({ term, count }));
  }

  // Get average search time
  getAverageSearchTime() {
    if (this.searchHistory.length === 0) return 0;
    
    const totalTime = this.searchHistory.reduce((sum, event) => sum + event.timeTaken, 0);
    return totalTime / this.searchHistory.length;
  }

  // Get search success rate
  getSearchSuccessRate() {
    if (this.searchHistory.length === 0) return 100;
    
    const successfulSearches = this.searchHistory.filter(event => event.resultsCount > 0).length;
    return (successfulSearches / this.searchHistory.length) * 100;
  }

  // Clear search history
  clearHistory() {
    this.searchHistory = [];
    localStorage.removeItem('searchAnalytics');
  }

  // Get session ID (for grouping searches in same session)
  getSessionId() {
    let sessionId = sessionStorage.getItem('searchSessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('searchSessionId', sessionId);
    }
    return sessionId;
  }
}

const searchAnalytics = new SearchAnalytics();
export default searchAnalytics;