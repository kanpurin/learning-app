import fs from 'fs';
import path from 'path';
import postcss from 'postcss';

const styles = postcss.parse(fs.readFileSync(path.join(__dirname, 'App.css'), 'utf8'));

test('main menu remains in document flow at all breakpoints, not fixed to the bottom', () => {
  styles.walkRules('.app-tabs', rule => {
    rule.walkDecls('position', declaration => expect(declaration.value).not.toBe('fixed'));
    rule.walkDecls('bottom', () => { throw new Error('Main menu must not be anchored to the bottom'); });
  });
});

test('mobile layout retains three columns without reserving space for a bottom menu', () => {
  let columns;
  styles.walkAtRules('media', media => {
    if (media.params !== '(max-width: 640px)') return;
    media.walkRules('.main-content', rule => {
      rule.walkDecls('padding-bottom', () => { throw new Error('Bottom menu padding must not be reserved'); });
    });
    media.walkRules('.app-tabs .nav', rule => {
      rule.walkDecls('grid-template-columns', declaration => { columns = declaration.value; });
    });
  });
  expect(columns).toBe('repeat(3, minmax(0, 1fr))');
});
