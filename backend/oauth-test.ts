// XLNC OAuth Setup Server - Professional UI
import express from 'express';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

const ZOHO_SCOPES = [
  'ZohoCRM.modules.ALL',
  'ZohoCRM.settings.ALL',
  'ZohoCRM.users.READ',
  'ZohoCalendar.calendar.ALL',
  'ZohoCalendar.event.ALL',
].join(',');

// Shared styles - XLNC Design System (Dark + Gold)
const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #080808;
    min-height: 100vh;
    color: #e5e5e5;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
  }

  /* Ambient gold glow */
  body::before {
    content: '';
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .container {
    max-width: 480px;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .card {
    background: linear-gradient(180deg, rgba(20, 20, 20, 0.95) 0%, rgba(12, 12, 12, 0.98) 100%);
    border: 1px solid rgba(212, 175, 55, 0.15);
    border-radius: 2px;
    padding: 48px 40px;
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.5),
      0 25px 50px -12px rgba(0, 0, 0, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.02);
  }

  .header {
    text-align: center;
    margin-bottom: 40px;
  }

  .logo {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 42px;
    font-weight: 600;
    background: linear-gradient(135deg, #FCF6BA 0%, #BF953F 50%, #AA771C 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.15em;
    margin-bottom: 8px;
  }

  .subtitle {
    font-size: 10px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.3em;
    font-weight: 500;
  }

  h2 {
    font-size: 11px;
    font-weight: 600;
    color: rgba(212, 175, 55, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.1);
  }

  .status-list {
    list-style: none;
    margin-bottom: 32px;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.03);
    margin-bottom: 8px;
    font-size: 13px;
  }

  .status-icon {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-icon.success { background: #D4AF37; box-shadow: 0 0 8px rgba(212, 175, 55, 0.5); }
  .status-icon.error { background: #4a4a4a; }
  .status-icon.warning { background: #8B7355; }

  .status-label { color: #888; font-weight: 400; }
  .status-value { margin-left: auto; font-weight: 500; color: #ccc; }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 16px 24px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.3s ease;
  }

  .btn-primary {
    background: linear-gradient(135deg, #BF953F 0%, #AA771C 100%);
    color: #080808;
    box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
  }

  .btn-primary:hover {
    box-shadow: 0 6px 30px rgba(212, 175, 55, 0.5);
    transform: translateY(-1px);
  }

  .btn-success {
    background: linear-gradient(135deg, #BF953F 0%, #AA771C 100%);
    color: #080808;
  }

  .btn-secondary {
    background: transparent;
    color: #888;
    border: 1px solid rgba(212, 175, 55, 0.2);
    margin-top: 12px;
  }

  .btn-secondary:hover {
    border-color: rgba(212, 175, 55, 0.4);
    color: #D4AF37;
  }

  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
    margin: 32px 0;
  }

  .token-box {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(212, 175, 55, 0.2);
    padding: 20px;
    margin: 24px 0;
  }

  .token-label {
    font-size: 10px;
    color: #D4AF37;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-bottom: 12px;
  }

  .token-value {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11px;
    color: #aaa;
    word-break: break-all;
    line-height: 1.8;
    background: rgba(0, 0, 0, 0.3);
    padding: 16px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 24px;
  }

  .info-item {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.03);
    padding: 16px;
  }

  .info-label {
    font-size: 9px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 6px;
  }

  .info-value {
    font-size: 14px;
    font-weight: 500;
    color: #ccc;
  }

  .steps {
    margin-top: 24px;
  }

  .step {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }

  .step-number {
    width: 24px;
    height: 24px;
    background: transparent;
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #D4AF37;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .step-text {
    font-size: 13px;
    color: #888;
    line-height: 1.7;
  }

  .step-text code {
    background: rgba(212, 175, 55, 0.1);
    color: #D4AF37;
    padding: 2px 8px;
    font-size: 11px;
  }

  .success-icon {
    width: 64px;
    height: 64px;
    background: transparent;
    border: 2px solid rgba(212, 175, 55, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    font-size: 28px;
  }

  .error-icon {
    width: 64px;
    height: 64px;
    background: transparent;
    border: 2px solid rgba(255, 100, 100, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    font-size: 28px;
  }

  .text-center { text-align: center; }
  .text-success { color: #D4AF37; }
  .text-error { color: #c9a065; }
  .text-muted { color: #555; font-size: 12px; margin-top: 8px; }
`;

app.get('/', (req, res) => {
  const hasClientId = !!process.env.ZOHO_CLIENT_ID;
  const hasClientSecret = !!process.env.ZOHO_CLIENT_SECRET;
  const hasRefreshToken = !!process.env.ZOHO_REFRESH_TOKEN;
  const allConfigured = hasClientId && hasClientSecret && hasRefreshToken;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>XLNC - Zoho Integration</title>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <div class="logo">XLNC</div>
            <div class="subtitle">Divine Agentic Intelligence System</div>
          </div>

          <h2>Integration Status</h2>

          <ul class="status-list">
            <li class="status-item">
              <span class="status-icon ${hasClientId ? 'success' : 'error'}"></span>
              <span class="status-label">Client ID</span>
              <span class="status-value">${hasClientId ? 'Configured' : 'Missing'}</span>
            </li>
            <li class="status-item">
              <span class="status-icon ${hasClientSecret ? 'success' : 'error'}"></span>
              <span class="status-label">Client Secret</span>
              <span class="status-value">${hasClientSecret ? 'Configured' : 'Missing'}</span>
            </li>
            <li class="status-item">
              <span class="status-icon ${hasRefreshToken ? 'success' : 'warning'}"></span>
              <span class="status-label">Refresh Token</span>
              <span class="status-value">${hasRefreshToken ? 'Connected' : 'Pending'}</span>
            </li>
          </ul>

          ${allConfigured ? `
            <a href="/test" class="btn btn-success">Test Connection</a>
          ` : `
            <a href="/authorize" class="btn btn-primary">Connect Zoho Account</a>
          `}

          ${hasRefreshToken ? `
            <a href="/authorize" class="btn btn-secondary">Reconnect Account</a>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/authorize', (req, res) => {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const redirectUri = process.env.ZOHO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>XLNC - Configuration Error</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card text-center">
            <div class="error-icon">⚠</div>
            <h2 class="text-error">Configuration Missing</h2>
            <p class="text-muted">Please add ZOHO_CLIENT_ID and ZOHO_REDIRECT_URI to your .env file</p>
            <a href="/" class="btn btn-secondary" style="margin-top: 24px;">← Back</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  const url = new URL('https://accounts.zoho.com/oauth/v2/auth');
  url.searchParams.set('scope', ZOHO_SCOPES);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('prompt', 'consent');

  console.log('Redirecting to Zoho OAuth...');
  res.redirect(url.toString());
});

app.get('/api/auth/zoho/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>XLNC - Authorization Error</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card text-center">
            <div class="error-icon">×</div>
            <h2 class="text-error">Authorization Failed</h2>
            <p style="color: #94a3b8; margin-bottom: 8px;">${error}</p>
            <p class="text-muted">${error_description || 'Please try again'}</p>
            <a href="/authorize" class="btn btn-primary" style="margin-top: 24px;">Try Again</a>
            <a href="/" class="btn btn-secondary">← Back</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  if (!code) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>XLNC - No Code</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card text-center">
            <div class="error-icon">?</div>
            <h2>No Authorization Code</h2>
            <p class="text-muted">No code was received from Zoho</p>
            <a href="/authorize" class="btn btn-primary" style="margin-top: 24px;">Try Again</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', process.env.ZOHO_CLIENT_ID!);
    params.append('client_secret', process.env.ZOHO_CLIENT_SECRET!);
    params.append('redirect_uri', process.env.ZOHO_REDIRECT_URI!);
    params.append('code', code as string);

    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);
    const { refresh_token, access_token, expires_in, api_domain } = response.data;

    if (refresh_token) {
      console.log('\\n' + '═'.repeat(60));
      console.log('  SUCCESS! Add this to your .env file:');
      console.log('═'.repeat(60));
      console.log(`\\n  ZOHO_REFRESH_TOKEN=${refresh_token}\\n`);
      console.log('═'.repeat(60) + '\\n');

      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>XLNC - Connected</title>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="success-icon">&#10003;</div>
                <div class="logo">Connected</div>
                <p class="subtitle">Zoho CRM & Calendar Linked</p>
              </div>

              <div class="token-box">
                <div class="token-label">Add to .env file</div>
                <div class="token-value" id="tokenValue">ZOHO_REFRESH_TOKEN=${refresh_token}</div>
              </div>

              <button onclick="copyToken()" class="btn btn-primary" id="copyBtn">Copy to Clipboard</button>

              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">API Domain</div>
                  <div class="info-value">${api_domain || 'zohoapis.com'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Token Expires</div>
                  <div class="info-value">${Math.round((expires_in || 3600) / 60)} min</div>
                </div>
              </div>

              <div class="divider"></div>

              <h2>Next Steps</h2>
              <div class="steps">
                <div class="step">
                  <div class="step-number">1</div>
                  <div class="step-text">Copy the token above and add it to <code>.env</code></div>
                </div>
                <div class="step">
                  <div class="step-number">2</div>
                  <div class="step-text">Restart the backend server</div>
                </div>
                <div class="step">
                  <div class="step-number">3</div>
                  <div class="step-text">Get your Calendar ID from Zoho Calendar settings</div>
                </div>
              </div>

              <a href="/" class="btn btn-secondary">Back to Dashboard</a>
            </div>
          </div>

          <script>
            function copyToken() {
              const token = 'ZOHO_REFRESH_TOKEN=${refresh_token}';
              navigator.clipboard.writeText(token).then(() => {
                const btn = document.getElementById('copyBtn');
                btn.textContent = 'Copied';
                setTimeout(() => {
                  btn.textContent = 'Copy to Clipboard';
                }, 2000);
              });
            }
          </script>
        </body>
        </html>
      `);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>XLNC - Already Connected</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="card text-center">
              <div class="success-icon" style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(202, 138, 4, 0.1) 100%);">⚡</div>
              <h2 style="color: #eab308;">Already Authorized</h2>
              <p style="color: #94a3b8; margin-bottom: 24px;">No new refresh token was issued.</p>
              <p class="text-muted">To get a new token, revoke access at <a href="https://api-console.zoho.com" target="_blank" style="color: #818cf8;">Zoho API Console</a> and try again.</p>
              <a href="/" class="btn btn-secondary" style="margin-top: 24px;">← Back</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }
  } catch (err: any) {
    const errorMsg = err.response?.data?.error || err.message;
    console.error('Token exchange error:', errorMsg);

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>XLNC - Error</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card text-center">
            <div class="error-icon">×</div>
            <h2 class="text-error">Token Exchange Failed</h2>
            <p style="color: #94a3b8;">${errorMsg}</p>
            <p class="text-muted">Check that your redirect URI matches exactly in Zoho API Console</p>
            <a href="/authorize" class="btn btn-primary" style="margin-top: 24px;">Try Again</a>
            <a href="/" class="btn btn-secondary">← Back</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

app.get('/test', async (req, res) => {
  if (!process.env.ZOHO_REFRESH_TOKEN) {
    return res.redirect('/');
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', process.env.ZOHO_CLIENT_ID!);
    params.append('client_secret', process.env.ZOHO_CLIENT_SECRET!);
    params.append('refresh_token', process.env.ZOHO_REFRESH_TOKEN!);

    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>XLNC - Connection Test</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <div class="success-icon">&#10003;</div>
              <div class="logo">Active</div>
              <p class="subtitle">Connection Verified</p>
            </div>

            <div class="info-grid" style="margin-top: 32px;">
              <div class="info-item">
                <div class="info-label">API Domain</div>
                <div class="info-value">${response.data.api_domain || 'zohoapis.com'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Token Valid For</div>
                <div class="info-value">${Math.round((response.data.expires_in || 3600) / 60)} minutes</div>
              </div>
            </div>

            <a href="/" class="btn btn-secondary" style="margin-top: 32px;">Back</a>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err: any) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>XLNC - Connection Failed</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <div class="error-icon">&#10005;</div>
              <div class="logo">Failed</div>
              <p class="subtitle">Connection Error</p>
            </div>
            <p style="color: #888; text-align: center; margin: 24px 0;">${err.response?.data?.error || err.message}</p>
            <p class="text-muted" style="text-align: center;">Your refresh token may have expired</p>
            <a href="/authorize" class="btn btn-primary" style="margin-top: 24px;">Reconnect</a>
            <a href="/" class="btn btn-secondary">Back</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║   ██╗  ██╗██╗     ███╗   ██╗ ██████╗                   ║');
  console.log('║   ╚██╗██╔╝██║     ████╗  ██║██╔════╝                   ║');
  console.log('║    ╚███╔╝ ██║     ██╔██╗ ██║██║                        ║');
  console.log('║    ██╔██╗ ██║     ██║╚██╗██║██║                        ║');
  console.log('║   ██╔╝ ██╗███████╗██║ ╚████║╚██████╗                   ║');
  console.log('║   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝ ╚═════╝                   ║');
  console.log('║                                                        ║');
  console.log('║   Divine Agentic Intelligence System                   ║');
  console.log('║   OAuth Configuration Server                           ║');
  console.log('║                                                        ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║                                                        ║');
  console.log(`║   Open: http://localhost:${PORT}                          ║`);
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
});
