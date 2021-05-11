import * as puppeteer from 'puppeteer';
import {
  BLOCKED_DOMAINS,
  MINIMAL_ARGS,
  SITE_URL,
  START_BUTTON_SELECTOR,
} from './globals';
import { wait } from './helpers/time';
import { Browser, Page } from 'puppeteer';
import { solveMathEquation } from './math';
import { getRandomNumber } from './helpers/math';

/**
 * Is on the main page
 * @param page
 * @param timeout Time in ms to timeout waiting for selector
 */
async function isOnMainPage(page: Page, timeout = 2000) {
  try {
    const result = await page.waitForSelector(START_BUTTON_SELECTOR, {
      timeout,
    });
    return !!result;
  } catch (e) {
    return false;
  }
}

async function clickStartGameButton(page: Page) {
  await page.waitForSelector(START_BUTTON_SELECTOR);
  await page.click(START_BUTTON_SELECTOR);
}

async function getMathEquationSymbols(page: Page) {
  const numbersSelector = '.numbers';
  const operatorSelector = '.operator';

  await page.waitForSelector(numbersSelector);

  const values = await page.evaluate(() => {
    const numbers = document.querySelector('.numbers');
    const divs = [...numbers.querySelectorAll('div')];
    return divs.map((value) => {
      const text = value.innerText.trim().replace(/&nbsp;/g, '');
      return parseInt(text);
    });
  });

  const operator = await page.$eval(operatorSelector, (el) => el.innerHTML);
  console.log('operator', operator);
  console.log('numberValues', values);

  return { values, operator };
}

async function collectStatistics(page: Page) {
  const percentileSelector = '.percentile-overall-number';
  const currentLevelSelector = '.metric-value-large';

  await Promise.all([
    page.waitForSelector(percentileSelector),
    page.waitForSelector(currentLevelSelector),
  ]);

  const lastSubmissionPercentile = await page.$eval(percentileSelector, (el) =>
    parseInt(el.innerHTML),
  );

  const currentLevel = await page.$eval(currentLevelSelector, (el) =>
    parseInt(el.innerHTML),
  );

  console.log(
    `Stats: level - ${currentLevel} percentile - ${lastSubmissionPercentile}%`,
  );

  return { currentLevel, lastSubmissionPercentile };
}

async function startNewGame(page: Page) {
  async function resolveMath() {
    const { values, operator } = await getMathEquationSymbols(page);
    const result = solveMathEquation(operator, values);

    console.log('result', result);
    await page.keyboard.type(result.toString(), { delay: 10 });
    await startNewGame(page);
  }

  const start = Date.now();
  await wait(getRandomNumber(200, 700));
  const mainPage = await isOnMainPage(page, 2000);
  if (mainPage) {
    console.log('Is on main page, finishing run');
    // Finished game, return from function
    return;
  }

  console.log("After wait on main page", Date.now() - start);

  try {
    await resolveMath();
  } catch (e) {
    console.error(e);
    return;
  }
}

async function start(page: Page, browser: Browser) {
  let tries = 1;
  while (tries < 100) {
    console.log(`Started ${tries} try`);
    await clickStartGameButton(page);
    await startNewGame(page);
    await collectStatistics(page);
    console.log(`Completed ${tries} try`);
    tries++;
  }

  console.log('Closing browser');
  await browser.close();
}

async function startBrowser() {
  const browser = await puppeteer.launch({
    headless: false,
    args: MINIMAL_ARGS,
  });
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    if (request.resourceType() === 'image') request.abort();
    else if (BLOCKED_DOMAINS.some((d) => url.includes(d))) request.abort();
    else request.continue();
  });

  // page.on('console', (msg) => {
  //   console.log('Page log:', msg.text());
  // });

  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

  await start(page, browser);
}

startBrowser();
