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
        ----------------------- CutsAPI Tests -----------------------
    */

        console.log("\n\n----------------------- CutsAPI Tests -----------------------");
    //   -------- Test 1 - PageCutsAPI loads 


    console.log("-- Test 1 - PageCutsAPI loads");

    await page.goto('http://127.0.0.1:3000/fraferbla1/');
    await page.screenshot({ path: './e2e_screenshots/cuts_api_01.png' });

    console.log("-- Test 1 - Finished\n-----------------");

    

    //  -------- Test 2 - The charging data, deleting data works and the table too?.

    console.log("-- Test 2 - The loadInitialData works and the table too?");
    await page.click("#link-to-cutstable",
        { waitUntil: "networkidle0" });

    page.on('dialog', async dialog => {
        dialog.accept();
    });
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './e2e_screenshots/cuts_api_02.png' });
    console.log("   The table works...");
    

    let rowInitialCount1 = (await page.$$('#cutsTable > tbody > tr')).length;
    

    if(rowInitialCount1 == 1) {
        console.log("   Checking charging data...");
        await page.click("#loadCutsButton");
        await page.waitForTimeout(1000);

        let rowLoadedCount1 = (await page.$$('#cutsTable > tbody > tr')).length;
        console.log("Amounts loaded:" + rowLoadedCount1);
        
        if(rowLoadedCount1 == rowInitialCount1) {
            console.log("Charging data doesn´t work. Exiting.");
            process.exit(1);
        }
        
        await page.screenshot({ path: './e2e_screenshots/cuts_api_02_1.png' });
        console.log(    "- OK");

        console.log("   Checking deleting data...");
        await page.click("#deleteCutsButton");
        await page.waitForTimeout(1000);
        let rowErasedCount1 = (await page.$$('#cutsTable > tbody > tr')).length;
        if(rowErasedCount1 != 1) {
            console.log("Deleting data doesn´t work. Exiting.");
            process.exit(1);
        }
        await page.screenshot({ path: './e2e_screenshots/cuts_api_02_2.png' });
        console.log(    "- OK");

    } else  {
        console.log("   Checking deleting data...");
        await page.click("#deleteCutsButton");

        await page.waitForTimeout(1000);
        let rowErasedCount1 = (await page.$$('#cutsTable > tbody > tr')).length;
        if(rowErasedCount1 != 1) {
            console.log("Deleting data doesn´t work. Exiting.");
            process.exit(1);
        }
        await page.screenshot({ path: './e2e_screenshots/cuts_api_02_2_2.png' });
        console.log(    "- OK");

        console.log("   Checking charging data...");
        await page.click("#loadCutsButton");

        await page.waitForTimeout(1000);

        let rowLoadedCount1 = (await page.$$('#cutsTable > tbody > tr')).length;
        
        if(rowLoadedCount1 == rowErasedCount1) {
            console.log("Charging data doesn´t work. Exiting.");
            process.exit(1);
        }
        await page.screenshot({ path: './e2e_screenshots/cuts_api_02_1_2.png' });
        console.log(    "- OK");
    }
    
    // Return to a normal state.
    console.log("   Returning to a normal state");
    await page.click("#deleteCutsButton");
    await page.waitForTimeout(1000);
    let return_normal_11 = (await page.$$('#cutsTable > tbody > tr')).length;

    if(return_normal_11 != 1) {
        console.log("Return to a normal state (delete) failed.")
        process.exit(1);
    }
    console.log("- Delete OK");
    await page.waitForTimeout(1000);
    await page.click("#loadCutsButton");
    await page.waitForTimeout(1000);
    let return_normal_22 = (await page.$$('#cutsTable > tbody > tr')).length;

    if(return_normal_22 == 1) {
        console.log("Return to a normal state (load) failed.")
        process.exit(1);
    }
    console.log("- Load OK");
    console.log("-- Test 2 - Finished\n-----------------");


    //  -------- Test 3 - Adding specific data.
    console.log("-- Test 3 - Adding specific data");

    let ActualRowsTest33 = (await page.$$('#cutsTable > tbody > tr')).length;

    // Typing an object.
    console.log("   Adding element...");
    await page.type('#degree_AddingCut', 'PUPPETEERADDED');
    await page.type('#year_AddingCut', '2018');
    await page.type('#cutoff_AddingCut', '7.22');
    await page.type('#selectpresented_AddingCut', '10000');
    await page.type('#price_AddingCut', '852.2');
    await page.type('#faculty_AddingCut', 'FPETER');
    await page.waitForTimeout(500);
    await page.screenshot({ path: './e2e_screenshots/cuts_api_03_1.png' });
    await page.click("#addCutButton");
    await page.waitForTimeout(1000);
    console.log("   Counting if the elements are +1");
    let AddedElementRowsTest33 = (await page.$$('#cutsTable > tbody > tr')).length;

    if(AddedElementRowsTest33 != ActualRowsTest33 + 1) {
        console.log("Adding data doesn´t work. Exiting.");
        process.exit(1);
    }
    console.log("- OK");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './e2e_screenshots/cuts_api_03_2.png',
        fullPage: true});
    console.log("-- Test 3 - Finished\n-----------------");

    
        //   -------- Test 4 - CutGraphs loads 

    console.log("-- Test 4 - PageCutsAPI loads");

    await page.goto('http://127.0.0.1:3000/fraferbla1/#/graphs');
    await page.waitForTimeout(1000);
    await page.click("#link-to-cutsgraph");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: './e2e_screenshots/cuts_api_06_1.png',
        fullPage: true});

    console.log("- OK");
    console.log("-- Test 6 - Finished\n-----------------");

    console.log("Cleaning up...");

    // Delete all elements
    await page.goto('http://127.0.0.1:3000/fraferbla1/');
    await page.click("#link-to-cutstable");
    await page.waitForTimeout(2000);
    await page.click("#deleteCutsButton");
    await page.waitForTimeout(2000);
    let ActualRowsTest77 = (await page.$$('#cutsTable > tbody > tr')).length;
    if(ActualRowsTest77 != 1) {
        console.log("Cleaning up doesn´t work... Exiting")
        process.exit(1);
    }
    await page.screenshot({ path: './e2e_screenshots/cuts_api_07.png' });

    console.log("-- All CUTS TESTS OK.");
    

    /*
    End of CutsAPI Tests
    */

    await browser.close();
    app.close();
})();