/*
 * vim: ts=4:sw=4:expandtab
 */

;(function () {
    'use strict';

    window.Forsta = window.Forsta || {};
    Forsta.tpl = {
        help: {}
    };

    /* Compile and render a handlebars template from an inline script.  The output
     * is placed right after the script tag holding the template. */
    Forsta.tpl.render = function(script_selector, tpl_context, _holder_tag) {
        const script = $(script_selector);
        let cache = script[0]._tpl_cache;
        if (cache === undefined) {
            cache = script[0]._tpl_cache = {};
            cache.template = Handlebars.compile(script.html());
            if (_holder_tag === undefined)
                _holder_tag = 'div';
            cache.holder = $(`<${_holder_tag}></${_holder_tag}>`);
            script.after(cache.holder);
        }
        cache.holder.html(cache.template(tpl_context));
    };

    Forsta.tpl.render = async function(id, context, options) {
        if (!options) {
            options = {};
        }
        const tag = $(`script#${id}[type="text/x-template"]`);
        if (!tag.length) {
            throw new Error(`Template ID Not Found: ${id}`);
        } else if (tag.length > 1) {
            throw new RangeError('More than one template found');
        }
        const href = tag.attr('href');
        const tpl = href ? (await (await fetch(href)).text()) : tag.html();
        const output = Handlebars.compile(tpl)(context);
        tag.after(output);
        if (options.replace !== false) {
            tag.remove();
        }
    };

    Forsta.tpl.help.round = function(val, _kwargs) {
        const kwargs = _kwargs.hash;
        const prec = kwargs.precision !== undefined ? kwargs.precision : 0;
        const sval = Number(val.toFixed(prec)).toLocaleString();
        if (sval.indexOf('.') === -1) {
            return sval;
        } else {
            return sval.replace(/0+$/, '').replace(/\.$/, '');
        }
        
    };

    Forsta.tpl.help.percent = function(val, _kwargs) {
        const sval = Forsta.tpl.help.round(val, _kwargs);
        return new Handlebars.SafeString(sval + '&nbsp;<small>%</small>');
    };

    Forsta.tpl.help.humantime = function(val) {
        return moment.duration(val, 'seconds').humanize();
    };

    Forsta.tpl.help.time = function(val, _kwargs) {
        const buf = [];
        const n = Math.round(val);
        if (n > 86400) {
            buf.push(Math.floor(n / 86400).toLocaleString());
            buf.push('days, ');
        }
        buf.push(('0' + Math.floor((n % 86400) / 3600).toString()).slice(-2));
        buf.push(':');
        buf.push(('0' + Math.floor((n % 3600) / 60).toString()).slice(-2));
        buf.push(':');
        buf.push(('0' + (n % 60).toString()).slice(-2));
        return buf.join('');
    };

    Forsta.tpl.help.humanbytes = function(val, _kwargs) {
        let units = [
            [1024 * 1024 * 1024 * 1024, 'TB'],
            [1024 * 1024 * 1024, 'GB'],
            [1024 * 1024, 'MB'],
            [1024, 'KB'],
            [0, ''],
        ];
        for (let i=0; i < units.length; i++) {
            const unit = units[i];
            if (Math.abs(val) >= unit[0]) {
                if (unit[0] !== 0)
                    val /= unit[0];
                const s = Forsta.tpl.help.round(val, _kwargs);
                return new Handlebars.SafeString([s, '&nbsp;<small>', unit[1],
                                                 '</small>'].join(''));
            }
        }
    };

    Forsta.tpl.help.humanint = function(val, _kwargs) {
        const units = [
            [1000000000000, 't'],
            [1000000000, 'b'],
            [1000000, 'm'],
            [1000, 'k'],
            [0, ''],
        ];
        for (let i=0; i < units.length; i++) {
            const unit = units[i];
            if (Math.abs(val) >= unit[0]) {
                if (unit[0] !== 0)
                    val /= unit[0];
                const s = Forsta.tpl.help.round(val, _kwargs);
                return new Handlebars.SafeString([s, '&nbsp;<small>', unit[1],
                                                 '</small>'].join(''));
            }
        }
    };

    Forsta.tpl.help.fixed = function(val, prec) {
        return val.toFixed(prec);
    };

    /*
     * Wire all the handlebars helpers defined here.
     * XXX Perhaps make app do this lazily so they can add more...
     */
    for (const key of Object.keys(Forsta.tpl.help)) {
        Handlebars.registerHelper(key, Forsta.tpl.help[key]);
    }
})();
