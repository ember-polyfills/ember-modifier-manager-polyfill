import Ember from 'ember';
import { capabilities } from '@ember/modifier';
import { module, test } from 'qunit';

module('Unit | Modifier Manager', function() {
  test('sets up Ember._modifierManagerCapabilities', function(assert) {
    assert.strictEqual(
      typeof capabilities,
      'function',
      'import { capabilities } from "@ember/modifier" works properly'
    );

    // should be transformed by babel, this just confirms it
    assert.strictEqual(
      capabilities,
      Ember._modifierManagerCapabilities,
      'typoed name matches "real" name'
    );
  });

  test('sets up alias for typoed `Ember._modifierManagerCapabilties`', function(assert) {
    assert.strictEqual(
      Ember._modifierManagerCapabilties,
      Ember._modifierManagerCapabilities,
      'typoed name matches "real" name'
    );
  });
});
