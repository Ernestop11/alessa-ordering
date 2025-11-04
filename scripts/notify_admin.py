#!/usr/bin/env python3
"""Simple notifier for integration logs.

Reads latest IntegrationLog entries and prints them. In production, this could send
email or SMS alerts. For now, it demonstrates how to poll logs manually.
"""

import os
from datetime import datetime, timedelta

from prisma import Prisma

LOG_WINDOW_MINUTES = int(os.environ.get('LOG_WINDOW_MINUTES', '30'))

async def main():
    prisma = Prisma()
    await prisma.connect()

    since = datetime.utcnow() - timedelta(minutes=LOG_WINDOW_MINUTES)

    logs = await prisma.integrationlog.find_many(
        where={
            'created_at': {'gte': since},
            'level': {'in': ['error', 'warn']},
        },
        order={
            'created_at': 'desc'
        },
        take=50,
    )

    if not logs:
        print(f'No warnings or errors in the last {LOG_WINDOW_MINUTES} minutes.')
    else:
        for log in logs:
            print(f"[{log.created_at.isoformat()}] {log.source.upper()} {log.level.upper()}: {log.message}")
            if log.payload:
                print('  Payload:', log.payload)

    await prisma.disconnect()

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
