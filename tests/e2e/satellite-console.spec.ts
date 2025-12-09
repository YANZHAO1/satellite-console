import { test, expect, Page } from '@playwright/test';

test.describe('Satellite Console Integration Tests', () => {
  let businessPage: Page;
  let satellitePage: Page;

  test.beforeEach(async ({ context }) => {
    businessPage = await context.newPage();
  });

  test.afterEach(async () => {
    if (satellitePage && !satellitePage.isClosed()) {
      await satellitePage.close();
    }
    if (businessPage && !businessPage.isClosed()) {
      await businessPage.close();
    }
  });

  test('should inject script and communicate with satellite window', async ({ context }) => {
    await businessPage.goto('/examples/basic.html');

    const satellitePagePromise = context.waitForEvent('page');
    satellitePage = await satellitePagePromise;
    await satellitePage.waitForLoadState('load');

    // Generate a log and wait for it to appear
    await businessPage.evaluate(() => {
      console.log('Test message from business page');
    });

    await satellitePage.waitForSelector('.log-entry:has-text("Test message from business page")', { timeout: 10000 });

    const logContent = await satellitePage.textContent('#log-container');
    expect(logContent).toContain('Test message from business page');
  });

  test('should display logs from multiple pages', async ({ context }) => {
    const page1 = await context.newPage();
    await page1.goto('/examples/multi-page/page1.html');

    const satellitePagePromise = context.waitForEvent('page');
    satellitePage = await satellitePagePromise;
    await satellitePage.waitForLoadState('load');
    await page1.waitForTimeout(1000);

    await page1.evaluate(() => {
      console.log('[Page1] First page log');
    });
    await satellitePage.waitForSelector('.log-entry:has-text("[Page1] First page log")', { timeout: 10000 });

    const page2 = await context.newPage();
    await page2.goto('/examples/multi-page/page2.html');
    await page2.waitForLoadState('load');
    await page2.waitForTimeout(1000);

    await page2.evaluate(() => {
      console.log('[Page2] Second page log');
    });
    await satellitePage.waitForSelector('.log-entry:has-text("[Page2] Second page log")', { timeout: 10000 });

    const page3 = await context.newPage();
    await page3.goto('/examples/multi-page/page3.html');
    await page3.waitForLoadState('load');
    await page3.waitForTimeout(1000);

    await page3.evaluate(() => {
      console.log('[Page3] Third page log');
    });
    await satellitePage.waitForSelector('.log-entry:has-text("[Page3] Third page log")', { timeout: 10000 });

    const logContent = await satellitePage.textContent('#log-container');
    expect(logContent).toContain('[Page1] First page log');
    expect(logContent).toContain('[Page2] Second page log');
    expect(logContent).toContain('[Page3] Third page log');

    await page1.close();
    await page2.close();
    await page3.close();
  });

  test('should handle satellite window close and reopen', async ({ context }) => {
    await businessPage.goto('/examples/basic.html');

    const satellitePagePromise = context.waitForEvent('page');
    satellitePage = await satellitePagePromise;
    await satellitePage.waitForLoadState('load');

    await businessPage.evaluate(() => {
      console.log('Log before close');
    });
    await satellitePage.waitForSelector('.log-entry:has-text("Log before close")', { timeout: 10000 });

    let logContent = await satellitePage.textContent('#log-container');
    expect(logContent).toContain('Log before close');

    await satellitePage.close();
    await businessPage.waitForTimeout(500);

    await businessPage.evaluate(() => {
      console.log('Log while closed');
    });

    const newSatellitePagePromise = context.waitForEvent('page');
    await businessPage.evaluate(() => {
      (window as any).SatelliteConsole.launch({ width: 900, height: 700 });
    });

    satellitePage = await newSatellitePagePromise;
    await satellitePage.waitForLoadState('load');

    await businessPage.evaluate(() => {
      console.log('Log after reopen');
    });
    await satellitePage.waitForSelector('.log-entry:has-text("Log after reopen")', { timeout: 10000 });

    logContent = await satellitePage.textContent('#log-container');
    expect(logContent).toContain('Log after reopen');
  });

  test('should filter logs by search text', async ({ context }) => {
    await businessPage.goto('/examples/basic.html');

    const satellitePagePromise = context.waitForEvent('page');
    satellitePage = await satellitePagePromise;
    await satellitePage.waitForLoadState('load');

    await businessPage.evaluate(() => {
      console.log('Apple fruit');
      console.log('Banana fruit');
      console.log('Cherry fruit');
      console.log('Dog animal');
      console.log('Elephant animal');
    });

    await satellitePage.waitForSelector('.log-entry:has-text("Elephant")', { timeout: 10000 });

    await satellitePage.fill('#search-input', 'fruit');
    await satellitePage.waitForTimeout(500);

    const logEntries = await satellitePage.$$('.log-entry');
    const visibleTexts: string[] = [];
    
    for (const entry of logEntries) {
      const isVisible = await entry.isVisible();
      if (isVisible) {
        const text = await entry.textContent();
        if (text) visibleTexts.push(text);
      }
    }

    expect(visibleTexts.some(log => log.includes('Apple'))).toBeTruthy();
    expect(visibleTexts.some(log => log.includes('Banana'))).toBeTruthy();
    expect(visibleTexts.some(log => log.includes('Cherry'))).toBeTruthy();
    expect(visibleTexts.some(log => log.includes('Dog'))).toBeFalsy();
    expect(visibleTexts.some(log => log.includes('Elephant'))).toBeFalsy();
  });

  test('should filter logs by page source', async ({ context }) => {
    const page1 = await context.newPage();
    await page1.goto('/examples/multi-page/page1.html');

    const satellitePagePromise = context.waitForEvent('page');
    satellitePage = await satellitePagePromise;
    await satellitePage.waitForLoadState('load');
    await page1.waitForTimeout(1000);

    await page1.evaluate(() => {
      console.log('[Page1] User management log');
    });
    await satellitePage.waitForSelector('.log-entry:has-text("[Page1] User management log")', { timeout: 10000 });

    const page2 = await context.newPage();
    await page2.goto('/examples/multi-page/page2.html');
    await page2.waitForLoadState('load');
    await page2.waitForTimeout(1000);

    await page2.evaluate(() => {
      console.log('[Page2] Order management log');
    });
    await satellitePage.waitForSelector('.log-entry:has-text("[Page2] Order management log")', { timeout: 10000 });

    const sourceSelect = await satellitePage.$('#source-filter');
    if (sourceSelect) {
      const options = await sourceSelect.$$('option');
      
      if (options.length > 1) {
        const firstPageValue = await options[1].getAttribute('value');
        if (firstPageValue) {
          await satellitePage.selectOption('#source-filter', firstPageValue);
          await satellitePage.waitForTimeout(500);

          const logContent = await satellitePage.textContent('#log-container');
          expect(logContent).toContain('[Page1]');
        }
      }
    }

    await page1.close();
    await page2.close();
  });

  test('should clear all logs when clear button is clicked', async ({ context }) => {
    await businessPage.goto('/examples/basic.html');

    const satellitePagePromise = context.waitForEvent('page');
    satellitePage = await satellitePagePromise;
    await satellitePage.waitForLoadState('load');

    await businessPage.evaluate(() => {
      console.log('Log 1');
      console.log('Log 2');
      console.log('Log 3');
    });

    await satellitePage.waitForSelector('.log-entry:has-text("Log 3")', { timeout: 10000 });

    let logEntries = await satellitePage.$$('.log-entry');
    const initialCount = logEntries.length;
    expect(initialCount).toBeGreaterThan(0);

    await satellitePage.click('#clear-btn');
    await satellitePage.waitForTimeout(1000);

    // Check if empty state is visible or no log entries exist
    const emptyState = await satellitePage.$('#empty-state');
    const isEmptyStateVisible = emptyState ? await emptyState.isVisible() : false;
    
    logEntries = await satellitePage.$$('.log-entry');
    
    // Either empty state should be visible or no log entries should exist
    expect(isEmptyStateVisible || logEntries.length === 0).toBeTruthy();

    await businessPage.evaluate(() => {
      console.log('New log after clear');
    });
    await satellitePage.waitForSelector('.log-entry:has-text("New log after clear")', { timeout: 10000 });

    const logContent = await satellitePage.textContent('#log-container');
    expect(logContent).toContain('New log after clear');
  });

  test('should display different log levels with correct styling', async ({ context }) => {
    await businessPage.goto('/examples/basic.html');

    const satellitePagePromise = context.waitForEvent('page');
    satellitePage = await satellitePagePromise;
    await satellitePage.waitForLoadState('load');

    await businessPage.evaluate(() => {
      console.log('Info log');
      console.warn('Warning log');
      console.error('Error log');
    });

    await satellitePage.waitForSelector('.log-entry:has-text("Error log")', { timeout: 10000 });

    const logEntries = await satellitePage.$$('.log-entry');
    
    let hasLogLevel = false;
    let hasWarnLevel = false;
    let hasErrorLevel = false;

    for (const entry of logEntries) {
      const className = await entry.getAttribute('class');
      if (className?.includes('log-level-log')) hasLogLevel = true;
      if (className?.includes('log-level-warn')) hasWarnLevel = true;
      if (className?.includes('log-level-error')) hasErrorLevel = true;
    }

    expect(hasLogLevel).toBeTruthy();
    expect(hasWarnLevel).toBeTruthy();
    expect(hasErrorLevel).toBeTruthy();
  });

  test('should handle complex objects and arrays', async ({ context }) => {
    await businessPage.goto('/examples/basic.html');

    const satellitePagePromise = context.waitForEvent('page');
    satellitePage = await satellitePagePromise;
    await satellitePage.waitForLoadState('load');

    await businessPage.evaluate(() => {
      console.log('Complex object:', {
        name: 'Test',
        value: 123,
        nested: {
          level1: {
            level2: 'deep value'
          }
        },
        array: [1, 2, 3, 4, 5]
      });
    });

    await satellitePage.waitForSelector('.log-entry:has-text("Complex object")', { timeout: 10000 });

    const logContent = await satellitePage.textContent('#log-container');
    expect(logContent).toContain('Complex object');
  });
});
