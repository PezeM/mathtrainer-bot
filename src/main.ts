import * as puppeteer from 'puppeteer';
import { SITE_URL, START_BUTTON_SELECTOR } from './globals';
import { wait } from './helpers/time';
import { Page } from 'puppeteer';
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

  await Promise.all([
    page.waitForSelector(numbersSelector),
    page.waitForSelector(operatorSelector),
  ]);

  const values = await page.evaluate(() => {
    const numbers = document.querySelector('.numbers');
    const divs = [...numbers.querySelectorAll('div')];
    return divs.map((value) => parseInt(value.innerText));
  });

  const operator = await page.$eval(operatorSelector, (el) => el.innerHTML);
  console.log('operator', operator);
  console.log('numberValues', values);

  return { values, operator };
}

async function startNewGame(page: Page) {
  async function resolveMath() {
    await wait(getRandomNumber(200, 350));
    const { values, operator } = await getMathEquationSymbols(page);
    const result = solveMathEquation(operator, values);

    console.log('result', result);
    await wait(getRandomNumber(200, 350));
    await page.keyboard.type(result.toString());
    await startNewGame(page);
  }

  await wait(getRandomNumber(100, 500));
  const mainPage = await isOnMainPage(page);
  if (mainPage) {
    console.log("Is on main page, finishing run");
    // Finished game, return from function
    return;
  }

  // Resolve math equation
  await resolveMath();
}

async function start(page: Page) {
  let tries = 1;
  while (tries < 100) {
    console.log(`Started ${tries} try`);
    await clickStartGameButton(page);
    await startNewGame(page);
    tries++;
    console.log(`Completed ${tries} try`);
  }
}

async function startBrowser() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  // page.on('console', (msg) => {
  //   console.log('Page log:', msg.text());
  // });

  await page.goto(SITE_URL);

  await start(page);
}

startBrowser();
