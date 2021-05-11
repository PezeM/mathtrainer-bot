/**
 * Some predefined delays (in milliseconds).
 */
import puppeteer from 'puppeteer/lib/cjs/puppeteer/node-puppeteer-core';
import { SITE_URL } from './globals';

async function browser() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.on('console', (msg) => {
    console.log('Page log:', msg.text());
  });

  await page.goto(SITE_URL);

  const selector = '.start.is-armed';
  await page.waitForSelector(selector);
  await page.click(selector);

  const numbersSelector = '.numbers';
  const operatorSelector = '.operator';

  await Promise.all([
    page.waitForSelector(numbersSelector),
    page.waitForSelector(operatorSelector)
  ]);

  console.log('After waiting for selectors');

  const values = await page.evaluate(() => {
    const numbers = document.querySelector('.numbers');
    const divs = [...numbers.querySelectorAll('div')];
    return divs.map(value => value.innerText);
  });

  console.log('values', values);

  const operator = await page.$eval(operatorSelector, el => el.innerHTML);
  console.log('operator', operator);

  const numberValues = values.map(v => parseInt(v));

  let result = 0;
  switch (operator) {
    case '+':
      result = numberValues[0] + numberValues[1];
      break;
    case '-':
      result = numberValues[0] - numberValues[1];
      break;
    case '*':
      result = numberValues[0] * numberValues[1];
      break;
    case '/':
      result = numberValues[0] / numberValues[1];
      break;
    default:
      console.log('Wrong operator', operator);
      break;
  }

  console.log('result', result);
  await page.keyboard.type(result.toString());
}

browser();
