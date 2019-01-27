import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

module('Integration | Component | modifier-manager', function(hooks) {
  setupRenderingTest(hooks);

  class ModifierManager {
    constructor(owner) {
      this.owner = owner;
    }

    createModifier(factory, args) {
      return factory.create(args);
    }

    installModifier(instance, element, args) {
      instance.element = element;
      let { positional, named } = args;
      instance.didInsertElement(positional, named);
    }

    updateModifier(instance, args) {
      let { positional, named } = args;
      instance.didUpdate(positional, named);
    }

    destroyModifier(instance) {
      instance.willDestroyElement();
    }
  }

  test('it basically works', async function(assert) {
    Ember._setModifierManager(owner => new ModifierManager(owner), class DidInsertModifier {});
    this.owner.register('modifier-manager:did-insert');

    await render(hbs`<div {{did-insert}}></div>`);

    assert.equal(this.element.textContent.trim(), '');
  });
});
