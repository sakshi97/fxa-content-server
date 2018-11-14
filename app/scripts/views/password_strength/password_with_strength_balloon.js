/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Creates and manages a PasswordStrengthBalloon.
 * Updates to the bound password element cause updates to the model
 * which are propagated out to the PasswordStrengthBalloon to
 * update the UI.
 *
 * @export
 * @class PasswordWithStrengthBalloonView
 * @extends {FormView}
 */

import FormView from '../form';
import PasswordStrengthBalloonView from './password_strength_balloon';

const PasswordWithStrengthBalloonView = FormView.extend({
  events: {
    change: 'updateModelForPassword',
    focus: 'createBalloon',
    keyup: 'updateModelForPassword',
    validate: 'validate',
  },

  initialize (options = {}) {
    this.passwordHelperBalloon = options.passwordHelperBalloon;
    this.balloonEl = options.balloonEl;
    this.parent = options.parent;
  },

  createBalloon () {
    if (! this.passwordHelperBalloon) {
      this.model.set('hasFocused', true);

      const passwordHelperBalloon = this.passwordHelperBalloon = new PasswordStrengthBalloonView({
        el: this.balloonEl,
        lang: this.lang,
        model: this.model,
        translator: this.translator
      });
      this.trackChildView(passwordHelperBalloon);
      // update our own styles whenever the balloon does to avoid any jank.
      this.listenTo(passwordHelperBalloon, 'rendered', () => this.updateStyles());

      return passwordHelperBalloon.render()
        .then(() => {
          this.$el.attr('aria-described-by', 'password-strength-balloon');
        });
    }
  },

  afterRender () {
    return Promise.resolve().then(() => {
      // If a password is pre-filled, update the model values
      // before rendering so that the tooltip is not displayed if
      // not necessary.
      if (this.$el.val().length) {
        return this.updateModelForPassword();
      }
    });
  },

  updateModelForPassword () {
    this.model.set('password', this.$el.val());
  },

  updateStyles () {
    const { hasEnteredPassword, hasSubmit, isValid } = this.model.toJSON();

    if (hasEnteredPassword || hasSubmit) {
      if (! isValid) {
        const describedById = this._getDescribedById();
        this.markElementInvalid(this.$el, describedById);
      } else {
        this.markElementValid(this.$el);
      }
    }
  },

  _getDescribedById () {
    const {
      isCommon,
      isSameAsEmail,
      isTooShort,
    } = this.model.toJSON();

    if (isTooShort) {
      return 'password-too-short';
    } else if (isSameAsEmail) {
      return 'password-same-as-email';
    } else if (isCommon) {
      return 'password-too-common';
    }
  },

  validate () {
    const validationError = this.model.validate();
    if (validationError) {
      validationError.describedById = this._getDescribedById();
      throw validationError;
    }
  }
});


export default PasswordWithStrengthBalloonView;
