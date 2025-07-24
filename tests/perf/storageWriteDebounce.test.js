const debounce = require('../../utils/debounce').default || require('../../utils/debounce');

(async () => {
  let writes = 0;
  const save = debounce(() => {
    writes++;
  }, 2000);

  for (let i = 0; i < 50; i++) {
    save({});
  }

  await new Promise((r) => setTimeout(r, 2500));
  if (writes >= 5) {
    throw new Error(`Too many writes: ${writes}`);
  }
})();
