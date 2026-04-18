const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testCreateProduct() {
    const form = new FormData();
    form.append('name', 'Test Product ' + Date.now());
    form.append('classification', 'ELECTRONICS');
    form.append('unitPrice', '99.99');
    form.append('inventoryLevel', '10');
    form.append('color', 'Black');
    
    // Simulate the bug: sending MUST_SET_HEADERS manually or wrong Content-Type
    try {
        const response = await axios.post('http://localhost:5000/api/admin/products', form, {
            headers: {
                ...form.getHeaders(),
                // 'Content-Type': 'application/json' // This was the bug theory
            }
        });
        console.log('✅ Success:', response.status, response.data);
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }
}

testCreateProduct();
