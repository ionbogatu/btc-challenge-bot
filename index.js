const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

const logFileDate = new Date();
const logFileName = 'log_' + logFileDate.getFullYear() + '-' + (logFileDate.getMonth() + 1) + '-' + logFileDate.getDate() + '_' + logFileDate.getHours() + '-' + logFileDate.getMinutes() + '-' + logFileDate.getSeconds() + '.' + logFileDate.getMilliseconds() + '.log';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

(async () => {
    logToFile('====================================================');
    logToFile('Bot started');

    let browser;

    try {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });

        logToFile('Browser started successfully');
    } catch (error) {
        logToFile('Failed launching Browser ' + error);
    }

    let bitcoinPrice;

    /* setInterval(async () => {
        try {
            const pricePage = await browser.newPage();

            logToFile('Open price page');

            await pricePage.goto('https://coinmarketcap.com/', {
                waitUntil: 'networkidle0',
            });

            logToFile('Look for BTC');

            const bitcoinPriceTag = await pricePage.$('a[href="/currencies/bitcoin/markets/"]');

            if (bitcoinPriceTag) {
                if (bitcoinPrice && bitcoinPrice >= 20000) {
                    logToFile('YOU WON!');
                    process.exit(0);
                } else {
                    const bitcoinPriceString = await bitcoinPriceTag.evaluate(e => e.innerText);
                    const thenum = parseFloat(bitcoinPriceString.replace( /^\D+/g, '').replace(',', ''));

                    if (!isNaN(thenum) && thenum >= 16000) {
                        logToFile('Bitcoin is at ' + thenum);
                        bitcoinPrice = thenum;
                    } else {
                        throw new Error('Unable to parse bitcoin price');
                    }
                }
            } else {
                throw new Error('Unable to get bitcoin price');
            }

            await pricePage.close();
        } catch (error) {
            logToFile('Error at get bitcoin price ' + error);
            bitcoinPrice = null;
            await takeScreenShotAndHtml(pricePage);
        }
    }, 1000 * 59); // every 60 seconds */

    try {
        // setInterval(async () => {
            const date = new Date();
            // if (date.getMinutes() === 59 && bitcoinPrice && bitcoinPrice < 20000) {
                logToFile('Current Bitcoin price: ' + bitcoinPrice);
                await changePrediction(browser, date);
            // }
        // }, 1000 * 30) // every 30 seconds
    } catch (error) {
        logToFile('Changing prediction failed ' + error);
        clearInterval(interval);
    }
})();

function logToFile(message) {
    const logDate = new Date();
    const prefix = '[' + logDate.getFullYear() + '-' + (logDate.getMonth() + 1) + '-' + logDate.getDate() + ' ' + logDate.getHours() + ':' + logDate.getMinutes() + ':' + logDate.getSeconds() + '.' + logDate.getMilliseconds() + ']';

    fs.writeFileSync(path.join(__dirname, logFileName), prefix + ' ' + message + '\n', {flag: 'a+'});
}

async function changePrediction(browser, now) {
    const page = await browser.newPage();

    logToFile('New page created');

    await page.goto('https://coinmarketcap.com/bitcoin-price-prediction/', {
        waitUntil: 'networkidle0',
    });

    logToFile('Navigated to bitcoin-price-predictions page');

    const loginButton = await page.$(".loadingWrapper___1LW0Q button.sc-1ejyco6-0.zUezT");

    if (loginButton !== null) {
        logToFile('First login button found');

        await loginButton.click();

        logToFile('Clicked on first login button');

        await page.waitForNavigation({
            waitUntil: 'networkidle0',
        });

        logToFile('Loaded login input');

        logToFile('Search for next login button');

        const nextLoginButton = await page.$("button.eTqYOE");

        if (nextLoginButton !== null) {
            logToFile('Next login button found');

            await page.focus('input[type=email]');
            await page.keyboard.type('');

            logToFile('Inserted login');

            await page.focus('input[type=password]');
            await page.keyboard.type('');

            logToFile('Inserted password');

            logToFile('Clicked on next login button');

            await nextLoginButton.click();

            await page.waitForNavigation({
                waitUntil: 'networkidle0',
            });

            const binanceId = await page.$('input.cxm5lu-0.dBVGER');

            if (binanceId) {
                logToFile('Logged in successfully!');
                await changeCurrentHourPrediction(page, now);
            } else {
                logToFile('Login failed!');
                await takeScreenShotAndHtml(page);
            }
        } else {
            logToFile('Next login button not found');
            await takeScreenShotAndHtml(page);
        }
    } else {
        logToFile('First login button not found');
        await takeScreenShotAndHtml(page);
    }

    await page.close();
}

async function takeScreenShotAndHtml(page) {
    try {
        const screenshotDate = new Date();
        const screenshotFileName = 'screenshot_' + screenshotDate.getFullYear() + '-' + (screenshotDate.getMonth() + 1) + '-' + screenshotDate.getDate() + '_' + screenshotDate.getHours() + '-' + screenshotDate.getMinutes() + '-' + screenshotDate.getSeconds() + '.' + screenshotDate.getMilliseconds() + '.png';

        await page.screenshot({ path: path.join(__dirname, screenshotFileName), fullPage: true});

        const htmlFileName = 'html_' + screenshotDate.getFullYear() + '-' + (screenshotDate.getMonth() + 1) + '-' + screenshotDate.getDate() + '_' + screenshotDate.getHours() + '-' + screenshotDate.getMinutes() + '-' + screenshotDate.getSeconds() + '.' + screenshotDate.getMilliseconds() + '.html';
        const html = await page.content();
        
        fs.writeFileSync(path.join(__dirname, htmlFileName), html, {flag: 'w+'});

        logToFile('Screenshot and html saved');
    } catch (error) {
        logToFile('Taking screenshot and html error ' + error);
    }
}

/* async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
} */

async function changeCurrentHourPrediction(page, now) {
    const firstPredictionBlock = await page.$(".predictionBlock___3a9cL");

    if (firstPredictionBlock) {
        await firstPredictionBlock.click();

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 2000);
        });

        const datePicker = await page.$('.modalWrpper___3xHIS input');

        if (datePicker) {
            await datePicker.focus();

            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 2000);
            });

            const nextInterval = moment(now).add('1', 'h');
            const date = nextInterval.date();
            const hours = (nextInterval.hours() >= 10 ? nextInterval.hours() : '0' + nextInterval.hours()) + ':00';

            logToFile('Added 1 hour. Looking for ' + date + ' @ ' + hours);

            debugger;

            const selectedMonth = await page.$('.modalWrpper___3xHIS .react-datepicker__current-month');

            if (selectedMonth) {
                let selectedMonthText = await selectedMonth.evaluate(e => {
                    const innerText = e.innerText
                    return innerText.substring(0, innerText.length - 5);
                });

                while (months[nextInterval.month()] !== selectedMonthText) {
                    selectedMonthText = await selectedMonth.evaluate(e => {
                        const innerText = e.innerText
                        return innerText.substring(0, innerText.length - 5);
                    });

                    const nextButton = await page.$('.modalWrpper___3xHIS .react-datepicker__navigation--next');

                    if (nextButton) {
                        await nextButton.click();
                    } else {
                        logToFile('Unable to locate the next month button');
                        await takeScreenShotAndHtml(page);
                        break;
                    }
                }



                debugger;
            } else {
                logToFile('Unable to locate the month');
                await takeScreenShotAndHtml(page);
            }

            // await page.$('.modalWrpper___3xHIS');

            /* const selectedHour = await page.$('.modalWrpper___3xHIS .react-datepicker__time-list-item--selected');

            if (selectedHour) {
                const hour = new Date().getHours() < 10 ? '0' + new Date().getHours() : new Date().getHours();
                if (selectedHour.innerText === hour + ":00") {
                    return;
                }
            } */

            /* const allHours = await page.$$('.modalWrpper___3xHIS .react-datepicker__time-list-item');

            const nextHour = (new Date().getHours() + 1) < 10 ? '0' + new Date().getHours() + 1 : (new Date().getHours() + 1 < 24 ? new Date().getHours() + 1 : '00' );
            for (const hourHandler of allHours) {
                await new Promise((resolve) => {
                    const isCurrentHour = await hourHandler.evaluate(e => e.innerText === nextHour + ':00');

                    if (isCurrentHour) {
                        await hourHandler.click();
                        resolve();
                        break;
                    } else {
                        resolve();
                    }
                })
            } */
        } else {
            logToFile('Unable to locate the date picker');
            await takeScreenShotAndHtml(page);
        }
    } else {
        logToFile('Unable to get the first prediction block');
        await takeScreenShotAndHtml(page);
    }
}