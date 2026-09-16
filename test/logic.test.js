const test = require('node:test');
const assert = require('node:assert/strict');
const { filterRecipients, updateSelection, paginate, createPrintConfirmation, markPrintDialogReturned, resolvePrintConfirmation, buildRecipientPayload } = require('../logic.js');

const recipients = [
  { id: '1', name: 'שרה כהן', city: 'ירושלים', street: 'יפו', num: '4', apt: '', printed: false },
  { id: '2', name: 'דוד לוי', city: 'בני ברק', street: 'רבי עקיבא', num: '8', apt: '2', printed: true },
  { id: '3', name: 'שרה לוי', city: 'ירושלים', street: 'הנביאים', num: '9', apt: '', printed: false }
];

test('filtering separates printed queues and matches address fields', () => {
  assert.deepEqual(filterRecipients(recipients, 'unprinted', 'שרה').map((r) => r.id), ['1', '3']);
  assert.deepEqual(filterRecipients(recipients, 'printed', 'עקיבא').map((r) => r.id), ['2']);
});

test('selection updates only the selection set passed to it', () => {
  const unprinted = updateSelection(new Set(), recipients.filter((r) => !r.printed), true);
  const printed = updateSelection(new Set(['2']), recipients.filter((r) => r.printed), false);
  assert.deepEqual([...unprinted], ['1', '3']);
  assert.deepEqual([...printed], []);
});

test('Select All changes only visible filtered rows and keeps sections independent', () => {
  const visibleUnprinted = filterRecipients(recipients, 'unprinted', 'שרה');
  const unprinted = updateSelection(new Set(['hidden-id']), visibleUnprinted, true);
  const afterDeselect = updateSelection(unprinted, visibleUnprinted, false);
  const printed = new Set(['2']);
  assert.deepEqual([...unprinted].sort(), ['1', '3', 'hidden-id']);
  assert.deepEqual([...afterDeselect], ['hidden-id']);
  assert.deepEqual([...printed], ['2']);
});

test('print confirmation only marks after the print dialog returns and Yes is chosen', () => {
  const opened = createPrintConfirmation(['1', '3']);
  assert.deepEqual(resolvePrintConfirmation(opened, true), { ids: ['1', '3'], shouldMarkPrinted: false });
  const returned = markPrintDialogReturned(opened);
  assert.deepEqual(resolvePrintConfirmation(returned, false), { ids: ['1', '3'], shouldMarkPrinted: false });
  assert.deepEqual(resolvePrintConfirmation(returned, true), { ids: ['1', '3'], shouldMarkPrinted: true });
});

test('pagination creates 33-label A4 pages without dropping labels', () => {
  const pages = paginate(Array.from({ length: 68 }, (_, index) => index), 33);
  assert.deepEqual(pages.map((page) => page.length), [33, 33, 2]);
  assert.equal(pages.flat().length, 68);
});

test('create and edit payloads preserve printed state and ownership rules', () => {
  const values = { name: ' Name ', city: ' City ', street: ' Street ', num: '7', apt: '3' };
  assert.deepEqual(buildRecipientPayload(values, 'user-1', false), { full_name: 'Name', city: 'City', street: 'Street', house_number: '7', apartment: '3', printed: false, user_id: 'user-1' });
  assert.deepEqual(buildRecipientPayload(values, 'user-1', true), { full_name: 'Name', city: 'City', street: 'Street', house_number: '7', apartment: '3' });
});
