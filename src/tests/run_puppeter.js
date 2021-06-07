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
        console.log("----------------------- Dansesben Tests -----------------------");
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

////////////////////////////////////////////////

    /*
        ----------------------- BudgetsAPI Tests -----------------------
    */

        console.log("\n\n----------------------- BudgetsAPI Tests -----------------------");
    //   -------- Test 1 - PageBudgetsAPI loads 


    console.log("-- Test 1 - PageBudgetsAPI loads");

    await page.goto('http://127.0.0.1:3000/budgetsAPI/');
    await page.screenshot({ path: './e2e_screenshots/budgets_api_01.png' });

    console.log("-- Test 1 - Finished\n-----------------");

    

    //  -------- Test 2 - The charging data, deleting data works and the table too?.

    console.log("-- Test 2 - The loadInitialData works and the table too?");
    await page.click("#link-to-budgetstable",
        { waitUntil: "networkidle0" });

    page.on('dialog', async dialog => {
        dialog.accept();
    });
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './e2e_screenshots/budgets_api_02.png' });
    console.log("   The table works...");
    

    let rowInitialCount = (await page.$$('#budgetsTable > tbody > tr')).length;
    

    if(rowInitialCount == 1) {
        console.log("   Checking charging data...");
        await page.click("#loadBudgetsButton");
        await page.waitForTimeout(1000);

        let rowLoadedCount = (await page.$$('#budgetsTable > tbody > tr')).length;
        console.log("Amounts loaded:" + rowLoadedCount);
        
        if(rowLoadedCount == rowInitialCount) {
            console.log("Charging data doesn´t work. Exiting.");
            process.exit(1);
        }
        
        await page.screenshot({ path: './e2e_screenshots/budgets_api_02_1.png' });
        console.log(    "- OK");

        console.log("   Checking deleting data...");
        await page.click("#deleteBudgetsButton");
        await page.waitForTimeout(1000);
        let rowErasedCount = (await page.$$('#budgetsTable > tbody > tr')).length;
        if(rowErasedCount != 1) {
            console.log("Deleting data doesn´t work. Exiting.");
            process.exit(1);
        }
        await page.screenshot({ path: './e2e_screenshots/budgets_api_02_2.png' });
        console.log(    "- OK");

    } else  {
        console.log("   Checking deleting data...");
        await page.click("#deleteBudgetsButton");

        await page.waitForTimeout(1000);
        let rowErasedCount = (await page.$$('#budgetsTable > tbody > tr')).length;
        if(rowErasedCount != 1) {
            console.log("Deleting data doesn´t work. Exiting.");
            process.exit(1);
        }
        await page.screenshot({ path: './e2e_screenshots/budgets_api_02_2_2.png' });
        console.log(    "- OK");

        console.log("   Checking charging data...");
        await page.click("#loadBudgetsButton");

        await page.waitForTimeout(1000);

        let rowLoadedCount = (await page.$$('#budgetsTable > tbody > tr')).length;
        
        if(rowLoadedCount == rowErasedCount) {
            console.log("Charging data doesn´t work. Exiting.");
            process.exit(1);
        }
        await page.screenshot({ path: './e2e_screenshots/budgets_api_02_1_2.png' });
        console.log(    "- OK");
    }
    
    // Return to a normal state.
    console.log("   Returning to a normal state");
    await page.click("#deleteBudgetsButton");
    await page.waitForTimeout(1000);
    let return_normal_1 = (await page.$$('#budgetsTable > tbody > tr')).length;

    if(return_normal_1 != 1) {
        console.log("Return to a normal state (delete) failed.")
        process.exit(1);
    }
    console.log("- Delete OK");
    await page.waitForTimeout(1000);
    await page.click("#loadBudgetsButton");
    await page.waitForTimeout(1000);
    let return_normal_2 = (await page.$$('#budgetsTable > tbody > tr')).length;

    if(return_normal_2 == 1) {
        console.log("Return to a normal state (load) failed.")
        process.exit(1);
    }
    console.log("- Load OK");
    console.log("-- Test 2 - Finished\n-----------------");


    //  -------- Test 3 - Adding specific data.
    console.log("-- Test 3 - Adding specific data");

    let ActualRowsTest3 = (await page.$$('#budgetsTable > tbody > tr')).length;

    // Typing an object.
    console.log("   Adding element...");
    await page.type('#center_AddingBudget', 'PUPPETEERADDED');
    await page.type('#year_AddingBudget', '201');
    await page.type('#fixedfees_AddingBudget', '12004.22');
    await page.type('#amountsbyetc_AddingBudget', '23100.3');
    await page.type('#amountsbyprof_AddingBudget', '36434.2');
    await page.type('#total_AddingBudget', '123556.2');
    await page.waitForTimeout(500);
    await page.screenshot({ path: './e2e_screenshots/budgets_api_03_1.png' });
    await page.click("#addBudgetButton");
    await page.waitForTimeout(1000);
    console.log("   Counting if the elements are +1");
    let AddedElementRowsTest3 = (await page.$$('#budgetsTable > tbody > tr')).length;

    if(AddedElementRowsTest3 != ActualRowsTest3 + 1) {
        console.log("Adding data doesn´t work. Exiting.");
        process.exit(1);
    }
    console.log("- OK");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './e2e_screenshots/budgets_api_03_2.png',
        fullPage: true});
    console.log("-- Test 3 - Finished\n-----------------");

    //  -------- Test 4 - Editing specific data.

    console.log("-- Test 4 - Editing specific data.");

    let idEdit =  await page.$eval('#center_PUPPETEERADDED_Budget_201', e => e.innerText);
    let budgets_valueBeforeEdit =  await page.$eval('#year_PUPPETEERADDED_Budget_201', e => e.innerText);

    console.log("   Accesing to the element..." + idEdit);
    await page.click("#center_PUPPETEERADDED_Budget_201");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './e2e_screenshots/budgets_api_04_1.png' });
    await page.waitForTimeout(1000);

    console.log("   Editing the year of element..." + idEdit);
    await page.type('#year_editBduget', '6');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './e2e_screenshots/budgets_api_04_2.png' });

    await page.click("#button_editBduget");
    await page.waitForTimeout(1000);

    let budgets_valueAfterEdit =  await page.$eval('#year_PUPPETEERADDED_Budget_2016', 
    e => e.innerText);
    
    if(budgets_valueBeforeEdit == budgets_valueAfterEdit) {
        console.log("Editing specific data doesn´t work. Exiting.");
        process.exit(1);
    }
    await page.screenshot({ path: './e2e_screenshots/budgets_api_04_3.png',
        fullPage: true});

    console.log("- OK");

    console.log("-- Test 4 - Finished\n-----------------");

        //  -------- Test 5 - Deleting specific data.
    console.log("-- Test 5 - Deleting specific data");

    let RowsTest5 = (await page.$$('#budgetsTable > tbody > tr')).length;
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './e2e_screenshots/budgets_api_05_1.png',
        fullPage: true});
    console.log("   Editing the year of element..." + "PUPPETEERADDED");
    await page.click('#deleteBudgetButton_PUPPETEERADDED_Budget_2016');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './e2e_screenshots/budgets_api_05_2.png',
        fullPage: true});

    let ElementDeletedRowsTest5 = (await page.$$('#budgetsTable > tbody > tr')).length;
    console.log("   Counting if the elements are -1");
    if(ElementDeletedRowsTest5 != RowsTest5 - 1) {
        console.log("Deleting specific data doesn´t work. Exiting.");
        process.exit(1);
    }
    console.log("- OK");
    console.log("-- Test 5 - Finished\n-----------------");

        //   -------- Test 6 - BudgetGraphs loads 

    console.log("-- Test 6 - PageBudgetsAPI loads");

    await page.goto('http://127.0.0.1:3000/budgetsAPI/');
    await page.waitForTimeout(1000);
    await page.click("#link-to-budgetsgraphs");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: './e2e_screenshots/budgets_api_06_1.png',
        fullPage: true});

    console.log("- OK");
    console.log("-- Test 6 - Finished\n-----------------");

    console.log("Cleaning up...");

    // Delete all elements
    await page.goto('http://127.0.0.1:3000/budgetsAPI/');
    await page.click("#link-to-budgetstable");
    await page.waitForTimeout(2000);
    await page.click("#deleteBudgetsButton");
    await page.waitForTimeout(2000);
    let ActualRowsTest7 = (await page.$$('#budgetsTable > tbody > tr')).length;
    if(ActualRowsTest7 != 1) {
        console.log("Cleaning up doesn´t work... Exiting")
        process.exit(1);
    }
    await page.screenshot({ path: './e2e_screenshots/budgets_api_07.png' });

    console.log("-- All BUDGETS TESTS OK.");
    

    /*
    End of BudgetsApi Tests
    */

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

    //  -------- Test 4 - Editing specific data.

    console.log("-- Test 4 - Editing specific data.");

    let idEdit1 =  await page.$eval('#degree_PUPPETEERADDED_Cut_2018', e => e.innerText);
    let cuts_valueBeforeEdit1 =  await page.$eval('#year_PUPPETEERADDED_Cut_2018', e => e.innerText);

    console.log("   Accesing to the element..." + idEdit1);
    await page.click("#degree_PUPPETEERADDED_Cut_2018");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './e2e_screenshots/cuts_api_04_1.png' });
    await page.waitForTimeout(1000);

    console.log("   Editing the year of element..." + idEdit1);
    await page.type('#year_editCut', '6');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './e2e_screenshots/cuts_api_04_2.png' });

    await page.click("#button_editCut");
    await page.waitForTimeout(1000);

    let cuts_valueAfterEdit1 =  await page.$eval('#year_PUPPETEERADDED_Cut_2016', 
    e => e.innerText);
    
    if(cuts_valueBeforeEdit1 == cuts_valueAfterEdit1) {
        console.log("Editing specific data doesn´t work. Exiting.");
        process.exit(1);
    }
    await page.screenshot({ path: './e2e_screenshots/cuts_api_04_3.png',
        fullPage: true});

    console.log("- OK");

    console.log("-- Test 4 - Finished\n-----------------");

        //  -------- Test 5 - Deleting specific data.
    console.log("-- Test 5 - Deleting specific data");

    let RowsTest55 = (await page.$$('#cutsTable > tbody > tr')).length;
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './e2e_screenshots/cuts_api_05_1.png',
        fullPage: true});
    console.log("   Editing the year of element..." + "PUPPETEERADDED");
    await page.click('#deleteCutButton_PUPPETEERADDED_Cut_2016');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './e2e_screenshots/cuts_api_05_2.png',
        fullPage: true});

    let ElementDeletedRowsTest55 = (await page.$$('#cutsTable > tbody > tr')).length;
    console.log("   Counting if the elements are -1");
    if(ElementDeletedRowsTest55 != RowsTest55 - 1) {
        console.log("Deleting specific data doesn´t work. Exiting.");
        process.exit(1);
    }
    console.log("- OK");
    console.log("-- Test 5 - Finished\n-----------------");

        //   -------- Test 6 - CutGraphs loads 

    console.log("-- Test 6 - PageCutsAPI loads");

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
    await page.goto('http://127.0.0.1:3000/cutsAPI/');
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