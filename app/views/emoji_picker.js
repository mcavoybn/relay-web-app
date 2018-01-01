// vim: ts=4:sw=4:expandtab

(function () {
    'use strict';

    self.F = self.F || {};

    const sheetSize = 32;  // Match CSS!
    let byCategory;
    let loading;

    F.EmojiPicker = F.View.extend({
        template: 'views/emoji-picker.html',

        className: 'ui modal basic',

        events: {
            'input input': 'onSearchInputDebounced',
            'click a.emoji-sheet-image': 'onEmojiClick'
        },

        initialize: function(attrs) {
            this.popup_options = attrs && attrs.popup_options;
            this.onSearchInputDebounced = _.debounce(this.onSearchInput, 200);
        },

        render_attributes: function() {
            return byCategory;
        },

        render: async function() {
            await F.View.prototype.render.apply(this, arguments);
            if (!byCategory) {
                this.$('.ui.dimmer').addClass('active');
                if (!loading) {
                    loading = this.loadData();
                }
                loading.then(this.render.bind(this));
            } else {
                this.$('.tabular.menu .item').tab();
            }
            return this;
        },

        loadData: async function() {
            const resp = await F.util.fetchStatic('images/emoji/emoji.json');
            const emojis = await resp.json();
            byCategory = {};
            for (const x of emojis) {
                if (!byCategory[x.category]) {
                    byCategory[x.category] = [];
                }
                x.x_offt = 1 + (x.sheet_x * (sheetSize + 2));
                x.y_offt = 1 + (x.sheet_y * (sheetSize + 2));
                x.terms = (x.name + ' ' + x.short_names.join(' ')).toLowerCase().replace(/[_-]/g, ' ');
                byCategory[x.category].push(x);
            }
        },

        show: async function() {
            if (!this._rendered) {
                await this.render();
            }
            if (this.popup_options) {
                this.$el.popup(this.popup_options);
            }
            return this.$el.modal('show');
        },

        hide: function() {
            return this.$el.popup('hide');
        },

        onSearchInput: async function(ev) {
            const terms = ev.target.value.toLowerCase().split(/[\s_\-,]+/).filter(x => !!x);
            if (terms.length) {
                const selectors = terms.map(x => `[data-terms*="${x.replace(/"/g, '')}"]`);
                const matchSet = new Set();
                const $matches = this.$('a.emoji-sheet-image' + selectors.join('')).filter((_, x) => {
                    const key = x.dataset.shortName;
                    if (matchSet.has(key)) {
                        return false;
                    } else {
                        matchSet.add(key);
                        return true;
                    }
                });
                const header = $matches.length === 1 ? 'Search Result' : 'Search Results';
                this.$('.f-search-results .ui.header').html(`${$matches.length} ${header}`);
                this.$('.f-search-results .f-search-previews').html($matches.clone());
                this.$('.f-search-results').show();
            } else {
                this.$('.f-search-results').hide();
            }
        },

        onEmojiClick: function(ev) {
            console.warn("Trigger select:", ev.target.dataset.shortName); // XXX
            this.trigger('select', ev.target.dataset.shortName);
        }
    });
})();
