import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { assign } from '@ember/polyfills';
import { capabilities, setModifierManager } from '@ember/modifier';

module('Integration | Component | modifier-manager', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function(assert) {
    assert.namedEquals = function(actual, expected, message) {
      // this is needed because older versions of Ember pass an `EmptyObject`
      // based object and QUnit fails due to the prototypes not matching
      let sanitizedActual = assign({}, actual);

      assert.deepEqual(sanitizedActual, expected, message);
    };
  });

  module('capabilities', function() {
    test('can set capabilities', async function(assert) {
      class MyModifier {}

      this.owner.register('modifier:my-modifier', MyModifier);

      setModifierManager(
        () => ({
          capabilities: capabilities('3.13'),

          createModifier(factory) {
            assert.equal(factory.class, MyModifier, 'the factory class is Modifier');
          },
          installModifier() {},
          updateModifier() {},
          destroyModifier() {},
        }),
        MyModifier
      );

      await render(hbs`<div {{my-modifier}}></div>`);
    });
  });

  module('setModifierManager', function() {
    test('it returns the provided object', function(assert) {
      let expected = Object.freeze({});
      let actual = setModifierManager(() => {}, expected);

      assert.strictEqual(actual, expected, 'the passed in object was returned');
    });
  });

  module('createModifier', function() {
    test('it passes the `factoryFor` definition', async function(assert) {
      assert.expect(1);

      class MyModifier {}

      this.owner.register('modifier:my-modifier', MyModifier);

      setModifierManager(
        () => ({
          capabilities: capabilities('3.13'),
          createModifier(factory) {
            assert.equal(factory.class, MyModifier, 'the factory class is Modifier');
          },
          installModifier() {},
          updateModifier() {},
          destroyModifier() {},
        }),
        MyModifier
      );

      await render(hbs`<div {{my-modifier}}></div>`);
    });
  });

  module('installModifier', function(hooks) {
    hooks.beforeEach(function() {
      class DidInsertModifier {}

      setModifierManager(
        () => ({
          capabilities: capabilities('3.13'),
          createModifier(_factory, args) {
            return args.positional[0];
          },

          installModifier(_state, element, args) {
            let [fn, ...positional] = args.positional;

            fn(element, positional, args.named);
          },

          updateModifier() {},
          destroyModifier() {},
        }),
        DidInsertModifier
      );
      this.owner.register('modifier:did-insert', DidInsertModifier);
    });

    test('it basically works', async function(assert) {
      assert.expect(2);

      this.someMethod = element => {
        assert.equal(element.tagName, 'DIV', 'correct element tagName');
        assert.dom(element).hasAttribute('data-foo', 'some-thing');
      };
      await render(hbs`<div data-foo="some-thing" {{did-insert this.someMethod}}></div>`);
    });

    test('it can accept arguments', async function(assert) {
      assert.expect(4);

      this.someMethod = (element, positional, named) => {
        assert.equal(element.tagName, 'DIV', 'correct element tagName');
        assert.dom(element).hasAttribute('data-foo', 'some-thing');

        assert.namedEquals(named, { some: 'hash-value' }, 'named args match');
        assert.deepEqual(positional, ['some-positional-value'], 'positional args match');
      };

      await render(
        hbs`<div data-foo="some-thing" {{did-insert this.someMethod "some-positional-value" some="hash-value"}}></div>`
      );
    });

    test('it is not invoked again when arguments change', async function(assert) {
      assert.expect(4);

      this.someMethod = (element, positional, named) => {
        assert.equal(element.tagName, 'DIV', 'correct element tagName');
        assert.dom(element).hasAttribute('data-foo', 'some-thing');

        assert.namedEquals(named, {}, 'named args match');
        assert.deepEqual(positional, ['initial'], 'positional args match');
      };

      this.set('firstArg', 'initial');
      await render(
        hbs`<div data-foo="some-thing" {{did-insert this.someMethod this.firstArg}}></div>`
      );
      this.set('firstArg', 'updated');
    });
  });

  module('updateModifier', function(hooks) {
    hooks.beforeEach(function() {
      class DidUpdateModifier {}

      setModifierManager(
        () => ({
          capabilities: capabilities('3.13'),
          createModifier() {
            return {};
          },
          installModifier(state, element) {
            state.element = element;
          },

          updateModifier({ element }, args) {
            let [fn, ...positional] = args.positional;

            fn(element, positional, args.named);
          },

          destroyModifier() {},
        }),
        DidUpdateModifier
      );
      this.owner.register('modifier:did-update', DidUpdateModifier);
    });

    test('it basically works', async function(assert) {
      assert.expect(4);

      this.someMethod = (element, positional, named) => {
        assert.equal(element.tagName, 'DIV', 'correct element tagName');
        assert.dom(element).hasAttribute('data-foo', 'some-thing');

        assert.namedEquals(named, {}, 'named args match');
        assert.deepEqual(positional, ['update'], 'positional args match');
      };

      this.set('boundValue', 'initial');
      await render(
        hbs`<div data-foo="some-thing" {{did-update this.someMethod this.boundValue}}></div>`
      );

      this.set('boundValue', 'update');
    });
  });

  module('destroyModifier', function(hooks) {
    hooks.beforeEach(function() {
      class WillDestroyModifier {}

      setModifierManager(
        () => ({
          capabilities: capabilities('3.13'),
          createModifier() {
            return {};
          },

          installModifier(state, element) {
            state.element = element;
          },

          updateModifier() {},

          destroyModifier({ element }, args) {
            let [fn, ...positional] = args.positional;

            fn(element, positional, args.named);
          },
        }),
        WillDestroyModifier
      );

      this.owner.register('modifier:will-destroy', WillDestroyModifier);
    });

    test('it basically works', async function(assert) {
      assert.expect(2);

      this.someMethod = element => {
        assert.equal(element.tagName, 'DIV', 'correct element tagName');
        assert.dom(element).hasAttribute('data-foo', 'some-thing');
      };
      this.set('show', true);

      await render(
        hbs`{{#if show}}<div data-foo="some-thing" {{will-destroy this.someMethod}}></div>{{/if}}`
      );

      // trigger destroy
      this.set('show', false);
    });

    test('it can accept arguments', async function(assert) {
      assert.expect(4);

      this.someMethod = (element, positional, named) => {
        assert.equal(element.tagName, 'DIV', 'correct element tagName');
        assert.dom(element).hasAttribute('data-foo', 'some-thing');

        assert.namedEquals(named, { some: 'hash-value' }, 'named args match');
        assert.deepEqual(positional, ['some-positional-value'], 'positional args match');
      };

      this.set('show', true);

      await render(
        hbs`{{#if show}}<div data-foo="some-thing" {{will-destroy this.someMethod "some-positional-value" some="hash-value"}}></div>{{/if}}`
      );

      // trigger destroy
      this.set('show', false);
    });
  });
});
