const puppeteer = require('puppeteer');
const app = require('../index');
const fs = require('fs');

if (!fs.existsSync("e2e_screenshots")){
    fs.mkdirSync("e2e_screenshots");
}

(async () => {
    const browser = await puppeteer.launch();
    console.log("Browser opened.\n-----------------");

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768});

    /*
        Dansesben Tests
     */

    /*
        Test 1 - Page loads
     */

    console.log("Test 1 - Page loads")

    await page.goto('http://127.0.0.1:3000/dansesben/');
    await page.screenshot({ path: './e2e_screenshots/01.png' });

    console.log("Test 1 - Finished\n-----------------")

    /*
        Test 2 - Add element
     */

    console.log("Test 2 - Add Element")
    let initialRows = await page.$$eval('#data-table tr', rows => rows.length)

    await Promise.all([
        page.waitForSelector("#field-of-knowledge-input"), // Wait for an element of the modal
        page.click("#add-element"),
    ]);

    // Fill the modal
    console.log("Test 2 - Filling modal")
    await page.waitForTimeout(2000);
    await page.type('#field-of-knowledge-input', 'Puppeteer');
    await page.type('#year-input', '1990');
    await page.type('#performance-percents-input', '22.1%');
    await page.type('#credits-passed-input', '200');
    await page.type('#credits-enrolled-input', '500');
    await page.type('#center-input', 'Mozilla');
    // Submit the modal
    await page.screenshot({ path: './e2e_screenshots/02-01.png' });
    await page.click("#save-element");
    await page.waitForTimeout(2000);
    console.log("Test 2 - Counting rows")

    let endRows = await page.$$eval('#data-table tr', rows => rows.length)
    await page.screenshot({ path: './e2e_screenshots/02-02.png' });

    if(initialRows === endRows){
        console.error("Test 2 - Same number of rows");
        process.exit(1);
    }

    console.log("Test 2 - Finished\n-----------------");

    /*
        Test 3 - Edit Element
     */

    console.log("Test 3 - Edit element")
    let valueBeforeEdit =  await page.$eval('#data-table tbody tr:last-child td', el => el.innerText);

    await Promise.all([
        page.waitForNavigation(),
        page.click("#data-table tbody tr:last-child td:last-child Button"),
    ]);

    await page.screenshot({ path: './e2e_screenshots/03-01.png' });
    await page.type('#field-of-knowledge-input', 'Puppeteer');
    await page.click("#save-element");
    await page.waitForTimeout(2000);
    console.log("Test 3 - Check if element changed");

    let valueAfterEdit =  await page.$eval('#data-table tbody tr:last-child td', el => el.innerText);

    if(valueBeforeEdit === valueAfterEdit){
        console.error("Test 3 - Same value");
        process.exit(1);
    }

    await page.screenshot({ path: './e2e_screenshots/03-02.png' });
    console.log("Test 3 - Finished\n-----------------");
    /*
        Test 4 - Remove element
     */
    console.log("Test 4 - Remove element")
    initialRows = await page.$$eval('#data-table tr', rows => rows.length)

    await page.click("#data-table tbody tr:last-child td:last-child Button:last-child");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: './e2e_screenshots/04-01.png' });
    await page.click("Button");
    await page.waitForTimeout(2000);

    endRows = await page.$$eval('#data-table tr', rows => rows.length)

    if(initialRows === endRows){
        console.error("Test 4 - Same number of rows. Element not removed");
        process.exit(1);
    }

    await page.screenshot({ path: './e2e_screenshots/04-02.png' });
    console.log("Test 4 - Finished\n-----------------");
    /*
        Test 5 - Create 2 elements and delete all elements
    */
    console.log("Test 5 - Create 2 elements and delete all elements");

    // First we create two elements
    const createElement = async function(i){
        await Promise.all([
            page.waitForSelector("#field-of-knowledge-input"), // Wait for an element of the modal
            page.click("#add-element"),
        ]);

        await page.waitForTimeout(2000);
        await page.type('#field-of-knowledge-input', 'Puppeteer' + i);
        await page.type('#year-input', '1990');
        await page.type('#performance-percents-input', '22.1%');
        await page.type('#credits-passed-input', '200');
        await page.type('#credits-enrolled-input', '500');
        await page.type('#center-input', 'Mozilla');
        // Submit the modal
        await page.click("#save-element");
        await page.waitForTimeout(2000);
    };

    // Create two elements
    await createElement(22);
    await createElement(33);
    initialRows = await page.$$eval('#data-table tr', rows => rows.length)
    await page.screenshot({ path: './e2e_screenshots/05-01.png' });

    // Delete all elements
    await page.click("#delete-all");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: './e2e_screenshots/05-02.png' });
    await page.click("Button");
    await page.waitForTimeout(2000);
    endRows = await page.$$eval('#data-table tr', rows => rows.length)

    if(initialRows === endRows){
        console.error("Test 5 - Same number of rows. All elements not removed");
        process.exit(1);
    }

    await page.screenshot({ path: './e2e_screenshots/05-03.png' });
    console.log("Test 5 - Finished\n-----------------");

    /*
        Test 6 - Create 7 elements and change page
    */
    console.log("Test 6 - Create 7 elements and change page");

    for (const x of Array(6).keys()) {
        console.log("Test 6 - Creating element " + x);
        await createElement(x);
    }
    await page.screenshot({ path: './e2e_screenshots/06-01.png' });

    initialRows = await page.$$eval('#data-table tr', rows => rows.length)
    await page.click("#next-page");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: './e2e_screenshots/06-02.png' });
    endRows = await page.$$eval('#data-table tr', rows => rows.length)

    if(initialRows === endRows){
        console.error("Test 6 - Same number of rows. Page not changed");
        process.exit(1);
    }

    await page.click("#previus-page");
    await page.waitForTimeout(1000);

    console.log("Test 6 - Finished\n-----------------");

    /*
        Test 7 - Filter elements
    */

    console.log("Test 7 - Filter elements")
    await page.type("input", "Puppeteer1");
    await page.waitForTimeout(2000);
    endRows = await page.$$eval('#data-table tr', rows => rows.length)
    await page.screenshot({ path: './e2e_screenshots/07-01.png' });

    if(endRows !== 3){
        console.error("Test 7 - Filter doesn't works");
        process.exit(1);
    }

    console.log("Test 7 - Finished\n-----------------");

    console.log("Cleaning up...");

    // Delete all elements
    await page.click("#delete-all");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: './e2e_screenshots/05-02.png' });
    await page.click("Button");
    await page.waitForTimeout(2000);

    console.log("All OK.")

    /*
    End of Dansesben Tests
    */

    await browser.close();
    app.close();
})();