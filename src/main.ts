import * as puppeteer from 'puppeteer';
import { SITE_URL } from './globals';
import { wait } from './helpers/time';
import { Page } from 'puppeteer';
import { solveMathEquation } from './math';

async function start(page: Page) {
  const selector = '.start.is-armed';
  await page.waitForSelector(selector);
  await page.click(selector);

  async function resolve(iteration = 1) {
    if (iteration >= 5) return;

    const numbersSelector = '.numbers';
    const operatorSelector = '.operator';

    await Promise.all([
      page.waitForSelector(numbersSelector),
      page.waitForSelector(operatorSelector),
    ]);

    console.log('After waiting for selectors');

    const values = await page.evaluate(() => {
      const numbers = document.querySelector('.numbers');
      const divs = [...numbers.querySelectorAll('div')];
      return divs.map((value) => value.innerText);
    });

    console.log('values', values);

    const operator = await page.$eval(operatorSelector, (el) => el.innerHTML);
    console.log('operator', operator);

    const numberValues = values.map((v) => parseInt(v));
    const result = solveMathEquation(operator, numberValues);

    console.log('result', result);
    await page.keyboard.type(result.toString());
    await wait(1000);
    await resolve(++iteration);
  }

  await resolve(1);
}

async function startBrowser() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.on('console', (msg) => {
    console.log('Page log:', msg.text());
  });

  await page.goto(SITE_URL);

  await start(page);
}


startBrowser();
