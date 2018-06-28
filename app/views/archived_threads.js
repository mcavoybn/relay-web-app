// vim: ts=4:sw=4:expandtab

(function () {
    'use strict';

    self.F = self.F || {};

    F.ArchivedThreadsView = F.ModalView.extend({

        contentTemplate: 'views/archived-threads.html',
        size: 'small',
        icon: 'archive',
        header: 'Archived Threads',

        events: {
            'click .f-restore': 'onRestoreClick',
            'click .f-expunge': 'onExpungeClick',
        },

        initialize: function() {
            F.ModalView.prototype.initialize.apply(this, arguments);
            this.threads = new F.ThreadCollection();
        },

        render_attributes: async function() {
            return Object.assign({
                threads: await Promise.all(this.threads.map(async x => Object.assign({
                    normTitle: x.getNormalizedTitle(),
                    avatar: await x.getAvatar({allowMultiple: true}),
                    messageCount: await x.messages.totalCount()
                }, x.attributes))),
            }, await F.ModalView.prototype.render_attributes.apply(this, arguments));
        },

        render: async function() {
            if (!this._rendered) {
                // This is slow to load the first time, so work in the BG and update when done.
                await F.ModalView.prototype.render.apply(this, arguments);
                this.toggleLoading(true);
                F.util.animationFrame().then(() => this.render());
            } else {
                await this.threads.fetch({
                    index: {
                        name: 'archived-timestamp',
                        lower: [1],
                        order: 'desc'
                    }
                });
                await F.ModalView.prototype.render.apply(this, arguments);
                this.toggleLoading(false);
            }
            return this;
        },

        onRestoreClick: async function(ev) {
            const row = $(ev.currentTarget).closest('.row');
            const thread = this.threads.get(row.data('id'));
            this.toggleLoading(true);
            try {
                await thread.restore();
                await this.render();
            } finally {
                this.toggleLoading(false);
            }
        },

        onExpungeClick: async function(ev) {
            const row = $(ev.currentTarget).closest('.row');
            const thread = this.threads.get(row.data('id'));
            if (await F.util.confirmModal({
                header: "Expunge Thread?",
                allowMultiple: true,
                icon: 'bomb',
                size: 'tiny',
                content: "Please confirm that you want to delete this thread and ALL of its messages.",
                confirmLabel: 'Expunge',
                confirmClass: 'red'
            })) {
                this.toggleLoading(true);
                try {
                    await thread.expunge();
                    await this.render();
                } finally {
                    this.toggleLoading(false);
                }
            }
        }
    });
})();
