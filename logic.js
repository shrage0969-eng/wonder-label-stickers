(function (root) {
  function normalize(value) {
    return String(value || '').trim().toLowerCase().replace(/[\s\-׳׳']/g, '');
  }

  function filterRecipients(recipients, section, filter) {
    const query = normalize(filter);
    return recipients.filter((recipient) => {
      if (section === 'printed' ? !recipient.printed : recipient.printed) return false;
      return !query || [recipient.name, recipient.city, recipient.street, recipient.num, recipient.apt]
        .some((value) => normalize(value).includes(query));
    });
  }

  function updateSelection(selected, rows, checked) {
    const next = new Set(selected);
    rows.forEach((row) => {
      if (checked) next.add(String(row.id));
      else next.delete(String(row.id));
    });
    return next;
  }

  function paginate(items, pageSize) {
    const pages = [];
    for (let index = 0; index < items.length; index += pageSize) pages.push(items.slice(index, index + pageSize));
    return pages;
  }

  function createPrintConfirmation(ids) {
    return { ids: [...ids], awaitingConfirmation: false };
  }

  function markPrintDialogReturned(state) {
    return { ...state, awaitingConfirmation: true };
  }

  function resolvePrintConfirmation(state, printedSuccessfully) {
    return { ids: [...(state?.ids || [])], shouldMarkPrinted: Boolean(state?.awaitingConfirmation && printedSuccessfully) };
  }

  function buildRecipientPayload(values, userId, isEdit) {
    const payload = {
      full_name: String(values.name || '').trim(), city: String(values.city || '').trim(),
      street: String(values.street || '').trim(), house_number: String(values.num || '').trim(),
      apartment: String(values.apt || '').trim()
    };
    if (!isEdit) {
      payload.printed = false;
      payload.user_id = userId;
    }
    return payload;
  }

  root.StickerLogic = { normalize, filterRecipients, updateSelection, paginate, createPrintConfirmation, markPrintDialogReturned, resolvePrintConfirmation, buildRecipientPayload };
  if (typeof module !== 'undefined') module.exports = root.StickerLogic;
})(typeof window !== 'undefined' ? window : globalThis);
