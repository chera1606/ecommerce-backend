const runTests = async () => {
    const BASE_URL = 'http://localhost:5000/api';
    console.log('--- Starting API Verification ---');
    
    // 1. Test Categories
    try {
        const res = await fetch(`${BASE_URL}/categories`);
        const data = await res.json();
        console.log(`PASS: GET /categories | Status: ${res.status} | Count: ${data.count}`);
    } catch (err) {
        console.error('FAIL: GET /categories |', err.message);
    }

    // 2. Test Recommended Products
    try {
        const res = await fetch(`${BASE_URL}/products/recommended`);
        const data = await res.json();
        console.log(`PASS: GET /products/recommended | Status: ${res.status} | Count: ${data.count}`);
    } catch (err) {
        console.error('FAIL: GET /products/recommended |', err.message);
    }

    // 3. Test Single Product (Valid ID)
    const validId = '69e266fa32310b00a6a504ab';
    try {
        const res = await fetch(`${BASE_URL}/products/${validId}`);
        const data = await res.json();
        console.log(`PASS: GET /products/:id (Valid) | Status: ${res.status} | Name: ${data.data?.name}`);
    } catch (err) {
        console.error('FAIL: GET /products/:id (Valid) |', err.message);
    }

    // 4. Test Single Product (Invalid Format ID)
    const invalidId = '123';
    try {
        const res = await fetch(`${BASE_URL}/products/${invalidId}`);
        const data = await res.json();
        if (res.status === 400) {
            console.log(`PASS: GET /products/:id (Invalid) | Status: ${res.status} | Message: ${data.message}`);
        } else {
            console.log(`FAIL: GET /products/:id (Invalid) | Expected 400, got ${res.status}`);
        }
    } catch (err) {
        console.error('FAIL: GET /products/:id (Invalid) |', err.message);
    }

    // 5. Test Shop Products
    try {
        const res = await fetch(`${BASE_URL}/shop/products`);
        const data = await res.json();
        console.log(`PASS: GET /shop/products | Status: ${res.status} | Total: ${data.totalProducts}`);
    } catch (err) {
        console.error('FAIL: GET /shop/products |', err.message);
    }

    console.log('--- API Verification Complete ---');
};

runTests();
