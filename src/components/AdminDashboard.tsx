import React, { useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Users, KeyRound, RefreshCw } from 'lucide-react';

interface AnalyticsSummary {
  totalKeys: number;
  totalRequests: number;
  totalKeywordAttempts: number;
  successfulKeywords: number;
  failedKeywords: number;
  successRate: string;
  totalCreditsUsed: number;
  totalEstimatedCost: number;
}

interface RecentFailure {
  keyword: string;
  approach: string;
  error_message: string;
  timestamp: string;
  access_key: string;
}

interface PopularKeyword {
  keyword: string;
  usage_count: number;
  success_count: number;
  failure_count: number;
}

interface DailyStat {
  date: string;
  total_attempts: number;
  successful: number;
  failed: number;
}

interface FormatStat {
  output_format: string;
  count: number;
}

interface RevenueStat {
  active_api_keys: number;
  total_keywords_requested: number;
  total_keywords_processed: number;
  total_credits_consumed: number;
  avg_credits_per_request: string;
}

interface MostUsedKeyword {
  keyword: string;
  usage_count: number;
}

interface AdminAnalytics {
  summary: AnalyticsSummary;
  formatStats: FormatStat[];
  revenueStats: RevenueStat;
  recentFailures: RecentFailure[];
  popularKeywords: PopularKeyword[];
  mostUsedKeywords: MostUsedKeyword[];
  dailyStats: DailyStat[];
}

interface AdminDashboardProps {
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://23.88.106.121:3002/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        setAnalytics(data.data);
        setLastRefresh(new Date());
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection failed. Please check your network.');
    }

    setIsLoading(false);
  };

  const refreshData = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://23.88.106.121:3002/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (response.ok) {
        setAnalytics(data.data);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
    setIsLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'var(--bg-primary)',
          padding: '40px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          maxWidth: '400px',
          width: '90%'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <KeyRound size={48} style={{ color: 'var(--accent-primary)', marginBottom: '16px' }} />
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Admin Access Required</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Enter the admin password to access system analytics</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password..."
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '16px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '16px'
              }}
              required
            />
            
            {error && (
              <p style={{ 
                color: 'var(--error-color)', 
                fontSize: '14px', 
                marginBottom: '16px', 
                textAlign: 'center' 
              }}>
                {error}
              </p>
            )}
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Authenticating...' : 'Access Dashboard'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BarChart3 size={24} style={{ color: 'var(--accent-primary)' }} />
              System Analytics Dashboard
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0' }}>
              Last updated: {lastRefresh.toLocaleString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={refreshData}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: 'var(--error-color)',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Summary Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px', 
            marginBottom: '32px' 
          }}>
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Users size={18} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Access Keys</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {analytics.summary.totalKeys}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={18} style={{ color: 'var(--success-color)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Success Rate</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                {analytics.summary.successRate}%
              </div>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <BarChart3 size={18} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Keyword Attempts</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {analytics.summary.totalKeywordAttempts}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--error-color)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Failed Keywords</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--error-color)' }}>
                {analytics.summary.failedKeywords}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <BarChart3 size={18} style={{ color: 'var(--accent-secondary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>API Requests</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {analytics.summary.totalRequests}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={18} style={{ color: 'var(--warning-color)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Credits Used</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--warning-color)' }}>
                {analytics.summary.totalCreditsUsed.toLocaleString()}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Users size={18} style={{ color: 'var(--success-color)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Est. Cost</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                ${analytics.summary.totalEstimatedCost}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Popular Keywords */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Most Popular Keywords</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {analytics.popularKeywords.map((keyword, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < analytics.popularKeywords.length - 1 ? '1px solid var(--border-color)' : 'none'
                  }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>"{keyword.keyword}"</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ 
                        color: 'var(--success-color)', 
                        fontSize: '12px',
                        background: 'rgba(76, 175, 80, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        ✓ {keyword.success_count}
                      </span>
                      {keyword.failure_count > 0 && (
                        <span style={{ 
                          color: 'var(--error-color)', 
                          fontSize: '12px',
                          background: 'rgba(244, 67, 54, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          ✗ {keyword.failure_count}
                        </span>
                      )}
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 'bold' }}>
                        {keyword.usage_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Failures */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Recent Failures (48h)</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {analytics.recentFailures.length === 0 ? (
                  <p style={{ color: 'var(--success-color)', textAlign: 'center', fontStyle: 'italic' }}>
                    🎉 No recent failures! System running smoothly.
                  </p>
                ) : (
                  analytics.recentFailures.map((failure, index) => (
                    <div key={index} style={{
                      padding: '12px',
                      marginBottom: '8px',
                      background: 'rgba(244, 67, 54, 0.05)',
                      border: '1px solid rgba(244, 67, 54, 0.2)',
                      borderRadius: '6px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          "{failure.keyword}" ({failure.approach})
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {new Date(failure.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--error-color)' }}>
                        {failure.error_message.substring(0, 100)}...
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Key: {failure.access_key}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Revenue and Format Analytics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
            {/* Revenue Stats */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Revenue Analytics</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Active API Keys</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                    {analytics.revenueStats.active_api_keys}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Keywords Requested</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {analytics.revenueStats.total_keywords_requested?.toLocaleString() || '0'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Keywords Processed</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                    {analytics.revenueStats.total_keywords_processed?.toLocaleString() || '0'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Credits Consumed</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--warning-color)' }}>
                    {analytics.revenueStats.total_credits_consumed?.toLocaleString() || '0'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Avg Credits/Request</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {analytics.revenueStats.avg_credits_per_request}
                  </span>
                </div>
              </div>
            </div>

            {/* Format Stats */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Output Format Usage</h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {analytics.formatStats.map((format, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < analytics.formatStats.length - 1 ? '1px solid var(--border-color)' : 'none'
                  }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', textTransform: 'capitalize' }}>
                      {format.output_format}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        color: 'var(--accent-primary)', 
                        fontSize: '14px', 
                        fontWeight: 'bold' 
                      }}>
                        {format.count}
                      </span>
                      <div style={{
                        width: '60px',
                        height: '6px',
                        background: 'var(--border-color)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.max(5, (format.count / Math.max(...analytics.formatStats.map(f => f.count))) * 100)}%`,
                          height: '100%',
                          background: 'var(--accent-primary)',
                          borderRadius: '3px'
                        }}></div>
                      </div>
                    </div>
                  </div>
                ))}
                {analytics.formatStats.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
                    No format data available yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Most Used Keywords (Successful) */}
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginTop: '24px'
          }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Most Successful Keywords</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {analytics.mostUsedKeywords.map((keyword, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'rgba(76, 175, 80, 0.05)',
                  border: '1px solid rgba(76, 175, 80, 0.2)',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>"{keyword.keyword}"</span>
                  <span style={{ 
                    color: 'var(--success-color)', 
                    fontSize: '13px', 
                    fontWeight: 'bold',
                    background: 'rgba(76, 175, 80, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {keyword.usage_count}
                  </span>
                </div>
              ))}
              {analytics.mostUsedKeywords.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic', gridColumn: '1 / -1' }}>
                  No successful keywords tracked yet
                </p>
              )}
            </div>
          </div>

          {/* Daily Stats */}
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginTop: '24px'
          }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Daily Activity (Last 7 Days)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Date</th>
                    <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Total</th>
                    <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Success</th>
                    <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Failed</th>
                    <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.dailyStats.map((day, index) => {
                    const rate = day.total_attempts > 0 ? ((day.successful / day.total_attempts) * 100).toFixed(1) : '0';
                    return (
                      <tr key={index} style={{ borderBottom: index < analytics.dailyStats.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                        <td style={{ padding: '8px', color: 'var(--text-primary)' }}>
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '8px', color: 'var(--text-primary)', textAlign: 'center' }}>
                          {day.total_attempts}
                        </td>
                        <td style={{ padding: '8px', color: 'var(--success-color)', textAlign: 'center' }}>
                          {day.successful}
                        </td>
                        <td style={{ padding: '8px', color: 'var(--error-color)', textAlign: 'center' }}>
                          {day.failed}
                        </td>
                        <td style={{ 
                          padding: '8px', 
                          textAlign: 'center',
                          color: parseFloat(rate) >= 90 ? 'var(--success-color)' : parseFloat(rate) >= 75 ? 'var(--warning-color)' : 'var(--error-color)'
                        }}>
                          {rate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
