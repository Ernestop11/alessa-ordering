import assert from 'node:assert/strict';
import { normalizeOrderPayload } from '../../lib/payments/normalize-order-payload';
import { maskEmail, maskPhone } from '../../lib/customer/login-masking';

function testNormalizeOrderPayload() {
  const payload = {
    items: [
      { menuItemId: 'item-1', quantity: 2, price: 5.5 },
      { menuItemId: 'item-2', quantity: 1, price: 3.25, notes: 'Extra sauce' },
    ],
    subtotalAmount: 14.25,
    tipAmount: 2,
    deliveryFee: 4.99,
    platformFee: 1.5,
    taxAmount: 1.2,
    totalAmount: 23.94,
    fulfillmentMethod: 'delivery',
    customerName: 'Test Customer',
    customerEmail: 'customer@example.com',
    customerPhone: '555-0100',
  };

  const result = normalizeOrderPayload(payload);
  assert.ok(result, 'Expected payload to normalize');
  assert.equal(result?.items.length, 2);
  assert.equal(result?.items[0].quantity, 2);
  assert.equal(result?.items[0].price, 5.5);
  assert.equal(result?.items[1].notes, 'Extra sauce');
  assert.equal(result?.subtotalAmount, 14.25);
  assert.equal(result?.totalAmount, 23.94);
  assert.equal(result?.fulfillmentMethod, 'delivery');
}

function testNormalizeOrderPayloadRejectsInvalid() {
  const invalidPayload = {
    items: [{ quantity: 1, price: 5 }],
  };

  const result = normalizeOrderPayload(invalidPayload);
  assert.equal(result, null, 'Invalid payload should return null');
}

function testMaskingHelpers() {
  assert.equal(maskEmail('demo@example.com'), 'de•••@example.com');
  assert.equal(maskEmail('ab@foo.com'), 'ab@foo.com');
  assert.equal(maskPhone('+1 (555) 123-4567'), '•••4567');
  assert.equal(maskPhone('9876'), '•••9876');
}

function runSmokeTests() {
  testNormalizeOrderPayload();
  testNormalizeOrderPayloadRejectsInvalid();
  testMaskingHelpers();
}

runSmokeTests();
