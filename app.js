const puppeteer = require('puppeteer');
const fs = require('fs');

// TODO: Load the credentials from the 'credentials.json' file
// HINT: Use the 'fs' module to read and parse the file
// const credentials = JSON.parse(fs.readFile('credentials.json', 'utf8'));

(async () => {
    const credentials = JSON.parse(await fs.promises.readFile('credentials.json', 'utf8'));

    // TODO: Launch a browser instance and open a new page
    const browser = await puppeteer.launch({ headless: false,
                                             executablePath: '/usr/bin/chromium',
                                             args: ['--no-sandbox', '--disable-setuid-sandbox'] 
                                          });
    const page = await browser.newPage();

    // Navigate to GitHub login page
    await page.goto('https://github.com/login');

    // TODO: Login to GitHub using the provided credentials
    // HINT: Use the 'type' method to input username and password, then click on the submit button
    const login_input = await page.$('#login_field');
    await login_input.type(credentials["username"]);
    const password_input = await page.$('#password');
    await password_input.type(credentials["password"]);
    const sign_in = await page.$('input[name="commit"]');
    await sign_in.click();
    // await TODO;

    // Wait for successful login
    await page.waitForSelector('.avatar.circle');

    // Extract the actual GitHub username to be used later
    const actualUsername = await page.$eval('meta[name="octolytics-actor-login"]', meta => meta.content);

    const repositories = ["cheeriojs/cheerio", "axios/axios", "puppeteer/puppeteer"];

    for (const repo of repositories) {
        await page.goto(`https://github.com/${repo}`);

        // TODO: Star the repository
        // HINT: Use selectors to identify and click on the star button
        let star_button = await page.$('button[data-aria-prefix="Star this repository"]');
        try {await star_button.click()} catch {}
        await new Promise(resolve => setTimeout(resolve, 500)); // This timeout helps ensure that the action is fully processed
    }

    // TODO: Navigate to the user's starred repositories page
    await page.goto('https://github.com/' + credentials["username"] + '?tab=stars');

    // TODO: Click on the "Create list" button
    const createListButton = await page.$('button[id^="dialog-show-dialog-"]');
    await createListButton.click();

    // TODO: Create a list named "Node Libraries"
    // HINT: Wait for the input field and type the list name
    await new Promise(resolve => setTimeout(resolve, 250))
    const list_name = await page.$('#user_list_name');
    await list_name.type('Node Libraries');
    const list_desc = await page.$('#user_list_description');
    await list_desc.type(":book:")

    // Wait for buttons to become visible
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Identify and click the "Create" button
    const buttons = await page.$$('.Button--primary.Button--medium.Button');
    for (const button of buttons) {
        const buttonText = await button.evaluate(node => node.textContent.trim());
        if (buttonText === 'Create') {
            await button.click();
            break;
        }
    }

    // Allow some time for the list creation process
    await new Promise(resolve => setTimeout(resolve, 2000));

    for (const repo of repositories) {
        await page.goto(`https://github.com/${repo}`);

        // TODO: Add this repository to the "Node Libraries" list
        // HINT: Open the dropdown, wait for it to load, and find the list by its name
        const dropdownSelector = await page.$('summary[aria-label="Add this repository to a list"]');
        await dropdownSelector.click();
        await page.waitForSelector('input.js-user-list-menu-item');
        // const listToAdd = await page.$('input.js-user-list-menu-item');
        // await listToAdd.click()
        const lists = await page.$$('.js-user-list-menu-form');

        for (const list of lists) {
          const textHandle = await list.getProperty('innerText');
          const text = await textHandle.jsonValue();
          if (text.includes('Node Libraries')) {
            await list.click();
            break;
          }
        }

        // Allow some time for the action to process
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Close the dropdown to finalize the addition to the list
        await dropdownSelector.click();
      }

    // Close the browser
    await browser.close();
})();
