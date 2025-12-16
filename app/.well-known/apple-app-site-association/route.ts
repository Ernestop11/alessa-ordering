import { NextResponse } from 'next/server';

/**
 * Apple App Site Association file for Universal Links
 * 
 * This file tells iOS which app to open when users click links to your domain.
 * 
 * IMPORTANT: 
 * - Replace TEAM_ID with your actual Apple Developer Team ID
 * - You can find your Team ID in Apple Developer portal: https://developer.apple.com/account
 * - Or in Xcode: Preferences → Accounts → Select your team → Team ID
 * 
 * The file must be accessible at:
 * https://alessacloud.com/.well-known/apple-app-site-association
 * https://*.alessacloud.com/.well-known/apple-app-site-association
 */
export async function GET() {
  // TODO: Replace TEAM_ID with your actual Apple Developer Team ID
  // Format: TEAM_ID.com.alessa.ordering
  // Example: ABC123DEF4.com.alessa.ordering
  const teamId = process.env.APPLE_TEAM_ID || 'TEAM_ID';
  const appId = `${teamId}.com.alessa.ordering`;

  const association = {
    applinks: {
      apps: [],
      details: [
        {
          appID: appId,
          paths: [
            '*',
            '/admin/fulfillment*',
            '/admin/*',
            '/order*',
            '/customer/*',
          ],
        },
      ],
    },
    webcredentials: {
      apps: [appId],
    },
  };

  return NextResponse.json(association, {
    headers: {
      'Content-Type': 'application/json',
      // Important: iOS requires this to be served over HTTPS
      // and without a file extension
    },
  });
}

