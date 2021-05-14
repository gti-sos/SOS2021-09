var app = (function () {
    'use strict';

    function noop$1() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop$1;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop$1;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_options(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            option.selected = ~value.indexOf(option.__value);
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop$1, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop$1) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop$1) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop$1;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop$1;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop$1;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.37.0 */

    const { Error: Error_1$1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block$6(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$6.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block$7(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$7, create_else_block$6];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$p.name
    		});
    	}

    	get routes() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    function getOriginalBodyPadding() {
      const style = window ? window.getComputedStyle(document.body, null) : {};

      return parseInt((style && style.getPropertyValue('padding-right')) || 0, 10);
    }

    function getScrollbarWidth() {
      let scrollDiv = document.createElement('div');
      // .modal-scrollbar-measure styles // https://github.com/twbs/bootstrap/blob/v4.0.0-alpha.4/scss/_modal.scss#L106-L113
      scrollDiv.style.position = 'absolute';
      scrollDiv.style.top = '-9999px';
      scrollDiv.style.width = '50px';
      scrollDiv.style.height = '50px';
      scrollDiv.style.overflow = 'scroll';
      document.body.appendChild(scrollDiv);
      const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
      document.body.removeChild(scrollDiv);
      return scrollbarWidth;
    }

    function setScrollbarWidth(padding) {
      document.body.style.paddingRight = padding > 0 ? `${padding}px` : null;
    }

    function isBodyOverflowing() {
      return window ? document.body.clientWidth < window.innerWidth : false;
    }

    function isObject(value) {
      const type = typeof value;
      return value != null && (type == 'object' || type == 'function');
    }

    function conditionallyUpdateScrollbar() {
      const scrollbarWidth = getScrollbarWidth();
      // https://github.com/twbs/bootstrap/blob/v4.0.0-alpha.6/js/src/modal.js#L433
      const fixedContent = document.querySelectorAll(
        '.fixed-top, .fixed-bottom, .is-fixed, .sticky-top'
      )[0];
      const bodyPadding = fixedContent
        ? parseInt(fixedContent.style.paddingRight || 0, 10)
        : 0;

      if (isBodyOverflowing()) {
        setScrollbarWidth(bodyPadding + scrollbarWidth);
      }
    }

    function getColumnSizeClass(isXs, colWidth, colSize) {
      if (colSize === true || colSize === '') {
        return isXs ? 'col' : `col-${colWidth}`;
      } else if (colSize === 'auto') {
        return isXs ? 'col-auto' : `col-${colWidth}-auto`;
      }

      return isXs ? `col-${colSize}` : `col-${colWidth}-${colSize}`;
    }

    function browserEvent(target, ...args) {
      target.addEventListener(...args);

      return () => target.removeEventListener(...args);
    }

    function toClassName(value) {
      let result = '';

      if (typeof value === 'string' || typeof value === 'number') {
        result += value;
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          result = value.map(toClassName).filter(Boolean).join(' ');
        } else {
          for (let key in value) {
            if (value[key]) {
              result && (result += ' ');
              result += key;
            }
          }
        }
      }

      return result;
    }

    function classnames(...args) {
      return args.map(toClassName).filter(Boolean).join(' ');
    }

    /* node_modules/sveltestrap/src/Alert.svelte generated by Svelte v3.37.0 */
    const file$n = "node_modules/sveltestrap/src/Alert.svelte";

    // (22:0) {#if isOpen}
    function create_if_block$6(ctx) {
    	let div;
    	let t;
    	let current_block_type_index;
    	let if_block1;
    	let div_transition;
    	let current;
    	let if_block0 = /*toggle*/ ctx[3] && create_if_block_2$3(ctx);
    	const if_block_creators = [create_if_block_1$4, create_else_block$5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*children*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let div_levels = [/*$$restProps*/ ctx[7], { class: /*classes*/ ctx[5] }, { role: "alert" }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if_block1.c();
    			set_attributes(div, div_data);
    			add_location(div, file$n, 22, 2, 637);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*toggle*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$3(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div, null);
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 128 && /*$$restProps*/ ctx[7],
    				(!current || dirty & /*classes*/ 32) && { class: /*classes*/ ctx[5] },
    				{ role: "alert" }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, /*transition*/ ctx[4], true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, /*transition*/ ctx[4], false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(22:0) {#if isOpen}",
    		ctx
    	});

    	return block;
    }

    // (28:4) {#if toggle}
    function create_if_block_2$3(ctx) {
    	let button;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			span.textContent = "×";
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$n, 33, 8, 900);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", /*closeClassNames*/ ctx[6]);
    			attr_dev(button, "aria-label", /*closeAriaLabel*/ ctx[1]);
    			add_location(button, file$n, 28, 6, 767);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*toggle*/ ctx[3])) /*toggle*/ ctx[3].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*closeClassNames*/ 64) {
    				attr_dev(button, "class", /*closeClassNames*/ ctx[6]);
    			}

    			if (dirty & /*closeAriaLabel*/ 2) {
    				attr_dev(button, "aria-label", /*closeAriaLabel*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(28:4) {#if toggle}",
    		ctx
    	});

    	return block;
    }

    // (39:4) {:else}
    function create_else_block$5(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4096) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[12], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(39:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (37:4) {#if children}
    function create_if_block_1$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*children*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*children*/ 1) set_data_dev(t, /*children*/ ctx[0]);
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(37:4) {#if children}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*isOpen*/ ctx[2] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isOpen*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isOpen*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let classes;
    	let closeClassNames;

    	const omit_props_names = [
    		"class","children","color","closeClassName","closeAriaLabel","isOpen","toggle","fade","transition"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Alert", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { children = undefined } = $$props;
    	let { color = "success" } = $$props;
    	let { closeClassName = "" } = $$props;
    	let { closeAriaLabel = "Close" } = $$props;
    	let { isOpen = true } = $$props;
    	let { toggle = undefined } = $$props;
    	let { fade: fade$1 = true } = $$props;
    	let { transition = { duration: fade$1 ? 400 : 0 } } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(7, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(8, className = $$new_props.class);
    		if ("children" in $$new_props) $$invalidate(0, children = $$new_props.children);
    		if ("color" in $$new_props) $$invalidate(9, color = $$new_props.color);
    		if ("closeClassName" in $$new_props) $$invalidate(10, closeClassName = $$new_props.closeClassName);
    		if ("closeAriaLabel" in $$new_props) $$invalidate(1, closeAriaLabel = $$new_props.closeAriaLabel);
    		if ("isOpen" in $$new_props) $$invalidate(2, isOpen = $$new_props.isOpen);
    		if ("toggle" in $$new_props) $$invalidate(3, toggle = $$new_props.toggle);
    		if ("fade" in $$new_props) $$invalidate(11, fade$1 = $$new_props.fade);
    		if ("transition" in $$new_props) $$invalidate(4, transition = $$new_props.transition);
    		if ("$$scope" in $$new_props) $$invalidate(12, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		fadeTransition: fade,
    		classnames,
    		className,
    		children,
    		color,
    		closeClassName,
    		closeAriaLabel,
    		isOpen,
    		toggle,
    		fade: fade$1,
    		transition,
    		classes,
    		closeClassNames
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(8, className = $$new_props.className);
    		if ("children" in $$props) $$invalidate(0, children = $$new_props.children);
    		if ("color" in $$props) $$invalidate(9, color = $$new_props.color);
    		if ("closeClassName" in $$props) $$invalidate(10, closeClassName = $$new_props.closeClassName);
    		if ("closeAriaLabel" in $$props) $$invalidate(1, closeAriaLabel = $$new_props.closeAriaLabel);
    		if ("isOpen" in $$props) $$invalidate(2, isOpen = $$new_props.isOpen);
    		if ("toggle" in $$props) $$invalidate(3, toggle = $$new_props.toggle);
    		if ("fade" in $$props) $$invalidate(11, fade$1 = $$new_props.fade);
    		if ("transition" in $$props) $$invalidate(4, transition = $$new_props.transition);
    		if ("classes" in $$props) $$invalidate(5, classes = $$new_props.classes);
    		if ("closeClassNames" in $$props) $$invalidate(6, closeClassNames = $$new_props.closeClassNames);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, color, toggle*/ 776) {
    			$$invalidate(5, classes = classnames(className, "alert", `alert-${color}`, { "alert-dismissible": toggle }));
    		}

    		if ($$self.$$.dirty & /*closeClassName*/ 1024) {
    			$$invalidate(6, closeClassNames = classnames("close", closeClassName));
    		}
    	};

    	return [
    		children,
    		closeAriaLabel,
    		isOpen,
    		toggle,
    		transition,
    		classes,
    		closeClassNames,
    		$$restProps,
    		className,
    		color,
    		closeClassName,
    		fade$1,
    		$$scope,
    		slots
    	];
    }

    class Alert extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {
    			class: 8,
    			children: 0,
    			color: 9,
    			closeClassName: 10,
    			closeAriaLabel: 1,
    			isOpen: 2,
    			toggle: 3,
    			fade: 11,
    			transition: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Alert",
    			options,
    			id: create_fragment$o.name
    		});
    	}

    	get class() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get children() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set children(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeClassName() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeClassName(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeAriaLabel() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeAriaLabel(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isOpen() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isOpen(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggle() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggle(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fade() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fade(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transition() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transition(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Button.svelte generated by Svelte v3.37.0 */
    const file$m = "node_modules/sveltestrap/src/Button.svelte";

    // (48:0) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let button_aria_label_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[17].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], null);
    	const default_slot_or_fallback = default_slot || fallback_block$1(ctx);

    	let button_levels = [
    		/*$$restProps*/ ctx[9],
    		{ class: /*classes*/ ctx[7] },
    		{ disabled: /*disabled*/ ctx[2] },
    		{ value: /*value*/ ctx[5] },
    		{
    			"aria-label": button_aria_label_value = /*ariaLabel*/ ctx[6] || /*defaultAriaLabel*/ ctx[8]
    		},
    		{ style: /*style*/ ctx[4] }
    	];

    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block_1 = {
    		c: function create() {
    			button = element("button");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			set_attributes(button, button_data);
    			add_location(button, file$m, 48, 2, 985);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[19], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 65536) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[16], dirty, null, null);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && dirty & /*close, children, $$scope*/ 65539) {
    					default_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			set_attributes(button, button_data = get_spread_update(button_levels, [
    				dirty & /*$$restProps*/ 512 && /*$$restProps*/ ctx[9],
    				(!current || dirty & /*classes*/ 128) && { class: /*classes*/ ctx[7] },
    				(!current || dirty & /*disabled*/ 4) && { disabled: /*disabled*/ ctx[2] },
    				(!current || dirty & /*value*/ 32) && { value: /*value*/ ctx[5] },
    				(!current || dirty & /*ariaLabel, defaultAriaLabel*/ 320 && button_aria_label_value !== (button_aria_label_value = /*ariaLabel*/ ctx[6] || /*defaultAriaLabel*/ ctx[8])) && { "aria-label": button_aria_label_value },
    				(!current || dirty & /*style*/ 16) && { style: /*style*/ ctx[4] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(48:0) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (33:0) {#if href}
    function create_if_block$5(ctx) {
    	let a;
    	let current_block_type_index;
    	let if_block;
    	let a_aria_label_value;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_1$3, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*children*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	let a_levels = [
    		/*$$restProps*/ ctx[9],
    		{ class: /*classes*/ ctx[7] },
    		{ disabled: /*disabled*/ ctx[2] },
    		{ href: /*href*/ ctx[3] },
    		{
    			"aria-label": a_aria_label_value = /*ariaLabel*/ ctx[6] || /*defaultAriaLabel*/ ctx[8]
    		},
    		{ style: /*style*/ ctx[4] }
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block_1 = {
    		c: function create() {
    			a = element("a");
    			if_block.c();
    			set_attributes(a, a_data);
    			add_location(a, file$m, 33, 2, 752);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			if_blocks[current_block_type_index].m(a, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(a, null);
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				dirty & /*$$restProps*/ 512 && /*$$restProps*/ ctx[9],
    				(!current || dirty & /*classes*/ 128) && { class: /*classes*/ ctx[7] },
    				(!current || dirty & /*disabled*/ 4) && { disabled: /*disabled*/ ctx[2] },
    				(!current || dirty & /*href*/ 8) && { href: /*href*/ ctx[3] },
    				(!current || dirty & /*ariaLabel, defaultAriaLabel*/ 320 && a_aria_label_value !== (a_aria_label_value = /*ariaLabel*/ ctx[6] || /*defaultAriaLabel*/ ctx[8])) && { "aria-label": a_aria_label_value },
    				(!current || dirty & /*style*/ 16) && { style: /*style*/ ctx[4] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(33:0) {#if href}",
    		ctx
    	});

    	return block_1;
    }

    // (62:6) {:else}
    function create_else_block_2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[17].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], null);

    	const block_1 = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 65536) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[16], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(62:6) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (60:25) 
    function create_if_block_3$1(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*children*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*children*/ 1) set_data_dev(t, /*children*/ ctx[0]);
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(60:25) ",
    		ctx
    	});

    	return block_1;
    }

    // (58:6) {#if close}
    function create_if_block_2$2(ctx) {
    	let span;

    	const block_1 = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "×";
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$m, 58, 8, 1171);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop$1,
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(58:6) {#if close}",
    		ctx
    	});

    	return block_1;
    }

    // (57:10)        
    function fallback_block$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2$2, create_if_block_3$1, create_else_block_2];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*close*/ ctx[1]) return 0;
    		if (/*children*/ ctx[0]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block_1 = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: fallback_block$1.name,
    		type: "fallback",
    		source: "(57:10)        ",
    		ctx
    	});

    	return block_1;
    }

    // (44:4) {:else}
    function create_else_block$4(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[17].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], null);

    	const block_1 = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 65536) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[16], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(44:4) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (42:4) {#if children}
    function create_if_block_1$3(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*children*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*children*/ 1) set_data_dev(t, /*children*/ ctx[0]);
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(42:4) {#if children}",
    		ctx
    	});

    	return block_1;
    }

    function create_fragment$n(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$5, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*href*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block_1 = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let ariaLabel;
    	let classes;
    	let defaultAriaLabel;

    	const omit_props_names = [
    		"class","active","block","children","close","color","disabled","href","outline","size","style","value"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { active = false } = $$props;
    	let { block = false } = $$props;
    	let { children = undefined } = $$props;
    	let { close = false } = $$props;
    	let { color = "secondary" } = $$props;
    	let { disabled = false } = $$props;
    	let { href = "" } = $$props;
    	let { outline = false } = $$props;
    	let { size = null } = $$props;
    	let { style = "" } = $$props;
    	let { value = "" } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(20, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		$$invalidate(9, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(10, className = $$new_props.class);
    		if ("active" in $$new_props) $$invalidate(11, active = $$new_props.active);
    		if ("block" in $$new_props) $$invalidate(12, block = $$new_props.block);
    		if ("children" in $$new_props) $$invalidate(0, children = $$new_props.children);
    		if ("close" in $$new_props) $$invalidate(1, close = $$new_props.close);
    		if ("color" in $$new_props) $$invalidate(13, color = $$new_props.color);
    		if ("disabled" in $$new_props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ("href" in $$new_props) $$invalidate(3, href = $$new_props.href);
    		if ("outline" in $$new_props) $$invalidate(14, outline = $$new_props.outline);
    		if ("size" in $$new_props) $$invalidate(15, size = $$new_props.size);
    		if ("style" in $$new_props) $$invalidate(4, style = $$new_props.style);
    		if ("value" in $$new_props) $$invalidate(5, value = $$new_props.value);
    		if ("$$scope" in $$new_props) $$invalidate(16, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		active,
    		block,
    		children,
    		close,
    		color,
    		disabled,
    		href,
    		outline,
    		size,
    		style,
    		value,
    		ariaLabel,
    		classes,
    		defaultAriaLabel
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(20, $$props = assign(assign({}, $$props), $$new_props));
    		if ("className" in $$props) $$invalidate(10, className = $$new_props.className);
    		if ("active" in $$props) $$invalidate(11, active = $$new_props.active);
    		if ("block" in $$props) $$invalidate(12, block = $$new_props.block);
    		if ("children" in $$props) $$invalidate(0, children = $$new_props.children);
    		if ("close" in $$props) $$invalidate(1, close = $$new_props.close);
    		if ("color" in $$props) $$invalidate(13, color = $$new_props.color);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ("href" in $$props) $$invalidate(3, href = $$new_props.href);
    		if ("outline" in $$props) $$invalidate(14, outline = $$new_props.outline);
    		if ("size" in $$props) $$invalidate(15, size = $$new_props.size);
    		if ("style" in $$props) $$invalidate(4, style = $$new_props.style);
    		if ("value" in $$props) $$invalidate(5, value = $$new_props.value);
    		if ("ariaLabel" in $$props) $$invalidate(6, ariaLabel = $$new_props.ariaLabel);
    		if ("classes" in $$props) $$invalidate(7, classes = $$new_props.classes);
    		if ("defaultAriaLabel" in $$props) $$invalidate(8, defaultAriaLabel = $$new_props.defaultAriaLabel);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		$$invalidate(6, ariaLabel = $$props["aria-label"]);

    		if ($$self.$$.dirty & /*className, close, outline, color, size, block, active*/ 64514) {
    			$$invalidate(7, classes = classnames(className, { close }, close || "btn", close || `btn${outline ? "-outline" : ""}-${color}`, size ? `btn-${size}` : false, block ? "btn-block" : false, { active }));
    		}

    		if ($$self.$$.dirty & /*close*/ 2) {
    			$$invalidate(8, defaultAriaLabel = close ? "Close" : null);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		children,
    		close,
    		disabled,
    		href,
    		style,
    		value,
    		ariaLabel,
    		classes,
    		defaultAriaLabel,
    		$$restProps,
    		className,
    		active,
    		block,
    		color,
    		outline,
    		size,
    		$$scope,
    		slots,
    		click_handler,
    		click_handler_1
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {
    			class: 10,
    			active: 11,
    			block: 12,
    			children: 0,
    			close: 1,
    			color: 13,
    			disabled: 2,
    			href: 3,
    			outline: 14,
    			size: 15,
    			style: 4,
    			value: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$n.name
    		});
    	}

    	get class() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get block() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get children() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set children(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set close(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outline() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outline(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Card.svelte generated by Svelte v3.37.0 */
    const file$l = "node_modules/sveltestrap/src/Card.svelte";

    function create_fragment$m(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	let div_levels = [
    		/*$$restProps*/ ctx[2],
    		{ class: /*classes*/ ctx[1] },
    		{ style: /*style*/ ctx[0] }
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$l, 20, 0, 437);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] },
    				(!current || dirty & /*style*/ 1) && { style: /*style*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","body","color","inverse","outline","style"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { body = false } = $$props;
    	let { color = "" } = $$props;
    	let { inverse = false } = $$props;
    	let { outline = false } = $$props;
    	let { style = "" } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(3, className = $$new_props.class);
    		if ("body" in $$new_props) $$invalidate(4, body = $$new_props.body);
    		if ("color" in $$new_props) $$invalidate(5, color = $$new_props.color);
    		if ("inverse" in $$new_props) $$invalidate(6, inverse = $$new_props.inverse);
    		if ("outline" in $$new_props) $$invalidate(7, outline = $$new_props.outline);
    		if ("style" in $$new_props) $$invalidate(0, style = $$new_props.style);
    		if ("$$scope" in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		body,
    		color,
    		inverse,
    		outline,
    		style,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(3, className = $$new_props.className);
    		if ("body" in $$props) $$invalidate(4, body = $$new_props.body);
    		if ("color" in $$props) $$invalidate(5, color = $$new_props.color);
    		if ("inverse" in $$props) $$invalidate(6, inverse = $$new_props.inverse);
    		if ("outline" in $$props) $$invalidate(7, outline = $$new_props.outline);
    		if ("style" in $$props) $$invalidate(0, style = $$new_props.style);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, inverse, body, color, outline*/ 248) {
    			$$invalidate(1, classes = classnames(className, "card", inverse ? "text-white" : false, body ? "card-body" : false, color ? `${outline ? "border" : "bg"}-${color}` : false));
    		}
    	};

    	return [
    		style,
    		classes,
    		$$restProps,
    		className,
    		body,
    		color,
    		inverse,
    		outline,
    		$$scope,
    		slots,
    		click_handler
    	];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {
    			class: 3,
    			body: 4,
    			color: 5,
    			inverse: 6,
    			outline: 7,
    			style: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$m.name
    		});
    	}

    	get class() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get body() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set body(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inverse() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inverse(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outline() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outline(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Col.svelte generated by Svelte v3.37.0 */
    const file$k = "node_modules/sveltestrap/src/Col.svelte";

    function create_fragment$l(ctx) {
    	let div;
    	let div_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	let div_levels = [
    		/*$$restProps*/ ctx[1],
    		{
    			class: div_class_value = /*colClasses*/ ctx[0].join(" ")
    		}
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$k, 58, 0, 1388);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				{ class: div_class_value }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	const omit_props_names = ["class","xs","sm","md","lg","xl"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Col", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { xs = undefined } = $$props;
    	let { sm = undefined } = $$props;
    	let { md = undefined } = $$props;
    	let { lg = undefined } = $$props;
    	let { xl = undefined } = $$props;
    	const colClasses = [];
    	const lookup = { xs, sm, md, lg, xl };

    	Object.keys(lookup).forEach(colWidth => {
    		const columnProp = lookup[colWidth];

    		if (!columnProp && columnProp !== "") {
    			return; //no value for this width
    		}

    		const isXs = colWidth === "xs";

    		if (isObject(columnProp)) {
    			const colSizeInterfix = isXs ? "-" : `-${colWidth}-`;
    			const colClass = getColumnSizeClass(isXs, colWidth, columnProp.size);

    			if (columnProp.size || columnProp.size === "") {
    				colClasses.push(colClass);
    			}

    			if (columnProp.push) {
    				colClasses.push(`push${colSizeInterfix}${columnProp.push}`);
    			}

    			if (columnProp.pull) {
    				colClasses.push(`pull${colSizeInterfix}${columnProp.pull}`);
    			}

    			if (columnProp.offset) {
    				colClasses.push(`offset${colSizeInterfix}${columnProp.offset}`);
    			}
    		} else {
    			colClasses.push(getColumnSizeClass(isXs, colWidth, columnProp));
    		}
    	});

    	if (!colClasses.length) {
    		colClasses.push("col");
    	}

    	if (className) {
    		colClasses.push(className);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("xs" in $$new_props) $$invalidate(3, xs = $$new_props.xs);
    		if ("sm" in $$new_props) $$invalidate(4, sm = $$new_props.sm);
    		if ("md" in $$new_props) $$invalidate(5, md = $$new_props.md);
    		if ("lg" in $$new_props) $$invalidate(6, lg = $$new_props.lg);
    		if ("xl" in $$new_props) $$invalidate(7, xl = $$new_props.xl);
    		if ("$$scope" in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getColumnSizeClass,
    		isObject,
    		className,
    		xs,
    		sm,
    		md,
    		lg,
    		xl,
    		colClasses,
    		lookup
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("xs" in $$props) $$invalidate(3, xs = $$new_props.xs);
    		if ("sm" in $$props) $$invalidate(4, sm = $$new_props.sm);
    		if ("md" in $$props) $$invalidate(5, md = $$new_props.md);
    		if ("lg" in $$props) $$invalidate(6, lg = $$new_props.lg);
    		if ("xl" in $$props) $$invalidate(7, xl = $$new_props.xl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [colClasses, $$restProps, className, xs, sm, md, lg, xl, $$scope, slots];
    }

    class Col extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {
    			class: 2,
    			xs: 3,
    			sm: 4,
    			md: 5,
    			lg: 6,
    			xl: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Col",
    			options,
    			id: create_fragment$l.name
    		});
    	}

    	get class() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xs() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xs(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sm() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sm(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get md() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set md(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lg() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lg(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xl() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xl(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Container.svelte generated by Svelte v3.37.0 */
    const file$j = "node_modules/sveltestrap/src/Container.svelte";

    function create_fragment$k(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let div_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$j, 10, 0, 220);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","fluid"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Container", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { fluid = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("fluid" in $$new_props) $$invalidate(3, fluid = $$new_props.fluid);
    		if ("$$scope" in $$new_props) $$invalidate(4, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ classnames, className, fluid, classes });

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("fluid" in $$props) $$invalidate(3, fluid = $$new_props.fluid);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, fluid*/ 12) {
    			$$invalidate(0, classes = classnames(className, fluid ? "container-fluid" : "container"));
    		}
    	};

    	return [classes, $$restProps, className, fluid, $$scope, slots];
    }

    class Container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { class: 2, fluid: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Container",
    			options,
    			id: create_fragment$k.name
    		});
    	}

    	get class() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fluid() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fluid(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Form.svelte generated by Svelte v3.37.0 */
    const file$i = "node_modules/sveltestrap/src/Form.svelte";

    function create_fragment$j(ctx) {
    	let form;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let form_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let form_data = {};

    	for (let i = 0; i < form_levels.length; i += 1) {
    		form_data = assign(form_data, form_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			form = element("form");
    			if (default_slot) default_slot.c();
    			set_attributes(form, form_data);
    			add_location(form, file$i, 10, 0, 212);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);

    			if (default_slot) {
    				default_slot.m(form, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", /*submit_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			set_attributes(form, form_data = get_spread_update(form_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","inline"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Form", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { inline = false } = $$props;

    	function submit_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("inline" in $$new_props) $$invalidate(3, inline = $$new_props.inline);
    		if ("$$scope" in $$new_props) $$invalidate(4, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ classnames, className, inline, classes });

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("inline" in $$props) $$invalidate(3, inline = $$new_props.inline);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, inline*/ 12) {
    			$$invalidate(0, classes = classnames(className, inline ? "form-inline" : false));
    		}
    	};

    	return [classes, $$restProps, className, inline, $$scope, slots, submit_handler];
    }

    class Form extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { class: 2, inline: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Form",
    			options,
    			id: create_fragment$j.name
    		});
    	}

    	get class() {
    		throw new Error("<Form>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Form>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inline() {
    		throw new Error("<Form>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inline(value) {
    		throw new Error("<Form>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/FormGroup.svelte generated by Svelte v3.37.0 */
    const file$h = "node_modules/sveltestrap/src/FormGroup.svelte";

    // (25:0) {:else}
    function create_else_block$3(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);
    	let div_levels = [/*$$restProps*/ ctx[2], { class: /*classes*/ ctx[1] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$h, 25, 2, 574);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(25:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:0) {#if tag === 'fieldset'}
    function create_if_block$4(ctx) {
    	let fieldset;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);
    	let fieldset_levels = [/*$$restProps*/ ctx[2], { class: /*classes*/ ctx[1] }];
    	let fieldset_data = {};

    	for (let i = 0; i < fieldset_levels.length; i += 1) {
    		fieldset_data = assign(fieldset_data, fieldset_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			fieldset = element("fieldset");
    			if (default_slot) default_slot.c();
    			set_attributes(fieldset, fieldset_data);
    			add_location(fieldset, file$h, 21, 2, 493);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, fieldset, anchor);

    			if (default_slot) {
    				default_slot.m(fieldset, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}

    			set_attributes(fieldset, fieldset_data = get_spread_update(fieldset_levels, [
    				dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(fieldset);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(21:0) {#if tag === 'fieldset'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*tag*/ ctx[0] === "fieldset") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","row","check","inline","disabled","tag"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FormGroup", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { row = false } = $$props;
    	let { check = false } = $$props;
    	let { inline = false } = $$props;
    	let { disabled = false } = $$props;
    	let { tag = null } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(3, className = $$new_props.class);
    		if ("row" in $$new_props) $$invalidate(4, row = $$new_props.row);
    		if ("check" in $$new_props) $$invalidate(5, check = $$new_props.check);
    		if ("inline" in $$new_props) $$invalidate(6, inline = $$new_props.inline);
    		if ("disabled" in $$new_props) $$invalidate(7, disabled = $$new_props.disabled);
    		if ("tag" in $$new_props) $$invalidate(0, tag = $$new_props.tag);
    		if ("$$scope" in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		row,
    		check,
    		inline,
    		disabled,
    		tag,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(3, className = $$new_props.className);
    		if ("row" in $$props) $$invalidate(4, row = $$new_props.row);
    		if ("check" in $$props) $$invalidate(5, check = $$new_props.check);
    		if ("inline" in $$props) $$invalidate(6, inline = $$new_props.inline);
    		if ("disabled" in $$props) $$invalidate(7, disabled = $$new_props.disabled);
    		if ("tag" in $$props) $$invalidate(0, tag = $$new_props.tag);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, row, check, inline, disabled*/ 248) {
    			$$invalidate(1, classes = classnames(className, row ? "row" : false, check ? "form-check" : "form-group", check && inline ? "form-check-inline" : false, check && disabled ? "disabled" : false));
    		}
    	};

    	return [
    		tag,
    		classes,
    		$$restProps,
    		className,
    		row,
    		check,
    		inline,
    		disabled,
    		$$scope,
    		slots
    	];
    }

    class FormGroup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {
    			class: 3,
    			row: 4,
    			check: 5,
    			inline: 6,
    			disabled: 7,
    			tag: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormGroup",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get class() {
    		throw new Error("<FormGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<FormGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get row() {
    		throw new Error("<FormGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set row(value) {
    		throw new Error("<FormGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get check() {
    		throw new Error("<FormGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set check(value) {
    		throw new Error("<FormGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inline() {
    		throw new Error("<FormGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inline(value) {
    		throw new Error("<FormGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<FormGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<FormGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tag() {
    		throw new Error("<FormGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tag(value) {
    		throw new Error("<FormGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Icon.svelte generated by Svelte v3.37.0 */
    const file$g = "node_modules/sveltestrap/src/Icon.svelte";

    function create_fragment$h(ctx) {
    	let i;
    	let i_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let i_data = {};

    	for (let i = 0; i < i_levels.length; i += 1) {
    		i_data = assign(i_data, i_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			i = element("i");
    			set_attributes(i, i_data);
    			add_location(i, file$g, 14, 0, 301);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			set_attributes(i, i_data = get_spread_update(i_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				dirty & /*classes*/ 1 && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","name"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Icon", slots, []);
    	let { class: className = "" } = $$props;
    	let { name = "" } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("name" in $$new_props) $$invalidate(3, name = $$new_props.name);
    	};

    	$$self.$capture_state = () => ({ classnames, className, name, classes });

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("name" in $$props) $$invalidate(3, name = $$new_props.name);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, name*/ 12) {
    			$$invalidate(0, classes = classnames(className, `bi-${name}`));
    		}
    	};

    	return [classes, $$restProps, className, name];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { class: 2, name: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get class() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Input.svelte generated by Svelte v3.37.0 */
    const file$f = "node_modules/sveltestrap/src/Input.svelte";

    // (356:40) 
    function create_if_block_16(ctx) {
    	let select;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[22].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[21], null);

    	let select_levels = [
    		/*$$restProps*/ ctx[12],
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ readonly: /*readonly*/ ctx[4] }
    	];

    	let select_data = {};

    	for (let i = 0; i < select_levels.length; i += 1) {
    		select_data = assign(select_data, select_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			select = element("select");
    			if (default_slot) default_slot.c();
    			set_attributes(select, select_data);
    			if (/*value*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[152].call(select));
    			add_location(select, file$f, 356, 2, 7097);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			if (default_slot) {
    				default_slot.m(select, null);
    			}

    			if (select_data.multiple) select_options(select, select_data.value);
    			select_option(select, /*value*/ ctx[1]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "blur", /*blur_handler_16*/ ctx[133], false, false, false),
    					listen_dev(select, "focus", /*focus_handler_16*/ ctx[134], false, false, false),
    					listen_dev(select, "change", /*change_handler_15*/ ctx[135], false, false, false),
    					listen_dev(select, "input", /*input_handler_15*/ ctx[136], false, false, false),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[152])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty[0] & /*$$scope*/ 2097152) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[21], dirty, null, null);
    				}
    			}

    			set_attributes(select, select_data = get_spread_update(select_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				(!current || dirty[0] & /*classes*/ 512) && { class: /*classes*/ ctx[9] },
    				(!current || dirty[0] & /*name*/ 64) && { name: /*name*/ ctx[6] },
    				(!current || dirty[0] & /*disabled*/ 256) && { disabled: /*disabled*/ ctx[8] },
    				(!current || dirty[0] & /*readonly*/ 16) && { readonly: /*readonly*/ ctx[4] }
    			]));

    			if (dirty[0] & /*$$restProps, classes, name, disabled, readonly*/ 4944 && select_data.multiple) select_options(select, select_data.value);

    			if (dirty[0] & /*value*/ 2) {
    				select_option(select, /*value*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_16.name,
    		type: "if",
    		source: "(356:40) ",
    		ctx
    	});

    	return block;
    }

    // (340:29) 
    function create_if_block_15(ctx) {
    	let textarea;
    	let mounted;
    	let dispose;

    	let textarea_levels = [
    		/*$$restProps*/ ctx[12],
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] },
    		{ readOnly: /*readonly*/ ctx[4] }
    	];

    	let textarea_data = {};

    	for (let i = 0; i < textarea_levels.length; i += 1) {
    		textarea_data = assign(textarea_data, textarea_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			set_attributes(textarea, textarea_data);
    			add_location(textarea, file$f, 340, 2, 6830);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "blur", /*blur_handler_15*/ ctx[126], false, false, false),
    					listen_dev(textarea, "focus", /*focus_handler_15*/ ctx[127], false, false, false),
    					listen_dev(textarea, "keydown", /*keydown_handler_15*/ ctx[128], false, false, false),
    					listen_dev(textarea, "keypress", /*keypress_handler_15*/ ctx[129], false, false, false),
    					listen_dev(textarea, "keyup", /*keyup_handler_15*/ ctx[130], false, false, false),
    					listen_dev(textarea, "change", /*change_handler_14*/ ctx[131], false, false, false),
    					listen_dev(textarea, "input", /*input_handler_14*/ ctx[132], false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[151])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(textarea, textarea_data = get_spread_update(textarea_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] }
    			]));

    			if (dirty[0] & /*value*/ 2) {
    				set_input_value(textarea, /*value*/ ctx[1]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_15.name,
    		type: "if",
    		source: "(340:29) ",
    		ctx
    	});

    	return block;
    }

    // (82:0) {#if tag === 'input'}
    function create_if_block$3(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*type*/ ctx[3] === "text") return create_if_block_1$2;
    		if (/*type*/ ctx[3] === "password") return create_if_block_2$1;
    		if (/*type*/ ctx[3] === "email") return create_if_block_3;
    		if (/*type*/ ctx[3] === "file") return create_if_block_4;
    		if (/*type*/ ctx[3] === "checkbox") return create_if_block_5;
    		if (/*type*/ ctx[3] === "radio") return create_if_block_6;
    		if (/*type*/ ctx[3] === "url") return create_if_block_7;
    		if (/*type*/ ctx[3] === "number") return create_if_block_8;
    		if (/*type*/ ctx[3] === "date") return create_if_block_9;
    		if (/*type*/ ctx[3] === "time") return create_if_block_10;
    		if (/*type*/ ctx[3] === "datetime") return create_if_block_11;
    		if (/*type*/ ctx[3] === "color") return create_if_block_12;
    		if (/*type*/ ctx[3] === "range") return create_if_block_13;
    		if (/*type*/ ctx[3] === "search") return create_if_block_14;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(82:0) {#if tag === 'input'}",
    		ctx
    	});

    	return block;
    }

    // (322:2) {:else}
    function create_else_block$2(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: /*type*/ ctx[3] },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] },
    		{ value: /*value*/ ctx[1] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 322, 4, 6503);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			input.value = input_data.value;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_14*/ ctx[121], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_14*/ ctx[122], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_14*/ ctx[123], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_14*/ ctx[124], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_14*/ ctx[125], false, false, false),
    					listen_dev(input, "input", /*handleInput*/ ctx[11], false, false, false),
    					listen_dev(input, "change", /*handleInput*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				dirty[0] & /*type*/ 8 && { type: /*type*/ ctx[3] },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] },
    				dirty[0] & /*value*/ 2 && input.value !== /*value*/ ctx[1] && { value: /*value*/ ctx[1] }
    			]));

    			if ("value" in input_data) {
    				input.value = input_data.value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(322:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (305:30) 
    function create_if_block_14(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "search" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 305, 4, 6220);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_13*/ ctx[114], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_13*/ ctx[115], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_13*/ ctx[116], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_13*/ ctx[117], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_13*/ ctx[118], false, false, false),
    					listen_dev(input, "change", /*change_handler_13*/ ctx[119], false, false, false),
    					listen_dev(input, "input", /*input_handler_13*/ ctx[120], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_9*/ ctx[150])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "search" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*value*/ 2) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_14.name,
    		type: "if",
    		source: "(305:30) ",
    		ctx
    	});

    	return block;
    }

    // (288:29) 
    function create_if_block_13(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "range" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 288, 4, 5917);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_12*/ ctx[107], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_12*/ ctx[108], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_12*/ ctx[109], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_12*/ ctx[110], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_12*/ ctx[111], false, false, false),
    					listen_dev(input, "change", /*change_handler_12*/ ctx[112], false, false, false),
    					listen_dev(input, "input", /*input_handler_12*/ ctx[113], false, false, false),
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[149]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[149])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "range" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*value*/ 2) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13.name,
    		type: "if",
    		source: "(288:29) ",
    		ctx
    	});

    	return block;
    }

    // (271:29) 
    function create_if_block_12(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "color" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 271, 4, 5615);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_11*/ ctx[100], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_11*/ ctx[101], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_11*/ ctx[102], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_11*/ ctx[103], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_11*/ ctx[104], false, false, false),
    					listen_dev(input, "change", /*change_handler_11*/ ctx[105], false, false, false),
    					listen_dev(input, "input", /*input_handler_11*/ ctx[106], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_8*/ ctx[148])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "color" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*value*/ 2) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(271:29) ",
    		ctx
    	});

    	return block;
    }

    // (254:32) 
    function create_if_block_11(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "datetime" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 254, 4, 5310);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_10*/ ctx[93], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_10*/ ctx[94], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_10*/ ctx[95], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_10*/ ctx[96], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_10*/ ctx[97], false, false, false),
    					listen_dev(input, "change", /*change_handler_10*/ ctx[98], false, false, false),
    					listen_dev(input, "input", /*input_handler_10*/ ctx[99], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_7*/ ctx[147])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "datetime" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*value*/ 2) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(254:32) ",
    		ctx
    	});

    	return block;
    }

    // (237:28) 
    function create_if_block_10(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "time" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 237, 4, 5006);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_9*/ ctx[86], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_9*/ ctx[87], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_9*/ ctx[88], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_9*/ ctx[89], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_9*/ ctx[90], false, false, false),
    					listen_dev(input, "change", /*change_handler_9*/ ctx[91], false, false, false),
    					listen_dev(input, "input", /*input_handler_9*/ ctx[92], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_6*/ ctx[146])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "time" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*value*/ 2) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(237:28) ",
    		ctx
    	});

    	return block;
    }

    // (220:28) 
    function create_if_block_9(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "date" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 220, 4, 4706);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_8*/ ctx[79], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_8*/ ctx[80], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_8*/ ctx[81], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_8*/ ctx[82], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_8*/ ctx[83], false, false, false),
    					listen_dev(input, "change", /*change_handler_8*/ ctx[84], false, false, false),
    					listen_dev(input, "input", /*input_handler_8*/ ctx[85], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_5*/ ctx[145])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "date" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*value*/ 2) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(220:28) ",
    		ctx
    	});

    	return block;
    }

    // (203:30) 
    function create_if_block_8(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "number" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 203, 4, 4404);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_7*/ ctx[72], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_7*/ ctx[73], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_7*/ ctx[74], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_7*/ ctx[75], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_7*/ ctx[76], false, false, false),
    					listen_dev(input, "change", /*change_handler_7*/ ctx[77], false, false, false),
    					listen_dev(input, "input", /*input_handler_7*/ ctx[78], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_4*/ ctx[144])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "number" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*value*/ 2 && to_number(input.value) !== /*value*/ ctx[1]) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(203:30) ",
    		ctx
    	});

    	return block;
    }

    // (186:27) 
    function create_if_block_7(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "url" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 186, 4, 4103);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_6*/ ctx[65], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_6*/ ctx[66], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_6*/ ctx[67], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_6*/ ctx[68], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_6*/ ctx[69], false, false, false),
    					listen_dev(input, "change", /*change_handler_6*/ ctx[70], false, false, false),
    					listen_dev(input, "input", /*input_handler_6*/ ctx[71], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_3*/ ctx[143])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "url" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*value*/ 2) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(186:27) ",
    		ctx
    	});

    	return block;
    }

    // (169:29) 
    function create_if_block_6(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "radio" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 169, 4, 3803);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_5*/ ctx[58], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_5*/ ctx[59], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_5*/ ctx[60], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_5*/ ctx[61], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_5*/ ctx[62], false, false, false),
    					listen_dev(input, "change", /*change_handler_5*/ ctx[63], false, false, false),
    					listen_dev(input, "input", /*input_handler_5*/ ctx[64], false, false, false),
    					listen_dev(input, "change", /*input_change_handler_2*/ ctx[142])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "radio" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*value*/ 2) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(169:29) ",
    		ctx
    	});

    	return block;
    }

    // (151:32) 
    function create_if_block_5(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "checkbox" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 151, 4, 3479);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			input.checked = /*checked*/ ctx[0];
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_4*/ ctx[51], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_4*/ ctx[52], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_4*/ ctx[53], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_4*/ ctx[54], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_4*/ ctx[55], false, false, false),
    					listen_dev(input, "change", /*change_handler_4*/ ctx[56], false, false, false),
    					listen_dev(input, "input", /*input_handler_4*/ ctx[57], false, false, false),
    					listen_dev(input, "change", /*input_change_handler_1*/ ctx[141])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "checkbox" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*checked*/ 1) {
    				input.checked = /*checked*/ ctx[0];
    			}

    			if (dirty[0] & /*value*/ 2) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(151:32) ",
    		ctx
    	});

    	return block;
    }

    // (134:28) 
    function create_if_block_4(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "file" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 134, 4, 3175);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_3*/ ctx[44], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_3*/ ctx[45], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_3*/ ctx[46], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_3*/ ctx[47], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_3*/ ctx[48], false, false, false),
    					listen_dev(input, "change", /*change_handler_3*/ ctx[49], false, false, false),
    					listen_dev(input, "input", /*input_handler_3*/ ctx[50], false, false, false),
    					listen_dev(input, "change", /*input_change_handler*/ ctx[140])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "file" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(134:28) ",
    		ctx
    	});

    	return block;
    }

    // (117:29) 
    function create_if_block_3(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "email" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 117, 4, 2874);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_2*/ ctx[37], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_2*/ ctx[38], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_2*/ ctx[39], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_2*/ ctx[40], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_2*/ ctx[41], false, false, false),
    					listen_dev(input, "change", /*change_handler_2*/ ctx[42], false, false, false),
    					listen_dev(input, "input", /*input_handler_2*/ ctx[43], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_2*/ ctx[139])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "email" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*value*/ 2 && input.value !== /*value*/ ctx[1]) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(117:29) ",
    		ctx
    	});

    	return block;
    }

    // (100:32) 
    function create_if_block_2$1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "password" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 100, 4, 2569);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler_1*/ ctx[30], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_1*/ ctx[31], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler_1*/ ctx[32], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler_1*/ ctx[33], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler_1*/ ctx[34], false, false, false),
    					listen_dev(input, "change", /*change_handler_1*/ ctx[35], false, false, false),
    					listen_dev(input, "input", /*input_handler_1*/ ctx[36], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_1*/ ctx[138])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "password" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*value*/ 2 && input.value !== /*value*/ ctx[1]) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(100:32) ",
    		ctx
    	});

    	return block;
    }

    // (83:2) {#if type === 'text'}
    function create_if_block_1$2(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		/*$$restProps*/ ctx[12],
    		{ type: "text" },
    		{ readOnly: /*readonly*/ ctx[4] },
    		{ class: /*classes*/ ctx[9] },
    		{ name: /*name*/ ctx[6] },
    		{ disabled: /*disabled*/ ctx[8] },
    		{ placeholder: /*placeholder*/ ctx[7] }
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$f, 83, 4, 2265);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "blur", /*blur_handler*/ ctx[23], false, false, false),
    					listen_dev(input, "focus", /*focus_handler*/ ctx[24], false, false, false),
    					listen_dev(input, "keydown", /*keydown_handler*/ ctx[25], false, false, false),
    					listen_dev(input, "keypress", /*keypress_handler*/ ctx[26], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler*/ ctx[27], false, false, false),
    					listen_dev(input, "change", /*change_handler*/ ctx[28], false, false, false),
    					listen_dev(input, "input", /*input_handler*/ ctx[29], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[137])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*$$restProps*/ 4096 && /*$$restProps*/ ctx[12],
    				{ type: "text" },
    				dirty[0] & /*readonly*/ 16 && { readOnly: /*readonly*/ ctx[4] },
    				dirty[0] & /*classes*/ 512 && { class: /*classes*/ ctx[9] },
    				dirty[0] & /*name*/ 64 && { name: /*name*/ ctx[6] },
    				dirty[0] & /*disabled*/ 256 && { disabled: /*disabled*/ ctx[8] },
    				dirty[0] & /*placeholder*/ 128 && { placeholder: /*placeholder*/ ctx[7] }
    			]));

    			if (dirty[0] & /*value*/ 2 && input.value !== /*value*/ ctx[1]) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(83:2) {#if type === 'text'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_if_block_15, create_if_block_16];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*tag*/ ctx[10] === "input") return 0;
    		if (/*tag*/ ctx[10] === "textarea") return 1;
    		if (/*tag*/ ctx[10] === "select" && !/*multiple*/ ctx[5]) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	const omit_props_names = [
    		"class","type","size","bsSize","color","checked","valid","invalid","plaintext","addon","value","files","readonly","multiple","name","placeholder","disabled"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Input", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { type = "text" } = $$props;
    	let { size = undefined } = $$props;
    	let { bsSize = undefined } = $$props;
    	let { color = undefined } = $$props;
    	let { checked = false } = $$props;
    	let { valid = false } = $$props;
    	let { invalid = false } = $$props;
    	let { plaintext = false } = $$props;
    	let { addon = false } = $$props;
    	let { value = "" } = $$props;
    	let { files = "" } = $$props;
    	let { readonly = undefined } = $$props;
    	let { multiple = undefined } = $$props;
    	let { name = "" } = $$props;
    	let { placeholder = "" } = $$props;
    	let { disabled = undefined } = $$props;
    	let classes;
    	let tag;

    	const handleInput = event => {
    		$$invalidate(1, value = event.target.value);
    	};

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_1(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_1(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_1(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_1(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_1(event) {
    		bubble($$self, event);
    	}

    	function change_handler_1(event) {
    		bubble($$self, event);
    	}

    	function input_handler_1(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_2(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_2(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_2(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_2(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_2(event) {
    		bubble($$self, event);
    	}

    	function change_handler_2(event) {
    		bubble($$self, event);
    	}

    	function input_handler_2(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_3(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_3(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_3(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_3(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_3(event) {
    		bubble($$self, event);
    	}

    	function change_handler_3(event) {
    		bubble($$self, event);
    	}

    	function input_handler_3(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_4(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_4(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_4(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_4(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_4(event) {
    		bubble($$self, event);
    	}

    	function change_handler_4(event) {
    		bubble($$self, event);
    	}

    	function input_handler_4(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_5(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_5(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_5(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_5(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_5(event) {
    		bubble($$self, event);
    	}

    	function change_handler_5(event) {
    		bubble($$self, event);
    	}

    	function input_handler_5(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_6(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_6(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_6(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_6(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_6(event) {
    		bubble($$self, event);
    	}

    	function change_handler_6(event) {
    		bubble($$self, event);
    	}

    	function input_handler_6(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_7(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_7(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_7(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_7(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_7(event) {
    		bubble($$self, event);
    	}

    	function change_handler_7(event) {
    		bubble($$self, event);
    	}

    	function input_handler_7(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_8(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_8(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_8(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_8(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_8(event) {
    		bubble($$self, event);
    	}

    	function change_handler_8(event) {
    		bubble($$self, event);
    	}

    	function input_handler_8(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_9(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_9(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_9(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_9(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_9(event) {
    		bubble($$self, event);
    	}

    	function change_handler_9(event) {
    		bubble($$self, event);
    	}

    	function input_handler_9(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_10(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_10(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_10(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_10(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_10(event) {
    		bubble($$self, event);
    	}

    	function change_handler_10(event) {
    		bubble($$self, event);
    	}

    	function input_handler_10(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_11(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_11(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_11(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_11(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_11(event) {
    		bubble($$self, event);
    	}

    	function change_handler_11(event) {
    		bubble($$self, event);
    	}

    	function input_handler_11(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_12(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_12(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_12(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_12(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_12(event) {
    		bubble($$self, event);
    	}

    	function change_handler_12(event) {
    		bubble($$self, event);
    	}

    	function input_handler_12(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_13(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_13(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_13(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_13(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_13(event) {
    		bubble($$self, event);
    	}

    	function change_handler_13(event) {
    		bubble($$self, event);
    	}

    	function input_handler_13(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_14(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_14(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_14(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_14(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_14(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_15(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_15(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_15(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_15(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_15(event) {
    		bubble($$self, event);
    	}

    	function change_handler_14(event) {
    		bubble($$self, event);
    	}

    	function input_handler_14(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_16(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_16(event) {
    		bubble($$self, event);
    	}

    	function change_handler_15(event) {
    		bubble($$self, event);
    	}

    	function input_handler_15(event) {
    		bubble($$self, event);
    	}

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	function input_input_handler_1() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	function input_input_handler_2() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	function input_change_handler() {
    		files = this.files;
    		$$invalidate(2, files);
    	}

    	function input_change_handler_1() {
    		checked = this.checked;
    		value = this.value;
    		$$invalidate(0, checked);
    		$$invalidate(1, value);
    	}

    	function input_change_handler_2() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	function input_input_handler_3() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	function input_input_handler_4() {
    		value = to_number(this.value);
    		$$invalidate(1, value);
    	}

    	function input_input_handler_5() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	function input_input_handler_6() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	function input_input_handler_7() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	function input_input_handler_8() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	function input_change_input_handler() {
    		value = to_number(this.value);
    		$$invalidate(1, value);
    	}

    	function input_input_handler_9() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	function select_change_handler() {
    		value = select_value(this);
    		$$invalidate(1, value);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(12, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(15, className = $$new_props.class);
    		if ("type" in $$new_props) $$invalidate(3, type = $$new_props.type);
    		if ("size" in $$new_props) $$invalidate(13, size = $$new_props.size);
    		if ("bsSize" in $$new_props) $$invalidate(14, bsSize = $$new_props.bsSize);
    		if ("color" in $$new_props) $$invalidate(16, color = $$new_props.color);
    		if ("checked" in $$new_props) $$invalidate(0, checked = $$new_props.checked);
    		if ("valid" in $$new_props) $$invalidate(17, valid = $$new_props.valid);
    		if ("invalid" in $$new_props) $$invalidate(18, invalid = $$new_props.invalid);
    		if ("plaintext" in $$new_props) $$invalidate(19, plaintext = $$new_props.plaintext);
    		if ("addon" in $$new_props) $$invalidate(20, addon = $$new_props.addon);
    		if ("value" in $$new_props) $$invalidate(1, value = $$new_props.value);
    		if ("files" in $$new_props) $$invalidate(2, files = $$new_props.files);
    		if ("readonly" in $$new_props) $$invalidate(4, readonly = $$new_props.readonly);
    		if ("multiple" in $$new_props) $$invalidate(5, multiple = $$new_props.multiple);
    		if ("name" in $$new_props) $$invalidate(6, name = $$new_props.name);
    		if ("placeholder" in $$new_props) $$invalidate(7, placeholder = $$new_props.placeholder);
    		if ("disabled" in $$new_props) $$invalidate(8, disabled = $$new_props.disabled);
    		if ("$$scope" in $$new_props) $$invalidate(21, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		type,
    		size,
    		bsSize,
    		color,
    		checked,
    		valid,
    		invalid,
    		plaintext,
    		addon,
    		value,
    		files,
    		readonly,
    		multiple,
    		name,
    		placeholder,
    		disabled,
    		classes,
    		tag,
    		handleInput
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(15, className = $$new_props.className);
    		if ("type" in $$props) $$invalidate(3, type = $$new_props.type);
    		if ("size" in $$props) $$invalidate(13, size = $$new_props.size);
    		if ("bsSize" in $$props) $$invalidate(14, bsSize = $$new_props.bsSize);
    		if ("color" in $$props) $$invalidate(16, color = $$new_props.color);
    		if ("checked" in $$props) $$invalidate(0, checked = $$new_props.checked);
    		if ("valid" in $$props) $$invalidate(17, valid = $$new_props.valid);
    		if ("invalid" in $$props) $$invalidate(18, invalid = $$new_props.invalid);
    		if ("plaintext" in $$props) $$invalidate(19, plaintext = $$new_props.plaintext);
    		if ("addon" in $$props) $$invalidate(20, addon = $$new_props.addon);
    		if ("value" in $$props) $$invalidate(1, value = $$new_props.value);
    		if ("files" in $$props) $$invalidate(2, files = $$new_props.files);
    		if ("readonly" in $$props) $$invalidate(4, readonly = $$new_props.readonly);
    		if ("multiple" in $$props) $$invalidate(5, multiple = $$new_props.multiple);
    		if ("name" in $$props) $$invalidate(6, name = $$new_props.name);
    		if ("placeholder" in $$props) $$invalidate(7, placeholder = $$new_props.placeholder);
    		if ("disabled" in $$props) $$invalidate(8, disabled = $$new_props.disabled);
    		if ("classes" in $$props) $$invalidate(9, classes = $$new_props.classes);
    		if ("tag" in $$props) $$invalidate(10, tag = $$new_props.tag);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*type, plaintext, addon, color, size, className, invalid, valid, bsSize*/ 2088968) {
    			{
    				const checkInput = ["radio", "checkbox"].indexOf(type) > -1;
    				const isNotaNumber = new RegExp("\\D", "g");
    				const fileInput = type === "file";
    				const textareaInput = type === "textarea";
    				const rangeInput = type === "range";
    				const selectInput = type === "select";
    				const buttonInput = type === "button" || type === "reset" || type === "submit";
    				const unsupportedInput = type === "hidden" || type === "image";
    				$$invalidate(10, tag = selectInput || textareaInput ? type : "input");
    				let formControlClass = "form-control";

    				if (plaintext) {
    					formControlClass = `${formControlClass}-plaintext`;
    					$$invalidate(10, tag = "input");
    				} else if (fileInput) {
    					formControlClass = `${formControlClass}-file`;
    				} else if (checkInput) {
    					if (addon) {
    						formControlClass = null;
    					} else {
    						formControlClass = "form-check-input";
    					}
    				} else if (buttonInput) {
    					formControlClass = `btn btn-${color || "secondary"}`;
    				} else if (rangeInput) {
    					formControlClass = "form-control-range";
    				} else if (unsupportedInput) {
    					formControlClass = "";
    				}

    				if (size && isNotaNumber.test(size)) {
    					console.warn("Please use the prop \"bsSize\" instead of the \"size\" to bootstrap's input sizing.");
    					$$invalidate(14, bsSize = size);
    					$$invalidate(13, size = undefined);
    				}

    				$$invalidate(9, classes = classnames(className, invalid && "is-invalid", valid && "is-valid", bsSize ? `form-control-${bsSize}` : false, formControlClass));
    			}
    		}
    	};

    	return [
    		checked,
    		value,
    		files,
    		type,
    		readonly,
    		multiple,
    		name,
    		placeholder,
    		disabled,
    		classes,
    		tag,
    		handleInput,
    		$$restProps,
    		size,
    		bsSize,
    		className,
    		color,
    		valid,
    		invalid,
    		plaintext,
    		addon,
    		$$scope,
    		slots,
    		blur_handler,
    		focus_handler,
    		keydown_handler,
    		keypress_handler,
    		keyup_handler,
    		change_handler,
    		input_handler,
    		blur_handler_1,
    		focus_handler_1,
    		keydown_handler_1,
    		keypress_handler_1,
    		keyup_handler_1,
    		change_handler_1,
    		input_handler_1,
    		blur_handler_2,
    		focus_handler_2,
    		keydown_handler_2,
    		keypress_handler_2,
    		keyup_handler_2,
    		change_handler_2,
    		input_handler_2,
    		blur_handler_3,
    		focus_handler_3,
    		keydown_handler_3,
    		keypress_handler_3,
    		keyup_handler_3,
    		change_handler_3,
    		input_handler_3,
    		blur_handler_4,
    		focus_handler_4,
    		keydown_handler_4,
    		keypress_handler_4,
    		keyup_handler_4,
    		change_handler_4,
    		input_handler_4,
    		blur_handler_5,
    		focus_handler_5,
    		keydown_handler_5,
    		keypress_handler_5,
    		keyup_handler_5,
    		change_handler_5,
    		input_handler_5,
    		blur_handler_6,
    		focus_handler_6,
    		keydown_handler_6,
    		keypress_handler_6,
    		keyup_handler_6,
    		change_handler_6,
    		input_handler_6,
    		blur_handler_7,
    		focus_handler_7,
    		keydown_handler_7,
    		keypress_handler_7,
    		keyup_handler_7,
    		change_handler_7,
    		input_handler_7,
    		blur_handler_8,
    		focus_handler_8,
    		keydown_handler_8,
    		keypress_handler_8,
    		keyup_handler_8,
    		change_handler_8,
    		input_handler_8,
    		blur_handler_9,
    		focus_handler_9,
    		keydown_handler_9,
    		keypress_handler_9,
    		keyup_handler_9,
    		change_handler_9,
    		input_handler_9,
    		blur_handler_10,
    		focus_handler_10,
    		keydown_handler_10,
    		keypress_handler_10,
    		keyup_handler_10,
    		change_handler_10,
    		input_handler_10,
    		blur_handler_11,
    		focus_handler_11,
    		keydown_handler_11,
    		keypress_handler_11,
    		keyup_handler_11,
    		change_handler_11,
    		input_handler_11,
    		blur_handler_12,
    		focus_handler_12,
    		keydown_handler_12,
    		keypress_handler_12,
    		keyup_handler_12,
    		change_handler_12,
    		input_handler_12,
    		blur_handler_13,
    		focus_handler_13,
    		keydown_handler_13,
    		keypress_handler_13,
    		keyup_handler_13,
    		change_handler_13,
    		input_handler_13,
    		blur_handler_14,
    		focus_handler_14,
    		keydown_handler_14,
    		keypress_handler_14,
    		keyup_handler_14,
    		blur_handler_15,
    		focus_handler_15,
    		keydown_handler_15,
    		keypress_handler_15,
    		keyup_handler_15,
    		change_handler_14,
    		input_handler_14,
    		blur_handler_16,
    		focus_handler_16,
    		change_handler_15,
    		input_handler_15,
    		input_input_handler,
    		input_input_handler_1,
    		input_input_handler_2,
    		input_change_handler,
    		input_change_handler_1,
    		input_change_handler_2,
    		input_input_handler_3,
    		input_input_handler_4,
    		input_input_handler_5,
    		input_input_handler_6,
    		input_input_handler_7,
    		input_input_handler_8,
    		input_change_input_handler,
    		input_input_handler_9,
    		textarea_input_handler,
    		select_change_handler
    	];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$g,
    			create_fragment$g,
    			safe_not_equal,
    			{
    				class: 15,
    				type: 3,
    				size: 13,
    				bsSize: 14,
    				color: 16,
    				checked: 0,
    				valid: 17,
    				invalid: 18,
    				plaintext: 19,
    				addon: 20,
    				value: 1,
    				files: 2,
    				readonly: 4,
    				multiple: 5,
    				name: 6,
    				placeholder: 7,
    				disabled: 8
    			},
    			[-1, -1, -1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get class() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bsSize() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bsSize(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valid() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valid(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalid() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalid(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get plaintext() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set plaintext(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get addon() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addon(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get files() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set files(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get readonly() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set readonly(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multiple() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multiple(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/InputGroup.svelte generated by Svelte v3.37.0 */
    const file$e = "node_modules/sveltestrap/src/InputGroup.svelte";

    function create_fragment$f(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let div_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$e, 14, 0, 243);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","size"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("InputGroup", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { size = "" } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("size" in $$new_props) $$invalidate(3, size = $$new_props.size);
    		if ("$$scope" in $$new_props) $$invalidate(4, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ classnames, className, size, classes });

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("size" in $$props) $$invalidate(3, size = $$new_props.size);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, size*/ 12) {
    			$$invalidate(0, classes = classnames(className, "input-group", size ? `input-group-${size}` : null));
    		}
    	};

    	return [classes, $$restProps, className, size, $$scope, slots];
    }

    class InputGroup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { class: 2, size: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputGroup",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get class() {
    		throw new Error("<InputGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<InputGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<InputGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<InputGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/InputGroupAddon.svelte generated by Svelte v3.37.0 */

    const { Error: Error_1 } = globals;
    const file$d = "node_modules/sveltestrap/src/InputGroupAddon.svelte";

    function create_fragment$e(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let div_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$d, 16, 0, 385);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","addonType"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("InputGroupAddon", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { addonType = "" } = $$props;

    	if (["prepend", "append"].indexOf(addonType) === -1) {
    		throw new Error(`addonType must be one of 'prepend', 'append'. Received '${addonType}' instead.`);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("addonType" in $$new_props) $$invalidate(3, addonType = $$new_props.addonType);
    		if ("$$scope" in $$new_props) $$invalidate(4, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		addonType,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("addonType" in $$props) $$invalidate(3, addonType = $$new_props.addonType);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, addonType*/ 12) {
    			$$invalidate(0, classes = classnames(className, `input-group-${addonType}`));
    		}
    	};

    	return [classes, $$restProps, className, addonType, $$scope, slots];
    }

    class InputGroupAddon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { class: 2, addonType: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputGroupAddon",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get class() {
    		throw new Error_1("<InputGroupAddon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error_1("<InputGroupAddon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get addonType() {
    		throw new Error_1("<InputGroupAddon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addonType(value) {
    		throw new Error_1("<InputGroupAddon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/InputGroupText.svelte generated by Svelte v3.37.0 */
    const file$c = "node_modules/sveltestrap/src/InputGroupText.svelte";

    function create_fragment$d(ctx) {
    	let span;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let span_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let span_data = {};

    	for (let i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			set_attributes(span, span_data);
    			add_location(span, file$c, 9, 0, 171);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			set_attributes(span, span_data = get_spread_update(span_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("InputGroupText", slots, ['default']);
    	let { class: className = "" } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ classnames, className, classes });

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className*/ 4) {
    			$$invalidate(0, classes = classnames(className, "input-group-text"));
    		}
    	};

    	return [classes, $$restProps, className, $$scope, slots];
    }

    class InputGroupText extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { class: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputGroupText",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get class() {
    		throw new Error("<InputGroupText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<InputGroupText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Label.svelte generated by Svelte v3.37.0 */
    const file$b = "node_modules/sveltestrap/src/Label.svelte";

    function create_fragment$c(ctx) {
    	let label;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[14].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], null);

    	let label_levels = [
    		/*$$restProps*/ ctx[2],
    		{ class: /*classes*/ ctx[1] },
    		{ for: /*fore*/ ctx[0] }
    	];

    	let label_data = {};

    	for (let i = 0; i < label_levels.length; i += 1) {
    		label_data = assign(label_data, label_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			if (default_slot) default_slot.c();
    			set_attributes(label, label_data);
    			add_location(label, file$b, 69, 0, 1625);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);

    			if (default_slot) {
    				default_slot.m(label, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8192) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[13], dirty, null, null);
    				}
    			}

    			set_attributes(label, label_data = get_spread_update(label_levels, [
    				dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] },
    				(!current || dirty & /*fore*/ 1) && { for: /*fore*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","hidden","check","size","for","xs","sm","md","lg","xl","widths"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Label", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { hidden = false } = $$props;
    	let { check = false } = $$props;
    	let { size = "" } = $$props;
    	let { for: fore = null } = $$props;
    	let { xs = "" } = $$props;
    	let { sm = "" } = $$props;
    	let { md = "" } = $$props;
    	let { lg = "" } = $$props;
    	let { xl = "" } = $$props;
    	const colWidths = { xs, sm, md, lg, xl };
    	let { widths = Object.keys(colWidths) } = $$props;
    	const colClasses = [];

    	widths.forEach(colWidth => {
    		let columnProp = $$props[colWidth];

    		if (!columnProp && columnProp !== "") {
    			return;
    		}

    		const isXs = colWidth === "xs";
    		let colClass;

    		if (isObject(columnProp)) {
    			const colSizeInterfix = isXs ? "-" : `-${colWidth}-`;
    			colClass = getColumnSizeClass(isXs, colWidth, columnProp.size);

    			colClasses.push(classnames({
    				[colClass]: columnProp.size || columnProp.size === "",
    				[`order${colSizeInterfix}${columnProp.order}`]: columnProp.order || columnProp.order === 0,
    				[`offset${colSizeInterfix}${columnProp.offset}`]: columnProp.offset || columnProp.offset === 0
    			}));
    		} else {
    			colClass = getColumnSizeClass(isXs, colWidth, columnProp);
    			colClasses.push(colClass);
    		}
    	});

    	$$self.$$set = $$new_props => {
    		$$invalidate(17, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		$$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(3, className = $$new_props.class);
    		if ("hidden" in $$new_props) $$invalidate(4, hidden = $$new_props.hidden);
    		if ("check" in $$new_props) $$invalidate(5, check = $$new_props.check);
    		if ("size" in $$new_props) $$invalidate(6, size = $$new_props.size);
    		if ("for" in $$new_props) $$invalidate(0, fore = $$new_props.for);
    		if ("xs" in $$new_props) $$invalidate(7, xs = $$new_props.xs);
    		if ("sm" in $$new_props) $$invalidate(8, sm = $$new_props.sm);
    		if ("md" in $$new_props) $$invalidate(9, md = $$new_props.md);
    		if ("lg" in $$new_props) $$invalidate(10, lg = $$new_props.lg);
    		if ("xl" in $$new_props) $$invalidate(11, xl = $$new_props.xl);
    		if ("widths" in $$new_props) $$invalidate(12, widths = $$new_props.widths);
    		if ("$$scope" in $$new_props) $$invalidate(13, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		getColumnSizeClass,
    		isObject,
    		className,
    		hidden,
    		check,
    		size,
    		fore,
    		xs,
    		sm,
    		md,
    		lg,
    		xl,
    		colWidths,
    		widths,
    		colClasses,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(17, $$props = assign(assign({}, $$props), $$new_props));
    		if ("className" in $$props) $$invalidate(3, className = $$new_props.className);
    		if ("hidden" in $$props) $$invalidate(4, hidden = $$new_props.hidden);
    		if ("check" in $$props) $$invalidate(5, check = $$new_props.check);
    		if ("size" in $$props) $$invalidate(6, size = $$new_props.size);
    		if ("fore" in $$props) $$invalidate(0, fore = $$new_props.fore);
    		if ("xs" in $$props) $$invalidate(7, xs = $$new_props.xs);
    		if ("sm" in $$props) $$invalidate(8, sm = $$new_props.sm);
    		if ("md" in $$props) $$invalidate(9, md = $$new_props.md);
    		if ("lg" in $$props) $$invalidate(10, lg = $$new_props.lg);
    		if ("xl" in $$props) $$invalidate(11, xl = $$new_props.xl);
    		if ("widths" in $$props) $$invalidate(12, widths = $$new_props.widths);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, hidden, check, size*/ 120) {
    			$$invalidate(1, classes = classnames(className, hidden ? "sr-only" : false, check ? "form-check-label" : false, size ? `col-form-label-${size}` : false, colClasses, colClasses.length ? "col-form-label" : false));
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		fore,
    		classes,
    		$$restProps,
    		className,
    		hidden,
    		check,
    		size,
    		xs,
    		sm,
    		md,
    		lg,
    		xl,
    		widths,
    		$$scope,
    		slots
    	];
    }

    class Label extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			class: 3,
    			hidden: 4,
    			check: 5,
    			size: 6,
    			for: 0,
    			xs: 7,
    			sm: 8,
    			md: 9,
    			lg: 10,
    			xl: 11,
    			widths: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Label",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get class() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hidden() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hidden(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get check() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set check(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get for() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set for(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xs() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xs(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sm() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sm(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get md() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set md(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lg() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lg(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xl() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xl(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get widths() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set widths(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Modal.svelte generated by Svelte v3.37.0 */

    const file$a = "node_modules/sveltestrap/src/Modal.svelte";
    const get_external_slot_changes = dirty => ({});
    const get_external_slot_context = ctx => ({});

    // (217:0) {#if _isMounted}
    function create_if_block$2(ctx) {
    	let div;
    	let current;
    	let if_block = /*isOpen*/ ctx[1] && create_if_block_1$1(ctx);

    	let div_levels = [
    		{ class: /*wrapClassName*/ ctx[4] },
    		{ tabindex: "-1" },
    		/*$$restProps*/ ctx[18]
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			set_attributes(div, div_data);
    			add_location(div, file$a, 217, 2, 4706);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*isOpen*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*isOpen*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				(!current || dirty[0] & /*wrapClassName*/ 16) && { class: /*wrapClassName*/ ctx[4] },
    				{ tabindex: "-1" },
    				dirty[0] & /*$$restProps*/ 262144 && /*$$restProps*/ ctx[18]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(217:0) {#if _isMounted}",
    		ctx
    	});

    	return block;
    }

    // (222:4) {#if isOpen}
    function create_if_block_1$1(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t0;
    	let div0_class_value;
    	let div2_class_value;
    	let div2_transition;
    	let t1;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	const external_slot_template = /*#slots*/ ctx[33].external;
    	const external_slot = create_slot(external_slot_template, ctx, /*$$scope*/ ctx[32], get_external_slot_context);
    	const default_slot_template = /*#slots*/ ctx[33].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[32], null);
    	let if_block = /*backdrop*/ ctx[3] && !/*staticModal*/ ctx[0] && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (external_slot) external_slot.c();
    			t0 = space();
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(div0, "class", div0_class_value = classnames("modal-content", /*contentClassName*/ ctx[7]));
    			add_location(div0, file$a, 237, 10, 5340);
    			attr_dev(div1, "class", /*classes*/ ctx[13]);
    			attr_dev(div1, "role", "document");
    			add_location(div1, file$a, 236, 8, 5272);
    			attr_dev(div2, "arialabelledby", /*labelledBy*/ ctx[2]);

    			attr_dev(div2, "class", div2_class_value = classnames("modal", /*modalClassName*/ ctx[5], {
    				show: /*isOpen*/ ctx[1],
    				"d-block": /*isOpen*/ ctx[1],
    				"d-none": !/*isOpen*/ ctx[1],
    				"position-static": /*staticModal*/ ctx[0]
    			}));

    			attr_dev(div2, "role", "dialog");
    			add_location(div2, file$a, 222, 6, 4800);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			if (external_slot) {
    				external_slot.m(div0, null);
    			}

    			append_dev(div0, t0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			/*div1_binding*/ ctx[34](div1);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div2, "introend", /*onModalOpened*/ ctx[15], false, false, false),
    					listen_dev(div2, "outroend", /*onModalClosed*/ ctx[16], false, false, false),
    					listen_dev(div2, "click", /*handleBackdropClick*/ ctx[14], false, false, false),
    					listen_dev(div2, "mousedown", /*handleBackdropMouseDown*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (external_slot) {
    				if (external_slot.p && dirty[1] & /*$$scope*/ 2) {
    					update_slot(external_slot, external_slot_template, ctx, /*$$scope*/ ctx[32], dirty, get_external_slot_changes, get_external_slot_context);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty[1] & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[32], dirty, null, null);
    				}
    			}

    			if (!current || dirty[0] & /*contentClassName*/ 128 && div0_class_value !== (div0_class_value = classnames("modal-content", /*contentClassName*/ ctx[7]))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (!current || dirty[0] & /*classes*/ 8192) {
    				attr_dev(div1, "class", /*classes*/ ctx[13]);
    			}

    			if (!current || dirty[0] & /*labelledBy*/ 4) {
    				attr_dev(div2, "arialabelledby", /*labelledBy*/ ctx[2]);
    			}

    			if (!current || dirty[0] & /*modalClassName, isOpen, staticModal*/ 35 && div2_class_value !== (div2_class_value = classnames("modal", /*modalClassName*/ ctx[5], {
    				show: /*isOpen*/ ctx[1],
    				"d-block": /*isOpen*/ ctx[1],
    				"d-none": !/*isOpen*/ ctx[1],
    				"position-static": /*staticModal*/ ctx[0]
    			}))) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (/*backdrop*/ ctx[3] && !/*staticModal*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*backdrop, staticModal*/ 9) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(external_slot, local);
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, /*transitionType*/ ctx[9], /*transitionOptions*/ ctx[10], true);
    				div2_transition.run(1);
    			});

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(external_slot, local);
    			transition_out(default_slot, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, /*transitionType*/ ctx[9], /*transitionOptions*/ ctx[10], false);
    			div2_transition.run(0);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (external_slot) external_slot.d(detaching);
    			if (default_slot) default_slot.d(detaching);
    			/*div1_binding*/ ctx[34](null);
    			if (detaching && div2_transition) div2_transition.end();
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(222:4) {#if isOpen}",
    		ctx
    	});

    	return block;
    }

    // (244:6) {#if backdrop && !staticModal}
    function create_if_block_2(ctx) {
    	let div;
    	let div_class_value;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = classnames("modal-backdrop", "show", /*backdropClassName*/ ctx[6]));
    			add_location(div, file$a, 244, 8, 5548);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*backdropClassName*/ 64 && div_class_value !== (div_class_value = classnames("modal-backdrop", "show", /*backdropClassName*/ ctx[6]))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: /*backdropDuration*/ ctx[8] }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: /*backdropDuration*/ ctx[8] }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(244:6) {#if backdrop && !staticModal}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*_isMounted*/ ctx[11] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*_isMounted*/ ctx[11]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*_isMounted*/ 2048) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let openCount = 0;
    const dialogBaseClass = "modal-dialog";

    function noop() {
    	
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let classes;

    	const omit_props_names = [
    		"class","static","isOpen","autoFocus","centered","scrollable","size","toggle","labelledBy","backdrop","onEnter","onExit","onOpened","onClosed","wrapClassName","modalClassName","backdropClassName","contentClassName","fade","backdropDuration","unmountOnClose","returnFocusAfterClose","transitionType","transitionOptions"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, ['external','default']);
    	let { class: className = "" } = $$props;
    	let { static: staticModal = false } = $$props;
    	let { isOpen = false } = $$props;
    	let { autoFocus = true } = $$props;
    	let { centered = false } = $$props;
    	let { scrollable = false } = $$props;
    	let { size = "" } = $$props;
    	let { toggle = undefined } = $$props;
    	let { labelledBy = "" } = $$props;
    	let { backdrop = true } = $$props;
    	let { onEnter = undefined } = $$props;
    	let { onExit = undefined } = $$props;
    	let { onOpened = noop } = $$props;
    	let { onClosed = noop } = $$props;
    	let { wrapClassName = "" } = $$props;
    	let { modalClassName = "" } = $$props;
    	let { backdropClassName = "" } = $$props;
    	let { contentClassName = "" } = $$props;
    	let { fade: fade$1 = true } = $$props;
    	let { backdropDuration = fade$1 ? 150 : 0 } = $$props;
    	let { unmountOnClose = true } = $$props;
    	let { returnFocusAfterClose = true } = $$props;
    	let { transitionType = fade } = $$props;
    	let { transitionOptions = { duration: fade$1 ? 300 : 0 } } = $$props;
    	let hasOpened = false;
    	let _isMounted = false;
    	let _triggeringElement;
    	let _originalBodyPadding;
    	let _lastIsOpen = isOpen;
    	let _lastHasOpened = hasOpened;
    	let _dialog;
    	let _mouseDownElement;
    	let _removeEscListener;

    	onMount(() => {
    		if (isOpen) {
    			init();
    			hasOpened = true;
    		}

    		if (typeof onEnter === "function") {
    			onEnter();
    		}

    		if (hasOpened && autoFocus) {
    			setFocus();
    		}
    	});

    	onDestroy(() => {
    		if (typeof onExit === "function") {
    			onExit();
    		}

    		destroy();

    		if (hasOpened) {
    			close();
    		}
    	});

    	afterUpdate(() => {
    		if (isOpen && !_lastIsOpen) {
    			init();
    			hasOpened = true;
    		}

    		if (autoFocus && hasOpened && !_lastHasOpened) {
    			setFocus();
    		}

    		_lastIsOpen = isOpen;
    		_lastHasOpened = hasOpened;
    	});

    	function setFocus() {
    		if (_dialog && _dialog.parentNode && typeof _dialog.parentNode.focus === "function") {
    			_dialog.parentNode.focus();
    		}
    	}

    	function init() {
    		try {
    			_triggeringElement = document.activeElement;
    		} catch(err) {
    			_triggeringElement = null;
    		}

    		if (!staticModal) {
    			_originalBodyPadding = getOriginalBodyPadding();
    			conditionallyUpdateScrollbar();

    			if (openCount === 0) {
    				document.body.className = classnames(document.body.className, "modal-open");
    			}

    			++openCount;
    		}

    		$$invalidate(11, _isMounted = true);
    	}

    	function manageFocusAfterClose() {
    		if (_triggeringElement) {
    			if (typeof _triggeringElement.focus === "function" && returnFocusAfterClose) {
    				_triggeringElement.focus();
    			}

    			_triggeringElement = null;
    		}
    	}

    	function destroy() {
    		manageFocusAfterClose();
    	}

    	function close() {
    		if (openCount <= 1) {
    			const modalOpenClassName = "modal-open";
    			const modalOpenClassNameRegex = new RegExp(`(^| )${modalOpenClassName}( |$)`);
    			document.body.className = document.body.className.replace(modalOpenClassNameRegex, " ").trim();
    		}

    		manageFocusAfterClose();
    		openCount = Math.max(0, openCount - 1);
    		setScrollbarWidth(_originalBodyPadding);
    	}

    	function handleBackdropClick(e) {
    		if (e.target === _mouseDownElement) {
    			e.stopPropagation();

    			if (!isOpen || !backdrop) {
    				return;
    			}

    			const backdropElem = _dialog ? _dialog.parentNode : null;

    			if (backdropElem && e.target === backdropElem && toggle) {
    				toggle(e);
    			}
    		}
    	}

    	function onModalOpened() {
    		_removeEscListener = browserEvent(document, "keydown", event => {
    			if (event.key && event.key === "Escape") {
    				toggle(event);
    			}
    		});

    		onOpened();
    	}

    	function onModalClosed() {
    		onClosed();

    		if (_removeEscListener) {
    			_removeEscListener();
    		}

    		if (unmountOnClose) {
    			destroy();
    		}

    		close();

    		if (_isMounted) {
    			hasOpened = false;
    		}

    		$$invalidate(11, _isMounted = false);
    	}

    	function handleBackdropMouseDown(e) {
    		_mouseDownElement = e.target;
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			_dialog = $$value;
    			$$invalidate(12, _dialog);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(18, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(19, className = $$new_props.class);
    		if ("static" in $$new_props) $$invalidate(0, staticModal = $$new_props.static);
    		if ("isOpen" in $$new_props) $$invalidate(1, isOpen = $$new_props.isOpen);
    		if ("autoFocus" in $$new_props) $$invalidate(20, autoFocus = $$new_props.autoFocus);
    		if ("centered" in $$new_props) $$invalidate(21, centered = $$new_props.centered);
    		if ("scrollable" in $$new_props) $$invalidate(22, scrollable = $$new_props.scrollable);
    		if ("size" in $$new_props) $$invalidate(23, size = $$new_props.size);
    		if ("toggle" in $$new_props) $$invalidate(24, toggle = $$new_props.toggle);
    		if ("labelledBy" in $$new_props) $$invalidate(2, labelledBy = $$new_props.labelledBy);
    		if ("backdrop" in $$new_props) $$invalidate(3, backdrop = $$new_props.backdrop);
    		if ("onEnter" in $$new_props) $$invalidate(25, onEnter = $$new_props.onEnter);
    		if ("onExit" in $$new_props) $$invalidate(26, onExit = $$new_props.onExit);
    		if ("onOpened" in $$new_props) $$invalidate(27, onOpened = $$new_props.onOpened);
    		if ("onClosed" in $$new_props) $$invalidate(28, onClosed = $$new_props.onClosed);
    		if ("wrapClassName" in $$new_props) $$invalidate(4, wrapClassName = $$new_props.wrapClassName);
    		if ("modalClassName" in $$new_props) $$invalidate(5, modalClassName = $$new_props.modalClassName);
    		if ("backdropClassName" in $$new_props) $$invalidate(6, backdropClassName = $$new_props.backdropClassName);
    		if ("contentClassName" in $$new_props) $$invalidate(7, contentClassName = $$new_props.contentClassName);
    		if ("fade" in $$new_props) $$invalidate(29, fade$1 = $$new_props.fade);
    		if ("backdropDuration" in $$new_props) $$invalidate(8, backdropDuration = $$new_props.backdropDuration);
    		if ("unmountOnClose" in $$new_props) $$invalidate(30, unmountOnClose = $$new_props.unmountOnClose);
    		if ("returnFocusAfterClose" in $$new_props) $$invalidate(31, returnFocusAfterClose = $$new_props.returnFocusAfterClose);
    		if ("transitionType" in $$new_props) $$invalidate(9, transitionType = $$new_props.transitionType);
    		if ("transitionOptions" in $$new_props) $$invalidate(10, transitionOptions = $$new_props.transitionOptions);
    		if ("$$scope" in $$new_props) $$invalidate(32, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		openCount,
    		classnames,
    		browserEvent,
    		onDestroy,
    		onMount,
    		afterUpdate,
    		fadeTransition: fade,
    		conditionallyUpdateScrollbar,
    		getOriginalBodyPadding,
    		setScrollbarWidth,
    		noop,
    		className,
    		staticModal,
    		isOpen,
    		autoFocus,
    		centered,
    		scrollable,
    		size,
    		toggle,
    		labelledBy,
    		backdrop,
    		onEnter,
    		onExit,
    		onOpened,
    		onClosed,
    		wrapClassName,
    		modalClassName,
    		backdropClassName,
    		contentClassName,
    		fade: fade$1,
    		backdropDuration,
    		unmountOnClose,
    		returnFocusAfterClose,
    		transitionType,
    		transitionOptions,
    		hasOpened,
    		_isMounted,
    		_triggeringElement,
    		_originalBodyPadding,
    		_lastIsOpen,
    		_lastHasOpened,
    		_dialog,
    		_mouseDownElement,
    		_removeEscListener,
    		setFocus,
    		init,
    		manageFocusAfterClose,
    		destroy,
    		close,
    		handleBackdropClick,
    		onModalOpened,
    		onModalClosed,
    		handleBackdropMouseDown,
    		dialogBaseClass,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(19, className = $$new_props.className);
    		if ("staticModal" in $$props) $$invalidate(0, staticModal = $$new_props.staticModal);
    		if ("isOpen" in $$props) $$invalidate(1, isOpen = $$new_props.isOpen);
    		if ("autoFocus" in $$props) $$invalidate(20, autoFocus = $$new_props.autoFocus);
    		if ("centered" in $$props) $$invalidate(21, centered = $$new_props.centered);
    		if ("scrollable" in $$props) $$invalidate(22, scrollable = $$new_props.scrollable);
    		if ("size" in $$props) $$invalidate(23, size = $$new_props.size);
    		if ("toggle" in $$props) $$invalidate(24, toggle = $$new_props.toggle);
    		if ("labelledBy" in $$props) $$invalidate(2, labelledBy = $$new_props.labelledBy);
    		if ("backdrop" in $$props) $$invalidate(3, backdrop = $$new_props.backdrop);
    		if ("onEnter" in $$props) $$invalidate(25, onEnter = $$new_props.onEnter);
    		if ("onExit" in $$props) $$invalidate(26, onExit = $$new_props.onExit);
    		if ("onOpened" in $$props) $$invalidate(27, onOpened = $$new_props.onOpened);
    		if ("onClosed" in $$props) $$invalidate(28, onClosed = $$new_props.onClosed);
    		if ("wrapClassName" in $$props) $$invalidate(4, wrapClassName = $$new_props.wrapClassName);
    		if ("modalClassName" in $$props) $$invalidate(5, modalClassName = $$new_props.modalClassName);
    		if ("backdropClassName" in $$props) $$invalidate(6, backdropClassName = $$new_props.backdropClassName);
    		if ("contentClassName" in $$props) $$invalidate(7, contentClassName = $$new_props.contentClassName);
    		if ("fade" in $$props) $$invalidate(29, fade$1 = $$new_props.fade);
    		if ("backdropDuration" in $$props) $$invalidate(8, backdropDuration = $$new_props.backdropDuration);
    		if ("unmountOnClose" in $$props) $$invalidate(30, unmountOnClose = $$new_props.unmountOnClose);
    		if ("returnFocusAfterClose" in $$props) $$invalidate(31, returnFocusAfterClose = $$new_props.returnFocusAfterClose);
    		if ("transitionType" in $$props) $$invalidate(9, transitionType = $$new_props.transitionType);
    		if ("transitionOptions" in $$props) $$invalidate(10, transitionOptions = $$new_props.transitionOptions);
    		if ("hasOpened" in $$props) hasOpened = $$new_props.hasOpened;
    		if ("_isMounted" in $$props) $$invalidate(11, _isMounted = $$new_props._isMounted);
    		if ("_triggeringElement" in $$props) _triggeringElement = $$new_props._triggeringElement;
    		if ("_originalBodyPadding" in $$props) _originalBodyPadding = $$new_props._originalBodyPadding;
    		if ("_lastIsOpen" in $$props) _lastIsOpen = $$new_props._lastIsOpen;
    		if ("_lastHasOpened" in $$props) _lastHasOpened = $$new_props._lastHasOpened;
    		if ("_dialog" in $$props) $$invalidate(12, _dialog = $$new_props._dialog);
    		if ("_mouseDownElement" in $$props) _mouseDownElement = $$new_props._mouseDownElement;
    		if ("_removeEscListener" in $$props) _removeEscListener = $$new_props._removeEscListener;
    		if ("classes" in $$props) $$invalidate(13, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*className, size, centered, scrollable*/ 15204352) {
    			$$invalidate(13, classes = classnames(dialogBaseClass, className, {
    				[`modal-${size}`]: size,
    				[`${dialogBaseClass}-centered`]: centered,
    				[`${dialogBaseClass}-scrollable`]: scrollable
    			}));
    		}
    	};

    	return [
    		staticModal,
    		isOpen,
    		labelledBy,
    		backdrop,
    		wrapClassName,
    		modalClassName,
    		backdropClassName,
    		contentClassName,
    		backdropDuration,
    		transitionType,
    		transitionOptions,
    		_isMounted,
    		_dialog,
    		classes,
    		handleBackdropClick,
    		onModalOpened,
    		onModalClosed,
    		handleBackdropMouseDown,
    		$$restProps,
    		className,
    		autoFocus,
    		centered,
    		scrollable,
    		size,
    		toggle,
    		onEnter,
    		onExit,
    		onOpened,
    		onClosed,
    		fade$1,
    		unmountOnClose,
    		returnFocusAfterClose,
    		$$scope,
    		slots,
    		div1_binding
    	];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$b,
    			create_fragment$b,
    			safe_not_equal,
    			{
    				class: 19,
    				static: 0,
    				isOpen: 1,
    				autoFocus: 20,
    				centered: 21,
    				scrollable: 22,
    				size: 23,
    				toggle: 24,
    				labelledBy: 2,
    				backdrop: 3,
    				onEnter: 25,
    				onExit: 26,
    				onOpened: 27,
    				onClosed: 28,
    				wrapClassName: 4,
    				modalClassName: 5,
    				backdropClassName: 6,
    				contentClassName: 7,
    				fade: 29,
    				backdropDuration: 8,
    				unmountOnClose: 30,
    				returnFocusAfterClose: 31,
    				transitionType: 9,
    				transitionOptions: 10
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get class() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get static() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set static(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isOpen() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isOpen(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoFocus() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoFocus(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get centered() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set centered(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollable() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrollable(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggle() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggle(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelledBy() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelledBy(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get backdrop() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set backdrop(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onEnter() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onEnter(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onExit() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onExit(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onOpened() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onOpened(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClosed() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClosed(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get wrapClassName() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wrapClassName(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get modalClassName() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modalClassName(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get backdropClassName() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set backdropClassName(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get contentClassName() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set contentClassName(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fade() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fade(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get backdropDuration() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set backdropDuration(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unmountOnClose() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unmountOnClose(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get returnFocusAfterClose() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set returnFocusAfterClose(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionType() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionType(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionOptions() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionOptions(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/ModalBody.svelte generated by Svelte v3.37.0 */
    const file$9 = "node_modules/sveltestrap/src/ModalBody.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let div_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$9, 9, 0, 165);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ModalBody", slots, ['default']);
    	let { class: className = "" } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ classnames, className, classes });

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className*/ 4) {
    			$$invalidate(0, classes = classnames(className, "modal-body"));
    		}
    	};

    	return [classes, $$restProps, className, $$scope, slots];
    }

    class ModalBody extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { class: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalBody",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get class() {
    		throw new Error("<ModalBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ModalBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/ModalFooter.svelte generated by Svelte v3.37.0 */
    const file$8 = "node_modules/sveltestrap/src/ModalFooter.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let div_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$8, 9, 0, 167);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ModalFooter", slots, ['default']);
    	let { class: className = "" } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ classnames, className, classes });

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className*/ 4) {
    			$$invalidate(0, classes = classnames(className, "modal-footer"));
    		}
    	};

    	return [classes, $$restProps, className, $$scope, slots];
    }

    class ModalFooter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { class: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalFooter",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get class() {
    		throw new Error("<ModalFooter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ModalFooter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/ModalHeader.svelte generated by Svelte v3.37.0 */
    const file$7 = "node_modules/sveltestrap/src/ModalHeader.svelte";
    const get_close_slot_changes = dirty => ({});
    const get_close_slot_context = ctx => ({});

    // (21:4) {:else}
    function create_else_block$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(21:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (19:4) {#if children}
    function create_if_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*children*/ ctx[2]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*children*/ 4) set_data_dev(t, /*children*/ ctx[2]);
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(19:4) {#if children}",
    		ctx
    	});

    	return block;
    }

    // (26:4) {#if typeof toggle === 'function'}
    function create_if_block$1(ctx) {
    	let button;
    	let span;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			t = text(/*closeIcon*/ ctx[3]);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$7, 31, 8, 735);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "close");
    			attr_dev(button, "aria-label", /*closeAriaLabel*/ ctx[1]);
    			add_location(button, file$7, 26, 6, 612);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*toggle*/ ctx[0])) /*toggle*/ ctx[0].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*closeIcon*/ 8) set_data_dev(t, /*closeIcon*/ ctx[3]);

    			if (dirty & /*closeAriaLabel*/ 2) {
    				attr_dev(button, "aria-label", /*closeAriaLabel*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(26:4) {#if typeof toggle === 'function'}",
    		ctx
    	});

    	return block;
    }

    // (25:21)      
    function fallback_block(ctx) {
    	let if_block_anchor;
    	let if_block = typeof /*toggle*/ ctx[0] === "function" && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (typeof /*toggle*/ ctx[0] === "function") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(25:21)      ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div;
    	let h5;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*children*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const close_slot_template = /*#slots*/ ctx[9].close;
    	const close_slot = create_slot(close_slot_template, ctx, /*$$scope*/ ctx[8], get_close_slot_context);
    	const close_slot_or_fallback = close_slot || fallback_block(ctx);
    	let div_levels = [/*$$restProps*/ ctx[5], { class: /*classes*/ ctx[4] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h5 = element("h5");
    			if_block.c();
    			t = space();
    			if (close_slot_or_fallback) close_slot_or_fallback.c();
    			attr_dev(h5, "class", "modal-title");
    			add_location(h5, file$7, 17, 2, 439);
    			set_attributes(div, div_data);
    			add_location(div, file$7, 16, 0, 398);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h5);
    			if_blocks[current_block_type_index].m(h5, null);
    			append_dev(div, t);

    			if (close_slot_or_fallback) {
    				close_slot_or_fallback.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(h5, null);
    			}

    			if (close_slot) {
    				if (close_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(close_slot, close_slot_template, ctx, /*$$scope*/ ctx[8], dirty, get_close_slot_changes, get_close_slot_context);
    				}
    			} else {
    				if (close_slot_or_fallback && close_slot_or_fallback.p && dirty & /*closeAriaLabel, toggle, closeIcon*/ 11) {
    					close_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 32 && /*$$restProps*/ ctx[5],
    				(!current || dirty & /*classes*/ 16) && { class: /*classes*/ ctx[4] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(close_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(close_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			if (close_slot_or_fallback) close_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let closeIcon;
    	let classes;
    	const omit_props_names = ["class","toggle","closeAriaLabel","charCode","children"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ModalHeader", slots, ['default','close']);
    	let { class: className = "" } = $$props;
    	let { toggle = undefined } = $$props;
    	let { closeAriaLabel = "Close" } = $$props;
    	let { charCode = 215 } = $$props;
    	let { children = undefined } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(5, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(6, className = $$new_props.class);
    		if ("toggle" in $$new_props) $$invalidate(0, toggle = $$new_props.toggle);
    		if ("closeAriaLabel" in $$new_props) $$invalidate(1, closeAriaLabel = $$new_props.closeAriaLabel);
    		if ("charCode" in $$new_props) $$invalidate(7, charCode = $$new_props.charCode);
    		if ("children" in $$new_props) $$invalidate(2, children = $$new_props.children);
    		if ("$$scope" in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		toggle,
    		closeAriaLabel,
    		charCode,
    		children,
    		closeIcon,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(6, className = $$new_props.className);
    		if ("toggle" in $$props) $$invalidate(0, toggle = $$new_props.toggle);
    		if ("closeAriaLabel" in $$props) $$invalidate(1, closeAriaLabel = $$new_props.closeAriaLabel);
    		if ("charCode" in $$props) $$invalidate(7, charCode = $$new_props.charCode);
    		if ("children" in $$props) $$invalidate(2, children = $$new_props.children);
    		if ("closeIcon" in $$props) $$invalidate(3, closeIcon = $$new_props.closeIcon);
    		if ("classes" in $$props) $$invalidate(4, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*charCode*/ 128) {
    			$$invalidate(3, closeIcon = typeof charCode === "number"
    			? String.fromCharCode(charCode)
    			: charCode);
    		}

    		if ($$self.$$.dirty & /*className*/ 64) {
    			$$invalidate(4, classes = classnames(className, "modal-header"));
    		}
    	};

    	return [
    		toggle,
    		closeAriaLabel,
    		children,
    		closeIcon,
    		classes,
    		$$restProps,
    		className,
    		charCode,
    		$$scope,
    		slots
    	];
    }

    class ModalHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			class: 6,
    			toggle: 0,
    			closeAriaLabel: 1,
    			charCode: 7,
    			children: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalHeader",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get class() {
    		throw new Error("<ModalHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ModalHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggle() {
    		throw new Error("<ModalHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggle(value) {
    		throw new Error("<ModalHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeAriaLabel() {
    		throw new Error("<ModalHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeAriaLabel(value) {
    		throw new Error("<ModalHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get charCode() {
    		throw new Error("<ModalHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set charCode(value) {
    		throw new Error("<ModalHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get children() {
    		throw new Error("<ModalHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set children(value) {
    		throw new Error("<ModalHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Row.svelte generated by Svelte v3.37.0 */
    const file$6 = "node_modules/sveltestrap/src/Row.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);
    	let div_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$6, 38, 0, 957);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 64) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getCols(cols) {
    	const colsValue = parseInt(cols);

    	if (!isNaN(colsValue)) {
    		if (colsValue > 0) {
    			return [`row-cols-${colsValue}`];
    		}
    	} else if (typeof cols === "object") {
    		return ["xs", "sm", "md", "lg", "xl"].map(colWidth => {
    			const isXs = colWidth === "xs";
    			const colSizeInterfix = isXs ? "-" : `-${colWidth}-`;
    			const value = cols[colWidth];

    			if (typeof value === "number" && value > 0) {
    				return `row-cols${colSizeInterfix}${value}`;
    			}

    			return null;
    		}).filter(value => !!value);
    	}

    	return [];
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","noGutters","form","cols"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Row", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { noGutters = false } = $$props;
    	let { form = false } = $$props;
    	let { cols = 0 } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("noGutters" in $$new_props) $$invalidate(3, noGutters = $$new_props.noGutters);
    		if ("form" in $$new_props) $$invalidate(4, form = $$new_props.form);
    		if ("cols" in $$new_props) $$invalidate(5, cols = $$new_props.cols);
    		if ("$$scope" in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		noGutters,
    		form,
    		cols,
    		getCols,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("noGutters" in $$props) $$invalidate(3, noGutters = $$new_props.noGutters);
    		if ("form" in $$props) $$invalidate(4, form = $$new_props.form);
    		if ("cols" in $$props) $$invalidate(5, cols = $$new_props.cols);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, noGutters, form, cols*/ 60) {
    			$$invalidate(0, classes = classnames(className, noGutters ? "no-gutters" : null, form ? "form-row" : "row", ...getCols(cols)));
    		}
    	};

    	return [classes, $$restProps, className, noGutters, form, cols, $$scope, slots];
    }

    class Row extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { class: 2, noGutters: 3, form: 4, cols: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Row",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get class() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noGutters() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noGutters(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get form() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set form(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cols() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cols(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Table.svelte generated by Svelte v3.37.0 */
    const file$5 = "node_modules/sveltestrap/src/Table.svelte";

    // (35:0) {:else}
    function create_else_block(ctx) {
    	let table;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);
    	let table_levels = [/*$$restProps*/ ctx[3], { class: /*classes*/ ctx[1] }];
    	let table_data = {};

    	for (let i = 0; i < table_levels.length; i += 1) {
    		table_data = assign(table_data, table_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			if (default_slot) default_slot.c();
    			set_attributes(table, table_data);
    			add_location(table, file$5, 35, 2, 861);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);

    			if (default_slot) {
    				default_slot.m(table, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2048) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[11], dirty, null, null);
    				}
    			}

    			set_attributes(table, table_data = get_spread_update(table_levels, [
    				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(35:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (29:0) {#if responsive}
    function create_if_block(ctx) {
    	let div;
    	let table;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);
    	let table_levels = [/*$$restProps*/ ctx[3], { class: /*classes*/ ctx[1] }];
    	let table_data = {};

    	for (let i = 0; i < table_levels.length; i += 1) {
    		table_data = assign(table_data, table_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			table = element("table");
    			if (default_slot) default_slot.c();
    			set_attributes(table, table_data);
    			add_location(table, file$5, 30, 4, 773);
    			attr_dev(div, "class", /*responsiveClassName*/ ctx[2]);
    			add_location(div, file$5, 29, 2, 735);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, table);

    			if (default_slot) {
    				default_slot.m(table, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2048) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[11], dirty, null, null);
    				}
    			}

    			set_attributes(table, table_data = get_spread_update(table_levels, [
    				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] }
    			]));

    			if (!current || dirty & /*responsiveClassName*/ 4) {
    				attr_dev(div, "class", /*responsiveClassName*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(29:0) {#if responsive}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*responsive*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let classes;
    	let responsiveClassName;
    	const omit_props_names = ["class","size","bordered","borderless","striped","dark","hover","responsive"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Table", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { size = "" } = $$props;
    	let { bordered = false } = $$props;
    	let { borderless = false } = $$props;
    	let { striped = false } = $$props;
    	let { dark = false } = $$props;
    	let { hover = false } = $$props;
    	let { responsive = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(4, className = $$new_props.class);
    		if ("size" in $$new_props) $$invalidate(5, size = $$new_props.size);
    		if ("bordered" in $$new_props) $$invalidate(6, bordered = $$new_props.bordered);
    		if ("borderless" in $$new_props) $$invalidate(7, borderless = $$new_props.borderless);
    		if ("striped" in $$new_props) $$invalidate(8, striped = $$new_props.striped);
    		if ("dark" in $$new_props) $$invalidate(9, dark = $$new_props.dark);
    		if ("hover" in $$new_props) $$invalidate(10, hover = $$new_props.hover);
    		if ("responsive" in $$new_props) $$invalidate(0, responsive = $$new_props.responsive);
    		if ("$$scope" in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		size,
    		bordered,
    		borderless,
    		striped,
    		dark,
    		hover,
    		responsive,
    		classes,
    		responsiveClassName
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(4, className = $$new_props.className);
    		if ("size" in $$props) $$invalidate(5, size = $$new_props.size);
    		if ("bordered" in $$props) $$invalidate(6, bordered = $$new_props.bordered);
    		if ("borderless" in $$props) $$invalidate(7, borderless = $$new_props.borderless);
    		if ("striped" in $$props) $$invalidate(8, striped = $$new_props.striped);
    		if ("dark" in $$props) $$invalidate(9, dark = $$new_props.dark);
    		if ("hover" in $$props) $$invalidate(10, hover = $$new_props.hover);
    		if ("responsive" in $$props) $$invalidate(0, responsive = $$new_props.responsive);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    		if ("responsiveClassName" in $$props) $$invalidate(2, responsiveClassName = $$new_props.responsiveClassName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, size, bordered, borderless, striped, dark, hover*/ 2032) {
    			$$invalidate(1, classes = classnames(className, "table", size ? "table-" + size : false, bordered ? "table-bordered" : false, borderless ? "table-borderless" : false, striped ? "table-striped" : false, dark ? "table-dark" : false, hover ? "table-hover" : false));
    		}

    		if ($$self.$$.dirty & /*responsive*/ 1) {
    			$$invalidate(2, responsiveClassName = responsive === true
    			? "table-responsive"
    			: `table-responsive-${responsive}`);
    		}
    	};

    	return [
    		responsive,
    		classes,
    		responsiveClassName,
    		$$restProps,
    		className,
    		size,
    		bordered,
    		borderless,
    		striped,
    		dark,
    		hover,
    		$$scope,
    		slots
    	];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			class: 4,
    			size: 5,
    			bordered: 6,
    			borderless: 7,
    			striped: 8,
    			dark: 9,
    			hover: 10,
    			responsive: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get class() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bordered() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bordered(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderless() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderless(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get striped() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set striped(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dark() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dark(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hover() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hover(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get responsive() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set responsive(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/dansesben/frontend/routes/ActionModal.svelte generated by Svelte v3.37.0 */
    const file$4 = "src/dansesben/frontend/routes/ActionModal.svelte";

    // (17:8) <ModalHeader {toggleModal}>
    function create_default_slot_5$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*title*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 2) set_data_dev(t, /*title*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5$2.name,
    		type: "slot",
    		source: "(17:8) <ModalHeader {toggleModal}>",
    		ctx
    	});

    	return block;
    }

    // (18:8) <ModalBody>
    function create_default_slot_4$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*description*/ ctx[2]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*description*/ 4) set_data_dev(t, /*description*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$2.name,
    		type: "slot",
    		source: "(18:8) <ModalBody>",
    		ctx
    	});

    	return block;
    }

    // (22:12) <Button color="danger" on:click={actionFunction}>
    function create_default_slot_3$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*actionName*/ ctx[3]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*actionName*/ 8) set_data_dev(t, /*actionName*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$2.name,
    		type: "slot",
    		source: "(22:12) <Button color=\\\"danger\\\" on:click={actionFunction}>",
    		ctx
    	});

    	return block;
    }

    // (23:12) <Button color="secundary" on:click={toggleModal}>
    function create_default_slot_2$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cerrar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$3.name,
    		type: "slot",
    		source: "(23:12) <Button color=\\\"secundary\\\" on:click={toggleModal}>",
    		ctx
    	});

    	return block;
    }

    // (21:8) <ModalFooter>
    function create_default_slot_1$4(ctx) {
    	let button0;
    	let t;
    	let button1;
    	let current;

    	button0 = new Button({
    			props: {
    				color: "danger",
    				$$slots: { default: [create_default_slot_3$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", function () {
    		if (is_function(/*actionFunction*/ ctx[4])) /*actionFunction*/ ctx[4].apply(this, arguments);
    	});

    	button1 = new Button({
    			props: {
    				color: "secundary",
    				$$slots: { default: [create_default_slot_2$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*toggleModal*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t = space();
    			create_component(button1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button0_changes = {};

    			if (dirty & /*$$scope, actionName*/ 72) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(button1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(21:8) <ModalFooter>",
    		ctx
    	});

    	return block;
    }

    // (16:4) <Modal isOpen={modalVisible} {toggleModal}>
    function create_default_slot$4(ctx) {
    	let modalheader;
    	let t0;
    	let modalbody;
    	let t1;
    	let modalfooter;
    	let current;

    	modalheader = new ModalHeader({
    			props: {
    				toggleModal: /*toggleModal*/ ctx[5],
    				$$slots: { default: [create_default_slot_5$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	modalbody = new ModalBody({
    			props: {
    				$$slots: { default: [create_default_slot_4$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	modalfooter = new ModalFooter({
    			props: {
    				$$slots: { default: [create_default_slot_1$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(modalheader.$$.fragment);
    			t0 = space();
    			create_component(modalbody.$$.fragment);
    			t1 = space();
    			create_component(modalfooter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modalheader, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(modalbody, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(modalfooter, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modalheader_changes = {};

    			if (dirty & /*$$scope, title*/ 66) {
    				modalheader_changes.$$scope = { dirty, ctx };
    			}

    			modalheader.$set(modalheader_changes);
    			const modalbody_changes = {};

    			if (dirty & /*$$scope, description*/ 68) {
    				modalbody_changes.$$scope = { dirty, ctx };
    			}

    			modalbody.$set(modalbody_changes);
    			const modalfooter_changes = {};

    			if (dirty & /*$$scope, actionFunction, actionName*/ 88) {
    				modalfooter_changes.$$scope = { dirty, ctx };
    			}

    			modalfooter.$set(modalfooter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modalheader.$$.fragment, local);
    			transition_in(modalbody.$$.fragment, local);
    			transition_in(modalfooter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modalheader.$$.fragment, local);
    			transition_out(modalbody.$$.fragment, local);
    			transition_out(modalfooter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modalheader, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(modalbody, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(modalfooter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(16:4) <Modal isOpen={modalVisible} {toggleModal}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let modal;
    	let current;

    	modal = new Modal({
    			props: {
    				isOpen: /*modalVisible*/ ctx[0],
    				toggleModal: /*toggleModal*/ ctx[5],
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(modal.$$.fragment);
    			add_location(div, file$4, 14, 0, 314);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(modal, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const modal_changes = {};
    			if (dirty & /*modalVisible*/ 1) modal_changes.isOpen = /*modalVisible*/ ctx[0];

    			if (dirty & /*$$scope, actionFunction, actionName, description, title*/ 94) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(modal);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ActionModal", slots, []);
    	let { modalVisible } = $$props;
    	const toggleModal = () => $$invalidate(0, modalVisible = !modalVisible);
    	let { title } = $$props;
    	let { description } = $$props;
    	let { actionName } = $$props;
    	let { actionFunction } = $$props;
    	const writable_props = ["modalVisible", "title", "description", "actionName", "actionFunction"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ActionModal> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("modalVisible" in $$props) $$invalidate(0, modalVisible = $$props.modalVisible);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("description" in $$props) $$invalidate(2, description = $$props.description);
    		if ("actionName" in $$props) $$invalidate(3, actionName = $$props.actionName);
    		if ("actionFunction" in $$props) $$invalidate(4, actionFunction = $$props.actionFunction);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		Modal,
    		ModalBody,
    		ModalFooter,
    		ModalHeader,
    		modalVisible,
    		toggleModal,
    		title,
    		description,
    		actionName,
    		actionFunction
    	});

    	$$self.$inject_state = $$props => {
    		if ("modalVisible" in $$props) $$invalidate(0, modalVisible = $$props.modalVisible);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("description" in $$props) $$invalidate(2, description = $$props.description);
    		if ("actionName" in $$props) $$invalidate(3, actionName = $$props.actionName);
    		if ("actionFunction" in $$props) $$invalidate(4, actionFunction = $$props.actionFunction);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [modalVisible, title, description, actionName, actionFunction, toggleModal];
    }

    class ActionModal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			modalVisible: 0,
    			title: 1,
    			description: 2,
    			actionName: 3,
    			actionFunction: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ActionModal",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*modalVisible*/ ctx[0] === undefined && !("modalVisible" in props)) {
    			console.warn("<ActionModal> was created without expected prop 'modalVisible'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<ActionModal> was created without expected prop 'title'");
    		}

    		if (/*description*/ ctx[2] === undefined && !("description" in props)) {
    			console.warn("<ActionModal> was created without expected prop 'description'");
    		}

    		if (/*actionName*/ ctx[3] === undefined && !("actionName" in props)) {
    			console.warn("<ActionModal> was created without expected prop 'actionName'");
    		}

    		if (/*actionFunction*/ ctx[4] === undefined && !("actionFunction" in props)) {
    			console.warn("<ActionModal> was created without expected prop 'actionFunction'");
    		}
    	}

    	get modalVisible() {
    		throw new Error("<ActionModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modalVisible(value) {
    		throw new Error("<ActionModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ActionModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ActionModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<ActionModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<ActionModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get actionName() {
    		throw new Error("<ActionModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set actionName(value) {
    		throw new Error("<ActionModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get actionFunction() {
    		throw new Error("<ActionModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set actionFunction(value) {
    		throw new Error("<ActionModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const apiData = writable([]);
    const apiAlerts = writable([]);

    const BASE_URL = "/api/v2/performances-by-degrees-us/";

    const getAllRecords = async function(){
        let res = await fetch(BASE_URL);
        return await res.json();
    };

    const searchRecords = function(options){
        let params = [];
        let paramsURL = "";
        for(let value in options){
            if(value !== "page" && options[value] !== ""){
                params.push(value + "=" + options[value]);
            }
        }

        if("page" in options){
            params.push("offset=" + (parseInt(options["page"])-1) * parseInt(options["limit"]));
        }

        if(params.length > 0){
            paramsURL = "?" + params.join("&");
        }

        return fetch(BASE_URL + paramsURL).then(response => response.json());
    };

    const deleteRecord = async function(element){
        let res = await fetch(BASE_URL + element.center + "/" + element.year + "/" + element["field-of-knowledge"], {"method": "DELETE"});

        if(res.status === 200){
            return {text: "Eliminado " + element.center + "/" + element.year + "/" + element["field-of-knowledge"] + " correctamente", color: "success"};
        }else if(res.status === 404){
            return {text: "Elemento " + element.center + "/" + element.year + "/" + element["field-of-knowledge"] + " no existe", color: "warning"};
        }else {
            return {text: "Error interno al intentar borrar " + element.center + "/" + element.year + "/" + element["field-of-knowledge"], color: "danger"};
        }
    };

    const deleteAllRecords = async function(){
        let res = await fetch(BASE_URL, {"method": "DELETE"});

        if(res.status === 200){
            return {text: "Todos los elementos han sido eliminados", color: "success"};
        }else {
            return {text: "Error interno al intentar borrar todos los elementos", color: "danger"};
        }
    };

    const addRecord = async function(element){
        let res = await fetch(BASE_URL, {"method": "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(element)});

        if(res.status === 201){
            return {text: "Elemento correctamente añadido", color: "success"};
        }
        else if(res.status === 400){
            return {text: "Elemento inválido, revise que los valores sean válidos", color: "warning"};
        }
        else {
            return {text: "Error interno al intentar añadir el elemento", color: "danger"};
        }
    };

    /* src/dansesben/frontend/routes/Home.svelte generated by Svelte v3.37.0 */
    const file$3 = "src/dansesben/frontend/routes/Home.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[40] = list[i];
    	child_ctx[42] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	return child_ctx;
    }

    // (103:8) <Alert color={alert.color} class="mb-1" dismissible>
    function create_default_slot_43(ctx) {
    	let t0_value = /*alert*/ ctx[43].text + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*alerts*/ 4 && t0_value !== (t0_value = /*alert*/ ctx[43].text + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_43.name,
    		type: "slot",
    		source: "(103:8) <Alert color={alert.color} class=\\\"mb-1\\\" dismissible>",
    		ctx
    	});

    	return block;
    }

    // (102:4) {#each alerts as alert}
    function create_each_block_1(ctx) {
    	let alert;
    	let current;

    	alert = new Alert({
    			props: {
    				color: /*alert*/ ctx[43].color,
    				class: "mb-1",
    				dismissible: true,
    				$$slots: { default: [create_default_slot_43] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(alert.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(alert, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const alert_changes = {};
    			if (dirty[0] & /*alerts*/ 4) alert_changes.color = /*alert*/ ctx[43].color;

    			if (dirty[0] & /*alerts*/ 4 | dirty[1] & /*$$scope*/ 32768) {
    				alert_changes.$$scope = { dirty, ctx };
    			}

    			alert.$set(alert_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(alert.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(alert.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(alert, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(102:4) {#each alerts as alert}",
    		ctx
    	});

    	return block;
    }

    // (101:0) <Container>
    function create_default_slot_42(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*alerts*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*alerts*/ 4) {
    				each_value_1 = /*alerts*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_42.name,
    		type: "slot",
    		source: "(101:0) <Container>",
    		ctx
    	});

    	return block;
    }

    // (122:8) <ModalHeader {toggleAddModal}>
    function create_default_slot_41(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Añadir entrada");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_41.name,
    		type: "slot",
    		source: "(122:8) <ModalHeader {toggleAddModal}>",
    		ctx
    	});

    	return block;
    }

    // (126:20) <Label>
    function create_default_slot_40(ctx) {
    	let b;

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Campo de conocimiento";
    			add_location(b, file$3, 125, 27, 3571);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_40.name,
    		type: "slot",
    		source: "(126:20) <Label>",
    		ctx
    	});

    	return block;
    }

    // (125:16) <FormGroup>
    function create_default_slot_39(ctx) {
    	let label;
    	let t;
    	let input;
    	let updating_value;
    	let current;

    	label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_40] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function input_value_binding(value) {
    		/*input_value_binding*/ ctx[14](value);
    	}

    	let input_props = { type: "text" };

    	if (/*rowToAdd*/ ctx[6]["field-of-knowledge"] !== void 0) {
    		input_props.value = /*rowToAdd*/ ctx[6]["field-of-knowledge"];
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding));

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			t = space();
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    			const input_changes = {};

    			if (!updating_value && dirty[0] & /*rowToAdd*/ 64) {
    				updating_value = true;
    				input_changes.value = /*rowToAdd*/ ctx[6]["field-of-knowledge"];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_39.name,
    		type: "slot",
    		source: "(125:16) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (130:20) <Label>
    function create_default_slot_38(ctx) {
    	let b;

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Año";
    			add_location(b, file$3, 129, 27, 3778);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_38.name,
    		type: "slot",
    		source: "(130:20) <Label>",
    		ctx
    	});

    	return block;
    }

    // (129:16) <FormGroup>
    function create_default_slot_37(ctx) {
    	let label;
    	let t;
    	let input;
    	let updating_value;
    	let current;

    	label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_38] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function input_value_binding_1(value) {
    		/*input_value_binding_1*/ ctx[15](value);
    	}

    	let input_props = { type: "number" };

    	if (/*rowToAdd*/ ctx[6].year !== void 0) {
    		input_props.value = /*rowToAdd*/ ctx[6].year;
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding_1));

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			t = space();
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    			const input_changes = {};

    			if (!updating_value && dirty[0] & /*rowToAdd*/ 64) {
    				updating_value = true;
    				input_changes.value = /*rowToAdd*/ ctx[6].year;
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_37.name,
    		type: "slot",
    		source: "(129:16) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (134:20) <Label>
    function create_default_slot_36(ctx) {
    	let b;

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Rendimiento";
    			add_location(b, file$3, 133, 27, 3952);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_36.name,
    		type: "slot",
    		source: "(134:20) <Label>",
    		ctx
    	});

    	return block;
    }

    // (133:16) <FormGroup>
    function create_default_slot_35(ctx) {
    	let label;
    	let t;
    	let input;
    	let updating_value;
    	let current;

    	label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_36] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function input_value_binding_2(value) {
    		/*input_value_binding_2*/ ctx[16](value);
    	}

    	let input_props = { type: "text" };

    	if (/*rowToAdd*/ ctx[6]["performance-percents"] !== void 0) {
    		input_props.value = /*rowToAdd*/ ctx[6]["performance-percents"];
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding_2));

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			t = space();
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    			const input_changes = {};

    			if (!updating_value && dirty[0] & /*rowToAdd*/ 64) {
    				updating_value = true;
    				input_changes.value = /*rowToAdd*/ ctx[6]["performance-percents"];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_35.name,
    		type: "slot",
    		source: "(133:16) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (138:20) <Label>
    function create_default_slot_34(ctx) {
    	let b;

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Créditos superados";
    			add_location(b, file$3, 137, 27, 4151);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_34.name,
    		type: "slot",
    		source: "(138:20) <Label>",
    		ctx
    	});

    	return block;
    }

    // (137:16) <FormGroup>
    function create_default_slot_33(ctx) {
    	let label;
    	let t;
    	let input;
    	let updating_value;
    	let current;

    	label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_34] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function input_value_binding_3(value) {
    		/*input_value_binding_3*/ ctx[17](value);
    	}

    	let input_props = { type: "number" };

    	if (/*rowToAdd*/ ctx[6]["credits-passed"] !== void 0) {
    		input_props.value = /*rowToAdd*/ ctx[6]["credits-passed"];
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding_3));

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			t = space();
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    			const input_changes = {};

    			if (!updating_value && dirty[0] & /*rowToAdd*/ 64) {
    				updating_value = true;
    				input_changes.value = /*rowToAdd*/ ctx[6]["credits-passed"];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_33.name,
    		type: "slot",
    		source: "(137:16) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (142:20) <Label>
    function create_default_slot_32(ctx) {
    	let b;

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Créditos matriculados";
    			add_location(b, file$3, 141, 27, 4353);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_32.name,
    		type: "slot",
    		source: "(142:20) <Label>",
    		ctx
    	});

    	return block;
    }

    // (141:16) <FormGroup>
    function create_default_slot_31(ctx) {
    	let label;
    	let t;
    	let input;
    	let updating_value;
    	let current;

    	label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_32] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function input_value_binding_4(value) {
    		/*input_value_binding_4*/ ctx[18](value);
    	}

    	let input_props = { type: "number" };

    	if (/*rowToAdd*/ ctx[6]["credits-enrolled"] !== void 0) {
    		input_props.value = /*rowToAdd*/ ctx[6]["credits-enrolled"];
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding_4));

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			t = space();
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    			const input_changes = {};

    			if (!updating_value && dirty[0] & /*rowToAdd*/ 64) {
    				updating_value = true;
    				input_changes.value = /*rowToAdd*/ ctx[6]["credits-enrolled"];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_31.name,
    		type: "slot",
    		source: "(141:16) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (146:20) <Label>
    function create_default_slot_30(ctx) {
    	let b;

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Centro";
    			add_location(b, file$3, 145, 27, 4560);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_30.name,
    		type: "slot",
    		source: "(146:20) <Label>",
    		ctx
    	});

    	return block;
    }

    // (145:16) <FormGroup>
    function create_default_slot_29(ctx) {
    	let label;
    	let t;
    	let input;
    	let updating_value;
    	let current;

    	label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_30] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function input_value_binding_5(value) {
    		/*input_value_binding_5*/ ctx[19](value);
    	}

    	let input_props = { type: "text" };

    	if (/*rowToAdd*/ ctx[6].center !== void 0) {
    		input_props.value = /*rowToAdd*/ ctx[6].center;
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding_5));

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			t = space();
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    			const input_changes = {};

    			if (!updating_value && dirty[0] & /*rowToAdd*/ 64) {
    				updating_value = true;
    				input_changes.value = /*rowToAdd*/ ctx[6].center;
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_29.name,
    		type: "slot",
    		source: "(145:16) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (124:12) <Form>
    function create_default_slot_28(ctx) {
    	let formgroup0;
    	let t0;
    	let formgroup1;
    	let t1;
    	let formgroup2;
    	let t2;
    	let formgroup3;
    	let t3;
    	let formgroup4;
    	let t4;
    	let formgroup5;
    	let current;

    	formgroup0 = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_39] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	formgroup1 = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_37] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	formgroup2 = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_35] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	formgroup3 = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_33] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	formgroup4 = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_31] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	formgroup5 = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_29] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(formgroup0.$$.fragment);
    			t0 = space();
    			create_component(formgroup1.$$.fragment);
    			t1 = space();
    			create_component(formgroup2.$$.fragment);
    			t2 = space();
    			create_component(formgroup3.$$.fragment);
    			t3 = space();
    			create_component(formgroup4.$$.fragment);
    			t4 = space();
    			create_component(formgroup5.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(formgroup0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(formgroup1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(formgroup2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(formgroup3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(formgroup4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(formgroup5, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const formgroup0_changes = {};

    			if (dirty[0] & /*rowToAdd*/ 64 | dirty[1] & /*$$scope*/ 32768) {
    				formgroup0_changes.$$scope = { dirty, ctx };
    			}

    			formgroup0.$set(formgroup0_changes);
    			const formgroup1_changes = {};

    			if (dirty[0] & /*rowToAdd*/ 64 | dirty[1] & /*$$scope*/ 32768) {
    				formgroup1_changes.$$scope = { dirty, ctx };
    			}

    			formgroup1.$set(formgroup1_changes);
    			const formgroup2_changes = {};

    			if (dirty[0] & /*rowToAdd*/ 64 | dirty[1] & /*$$scope*/ 32768) {
    				formgroup2_changes.$$scope = { dirty, ctx };
    			}

    			formgroup2.$set(formgroup2_changes);
    			const formgroup3_changes = {};

    			if (dirty[0] & /*rowToAdd*/ 64 | dirty[1] & /*$$scope*/ 32768) {
    				formgroup3_changes.$$scope = { dirty, ctx };
    			}

    			formgroup3.$set(formgroup3_changes);
    			const formgroup4_changes = {};

    			if (dirty[0] & /*rowToAdd*/ 64 | dirty[1] & /*$$scope*/ 32768) {
    				formgroup4_changes.$$scope = { dirty, ctx };
    			}

    			formgroup4.$set(formgroup4_changes);
    			const formgroup5_changes = {};

    			if (dirty[0] & /*rowToAdd*/ 64 | dirty[1] & /*$$scope*/ 32768) {
    				formgroup5_changes.$$scope = { dirty, ctx };
    			}

    			formgroup5.$set(formgroup5_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(formgroup0.$$.fragment, local);
    			transition_in(formgroup1.$$.fragment, local);
    			transition_in(formgroup2.$$.fragment, local);
    			transition_in(formgroup3.$$.fragment, local);
    			transition_in(formgroup4.$$.fragment, local);
    			transition_in(formgroup5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(formgroup0.$$.fragment, local);
    			transition_out(formgroup1.$$.fragment, local);
    			transition_out(formgroup2.$$.fragment, local);
    			transition_out(formgroup3.$$.fragment, local);
    			transition_out(formgroup4.$$.fragment, local);
    			transition_out(formgroup5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(formgroup0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(formgroup1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(formgroup2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(formgroup3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(formgroup4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(formgroup5, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_28.name,
    		type: "slot",
    		source: "(124:12) <Form>",
    		ctx
    	});

    	return block;
    }

    // (123:8) <ModalBody>
    function create_default_slot_27(ctx) {
    	let form;
    	let current;

    	form = new Form({
    			props: {
    				$$slots: { default: [create_default_slot_28] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(form.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(form, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const form_changes = {};

    			if (dirty[0] & /*rowToAdd*/ 64 | dirty[1] & /*$$scope*/ 32768) {
    				form_changes.$$scope = { dirty, ctx };
    			}

    			form.$set(form_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(form.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(form.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(form, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_27.name,
    		type: "slot",
    		source: "(123:8) <ModalBody>",
    		ctx
    	});

    	return block;
    }

    // (152:12) <Button color="primary" on:click={addElement}>
    function create_default_slot_26(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Guardar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_26.name,
    		type: "slot",
    		source: "(152:12) <Button color=\\\"primary\\\" on:click={addElement}>",
    		ctx
    	});

    	return block;
    }

    // (153:12) <Button color="secundary" on:click={toggleAddModal}>
    function create_default_slot_25(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cerrar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_25.name,
    		type: "slot",
    		source: "(153:12) <Button color=\\\"secundary\\\" on:click={toggleAddModal}>",
    		ctx
    	});

    	return block;
    }

    // (151:8) <ModalFooter>
    function create_default_slot_24(ctx) {
    	let button0;
    	let t;
    	let button1;
    	let current;

    	button0 = new Button({
    			props: {
    				color: "primary",
    				$$slots: { default: [create_default_slot_26] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*addElement*/ ctx[12]);

    	button1 = new Button({
    			props: {
    				color: "secundary",
    				$$slots: { default: [create_default_slot_25] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*toggleAddModal*/ ctx[11]);

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t = space();
    			create_component(button1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(button1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_24.name,
    		type: "slot",
    		source: "(151:8) <ModalFooter>",
    		ctx
    	});

    	return block;
    }

    // (121:4) <Modal isOpen={addModal} {toggleAddModal}>
    function create_default_slot_23(ctx) {
    	let modalheader;
    	let t0;
    	let modalbody;
    	let t1;
    	let modalfooter;
    	let current;

    	modalheader = new ModalHeader({
    			props: {
    				toggleAddModal: /*toggleAddModal*/ ctx[11],
    				$$slots: { default: [create_default_slot_41] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	modalbody = new ModalBody({
    			props: {
    				$$slots: { default: [create_default_slot_27] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	modalfooter = new ModalFooter({
    			props: {
    				$$slots: { default: [create_default_slot_24] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(modalheader.$$.fragment);
    			t0 = space();
    			create_component(modalbody.$$.fragment);
    			t1 = space();
    			create_component(modalfooter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modalheader, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(modalbody, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(modalfooter, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modalheader_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				modalheader_changes.$$scope = { dirty, ctx };
    			}

    			modalheader.$set(modalheader_changes);
    			const modalbody_changes = {};

    			if (dirty[0] & /*rowToAdd*/ 64 | dirty[1] & /*$$scope*/ 32768) {
    				modalbody_changes.$$scope = { dirty, ctx };
    			}

    			modalbody.$set(modalbody_changes);
    			const modalfooter_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				modalfooter_changes.$$scope = { dirty, ctx };
    			}

    			modalfooter.$set(modalfooter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modalheader.$$.fragment, local);
    			transition_in(modalbody.$$.fragment, local);
    			transition_in(modalfooter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modalheader.$$.fragment, local);
    			transition_out(modalbody.$$.fragment, local);
    			transition_out(modalfooter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modalheader, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(modalbody, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(modalfooter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_23.name,
    		type: "slot",
    		source: "(121:4) <Modal isOpen={addModal} {toggleAddModal}>",
    		ctx
    	});

    	return block;
    }

    // (163:16) <Button color="success" on:click={() => toggleAddModal()}>
    function create_default_slot_22(ctx) {
    	let icon;
    	let t;
    	let current;
    	icon = new Icon({ props: { name: "plus" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    			t = text("Añadir elemento");
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_22.name,
    		type: "slot",
    		source: "(163:16) <Button color=\\\"success\\\" on:click={() => toggleAddModal()}>",
    		ctx
    	});

    	return block;
    }

    // (164:16) <Button color="danger" on:click={() => toggleDeleteAllModal()}>
    function create_default_slot_21(ctx) {
    	let icon;
    	let t;
    	let current;

    	icon = new Icon({
    			props: { name: "trash-fill", class: "pr-1" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    			t = text("Borrar todo");
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_21.name,
    		type: "slot",
    		source: "(164:16) <Button color=\\\"danger\\\" on:click={() => toggleDeleteAllModal()}>",
    		ctx
    	});

    	return block;
    }

    // (165:16) <Button color="info" on:click={() => goToGraphs()}>
    function create_default_slot_20$1(ctx) {
    	let icon;
    	let t;
    	let current;

    	icon = new Icon({
    			props: { name: "graph-up", class: "pr-1" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    			t = text("Ver gráficas");
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_20$1.name,
    		type: "slot",
    		source: "(165:16) <Button color=\\\"info\\\" on:click={() => goToGraphs()}>",
    		ctx
    	});

    	return block;
    }

    // (162:12) <FormGroup class="float-left">
    function create_default_slot_19$1(ctx) {
    	let button0;
    	let t0;
    	let button1;
    	let t1;
    	let button2;
    	let current;

    	button0 = new Button({
    			props: {
    				color: "success",
    				$$slots: { default: [create_default_slot_22] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*click_handler*/ ctx[20]);

    	button1 = new Button({
    			props: {
    				color: "danger",
    				$$slots: { default: [create_default_slot_21] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler_1*/ ctx[21]);

    	button2 = new Button({
    			props: {
    				color: "info",
    				$$slots: { default: [create_default_slot_20$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2.$on("click", /*click_handler_2*/ ctx[22]);

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t0 = space();
    			create_component(button1.$$.fragment);
    			t1 = space();
    			create_component(button2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(button1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(button2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(button1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(button2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_19$1.name,
    		type: "slot",
    		source: "(162:12) <FormGroup class=\\\"float-left\\\">",
    		ctx
    	});

    	return block;
    }

    // (161:8) <Col>
    function create_default_slot_18$1(ctx) {
    	let formgroup;
    	let current;

    	formgroup = new FormGroup({
    			props: {
    				class: "float-left",
    				$$slots: { default: [create_default_slot_19$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(formgroup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(formgroup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const formgroup_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				formgroup_changes.$$scope = { dirty, ctx };
    			}

    			formgroup.$set(formgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(formgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(formgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(formgroup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_18$1.name,
    		type: "slot",
    		source: "(161:8) <Col>",
    		ctx
    	});

    	return block;
    }

    // (171:20) <InputGroupText>
    function create_default_slot_17$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Elementos");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_17$1.name,
    		type: "slot",
    		source: "(171:20) <InputGroupText>",
    		ctx
    	});

    	return block;
    }

    // (170:16) <InputGroupAddon addonType="prepend">
    function create_default_slot_16$1(ctx) {
    	let inputgrouptext;
    	let current;

    	inputgrouptext = new InputGroupText({
    			props: {
    				$$slots: { default: [create_default_slot_17$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(inputgrouptext.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(inputgrouptext, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const inputgrouptext_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				inputgrouptext_changes.$$scope = { dirty, ctx };
    			}

    			inputgrouptext.$set(inputgrouptext_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputgrouptext.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputgrouptext.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inputgrouptext, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_16$1.name,
    		type: "slot",
    		source: "(170:16) <InputGroupAddon addonType=\\\"prepend\\\">",
    		ctx
    	});

    	return block;
    }

    // (173:16) <Input type="select" on:change={(evt) => {searchConfig = {limit: evt.target.value, page: 1}}}>
    function create_default_slot_15$1(ctx) {
    	let option0;
    	let t1;
    	let option1;
    	let t3;
    	let option2;
    	let t5;
    	let option3;
    	let t7;
    	let option4;

    	const block = {
    		c: function create() {
    			option0 = element("option");
    			option0.textContent = "5";
    			t1 = space();
    			option1 = element("option");
    			option1.textContent = "10";
    			t3 = space();
    			option2 = element("option");
    			option2.textContent = "25";
    			t5 = space();
    			option3 = element("option");
    			option3.textContent = "50";
    			t7 = space();
    			option4 = element("option");
    			option4.textContent = "100";
    			option0.__value = "5";
    			option0.value = option0.__value;
    			add_location(option0, file$3, 173, 20, 5794);
    			option1.__value = "10";
    			option1.value = option1.__value;
    			add_location(option1, file$3, 174, 20, 5833);
    			option2.__value = "25";
    			option2.value = option2.__value;
    			add_location(option2, file$3, 175, 20, 5873);
    			option3.__value = "50";
    			option3.value = option3.__value;
    			add_location(option3, file$3, 176, 20, 5913);
    			option4.__value = "100";
    			option4.value = option4.__value;
    			add_location(option4, file$3, 177, 20, 5953);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, option1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, option2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, option3, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, option4, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(option1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(option2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(option3);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(option4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_15$1.name,
    		type: "slot",
    		source: "(173:16) <Input type=\\\"select\\\" on:change={(evt) => {searchConfig = {limit: evt.target.value, page: 1}}}>",
    		ctx
    	});

    	return block;
    }

    // (169:12) <InputGroup>
    function create_default_slot_14$1(ctx) {
    	let inputgroupaddon;
    	let t;
    	let input;
    	let current;

    	inputgroupaddon = new InputGroupAddon({
    			props: {
    				addonType: "prepend",
    				$$slots: { default: [create_default_slot_16$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	input = new Input({
    			props: {
    				type: "select",
    				$$slots: { default: [create_default_slot_15$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	input.$on("change", /*change_handler*/ ctx[23]);

    	const block = {
    		c: function create() {
    			create_component(inputgroupaddon.$$.fragment);
    			t = space();
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(inputgroupaddon, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const inputgroupaddon_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				inputgroupaddon_changes.$$scope = { dirty, ctx };
    			}

    			inputgroupaddon.$set(inputgroupaddon_changes);
    			const input_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				input_changes.$$scope = { dirty, ctx };
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputgroupaddon.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputgroupaddon.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inputgroupaddon, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_14$1.name,
    		type: "slot",
    		source: "(169:12) <InputGroup>",
    		ctx
    	});

    	return block;
    }

    // (168:8) <Col>
    function create_default_slot_13$1(ctx) {
    	let inputgroup;
    	let current;

    	inputgroup = new InputGroup({
    			props: {
    				$$slots: { default: [create_default_slot_14$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(inputgroup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(inputgroup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const inputgroup_changes = {};

    			if (dirty[0] & /*searchConfig*/ 2 | dirty[1] & /*$$scope*/ 32768) {
    				inputgroup_changes.$$scope = { dirty, ctx };
    			}

    			inputgroup.$set(inputgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inputgroup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13$1.name,
    		type: "slot",
    		source: "(168:8) <Col>",
    		ctx
    	});

    	return block;
    }

    // (160:4) <Row class="mt-3">
    function create_default_slot_12$1(ctx) {
    	let col0;
    	let t;
    	let col1;
    	let current;

    	col0 = new Col({
    			props: {
    				$$slots: { default: [create_default_slot_18$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	col1 = new Col({
    			props: {
    				$$slots: { default: [create_default_slot_13$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(col0.$$.fragment);
    			t = space();
    			create_component(col1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(col0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(col1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const col0_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				col0_changes.$$scope = { dirty, ctx };
    			}

    			col0.$set(col0_changes);
    			const col1_changes = {};

    			if (dirty[0] & /*searchConfig*/ 2 | dirty[1] & /*$$scope*/ 32768) {
    				col1_changes.$$scope = { dirty, ctx };
    			}

    			col1.$set(col1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(col0.$$.fragment, local);
    			transition_in(col1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(col0.$$.fragment, local);
    			transition_out(col1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(col0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(col1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12$1.name,
    		type: "slot",
    		source: "(160:4) <Row class=\\\"mt-3\\\">",
    		ctx
    	});

    	return block;
    }

    // (217:28) <Button color="primary" on:click={() => editElement(index)}>
    function create_default_slot_11$1(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: { name: "pencil-fill" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11$1.name,
    		type: "slot",
    		source: "(217:28) <Button color=\\\"primary\\\" on:click={() => editElement(index)}>",
    		ctx
    	});

    	return block;
    }

    // (218:28) <Button color="danger" on:click={() => openDeleteModal(index)}>
    function create_default_slot_10$1(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: { name: "trash-fill" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10$1.name,
    		type: "slot",
    		source: "(218:28) <Button color=\\\"danger\\\" on:click={() => openDeleteModal(index)}>",
    		ctx
    	});

    	return block;
    }

    // (216:24) <FormGroup>
    function create_default_slot_9$1(ctx) {
    	let button0;
    	let t;
    	let button1;
    	let current;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[30](/*index*/ ctx[42]);
    	}

    	button0 = new Button({
    			props: {
    				color: "primary",
    				$$slots: { default: [create_default_slot_11$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", click_handler_3);

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[31](/*index*/ ctx[42]);
    	}

    	button1 = new Button({
    			props: {
    				color: "danger",
    				$$slots: { default: [create_default_slot_10$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", click_handler_4);

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t = space();
    			create_component(button1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(button1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9$1.name,
    		type: "slot",
    		source: "(216:24) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (206:16) {#each data as row,                 index ({"year": row.year, "center": row.center, "field-of-knowledge": row["field-of-knowledge"]}
    function create_each_block$1(key_1, ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*row*/ ctx[40]["field-of-knowledge"] + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*row*/ ctx[40].year + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*row*/ ctx[40]["performance-percents"] + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*row*/ ctx[40]["credits-passed"] + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*row*/ ctx[40]["credits-enrolled"] + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10_value = /*row*/ ctx[40].center + "";
    	let t10;
    	let t11;
    	let td6;
    	let formgroup;
    	let t12;
    	let current;

    	formgroup = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_9$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			td6 = element("td");
    			create_component(formgroup.$$.fragment);
    			t12 = space();
    			add_location(td0, file$3, 208, 20, 7477);
    			add_location(td1, file$3, 209, 20, 7534);
    			add_location(td2, file$3, 210, 20, 7574);
    			add_location(td3, file$3, 211, 20, 7633);
    			add_location(td4, file$3, 212, 20, 7686);
    			add_location(td5, file$3, 213, 20, 7741);
    			add_location(td6, file$3, 214, 20, 7783);
    			add_location(tr, file$3, 207, 16, 7452);
    			this.first = tr;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td6);
    			mount_component(formgroup, td6, null);
    			append_dev(tr, t12);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*data*/ 1) && t0_value !== (t0_value = /*row*/ ctx[40]["field-of-knowledge"] + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty[0] & /*data*/ 1) && t2_value !== (t2_value = /*row*/ ctx[40].year + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[0] & /*data*/ 1) && t4_value !== (t4_value = /*row*/ ctx[40]["performance-percents"] + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty[0] & /*data*/ 1) && t6_value !== (t6_value = /*row*/ ctx[40]["credits-passed"] + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty[0] & /*data*/ 1) && t8_value !== (t8_value = /*row*/ ctx[40]["credits-enrolled"] + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty[0] & /*data*/ 1) && t10_value !== (t10_value = /*row*/ ctx[40].center + "")) set_data_dev(t10, t10_value);
    			const formgroup_changes = {};

    			if (dirty[0] & /*data*/ 1 | dirty[1] & /*$$scope*/ 32768) {
    				formgroup_changes.$$scope = { dirty, ctx };
    			}

    			formgroup.$set(formgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(formgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(formgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(formgroup);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(206:16) {#each data as row,                 index ({\\\"year\\\": row.year, \\\"center\\\": row.center, \\\"field-of-knowledge\\\": row[\\\"field-of-knowledge\\\"]}",
    		ctx
    	});

    	return block;
    }

    // (184:8) <Table responsive>
    function create_default_slot_8$1(ctx) {
    	let thead;
    	let tr0;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let t7;
    	let th4;
    	let t9;
    	let th5;
    	let t11;
    	let th6;
    	let t13;
    	let tbody;
    	let tr1;
    	let td0;
    	let input0;
    	let updating_value;
    	let t14;
    	let td1;
    	let input1;
    	let updating_value_1;
    	let t15;
    	let td2;
    	let input2;
    	let updating_value_2;
    	let t16;
    	let td3;
    	let input3;
    	let updating_value_3;
    	let t17;
    	let td4;
    	let input4;
    	let updating_value_4;
    	let t18;
    	let td5;
    	let input5;
    	let updating_value_5;
    	let t19;
    	let td6;
    	let t21;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[24](value);
    	}

    	let input0_props = {
    		type: "search",
    		placeholder: "Campo Conocimiento"
    	};

    	if (/*searchConfig*/ ctx[1]["field-of-knowledge"] !== void 0) {
    		input0_props.value = /*searchConfig*/ ctx[1]["field-of-knowledge"];
    	}

    	input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[25](value);
    	}

    	let input1_props = { type: "search", placeholder: "Año" };

    	if (/*searchConfig*/ ctx[1].year !== void 0) {
    		input1_props.value = /*searchConfig*/ ctx[1].year;
    	}

    	input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[26](value);
    	}

    	let input2_props = {
    		type: "search",
    		placeholder: "Rendimiento"
    	};

    	if (/*searchConfig*/ ctx[1]["performance-percents"] !== void 0) {
    		input2_props.value = /*searchConfig*/ ctx[1]["performance-percents"];
    	}

    	input2 = new Input({ props: input2_props, $$inline: true });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	function input3_value_binding(value) {
    		/*input3_value_binding*/ ctx[27](value);
    	}

    	let input3_props = {
    		type: "search",
    		placeholder: "Créditos superados"
    	};

    	if (/*searchConfig*/ ctx[1]["credits-passed"] !== void 0) {
    		input3_props.value = /*searchConfig*/ ctx[1]["credits-passed"];
    	}

    	input3 = new Input({ props: input3_props, $$inline: true });
    	binding_callbacks.push(() => bind(input3, "value", input3_value_binding));

    	function input4_value_binding(value) {
    		/*input4_value_binding*/ ctx[28](value);
    	}

    	let input4_props = {
    		type: "search",
    		placeholder: "Créditos matriculados"
    	};

    	if (/*searchConfig*/ ctx[1]["credits-enrolled"] !== void 0) {
    		input4_props.value = /*searchConfig*/ ctx[1]["credits-enrolled"];
    	}

    	input4 = new Input({ props: input4_props, $$inline: true });
    	binding_callbacks.push(() => bind(input4, "value", input4_value_binding));

    	function input5_value_binding(value) {
    		/*input5_value_binding*/ ctx[29](value);
    	}

    	let input5_props = { type: "search", placeholder: "Centro" };

    	if (/*searchConfig*/ ctx[1].center !== void 0) {
    		input5_props.value = /*searchConfig*/ ctx[1].center;
    	}

    	input5 = new Input({ props: input5_props, $$inline: true });
    	binding_callbacks.push(() => bind(input5, "value", input5_value_binding));
    	let each_value = /*data*/ ctx[0];
    	validate_each_argument(each_value);

    	const get_key = ctx => ({
    		"year": /*row*/ ctx[40].year,
    		"center": /*row*/ ctx[40].center,
    		"field-of-knowledge": /*row*/ ctx[40]["field-of-knowledge"]
    	});

    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Campo de conocimiento";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Año";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Rendimiento";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Créditos superados";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "Créditos matriculados";
    			t9 = space();
    			th5 = element("th");
    			th5.textContent = "Centro";
    			t11 = space();
    			th6 = element("th");
    			th6.textContent = "Acciones";
    			t13 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			create_component(input0.$$.fragment);
    			t14 = space();
    			td1 = element("td");
    			create_component(input1.$$.fragment);
    			t15 = space();
    			td2 = element("td");
    			create_component(input2.$$.fragment);
    			t16 = space();
    			td3 = element("td");
    			create_component(input3.$$.fragment);
    			t17 = space();
    			td4 = element("td");
    			create_component(input4.$$.fragment);
    			t18 = space();
    			td5 = element("td");
    			create_component(input5.$$.fragment);
    			t19 = space();
    			td6 = element("td");
    			td6.textContent = "No hay acciones disponibles";
    			t21 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(th0, file$3, 186, 16, 6141);
    			add_location(th1, file$3, 187, 16, 6188);
    			add_location(th2, file$3, 188, 16, 6217);
    			add_location(th3, file$3, 189, 16, 6254);
    			add_location(th4, file$3, 190, 16, 6298);
    			add_location(th5, file$3, 191, 16, 6345);
    			add_location(th6, file$3, 192, 16, 6377);
    			add_location(tr0, file$3, 185, 12, 6120);
    			add_location(thead, file$3, 184, 12, 6100);
    			add_location(td0, file$3, 197, 20, 6495);
    			add_location(td1, file$3, 198, 20, 6628);
    			add_location(td2, file$3, 199, 20, 6729);
    			add_location(td3, file$3, 200, 20, 6857);
    			add_location(td4, file$3, 201, 20, 6986);
    			add_location(td5, file$3, 202, 20, 7120);
    			add_location(td6, file$3, 203, 20, 7226);
    			add_location(tr1, file$3, 196, 16, 6470);
    			add_location(tbody, file$3, 195, 12, 6446);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, th1);
    			append_dev(tr0, t3);
    			append_dev(tr0, th2);
    			append_dev(tr0, t5);
    			append_dev(tr0, th3);
    			append_dev(tr0, t7);
    			append_dev(tr0, th4);
    			append_dev(tr0, t9);
    			append_dev(tr0, th5);
    			append_dev(tr0, t11);
    			append_dev(tr0, th6);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, tbody, anchor);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			mount_component(input0, td0, null);
    			append_dev(tr1, t14);
    			append_dev(tr1, td1);
    			mount_component(input1, td1, null);
    			append_dev(tr1, t15);
    			append_dev(tr1, td2);
    			mount_component(input2, td2, null);
    			append_dev(tr1, t16);
    			append_dev(tr1, td3);
    			mount_component(input3, td3, null);
    			append_dev(tr1, t17);
    			append_dev(tr1, td4);
    			mount_component(input4, td4, null);
    			append_dev(tr1, t18);
    			append_dev(tr1, td5);
    			mount_component(input5, td5, null);
    			append_dev(tr1, t19);
    			append_dev(tr1, td6);
    			append_dev(tbody, t21);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const input0_changes = {};

    			if (!updating_value && dirty[0] & /*searchConfig*/ 2) {
    				updating_value = true;
    				input0_changes.value = /*searchConfig*/ ctx[1]["field-of-knowledge"];
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty[0] & /*searchConfig*/ 2) {
    				updating_value_1 = true;
    				input1_changes.value = /*searchConfig*/ ctx[1].year;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_2 && dirty[0] & /*searchConfig*/ 2) {
    				updating_value_2 = true;
    				input2_changes.value = /*searchConfig*/ ctx[1]["performance-percents"];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);
    			const input3_changes = {};

    			if (!updating_value_3 && dirty[0] & /*searchConfig*/ 2) {
    				updating_value_3 = true;
    				input3_changes.value = /*searchConfig*/ ctx[1]["credits-passed"];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			input3.$set(input3_changes);
    			const input4_changes = {};

    			if (!updating_value_4 && dirty[0] & /*searchConfig*/ 2) {
    				updating_value_4 = true;
    				input4_changes.value = /*searchConfig*/ ctx[1]["credits-enrolled"];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			input4.$set(input4_changes);
    			const input5_changes = {};

    			if (!updating_value_5 && dirty[0] & /*searchConfig*/ 2) {
    				updating_value_5 = true;
    				input5_changes.value = /*searchConfig*/ ctx[1].center;
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			input5.$set(input5_changes);

    			if (dirty[0] & /*openDeleteModal, data, editElement*/ 8321) {
    				each_value = /*data*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, tbody, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			transition_in(input4.$$.fragment, local);
    			transition_in(input5.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(input4.$$.fragment, local);
    			transition_out(input5.$$.fragment, local);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(tbody);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(input2);
    			destroy_component(input3);
    			destroy_component(input4);
    			destroy_component(input5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8$1.name,
    		type: "slot",
    		source: "(184:8) <Table responsive>",
    		ctx
    	});

    	return block;
    }

    // (183:4) <Row>
    function create_default_slot_7$1(ctx) {
    	let table;
    	let current;

    	table = new Table({
    			props: {
    				responsive: true,
    				$$slots: { default: [create_default_slot_8$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(table.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(table, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const table_changes = {};

    			if (dirty[0] & /*data, searchConfig*/ 3 | dirty[1] & /*$$scope*/ 32768) {
    				table_changes.$$scope = { dirty, ctx };
    			}

    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(table, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7$1.name,
    		type: "slot",
    		source: "(183:4) <Row>",
    		ctx
    	});

    	return block;
    }

    // (230:20) <Button class="btn-light bg-transparent" on:click={() => {if (searchConfig.page > 1) searchConfig.page--}}>
    function create_default_slot_6$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Anterior");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6$1.name,
    		type: "slot",
    		source: "(230:20) <Button class=\\\"btn-light bg-transparent\\\" on:click={() => {if (searchConfig.page > 1) searchConfig.page--}}>",
    		ctx
    	});

    	return block;
    }

    // (231:20) <InputGroupText class="bg-transparent">
    function create_default_slot_5$1(ctx) {
    	let t_value = /*searchConfig*/ ctx[1].page + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*searchConfig*/ 2 && t_value !== (t_value = /*searchConfig*/ ctx[1].page + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5$1.name,
    		type: "slot",
    		source: "(231:20) <InputGroupText class=\\\"bg-transparent\\\">",
    		ctx
    	});

    	return block;
    }

    // (232:20) <Button class="btn-light bg-transparent" on:click={() => {if (data.length === parseInt(searchConfig.limit)) searchConfig.page++}}>
    function create_default_slot_4$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Siguiente");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$1.name,
    		type: "slot",
    		source: "(232:20) <Button class=\\\"btn-light bg-transparent\\\" on:click={() => {if (data.length === parseInt(searchConfig.limit)) searchConfig.page++}}>",
    		ctx
    	});

    	return block;
    }

    // (229:16) <InputGroup>
    function create_default_slot_3$1(ctx) {
    	let button0;
    	let t0;
    	let inputgrouptext;
    	let t1;
    	let button1;
    	let current;

    	button0 = new Button({
    			props: {
    				class: "btn-light bg-transparent",
    				$$slots: { default: [create_default_slot_6$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*click_handler_5*/ ctx[32]);

    	inputgrouptext = new InputGroupText({
    			props: {
    				class: "bg-transparent",
    				$$slots: { default: [create_default_slot_5$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1 = new Button({
    			props: {
    				class: "btn-light bg-transparent",
    				$$slots: { default: [create_default_slot_4$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler_6*/ ctx[33]);

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t0 = space();
    			create_component(inputgrouptext.$$.fragment);
    			t1 = space();
    			create_component(button1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(inputgrouptext, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const inputgrouptext_changes = {};

    			if (dirty[0] & /*searchConfig*/ 2 | dirty[1] & /*$$scope*/ 32768) {
    				inputgrouptext_changes.$$scope = { dirty, ctx };
    			}

    			inputgrouptext.$set(inputgrouptext_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 32768) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(inputgrouptext.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(inputgrouptext.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(inputgrouptext, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(button1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(229:16) <InputGroup>",
    		ctx
    	});

    	return block;
    }

    // (227:8) <Col>
    function create_default_slot_2$2(ctx) {
    	let div;
    	let inputgroup;
    	let current;

    	inputgroup = new InputGroup({
    			props: {
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(inputgroup.$$.fragment);
    			attr_dev(div, "class", "float-right");
    			add_location(div, file$3, 227, 12, 8264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(inputgroup, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const inputgroup_changes = {};

    			if (dirty[0] & /*data, searchConfig*/ 3 | dirty[1] & /*$$scope*/ 32768) {
    				inputgroup_changes.$$scope = { dirty, ctx };
    			}

    			inputgroup.$set(inputgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(inputgroup);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(227:8) <Col>",
    		ctx
    	});

    	return block;
    }

    // (226:4) <Row>
    function create_default_slot_1$3(ctx) {
    	let col;
    	let current;

    	col = new Col({
    			props: {
    				$$slots: { default: [create_default_slot_2$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(col.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const col_changes = {};

    			if (dirty[0] & /*data, searchConfig*/ 3 | dirty[1] & /*$$scope*/ 32768) {
    				col_changes.$$scope = { dirty, ctx };
    			}

    			col.$set(col_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(226:4) <Row>",
    		ctx
    	});

    	return block;
    }

    // (159:0) <Container>
    function create_default_slot$3(ctx) {
    	let row0;
    	let t0;
    	let row1;
    	let t1;
    	let row2;
    	let current;

    	row0 = new Row({
    			props: {
    				class: "mt-3",
    				$$slots: { default: [create_default_slot_12$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	row1 = new Row({
    			props: {
    				$$slots: { default: [create_default_slot_7$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	row2 = new Row({
    			props: {
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(row0.$$.fragment);
    			t0 = space();
    			create_component(row1.$$.fragment);
    			t1 = space();
    			create_component(row2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(row0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(row1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(row2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const row0_changes = {};

    			if (dirty[0] & /*searchConfig*/ 2 | dirty[1] & /*$$scope*/ 32768) {
    				row0_changes.$$scope = { dirty, ctx };
    			}

    			row0.$set(row0_changes);
    			const row1_changes = {};

    			if (dirty[0] & /*data, searchConfig*/ 3 | dirty[1] & /*$$scope*/ 32768) {
    				row1_changes.$$scope = { dirty, ctx };
    			}

    			row1.$set(row1_changes);
    			const row2_changes = {};

    			if (dirty[0] & /*data, searchConfig*/ 3 | dirty[1] & /*$$scope*/ 32768) {
    				row2_changes.$$scope = { dirty, ctx };
    			}

    			row2.$set(row2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(row0.$$.fragment, local);
    			transition_in(row1.$$.fragment, local);
    			transition_in(row2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row0.$$.fragment, local);
    			transition_out(row1.$$.fragment, local);
    			transition_out(row2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(row0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(row1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(row2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(159:0) <Container>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let container0;
    	let t0;
    	let actionmodal0;
    	let t1;
    	let actionmodal1;
    	let t2;
    	let div;
    	let modal;
    	let t3;
    	let container1;
    	let current;

    	container0 = new Container({
    			props: {
    				$$slots: { default: [create_default_slot_42] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	actionmodal0 = new ActionModal({
    			props: {
    				modalVisible: /*deleteModal*/ ctx[3],
    				title: "¿Seguro que quiere borrar el elemento?",
    				description: "Esta acción es irreversible.",
    				actionName: "Borrar",
    				actionFunction: /*deleteElement*/ ctx[8]
    			},
    			$$inline: true
    		});

    	actionmodal1 = new ActionModal({
    			props: {
    				modalVisible: /*deleteAllModal*/ ctx[4],
    				title: "¿Seguro que quiere borrar todos los elementos?",
    				description: "Esta acción es irreversible.",
    				actionName: "Borrar",
    				actionFunction: /*deleteAllElements*/ ctx[10]
    			},
    			$$inline: true
    		});

    	modal = new Modal({
    			props: {
    				isOpen: /*addModal*/ ctx[5],
    				toggleAddModal: /*toggleAddModal*/ ctx[11],
    				$$slots: { default: [create_default_slot_23] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	container1 = new Container({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(container0.$$.fragment);
    			t0 = space();
    			create_component(actionmodal0.$$.fragment);
    			t1 = space();
    			create_component(actionmodal1.$$.fragment);
    			t2 = space();
    			div = element("div");
    			create_component(modal.$$.fragment);
    			t3 = space();
    			create_component(container1.$$.fragment);
    			add_location(div, file$3, 119, 0, 3357);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(container0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(actionmodal0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(actionmodal1, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(modal, div, null);
    			insert_dev(target, t3, anchor);
    			mount_component(container1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const container0_changes = {};

    			if (dirty[0] & /*alerts*/ 4 | dirty[1] & /*$$scope*/ 32768) {
    				container0_changes.$$scope = { dirty, ctx };
    			}

    			container0.$set(container0_changes);
    			const actionmodal0_changes = {};
    			if (dirty[0] & /*deleteModal*/ 8) actionmodal0_changes.modalVisible = /*deleteModal*/ ctx[3];
    			actionmodal0.$set(actionmodal0_changes);
    			const actionmodal1_changes = {};
    			if (dirty[0] & /*deleteAllModal*/ 16) actionmodal1_changes.modalVisible = /*deleteAllModal*/ ctx[4];
    			actionmodal1.$set(actionmodal1_changes);
    			const modal_changes = {};
    			if (dirty[0] & /*addModal*/ 32) modal_changes.isOpen = /*addModal*/ ctx[5];

    			if (dirty[0] & /*rowToAdd*/ 64 | dirty[1] & /*$$scope*/ 32768) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    			const container1_changes = {};

    			if (dirty[0] & /*data, searchConfig*/ 3 | dirty[1] & /*$$scope*/ 32768) {
    				container1_changes.$$scope = { dirty, ctx };
    			}

    			container1.$set(container1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(container0.$$.fragment, local);
    			transition_in(actionmodal0.$$.fragment, local);
    			transition_in(actionmodal1.$$.fragment, local);
    			transition_in(modal.$$.fragment, local);
    			transition_in(container1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(container0.$$.fragment, local);
    			transition_out(actionmodal0.$$.fragment, local);
    			transition_out(actionmodal1.$$.fragment, local);
    			transition_out(modal.$$.fragment, local);
    			transition_out(container1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(container0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(actionmodal0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(actionmodal1, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			destroy_component(modal);
    			if (detaching) detach_dev(t3);
    			destroy_component(container1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function goToGraphs() {
    	window.location.href = "?#/graphs";
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	let data = [];
    	let searchConfig = { "limit": 5, "page": 1 };

    	const unsubscribe = apiData.subscribe(value => {
    		$$invalidate(0, data = value);
    	});

    	async function loadData() {
    		let tmpData = await searchRecords(searchConfig);
    		apiData.update(_ => tmpData);
    	}

    	function addAlert(message) {
    		apiAlerts.update(alerts => [...alerts, message]);
    		setTimeout(() => apiAlerts.update(alerts => alerts.slice(1)), 1300);
    	}

    	// Alerts
    	let alerts = [];

    	const unsubscribeAlerts = apiAlerts.subscribe(value => {
    		$$invalidate(2, alerts = value);
    	});

    	///
    	/// Model logic
    	///
    	// Delete modal
    	let deleteModal = false;

    	let deleteModalIndex = 0;
    	const toggleDeleteModal = () => $$invalidate(3, deleteModal = !deleteModal);

    	function openDeleteModal(index) {
    		deleteModalIndex = index;
    		toggleDeleteModal();
    	}

    	async function deleteElement() {
    		let element = data[deleteModalIndex];
    		let result = await deleteRecord(element);
    		addAlert(result);
    		toggleDeleteModal();
    		await loadData(); // Renew data
    	}

    	// Delete all modal
    	let deleteAllModal = false;

    	const toggleDeleteAllModal = () => $$invalidate(4, deleteAllModal = !deleteAllModal);

    	// Delete All
    	async function deleteAllElements() {
    		let result = await deleteAllRecords();
    		addAlert(result);
    		await loadData(); // Renew data
    		toggleDeleteAllModal();
    	}

    	// Add all modal
    	let addModal = false;

    	const toggleAddModal = () => $$invalidate(5, addModal = !addModal);
    	let rowToAdd = {};

    	async function addElement() {
    		let result = await addRecord(rowToAdd);
    		addAlert(result);
    		await loadData(); // Renew data
    		toggleAddModal();
    	}

    	// Edit Element
    	function editElement(index) {
    		let element = data[index];

    		// The push function is broken.
    		let oldDataURL = "?#/" + element.center + "/" + element.year + "/" + element["field-of-knowledge"];

    		window.location.href = oldDataURL;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	function input_value_binding(value) {
    		if ($$self.$$.not_equal(rowToAdd["field-of-knowledge"], value)) {
    			rowToAdd["field-of-knowledge"] = value;
    			$$invalidate(6, rowToAdd);
    		}
    	}

    	function input_value_binding_1(value) {
    		if ($$self.$$.not_equal(rowToAdd.year, value)) {
    			rowToAdd.year = value;
    			$$invalidate(6, rowToAdd);
    		}
    	}

    	function input_value_binding_2(value) {
    		if ($$self.$$.not_equal(rowToAdd["performance-percents"], value)) {
    			rowToAdd["performance-percents"] = value;
    			$$invalidate(6, rowToAdd);
    		}
    	}

    	function input_value_binding_3(value) {
    		if ($$self.$$.not_equal(rowToAdd["credits-passed"], value)) {
    			rowToAdd["credits-passed"] = value;
    			$$invalidate(6, rowToAdd);
    		}
    	}

    	function input_value_binding_4(value) {
    		if ($$self.$$.not_equal(rowToAdd["credits-enrolled"], value)) {
    			rowToAdd["credits-enrolled"] = value;
    			$$invalidate(6, rowToAdd);
    		}
    	}

    	function input_value_binding_5(value) {
    		if ($$self.$$.not_equal(rowToAdd.center, value)) {
    			rowToAdd.center = value;
    			$$invalidate(6, rowToAdd);
    		}
    	}

    	const click_handler = () => toggleAddModal();
    	const click_handler_1 = () => toggleDeleteAllModal();
    	const click_handler_2 = () => goToGraphs();

    	const change_handler = evt => {
    		$$invalidate(1, searchConfig = { limit: evt.target.value, page: 1 });
    	};

    	function input0_value_binding(value) {
    		if ($$self.$$.not_equal(searchConfig["field-of-knowledge"], value)) {
    			searchConfig["field-of-knowledge"] = value;
    			$$invalidate(1, searchConfig);
    		}
    	}

    	function input1_value_binding(value) {
    		if ($$self.$$.not_equal(searchConfig.year, value)) {
    			searchConfig.year = value;
    			$$invalidate(1, searchConfig);
    		}
    	}

    	function input2_value_binding(value) {
    		if ($$self.$$.not_equal(searchConfig["performance-percents"], value)) {
    			searchConfig["performance-percents"] = value;
    			$$invalidate(1, searchConfig);
    		}
    	}

    	function input3_value_binding(value) {
    		if ($$self.$$.not_equal(searchConfig["credits-passed"], value)) {
    			searchConfig["credits-passed"] = value;
    			$$invalidate(1, searchConfig);
    		}
    	}

    	function input4_value_binding(value) {
    		if ($$self.$$.not_equal(searchConfig["credits-enrolled"], value)) {
    			searchConfig["credits-enrolled"] = value;
    			$$invalidate(1, searchConfig);
    		}
    	}

    	function input5_value_binding(value) {
    		if ($$self.$$.not_equal(searchConfig.center, value)) {
    			searchConfig.center = value;
    			$$invalidate(1, searchConfig);
    		}
    	}

    	const click_handler_3 = index => editElement(index);
    	const click_handler_4 = index => openDeleteModal(index);

    	const click_handler_5 = () => {
    		if (searchConfig.page > 1) $$invalidate(1, searchConfig.page--, searchConfig);
    	};

    	const click_handler_6 = () => {
    		if (data.length === parseInt(searchConfig.limit)) $$invalidate(1, searchConfig.page++, searchConfig);
    	};

    	$$self.$capture_state = () => ({
    		Col,
    		Container,
    		Row,
    		Table,
    		FormGroup,
    		Label,
    		Input,
    		InputGroup,
    		InputGroupText,
    		Button,
    		Icon,
    		Modal,
    		ModalBody,
    		ModalFooter,
    		ModalHeader,
    		Form,
    		Alert,
    		InputGroupAddon,
    		ActionModal,
    		apiAlerts,
    		apiData,
    		deleteRecord,
    		deleteAllRecords,
    		addRecord,
    		searchRecords,
    		data,
    		searchConfig,
    		unsubscribe,
    		loadData,
    		addAlert,
    		alerts,
    		unsubscribeAlerts,
    		deleteModal,
    		deleteModalIndex,
    		toggleDeleteModal,
    		openDeleteModal,
    		deleteElement,
    		deleteAllModal,
    		toggleDeleteAllModal,
    		deleteAllElements,
    		addModal,
    		toggleAddModal,
    		rowToAdd,
    		addElement,
    		editElement,
    		goToGraphs
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("searchConfig" in $$props) $$invalidate(1, searchConfig = $$props.searchConfig);
    		if ("alerts" in $$props) $$invalidate(2, alerts = $$props.alerts);
    		if ("deleteModal" in $$props) $$invalidate(3, deleteModal = $$props.deleteModal);
    		if ("deleteModalIndex" in $$props) deleteModalIndex = $$props.deleteModalIndex;
    		if ("deleteAllModal" in $$props) $$invalidate(4, deleteAllModal = $$props.deleteAllModal);
    		if ("addModal" in $$props) $$invalidate(5, addModal = $$props.addModal);
    		if ("rowToAdd" in $$props) $$invalidate(6, rowToAdd = $$props.rowToAdd);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*searchConfig*/ 2) {
    			{
    				// Load Data
    				searchRecords(searchConfig).then(data => apiData.update(_ => data));
    			}
    		}
    	};

    	return [
    		data,
    		searchConfig,
    		alerts,
    		deleteModal,
    		deleteAllModal,
    		addModal,
    		rowToAdd,
    		openDeleteModal,
    		deleteElement,
    		toggleDeleteAllModal,
    		deleteAllElements,
    		toggleAddModal,
    		addElement,
    		editElement,
    		input_value_binding,
    		input_value_binding_1,
    		input_value_binding_2,
    		input_value_binding_3,
    		input_value_binding_4,
    		input_value_binding_5,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		change_handler,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding,
    		input3_value_binding,
    		input4_value_binding,
    		input5_value_binding,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6
    	];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/dansesben/frontend/routes/NotFound.svelte generated by Svelte v3.37.0 */

    function create_fragment$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("No se ha podido encontrar la ruta especificada.");
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop$1,
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NotFound", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NotFound> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/dansesben/frontend/routes/EditElement.svelte generated by Svelte v3.37.0 */
    const file$2 = "src/dansesben/frontend/routes/EditElement.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (56:8) <Alert color={alert.color} class="mb-1" dismissible>
    function create_default_slot_20(ctx) {
    	let t0_value = /*alert*/ ctx[11].text + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*alerts*/ 1 && t0_value !== (t0_value = /*alert*/ ctx[11].text + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_20.name,
    		type: "slot",
    		source: "(56:8) <Alert color={alert.color} class=\\\"mb-1\\\" dismissible>",
    		ctx
    	});

    	return block;
    }

    // (55:4) {#each alerts as alert}
    function create_each_block(ctx) {
    	let alert;
    	let current;

    	alert = new Alert({
    			props: {
    				color: /*alert*/ ctx[11].color,
    				class: "mb-1",
    				dismissible: true,
    				$$slots: { default: [create_default_slot_20] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(alert.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(alert, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const alert_changes = {};
    			if (dirty & /*alerts*/ 1) alert_changes.color = /*alert*/ ctx[11].color;

    			if (dirty & /*$$scope, alerts*/ 16385) {
    				alert_changes.$$scope = { dirty, ctx };
    			}

    			alert.$set(alert_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(alert.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(alert.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(alert, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(55:4) {#each alerts as alert}",
    		ctx
    	});

    	return block;
    }

    // (54:0) <Container>
    function create_default_slot_19(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*alerts*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*alerts*/ 1) {
    				each_value = /*alerts*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_19.name,
    		type: "slot",
    		source: "(54:0) <Container>",
    		ctx
    	});

    	return block;
    }

    // (67:20) <Label>
    function create_default_slot_18(ctx) {
    	let b;

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Campo de conocimiento";
    			add_location(b, file$2, 66, 27, 2315);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_18.name,
    		type: "slot",
    		source: "(67:20) <Label>",
    		ctx
    	});

    	return block;
    }

    // (66:16) <FormGroup>
    function create_default_slot_17(ctx) {
    	let label;
    	let t;
    	let input;
    	let updating_value;
    	let current;

    	label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_18] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function input_value_binding(value) {
    		/*input_value_binding*/ ctx[4](value);
    	}

    	let input_props = { type: "text" };

    	if (/*newDataEdit*/ ctx[1]["field-of-knowledge"] !== void 0) {
    		input_props.value = /*newDataEdit*/ ctx[1]["field-of-knowledge"];
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding));

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			t = space();
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    			const input_changes = {};

    			if (!updating_value && dirty & /*newDataEdit*/ 2) {
    				updating_value = true;
    				input_changes.value = /*newDataEdit*/ ctx[1]["field-of-knowledge"];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_17.name,
    		type: "slot",
    		source: "(66:16) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (71:20) <Label>
    function create_default_slot_16(ctx) {
    	let b;

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Año";
    			add_location(b, file$2, 70, 27, 2525);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_16.name,
    		type: "slot",
    		source: "(71:20) <Label>",
    		ctx
    	});

    	return block;
    }

    // (70:16) <FormGroup>
    function create_default_slot_15(ctx) {
    	let label;
    	let t;
    	let input;
    	let updating_value;
    	let current;

    	label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_16] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function input_value_binding_1(value) {
    		/*input_value_binding_1*/ ctx[5](value);
    	}

    	let input_props = { type: "number" };

    	if (/*newDataEdit*/ ctx[1].year !== void 0) {
    		input_props.value = /*newDataEdit*/ ctx[1].year;
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding_1));

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			t = space();
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    			const input_changes = {};

    			if (!updating_value && dirty & /*newDataEdit*/ 2) {
    				updating_value = true;
    				input_changes.value = /*newDataEdit*/ ctx[1].year;
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_15.name,
    		type: "slot",
    		source: "(70:16) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (75:20) <Label>
    function create_default_slot_14(ctx) {
    	let b;

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Rendimiento";
    			add_location(b, file$2, 74, 27, 2702);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_14.name,
    		type: "slot",
    		source: "(75:20) <Label>",
    		ctx
    	});

    	return block;
    }

    // (74:16) <FormGroup>
    function create_default_slot_13(ctx) {
    	let label;
    	let t;
    	let input;
    	let updating_value;
    	let current;

    	label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_14] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function input_value_binding_2(value) {
    		/*input_value_binding_2*/ ctx[6](value);
    	}

    	let input_props = { type: "text" };

    	if (/*newDataEdit*/ ctx[1]["performance-percents"] !== void 0) {
    		input_props.value = /*newDataEdit*/ ctx[1]["performance-percents"];
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding_2));

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			t = space();
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    			const input_changes = {};

    			if (!updating_value && dirty & /*newDataEdit*/ 2) {
    				updating_value = true;
    				input_changes.value = /*newDataEdit*/ ctx[1]["performance-percents"];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13.name,
    		type: "slot",
    		source: "(74:16) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (79:20) <Label>
    function create_default_slot_12(ctx) {
    	let b;

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Créditos superados";
    			add_location(b, file$2, 78, 27, 2904);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12.name,
    		type: "slot",
    		source: "(79:20) <Label>",
    		ctx
    	});

    	return block;
    }

    // (78:16) <FormGroup>
    function create_default_slot_11(ctx) {
    	let label;
    	let t;
    	let input;
    	let updating_value;
    	let current;

    	label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_12] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function input_value_binding_3(value) {
    		/*input_value_binding_3*/ ctx[7](value);
    	}

    	let input_props = { type: "number" };

    	if (/*newDataEdit*/ ctx[1]["credits-passed"] !== void 0) {
    		input_props.value = /*newDataEdit*/ ctx[1]["credits-passed"];
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding_3));

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			t = space();
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    			const input_changes = {};

    			if (!updating_value && dirty & /*newDataEdit*/ 2) {
    				updating_value = true;
    				input_changes.value = /*newDataEdit*/ ctx[1]["credits-passed"];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(78:16) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (83:20) <Label>
    function create_default_slot_10(ctx) {
    	let b;

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Créditos matriculados";
    			add_location(b, file$2, 82, 27, 3109);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(83:20) <Label>",
    		ctx
    	});

    	return block;
    }

    // (82:16) <FormGroup>
    function create_default_slot_9(ctx) {
    	let label;
    	let t;
    	let input;
    	let updating_value;
    	let current;

    	label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function input_value_binding_4(value) {
    		/*input_value_binding_4*/ ctx[8](value);
    	}

    	let input_props = { type: "number" };

    	if (/*newDataEdit*/ ctx[1]["credits-enrolled"] !== void 0) {
    		input_props.value = /*newDataEdit*/ ctx[1]["credits-enrolled"];
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding_4));

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			t = space();
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    			const input_changes = {};

    			if (!updating_value && dirty & /*newDataEdit*/ 2) {
    				updating_value = true;
    				input_changes.value = /*newDataEdit*/ ctx[1]["credits-enrolled"];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(82:16) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (87:20) <Label>
    function create_default_slot_8(ctx) {
    	let b;

    	const block = {
    		c: function create() {
    			b = element("b");
    			b.textContent = "Centro";
    			add_location(b, file$2, 86, 27, 3319);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(87:20) <Label>",
    		ctx
    	});

    	return block;
    }

    // (86:16) <FormGroup>
    function create_default_slot_7(ctx) {
    	let label;
    	let t;
    	let input;
    	let updating_value;
    	let current;

    	label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function input_value_binding_5(value) {
    		/*input_value_binding_5*/ ctx[9](value);
    	}

    	let input_props = { type: "text" };

    	if (/*newDataEdit*/ ctx[1].center !== void 0) {
    		input_props.value = /*newDataEdit*/ ctx[1].center;
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding_5));

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			t = space();
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    			const input_changes = {};

    			if (!updating_value && dirty & /*newDataEdit*/ 2) {
    				updating_value = true;
    				input_changes.value = /*newDataEdit*/ ctx[1].center;
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(86:16) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (91:20) <Button color="primary" on:click={saveEditedElement}>
    function create_default_slot_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Guardar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(91:20) <Button color=\\\"primary\\\" on:click={saveEditedElement}>",
    		ctx
    	});

    	return block;
    }

    // (92:20) <Button color="secundary" on:click={pop}>
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cerrar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(92:20) <Button color=\\\"secundary\\\" on:click={pop}>",
    		ctx
    	});

    	return block;
    }

    // (90:16) <FormGroup>
    function create_default_slot_4(ctx) {
    	let button0;
    	let t;
    	let button1;
    	let current;

    	button0 = new Button({
    			props: {
    				color: "primary",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*saveEditedElement*/ ctx[2]);

    	button1 = new Button({
    			props: {
    				color: "secundary",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", pop);

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t = space();
    			create_component(button1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(button1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(90:16) <FormGroup>",
    		ctx
    	});

    	return block;
    }

    // (65:12) <Form>
    function create_default_slot_3(ctx) {
    	let formgroup0;
    	let t0;
    	let formgroup1;
    	let t1;
    	let formgroup2;
    	let t2;
    	let formgroup3;
    	let t3;
    	let formgroup4;
    	let t4;
    	let formgroup5;
    	let t5;
    	let formgroup6;
    	let current;

    	formgroup0 = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_17] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	formgroup1 = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_15] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	formgroup2 = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_13] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	formgroup3 = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	formgroup4 = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	formgroup5 = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	formgroup6 = new FormGroup({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(formgroup0.$$.fragment);
    			t0 = space();
    			create_component(formgroup1.$$.fragment);
    			t1 = space();
    			create_component(formgroup2.$$.fragment);
    			t2 = space();
    			create_component(formgroup3.$$.fragment);
    			t3 = space();
    			create_component(formgroup4.$$.fragment);
    			t4 = space();
    			create_component(formgroup5.$$.fragment);
    			t5 = space();
    			create_component(formgroup6.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(formgroup0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(formgroup1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(formgroup2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(formgroup3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(formgroup4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(formgroup5, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(formgroup6, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const formgroup0_changes = {};

    			if (dirty & /*$$scope, newDataEdit*/ 16386) {
    				formgroup0_changes.$$scope = { dirty, ctx };
    			}

    			formgroup0.$set(formgroup0_changes);
    			const formgroup1_changes = {};

    			if (dirty & /*$$scope, newDataEdit*/ 16386) {
    				formgroup1_changes.$$scope = { dirty, ctx };
    			}

    			formgroup1.$set(formgroup1_changes);
    			const formgroup2_changes = {};

    			if (dirty & /*$$scope, newDataEdit*/ 16386) {
    				formgroup2_changes.$$scope = { dirty, ctx };
    			}

    			formgroup2.$set(formgroup2_changes);
    			const formgroup3_changes = {};

    			if (dirty & /*$$scope, newDataEdit*/ 16386) {
    				formgroup3_changes.$$scope = { dirty, ctx };
    			}

    			formgroup3.$set(formgroup3_changes);
    			const formgroup4_changes = {};

    			if (dirty & /*$$scope, newDataEdit*/ 16386) {
    				formgroup4_changes.$$scope = { dirty, ctx };
    			}

    			formgroup4.$set(formgroup4_changes);
    			const formgroup5_changes = {};

    			if (dirty & /*$$scope, newDataEdit*/ 16386) {
    				formgroup5_changes.$$scope = { dirty, ctx };
    			}

    			formgroup5.$set(formgroup5_changes);
    			const formgroup6_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				formgroup6_changes.$$scope = { dirty, ctx };
    			}

    			formgroup6.$set(formgroup6_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(formgroup0.$$.fragment, local);
    			transition_in(formgroup1.$$.fragment, local);
    			transition_in(formgroup2.$$.fragment, local);
    			transition_in(formgroup3.$$.fragment, local);
    			transition_in(formgroup4.$$.fragment, local);
    			transition_in(formgroup5.$$.fragment, local);
    			transition_in(formgroup6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(formgroup0.$$.fragment, local);
    			transition_out(formgroup1.$$.fragment, local);
    			transition_out(formgroup2.$$.fragment, local);
    			transition_out(formgroup3.$$.fragment, local);
    			transition_out(formgroup4.$$.fragment, local);
    			transition_out(formgroup5.$$.fragment, local);
    			transition_out(formgroup6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(formgroup0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(formgroup1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(formgroup2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(formgroup3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(formgroup4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(formgroup5, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(formgroup6, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(65:12) <Form>",
    		ctx
    	});

    	return block;
    }

    // (64:8) <Card class="pl-5 pr-5 pt-2 pb-2">
    function create_default_slot_2$1(ctx) {
    	let form;
    	let current;

    	form = new Form({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(form.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(form, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const form_changes = {};

    			if (dirty & /*$$scope, newDataEdit*/ 16386) {
    				form_changes.$$scope = { dirty, ctx };
    			}

    			form.$set(form_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(form.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(form.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(form, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(64:8) <Card class=\\\"pl-5 pr-5 pt-2 pb-2\\\">",
    		ctx
    	});

    	return block;
    }

    // (63:4) <Row class="justify-content-center">
    function create_default_slot_1$2(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				class: "pl-5 pr-5 pt-2 pb-2",
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};

    			if (dirty & /*$$scope, newDataEdit*/ 16386) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(63:4) <Row class=\\\"justify-content-center\\\">",
    		ctx
    	});

    	return block;
    }

    // (62:0) <Container>
    function create_default_slot$2(ctx) {
    	let row;
    	let current;

    	row = new Row({
    			props: {
    				class: "justify-content-center",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(row.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const row_changes = {};

    			if (dirty & /*$$scope, newDataEdit*/ 16386) {
    				row_changes.$$scope = { dirty, ctx };
    			}

    			row.$set(row_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(62:0) <Container>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let container0;
    	let t;
    	let container1;
    	let current;

    	container0 = new Container({
    			props: {
    				$$slots: { default: [create_default_slot_19] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	container1 = new Container({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(container0.$$.fragment);
    			t = space();
    			create_component(container1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(container0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(container1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const container0_changes = {};

    			if (dirty & /*$$scope, alerts*/ 16385) {
    				container0_changes.$$scope = { dirty, ctx };
    			}

    			container0.$set(container0_changes);
    			const container1_changes = {};

    			if (dirty & /*$$scope, newDataEdit*/ 16386) {
    				container1_changes.$$scope = { dirty, ctx };
    			}

    			container1.$set(container1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(container0.$$.fragment, local);
    			transition_in(container1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(container0.$$.fragment, local);
    			transition_out(container1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(container0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(container1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("EditElement", slots, []);
    	let { params = {} } = $$props; // URL params
    	let alerts = [];
    	let newDataEdit = {};
    	let oldDataURL = params.center + "/" + params.year + "/" + params["field-of-knowledge"];

    	onMount(async () => {
    		const res = await fetch("/api/v2/performances-by-degrees-us/" + oldDataURL);

    		if (res.status === 404) {
    			$$invalidate(0, alerts = [
    				...alerts,
    				{
    					text: "Elemento " + oldDataURL + " no existe",
    					color: "warning"
    				}
    			]);

    			setTimeout(
    				() => {
    					alerts.shift();
    					$$invalidate(0, alerts);
    					window.location.href = "";
    				},
    				2000
    			);
    		} else {
    			$$invalidate(1, newDataEdit = await res.json());
    		}
    	});

    	async function saveEditedElement() {
    		let res = await fetch("/api/v2/performances-by-degrees-us/" + oldDataURL, {
    			"method": "PUT",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify(newDataEdit)
    		});

    		if (res.status === 200) {
    			$$invalidate(0, alerts = [
    				...alerts,
    				{
    					text: "Modificado " + oldDataURL + " correctamente",
    					color: "success"
    				}
    			]);

    			setTimeout(
    				async () => {
    					alerts.shift();
    					$$invalidate(0, alerts);
    					window.location.href = "";
    				},
    				1200
    			);
    		} else if (res.status === 404) {
    			$$invalidate(0, alerts = [
    				...alerts,
    				{
    					text: "Elemento " + oldDataURL + " no existe",
    					color: "warning"
    				}
    			]);

    			setTimeout(
    				async () => {
    					alerts.shift();
    					$$invalidate(0, alerts);
    					window.location.href = "";
    				},
    				1200
    			);
    		} else {
    			$$invalidate(0, alerts = [
    				...alerts,
    				{
    					text: "Error interno al intentar modificar " + oldDataURL,
    					color: "danger"
    				}
    			]);

    			setTimeout(
    				() => {
    					alerts.shift();
    					$$invalidate(0, alerts);
    				},
    				1200
    			);
    		}
    	}

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EditElement> was created with unknown prop '${key}'`);
    	});

    	function input_value_binding(value) {
    		if ($$self.$$.not_equal(newDataEdit["field-of-knowledge"], value)) {
    			newDataEdit["field-of-knowledge"] = value;
    			$$invalidate(1, newDataEdit);
    		}
    	}

    	function input_value_binding_1(value) {
    		if ($$self.$$.not_equal(newDataEdit.year, value)) {
    			newDataEdit.year = value;
    			$$invalidate(1, newDataEdit);
    		}
    	}

    	function input_value_binding_2(value) {
    		if ($$self.$$.not_equal(newDataEdit["performance-percents"], value)) {
    			newDataEdit["performance-percents"] = value;
    			$$invalidate(1, newDataEdit);
    		}
    	}

    	function input_value_binding_3(value) {
    		if ($$self.$$.not_equal(newDataEdit["credits-passed"], value)) {
    			newDataEdit["credits-passed"] = value;
    			$$invalidate(1, newDataEdit);
    		}
    	}

    	function input_value_binding_4(value) {
    		if ($$self.$$.not_equal(newDataEdit["credits-enrolled"], value)) {
    			newDataEdit["credits-enrolled"] = value;
    			$$invalidate(1, newDataEdit);
    		}
    	}

    	function input_value_binding_5(value) {
    		if ($$self.$$.not_equal(newDataEdit.center, value)) {
    			newDataEdit.center = value;
    			$$invalidate(1, newDataEdit);
    		}
    	}

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(3, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		Container,
    		Alert,
    		Row,
    		Form,
    		FormGroup,
    		Label,
    		Input,
    		Button,
    		Card,
    		onMount,
    		pop,
    		params,
    		alerts,
    		newDataEdit,
    		oldDataURL,
    		saveEditedElement
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(3, params = $$props.params);
    		if ("alerts" in $$props) $$invalidate(0, alerts = $$props.alerts);
    		if ("newDataEdit" in $$props) $$invalidate(1, newDataEdit = $$props.newDataEdit);
    		if ("oldDataURL" in $$props) oldDataURL = $$props.oldDataURL;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		alerts,
    		newDataEdit,
    		saveEditedElement,
    		params,
    		input_value_binding,
    		input_value_binding_1,
    		input_value_binding_2,
    		input_value_binding_3,
    		input_value_binding_4,
    		input_value_binding_5
    	];
    }

    class EditElement extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { params: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditElement",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get params() {
    		throw new Error("<EditElement>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<EditElement>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*
     Highcharts JS v9.1.0 (2021-05-03)

     (c) 2009-2021 Torstein Honsi

     License: www.highcharts.com/license
    */

    var highcharts = createCommonjsModule(function (module) {
    (function(W,O){module.exports?(O["default"]=O,module.exports=W.document?O(W):O):(W.Highcharts&&W.Highcharts.error(16,!0),W.Highcharts=O(W));})("undefined"!==typeof window?window:commonjsGlobal,function(W){function O(D,b,e,z){D.hasOwnProperty(b)||(D[b]=z.apply(null,e));}var e={};O(e,"Core/Globals.js",[],function(){var D="undefined"!==typeof W?W:"undefined"!==typeof window?window:{},b;(function(b){b.SVG_NS=
    "http://www.w3.org/2000/svg";b.product="Highcharts";b.version="9.1.0";b.win=D;b.doc=b.win.document;b.svg=b.doc&&b.doc.createElementNS&&!!b.doc.createElementNS(b.SVG_NS,"svg").createSVGRect;b.userAgent=b.win.navigator&&b.win.navigator.userAgent||"";b.isChrome=-1!==b.userAgent.indexOf("Chrome");b.isFirefox=-1!==b.userAgent.indexOf("Firefox");b.isMS=/(edge|msie|trident)/i.test(b.userAgent)&&!b.win.opera;b.isSafari=!b.isChrome&&-1!==b.userAgent.indexOf("Safari");b.isTouchDevice=/(Mobile|Android|Windows Phone)/.test(b.userAgent);
    b.isWebKit=-1!==b.userAgent.indexOf("AppleWebKit");b.deg2rad=2*Math.PI/360;b.hasBidiBug=b.isFirefox&&4>parseInt(b.userAgent.split("Firefox/")[1],10);b.hasTouch=!!b.win.TouchEvent;b.marginNames=["plotTop","marginRight","marginBottom","plotLeft"];b.noop=function(){};b.supportsPassiveEvents=function(){var D=!1;if(!b.isMS){var e=Object.defineProperty({},"passive",{get:function(){D=!0;}});b.win.addEventListener&&b.win.removeEventListener&&(b.win.addEventListener("testPassive",b.noop,e),b.win.removeEventListener("testPassive",
    b.noop,e));}return D}();b.charts=[];b.dateFormats={};b.seriesTypes={};b.symbolSizes={};})(b||(b={}));return b});O(e,"Core/Utilities.js",[e["Core/Globals.js"]],function(D){function b(a,c,h,r){var y=c?"Highcharts error":"Highcharts warning";32===a&&(a=y+": Deprecated member");var d=w(a),M=d?y+" #"+a+": www.highcharts.com/errors/"+a+"/":a.toString();if("undefined"!==typeof r){var t="";d&&(M+="?");n(r,function(p,a){t+="\n - "+a+": "+p;d&&(M+=encodeURI(a)+"="+encodeURI(p));});M+=t;}E(Highcharts,"displayError",
    {chart:h,code:a,message:M,params:r},function(){if(c)throw Error(M);g.console&&-1===b.messages.indexOf(M)&&console.warn(M);});b.messages.push(M);}function e(a,c){var y={};n(a,function(g,h){if(C(a[h],!0)&&!a.nodeType&&c[h])g=e(a[h],c[h]),Object.keys(g).length&&(y[h]=g);else if(C(a[h])||a[h]!==c[h])y[h]=a[h];});return y}function z(a,c){return parseInt(a,c||10)}function H(a){return "string"===typeof a}function G(a){a=Object.prototype.toString.call(a);return "[object Array]"===a||"[object Array Iterator]"===
    a}function C(a,c){return !!a&&"object"===typeof a&&(!c||!G(a))}function B(a){return C(a)&&"number"===typeof a.nodeType}function x(a){var c=a&&a.constructor;return !(!C(a,!0)||B(a)||!c||!c.name||"Object"===c.name)}function w(a){return "number"===typeof a&&!isNaN(a)&&Infinity>a&&-Infinity<a}function v(a){return "undefined"!==typeof a&&null!==a}function f(a,c,g){var y;H(c)?v(g)?a.setAttribute(c,g):a&&a.getAttribute&&((y=a.getAttribute(c))||"class"!==c||(y=a.getAttribute(c+"Name"))):n(c,function(c,y){a.setAttribute(y,
    c);});return y}function d(a,c){var y;a||(a={});for(y in c)a[y]=c[y];return a}function q(){for(var a=arguments,c=a.length,g=0;g<c;g++){var h=a[g];if("undefined"!==typeof h&&null!==h)return h}}function k(a,c){D.isMS&&!D.svg&&c&&"undefined"!==typeof c.opacity&&(c.filter="alpha(opacity="+100*c.opacity+")");d(a.style,c);}function l(a,g,h,r,m){a=c.createElement(a);g&&d(a,g);m&&k(a,{padding:"0",border:"none",margin:"0"});h&&k(a,h);r&&r.appendChild(a);return a}function N(a,c){return parseFloat(a.toPrecision(c||
    14))}function u(a,c,h){var y=D.getStyle||u;if("width"===c)return c=Math.min(a.offsetWidth,a.scrollWidth),h=a.getBoundingClientRect&&a.getBoundingClientRect().width,h<c&&h>=c-1&&(c=Math.floor(h)),Math.max(0,c-(y(a,"padding-left",!0)||0)-(y(a,"padding-right",!0)||0));if("height"===c)return Math.max(0,Math.min(a.offsetHeight,a.scrollHeight)-(y(a,"padding-top",!0)||0)-(y(a,"padding-bottom",!0)||0));g.getComputedStyle||b(27,!0);if(a=g.getComputedStyle(a,void 0)){var r=a.getPropertyValue(c);q(h,"opacity"!==
    c)&&(r=z(r));}return r}function n(a,c,g){for(var h in a)Object.hasOwnProperty.call(a,h)&&c.call(g||a[h],a[h],h,a);}function J(a,c,g){function h(t,p){var c=a.removeEventListener||D.removeEventListenerPolyfill;c&&c.call(a,t,p,!1);}function y(t){var p;if(a.nodeName){if(c){var g={};g[c]=!0;}else g=t;n(g,function(a,c){if(t[c])for(p=t[c].length;p--;)h(c,t[c][p].fn);});}}var r="function"===typeof a&&a.prototype||a;if(Object.hasOwnProperty.call(r,"hcEvents")){var M=r.hcEvents;c?(r=M[c]||[],g?(M[c]=r.filter(function(a){return g!==
    a.fn}),h(c,g)):(y(M),M[c]=[])):(y(M),delete r.hcEvents);}}function E(a,g,h,r){h=h||{};if(c.createEvent&&(a.dispatchEvent||a.fireEvent&&a!==D)){var y=c.createEvent("Events");y.initEvent(g,!0,!0);h=d(y,h);a.dispatchEvent?a.dispatchEvent(h):a.fireEvent(g,h);}else if(a.hcEvents){h.target||d(h,{preventDefault:function(){h.defaultPrevented=!0;},target:a,type:g});y=[];for(var m=a,M=!1;m.hcEvents;)Object.hasOwnProperty.call(m,"hcEvents")&&m.hcEvents[g]&&(y.length&&(M=!0),y.unshift.apply(y,m.hcEvents[g])),m=
    Object.getPrototypeOf(m);M&&y.sort(function(a,p){return a.order-p.order});y.forEach(function(t){!1===t.fn.call(a,h)&&h.preventDefault();});}r&&!h.defaultPrevented&&r.call(a,h);}var m=D.charts,c=D.doc,g=D.win;(b||(b={})).messages=[];var a;Math.easeInOutSine=function(a){return -.5*(Math.cos(Math.PI*a)-1)};var h=Array.prototype.find?function(a,c){return a.find(c)}:function(a,c){var g,h=a.length;for(g=0;g<h;g++)if(c(a[g],g))return a[g]};n({map:"map",each:"forEach",grep:"filter",reduce:"reduce",some:"some"},
    function(a,c){D[c]=function(g){var h;b(32,!1,void 0,(h={},h["Highcharts."+c]="use Array."+a,h));return Array.prototype[a].apply(g,[].slice.call(arguments,1))};});var r,A=function(){var a=Math.random().toString(36).substring(2,9)+"-",c=0;return function(){return "highcharts-"+(r?"":a)+c++}}();g.jQuery&&(g.jQuery.fn.highcharts=function(){var a=[].slice.call(arguments);if(this[0])return a[0]?(new (D[H(a[0])?a.shift():"Chart"])(this[0],a[0],a[1]),this):m[f(this[0],"data-highcharts-chart")]});return {addEvent:function(a,
    c,g,h){void 0===h&&(h={});var r="function"===typeof a&&a.prototype||a;Object.hasOwnProperty.call(r,"hcEvents")||(r.hcEvents={});r=r.hcEvents;D.Point&&a instanceof D.Point&&a.series&&a.series.chart&&(a.series.chart.runTrackerClick=!0);var y=a.addEventListener||D.addEventListenerPolyfill;y&&y.call(a,c,g,D.supportsPassiveEvents?{passive:void 0===h.passive?-1!==c.indexOf("touch"):h.passive,capture:!1}:!1);r[c]||(r[c]=[]);r[c].push({fn:g,order:"number"===typeof h.order?h.order:Infinity});r[c].sort(function(a,
    t){return a.order-t.order});return function(){J(a,c,g);}},arrayMax:function(a){for(var c=a.length,g=a[0];c--;)a[c]>g&&(g=a[c]);return g},arrayMin:function(a){for(var c=a.length,g=a[0];c--;)a[c]<g&&(g=a[c]);return g},attr:f,clamp:function(a,c,g){return a>c?a<g?a:g:c},cleanRecursively:e,clearTimeout:function(a){v(a)&&clearTimeout(a);},correctFloat:N,createElement:l,css:k,defined:v,destroyObjectProperties:function(a,c){n(a,function(g,h){g&&g!==c&&g.destroy&&g.destroy();delete a[h];});},discardElement:function(c){a||
    (a=l("div"));c&&a.appendChild(c);a.innerHTML="";},erase:function(a,c){for(var g=a.length;g--;)if(a[g]===c){a.splice(g,1);break}},error:b,extend:d,extendClass:function(a,c){var g=function(){};g.prototype=new a;d(g.prototype,c);return g},find:h,fireEvent:E,getMagnitude:function(a){return Math.pow(10,Math.floor(Math.log(a)/Math.LN10))},getNestedProperty:function(a,c){for(a=a.split(".");a.length&&v(c);){var h=a.shift();if("undefined"===typeof h||"__proto__"===h)return;c=c[h];if(!v(c)||"function"===typeof c||
    "number"===typeof c.nodeType||c===g)return}return c},getStyle:u,inArray:function(a,c,g){b(32,!1,void 0,{"Highcharts.inArray":"use Array.indexOf"});return c.indexOf(a,g)},isArray:G,isClass:x,isDOMElement:B,isFunction:function(a){return "function"===typeof a},isNumber:w,isObject:C,isString:H,keys:function(a){b(32,!1,void 0,{"Highcharts.keys":"use Object.keys"});return Object.keys(a)},merge:function(){var a,c=arguments,g={},h=function(a,c){"object"!==typeof a&&(a={});n(c,function(t,p){"__proto__"!==p&&
    "constructor"!==p&&(!C(t,!0)||x(t)||B(t)?a[p]=c[p]:a[p]=h(a[p]||{},t));});return a};!0===c[0]&&(g=c[1],c=Array.prototype.slice.call(c,2));var r=c.length;for(a=0;a<r;a++)g=h(g,c[a]);return g},normalizeTickInterval:function(a,c,g,h,r){var d=a;g=q(g,1);var M=a/g;c||(c=r?[1,1.2,1.5,2,2.5,3,4,5,6,8,10]:[1,2,2.5,5,10],!1===h&&(1===g?c=c.filter(function(a){return 0===a%1}):.1>=g&&(c=[1/g])));for(h=0;h<c.length&&!(d=c[h],r&&d*g>=a||!r&&M<=(c[h]+(c[h+1]||c[h]))/2);h++);return d=N(d*g,-Math.round(Math.log(.001)/
    Math.LN10))},objectEach:n,offset:function(a){var h=c.documentElement;a=a.parentElement||a.parentNode?a.getBoundingClientRect():{top:0,left:0,width:0,height:0};return {top:a.top+(g.pageYOffset||h.scrollTop)-(h.clientTop||0),left:a.left+(g.pageXOffset||h.scrollLeft)-(h.clientLeft||0),width:a.width,height:a.height}},pad:function(a,c,g){return Array((c||2)+1-String(a).replace("-","").length).join(g||"0")+a},pick:q,pInt:z,relativeLength:function(a,c,g){return /%$/.test(a)?c*parseFloat(a)/100+(g||0):parseFloat(a)},
    removeEvent:J,splat:function(a){return G(a)?a:[a]},stableSort:function(a,c){var g=a.length,h,r;for(r=0;r<g;r++)a[r].safeI=r;a.sort(function(a,g){h=c(a,g);return 0===h?a.safeI-g.safeI:h});for(r=0;r<g;r++)delete a[r].safeI;},syncTimeout:function(a,c,g){if(0<c)return setTimeout(a,c,g);a.call(0,g);return -1},timeUnits:{millisecond:1,second:1E3,minute:6E4,hour:36E5,day:864E5,week:6048E5,month:24192E5,year:314496E5},uniqueKey:A,useSerialIds:function(a){return r=q(a,r)},wrap:function(a,c,g){var h=a[c];a[c]=
    function(){var a=Array.prototype.slice.call(arguments),c=arguments,r=this;r.proceed=function(){h.apply(r,arguments.length?arguments:c);};a.unshift(h);a=g.apply(this,a);r.proceed=null;return a};}}});O(e,"Core/Color/Color.js",[e["Core/Globals.js"],e["Core/Utilities.js"]],function(D,b){var e=b.isNumber,z=b.merge,H=b.pInt;b=function(){function b(e){this.parsers=[{regex:/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]?(?:\.[0-9]+)?)\s*\)/,parse:function(b){return [H(b[1]),H(b[2]),
    H(b[3]),parseFloat(b[4],10)]}},{regex:/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/,parse:function(b){return [H(b[1]),H(b[2]),H(b[3]),1]}}];this.rgba=[];if(D.Color!==b)return new D.Color(e);if(!(this instanceof b))return new b(e);this.init(e);}b.parse=function(e){return new b(e)};b.prototype.init=function(e){var B,x;if((this.input=e=b.names[e&&e.toLowerCase?e.toLowerCase():""]||e)&&e.stops)this.stops=e.stops.map(function(f){return new b(f[1])});else {if(e&&e.charAt&&"#"===e.charAt()){var w=
    e.length;e=parseInt(e.substr(1),16);7===w?B=[(e&16711680)>>16,(e&65280)>>8,e&255,1]:4===w&&(B=[(e&3840)>>4|(e&3840)>>8,(e&240)>>4|e&240,(e&15)<<4|e&15,1]);}if(!B)for(x=this.parsers.length;x--&&!B;){var v=this.parsers[x];(w=v.regex.exec(e))&&(B=v.parse(w));}}this.rgba=B||[];};b.prototype.get=function(b){var B=this.input,x=this.rgba;if("undefined"!==typeof this.stops){var w=z(B);w.stops=[].concat(w.stops);this.stops.forEach(function(v,f){w.stops[f]=[w.stops[f][0],v.get(b)];});}else w=x&&e(x[0])?"rgb"===
    b||!b&&1===x[3]?"rgb("+x[0]+","+x[1]+","+x[2]+")":"a"===b?x[3]:"rgba("+x.join(",")+")":B;return w};b.prototype.brighten=function(b){var B,x=this.rgba;if(this.stops)this.stops.forEach(function(w){w.brighten(b);});else if(e(b)&&0!==b)for(B=0;3>B;B++)x[B]+=H(255*b),0>x[B]&&(x[B]=0),255<x[B]&&(x[B]=255);return this};b.prototype.setOpacity=function(b){this.rgba[3]=b;return this};b.prototype.tweenTo=function(b,e){var x=this.rgba,w=b.rgba;w.length&&x&&x.length?(b=1!==w[3]||1!==x[3],e=(b?"rgba(":"rgb(")+Math.round(w[0]+
    (x[0]-w[0])*(1-e))+","+Math.round(w[1]+(x[1]-w[1])*(1-e))+","+Math.round(w[2]+(x[2]-w[2])*(1-e))+(b?","+(w[3]+(x[3]-w[3])*(1-e)):"")+")"):e=b.input||"none";return e};b.names={white:"#ffffff",black:"#000000"};return b}();D.Color=b;D.color=b.parse;return b});O(e,"Core/Color/Palette.js",[],function(){return {colors:"#7cb5ec #434348 #90ed7d #f7a35c #8085e9 #f15c80 #e4d354 #2b908f #f45b5b #91e8e1".split(" "),backgroundColor:"#ffffff",neutralColor100:"#000000",neutralColor80:"#333333",neutralColor60:"#666666",
    neutralColor40:"#999999",neutralColor20:"#cccccc",neutralColor10:"#e6e6e6",neutralColor5:"#f2f2f2",neutralColor3:"#f7f7f7",highlightColor100:"#003399",highlightColor80:"#335cad",highlightColor60:"#6685c2",highlightColor20:"#ccd6eb",highlightColor10:"#e6ebf5",positiveColor:"#06b535",negativeColor:"#f21313"}});O(e,"Core/Time.js",[e["Core/Globals.js"],e["Core/Utilities.js"]],function(e,b){var D=e.win,z=b.defined,H=b.error,G=b.extend,C=b.isObject,B=b.merge,x=b.objectEach,w=b.pad,v=b.pick,f=b.splat,d=
    b.timeUnits;b=function(){function q(d){this.options={};this.variableTimezone=this.useUTC=!1;this.Date=D.Date;this.getTimezoneOffset=this.timezoneOffsetFunction();this.update(d);}q.prototype.get=function(d,l){if(this.variableTimezone||this.timezoneOffset){var k=l.getTime(),u=k-this.getTimezoneOffset(l);l.setTime(u);d=l["getUTC"+d]();l.setTime(k);return d}return this.useUTC?l["getUTC"+d]():l["get"+d]()};q.prototype.set=function(d,l,f){if(this.variableTimezone||this.timezoneOffset){if("Milliseconds"===
    d||"Seconds"===d||"Minutes"===d&&0===this.getTimezoneOffset(l)%36E5)return l["setUTC"+d](f);var u=this.getTimezoneOffset(l);u=l.getTime()-u;l.setTime(u);l["setUTC"+d](f);d=this.getTimezoneOffset(l);u=l.getTime()+d;return l.setTime(u)}return this.useUTC?l["setUTC"+d](f):l["set"+d](f)};q.prototype.update=function(d){var l=v(d&&d.useUTC,!0);this.options=d=B(!0,this.options||{},d);this.Date=d.Date||D.Date||Date;this.timezoneOffset=(this.useUTC=l)&&d.timezoneOffset;this.getTimezoneOffset=this.timezoneOffsetFunction();
    this.variableTimezone=l&&!(!d.getTimezoneOffset&&!d.timezone);};q.prototype.makeTime=function(d,l,f,u,n,q){if(this.useUTC){var k=this.Date.UTC.apply(0,arguments);var m=this.getTimezoneOffset(k);k+=m;var c=this.getTimezoneOffset(k);m!==c?k+=c-m:m-36E5!==this.getTimezoneOffset(k-36E5)||e.isSafari||(k-=36E5);}else k=(new this.Date(d,l,v(f,1),v(u,0),v(n,0),v(q,0))).getTime();return k};q.prototype.timezoneOffsetFunction=function(){var d=this,l=this.options,f=l.moment||D.moment;if(!this.useUTC)return function(d){return 6E4*
    (new Date(d.toString())).getTimezoneOffset()};if(l.timezone){if(f)return function(d){return 6E4*-f.tz(d,l.timezone).utcOffset()};H(25);}return this.useUTC&&l.getTimezoneOffset?function(d){return 6E4*l.getTimezoneOffset(d.valueOf())}:function(){return 6E4*(d.timezoneOffset||0)}};q.prototype.dateFormat=function(d,f,q){if(!z(f)||isNaN(f))return e.defaultOptions.lang&&e.defaultOptions.lang.invalidDate||"";d=v(d,"%Y-%m-%d %H:%M:%S");var l=this,n=new this.Date(f),k=this.get("Hours",n),N=this.get("Day",n),
    m=this.get("Date",n),c=this.get("Month",n),g=this.get("FullYear",n),a=e.defaultOptions.lang,h=a&&a.weekdays,r=a&&a.shortWeekdays;n=G({a:r?r[N]:h[N].substr(0,3),A:h[N],d:w(m),e:w(m,2," "),w:N,b:a.shortMonths[c],B:a.months[c],m:w(c+1),o:c+1,y:g.toString().substr(2,2),Y:g,H:w(k),k:k,I:w(k%12||12),l:k%12||12,M:w(this.get("Minutes",n)),p:12>k?"AM":"PM",P:12>k?"am":"pm",S:w(n.getSeconds()),L:w(Math.floor(f%1E3),3)},e.dateFormats);x(n,function(a,c){for(;-1!==d.indexOf("%"+c);)d=d.replace("%"+c,"function"===
    typeof a?a.call(l,f):a);});return q?d.substr(0,1).toUpperCase()+d.substr(1):d};q.prototype.resolveDTLFormat=function(d){return C(d,!0)?d:(d=f(d),{main:d[0],from:d[1],to:d[2]})};q.prototype.getTimeTicks=function(f,l,q,u){var n=this,k=[],N={};var m=new n.Date(l);var c=f.unitRange,g=f.count||1,a;u=v(u,1);if(z(l)){n.set("Milliseconds",m,c>=d.second?0:g*Math.floor(n.get("Milliseconds",m)/g));c>=d.second&&n.set("Seconds",m,c>=d.minute?0:g*Math.floor(n.get("Seconds",m)/g));c>=d.minute&&n.set("Minutes",m,
    c>=d.hour?0:g*Math.floor(n.get("Minutes",m)/g));c>=d.hour&&n.set("Hours",m,c>=d.day?0:g*Math.floor(n.get("Hours",m)/g));c>=d.day&&n.set("Date",m,c>=d.month?1:Math.max(1,g*Math.floor(n.get("Date",m)/g)));if(c>=d.month){n.set("Month",m,c>=d.year?0:g*Math.floor(n.get("Month",m)/g));var h=n.get("FullYear",m);}c>=d.year&&n.set("FullYear",m,h-h%g);c===d.week&&(h=n.get("Day",m),n.set("Date",m,n.get("Date",m)-h+u+(h<u?-7:0)));h=n.get("FullYear",m);u=n.get("Month",m);var r=n.get("Date",m),A=n.get("Hours",m);
    l=m.getTime();!n.variableTimezone&&n.useUTC||!z(q)||(a=q-l>4*d.month||n.getTimezoneOffset(l)!==n.getTimezoneOffset(q));l=m.getTime();for(m=1;l<q;)k.push(l),l=c===d.year?n.makeTime(h+m*g,0):c===d.month?n.makeTime(h,u+m*g):!a||c!==d.day&&c!==d.week?a&&c===d.hour&&1<g?n.makeTime(h,u,r,A+m*g):l+c*g:n.makeTime(h,u,r+m*g*(c===d.day?1:7)),m++;k.push(l);c<=d.hour&&1E4>k.length&&k.forEach(function(a){0===a%18E5&&"000000000"===n.dateFormat("%H%M%S%L",a)&&(N[a]="day");});}k.info=G(f,{higherRanks:N,totalRange:c*
    g});return k};return q}();e.Time=b;return e.Time});O(e,"Core/Options.js",[e["Core/Globals.js"],e["Core/Color/Color.js"],e["Core/Color/Palette.js"],e["Core/Time.js"],e["Core/Utilities.js"]],function(e,b,I,z,H){var D=e.isTouchDevice,C=e.svg;b=b.parse;var B=H.merge;var x={colors:I.colors,symbols:["circle","diamond","square","triangle","triangle-down"],lang:{loading:"Loading...",months:"January February March April May June July August September October November December".split(" "),shortMonths:"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" "),
    weekdays:"Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),decimalPoint:".",numericSymbols:"kMGTPE".split(""),resetZoom:"Reset zoom",resetZoomTitle:"Reset zoom level 1:1",thousandsSep:" "},global:{},time:{Date:void 0,getTimezoneOffset:void 0,timezone:void 0,timezoneOffset:0,useUTC:!0},chart:{panning:{enabled:!1,type:"x"},styledMode:!1,borderRadius:0,colorCount:10,defaultSeriesType:"line",ignoreHiddenSeries:!0,spacing:[10,10,15,10],resetZoomButton:{theme:{zIndex:6},position:{align:"right",
    x:-10,y:10}},zoomBySingleTouch:!1,width:null,height:null,borderColor:I.highlightColor80,backgroundColor:I.backgroundColor,plotBorderColor:I.neutralColor20},title:{text:"Chart title",align:"center",margin:15,widthAdjust:-44},subtitle:{text:"",align:"center",widthAdjust:-44},caption:{margin:15,text:"",align:"left",verticalAlign:"bottom"},plotOptions:{},labels:{style:{position:"absolute",color:I.neutralColor80}},legend:{enabled:!0,align:"center",alignColumns:!0,layout:"horizontal",labelFormatter:function(){return this.name},
    borderColor:I.neutralColor40,borderRadius:0,navigation:{activeColor:I.highlightColor100,inactiveColor:I.neutralColor20},itemStyle:{color:I.neutralColor80,cursor:"pointer",fontSize:"12px",fontWeight:"bold",textOverflow:"ellipsis"},itemHoverStyle:{color:I.neutralColor100},itemHiddenStyle:{color:I.neutralColor20},shadow:!1,itemCheckboxStyle:{position:"absolute",width:"13px",height:"13px"},squareSymbol:!0,symbolPadding:5,verticalAlign:"bottom",x:0,y:0,title:{style:{fontWeight:"bold"}}},loading:{labelStyle:{fontWeight:"bold",
    position:"relative",top:"45%"},style:{position:"absolute",backgroundColor:I.backgroundColor,opacity:.5,textAlign:"center"}},tooltip:{enabled:!0,animation:C,borderRadius:3,dateTimeLabelFormats:{millisecond:"%A, %b %e, %H:%M:%S.%L",second:"%A, %b %e, %H:%M:%S",minute:"%A, %b %e, %H:%M",hour:"%A, %b %e, %H:%M",day:"%A, %b %e, %Y",week:"Week from %A, %b %e, %Y",month:"%B %Y",year:"%Y"},footerFormat:"",padding:8,snap:D?25:10,headerFormat:'<span style="font-size: 10px">{point.key}</span><br/>',pointFormat:'<span style="color:{point.color}">\u25cf</span> {series.name}: <b>{point.y}</b><br/>',
    backgroundColor:b(I.neutralColor3).setOpacity(.85).get(),borderWidth:1,shadow:!0,style:{color:I.neutralColor80,cursor:"default",fontSize:"12px",whiteSpace:"nowrap"}},credits:{enabled:!0,href:"https://www.highcharts.com?credits",position:{align:"right",x:-10,verticalAlign:"bottom",y:-5},style:{cursor:"pointer",color:I.neutralColor40,fontSize:"9px"},text:"Highcharts.com"}};x.chart.styledMode=!1;var w=new z(B(x.global,x.time));return {defaultOptions:x,defaultTime:w,getOptions:function(){return x},
    setOptions:function(v){B(!0,x,v);if(v.time||v.global)e.time?e.time.update(B(x.global,x.time,v.global,v.time)):e.time=w;return x}}});O(e,"Core/Animation/Fx.js",[e["Core/Color/Color.js"],e["Core/Globals.js"],e["Core/Utilities.js"]],function(e,b,I){var D=e.parse,H=b.win,G=I.isNumber,C=I.objectEach;return function(){function b(b,w,v){this.pos=NaN;this.options=w;this.elem=b;this.prop=v;}b.prototype.dSetter=function(){var b=this.paths,w=b&&b[0];b=b&&b[1];var v=this.now||0,f=[];if(1!==v&&w&&b)if(w.length===
    b.length&&1>v)for(var d=0;d<b.length;d++){for(var q=w[d],k=b[d],l=[],N=0;N<k.length;N++){var u=q[N],n=k[N];G(u)&&G(n)&&("A"!==k[0]||4!==N&&5!==N)?l[N]=u+v*(n-u):l[N]=n;}f.push(l);}else f=b;else f=this.toD||[];this.elem.attr("d",f,void 0,!0);};b.prototype.update=function(){var b=this.elem,w=this.prop,v=this.now,f=this.options.step;if(this[w+"Setter"])this[w+"Setter"]();else b.attr?b.element&&b.attr(w,v,null,!0):b.style[w]=v+this.unit;f&&f.call(b,v,this);};b.prototype.run=function(e,w,v){var f=this,d=f.options,
    q=function(d){return q.stopped?!1:f.step(d)},k=H.requestAnimationFrame||function(d){setTimeout(d,13);},l=function(){for(var d=0;d<b.timers.length;d++)b.timers[d]()||b.timers.splice(d--,1);b.timers.length&&k(l);};e!==w||this.elem["forceAnimate:"+this.prop]?(this.startTime=+new Date,this.start=e,this.end=w,this.unit=v,this.now=this.start,this.pos=0,q.elem=this.elem,q.prop=this.prop,q()&&1===b.timers.push(q)&&k(l)):(delete d.curAnim[this.prop],d.complete&&0===Object.keys(d.curAnim).length&&d.complete.call(this.elem));};
    b.prototype.step=function(b){var w=+new Date,v=this.options,f=this.elem,d=v.complete,q=v.duration,k=v.curAnim;if(f.attr&&!f.element)b=!1;else if(b||w>=q+this.startTime){this.now=this.end;this.pos=1;this.update();var l=k[this.prop]=!0;C(k,function(d){!0!==d&&(l=!1);});l&&d&&d.call(f);b=!1;}else this.pos=v.easing((w-this.startTime)/q),this.now=this.start+(this.end-this.start)*this.pos,this.update(),b=!0;return b};b.prototype.initPath=function(b,w,v){function f(d,m){for(;d.length<J;){var c=d[0],g=m[J-
    d.length];g&&"M"===c[0]&&(d[0]="C"===g[0]?["C",c[1],c[2],c[1],c[2],c[1],c[2]]:["L",c[1],c[2]]);d.unshift(c);l&&(c=d.pop(),d.push(d[d.length-1],c));}}function d(d,m){for(;d.length<J;)if(m=d[Math.floor(d.length/N)-1].slice(),"C"===m[0]&&(m[1]=m[5],m[2]=m[6]),l){var c=d[Math.floor(d.length/N)].slice();d.splice(d.length/2,0,m,c);}else d.push(m);}var q=b.startX,k=b.endX;v=v.slice();var l=b.isArea,N=l?2:1;w=w&&w.slice();if(!w)return [v,v];if(q&&k&&k.length){for(b=0;b<q.length;b++)if(q[b]===k[0]){var u=b;break}else if(q[0]===
    k[k.length-q.length+b]){u=b;var n=!0;break}else if(q[q.length-1]===k[k.length-q.length+b]){u=q.length-b;break}"undefined"===typeof u&&(w=[]);}if(w.length&&G(u)){var J=v.length+u*N;n?(f(w,v),d(v,w)):(f(v,w),d(w,v));}return [w,v]};b.prototype.fillSetter=function(){b.prototype.strokeSetter.apply(this,arguments);};b.prototype.strokeSetter=function(){this.elem.attr(this.prop,D(this.start).tweenTo(D(this.end),this.pos),null,!0);};b.timers=[];return b}()});O(e,"Core/Animation/AnimationUtilities.js",[e["Core/Animation/Fx.js"],
    e["Core/Utilities.js"]],function(e,b){function D(d){return x(d)?w({duration:500,defer:0},d):{duration:d?500:0,defer:0}}function z(d,f){for(var q=e.timers.length;q--;)e.timers[q].elem!==d||f&&f!==e.timers[q].prop||(e.timers[q].stopped=!0);}var H=b.defined,G=b.getStyle,C=b.isArray,B=b.isNumber,x=b.isObject,w=b.merge,v=b.objectEach,f=b.pick;return {animate:function(d,f,k){var l,q="",u,n;if(!x(k)){var b=arguments;k={duration:b[2],easing:b[3],complete:b[4]};}B(k.duration)||(k.duration=400);k.easing="function"===
    typeof k.easing?k.easing:Math[k.easing]||Math.easeInOutSine;k.curAnim=w(f);v(f,function(b,m){z(d,m);n=new e(d,k,m);u=void 0;"d"===m&&C(f.d)?(n.paths=n.initPath(d,d.pathArray,f.d),n.toD=f.d,l=0,u=1):d.attr?l=d.attr(m):(l=parseFloat(G(d,m))||0,"opacity"!==m&&(q="px"));u||(u=b);"string"===typeof u&&u.match("px")&&(u=u.replace(/px/g,""));n.run(l,u,q);});},animObject:D,getDeferredAnimation:function(d,f,b){var l=D(f),q=0,u=0;(b?[b]:d.series).forEach(function(d){d=D(d.options.animation);q=f&&H(f.defer)?l.defer:
    Math.max(q,d.duration+d.defer);u=Math.min(l.duration,d.duration);});d.renderer.forExport&&(q=0);return {defer:Math.max(0,q-u),duration:Math.min(q,u)}},setAnimation:function(d,q){q.renderer.globalAnimation=f(d,q.options.chart.animation,!0);},stop:z}});O(e,"Core/Renderer/HTML/AST.js",[e["Core/Globals.js"],e["Core/Utilities.js"]],function(e,b){var D=e.SVG_NS,z=b.attr,H=b.createElement,G=b.discardElement,C=b.error,B=b.isString,x=b.objectEach,w=b.splat;var v=!1;try{v=!!(new DOMParser).parseFromString("",
    "text/html");}catch(f){}return function(){function f(d){this.nodes="string"===typeof d?this.parseMarkup(d):d;}f.filterUserAttributes=function(d){x(d,function(q,b){var l=!0;-1===f.allowedAttributes.indexOf(b)&&(l=!1);-1!==["background","dynsrc","href","lowsrc","src"].indexOf(b)&&(l=B(q)&&f.allowedReferences.some(function(d){return 0===q.indexOf(d)}));l||(C("Highcharts warning: Invalid attribute '"+b+"' in config"),delete d[b]);});return d};f.setElementHTML=function(d,q){d.innerHTML="";q&&(new f(q)).addToDOM(d);};
    f.prototype.addToDOM=function(d){function q(d,l){var b;w(d).forEach(function(d){var n=d.tagName,u=d.textContent?e.doc.createTextNode(d.textContent):void 0;if(n)if("#text"===n)var k=u;else if(-1!==f.allowedTags.indexOf(n)){n=e.doc.createElementNS("svg"===n?D:l.namespaceURI||D,n);var m=d.attributes||{};x(d,function(c,g){"tagName"!==g&&"attributes"!==g&&"children"!==g&&"textContent"!==g&&(m[g]=c);});z(n,f.filterUserAttributes(m));u&&n.appendChild(u);q(d.children||[],n);k=n;}else C("Highcharts warning: Invalid tagName '"+
    n+"' in config");k&&l.appendChild(k);b=k;});return b}return q(this.nodes,d)};f.prototype.parseMarkup=function(d){var f=[];if(v)d=(new DOMParser).parseFromString(d,"text/html");else {var b=H("div");b.innerHTML=d;d={body:b};}var l=function(d,f){var n=d.nodeName.toLowerCase(),b={tagName:n};if("#text"===n){n=d.textContent||"";if(/^[\s]*$/.test(n))return;b.textContent=n;}if(n=d.attributes){var u={};[].forEach.call(n,function(c){u[c.name]=c.value;});b.attributes=u;}if(d.childNodes.length){var m=[];[].forEach.call(d.childNodes,
    function(c){l(c,m);});m.length&&(b.children=m);}f.push(b);};[].forEach.call(d.body.childNodes,function(d){return l(d,f)});b&&G(b);return f};f.allowedTags="a b br button caption circle clipPath code dd defs div dl dt em feComponentTransfer feFuncA feFuncB feFuncG feFuncR feGaussianBlur feOffset feMerge feMergeNode filter h1 h2 h3 h4 h5 h6 hr i img li linearGradient marker ol p path pattern pre rect small span stop strong style sub sup svg table text thead tbody tspan td th tr u ul #text".split(" ");f.allowedAttributes=
    "aria-controls aria-describedby aria-expanded aria-haspopup aria-hidden aria-label aria-labelledby aria-live aria-pressed aria-readonly aria-roledescription aria-selected class clip-path color colspan cx cy d dx dy disabled fill height href id in markerHeight markerWidth offset opacity orient padding paddingLeft patternUnits r refX refY role scope slope src startOffset stdDeviation stroke stroke-linecap stroke-width style result rowspan summary target tabindex text-align textAnchor textLength type valign width x x1 x2 y y1 y2 zIndex".split(" ");
    f.allowedReferences="https:// http:// mailto: / ../ ./ #".split(" ");return f}()});O(e,"Core/FormatUtilities.js",[e["Core/Options.js"],e["Core/Utilities.js"]],function(e,b){function D(b,v,f,d){b=+b||0;v=+v;var q=z.lang,k=(b.toString().split(".")[1]||"").split("e")[0].length,l=b.toString().split("e"),N=v;if(-1===v)v=Math.min(k,20);else if(!C(v))v=2;else if(v&&l[1]&&0>l[1]){var u=v+ +l[1];0<=u?(l[0]=(+l[0]).toExponential(u).split("e")[0],v=u):(l[0]=l[0].split(".")[0]||0,b=20>v?(l[0]*Math.pow(10,l[1])).toFixed(v):
    0,l[1]=0);}u=(Math.abs(l[1]?l[0]:b)+Math.pow(10,-Math.max(v,k)-1)).toFixed(v);k=String(x(u));var n=3<k.length?k.length%3:0;f=B(f,q.decimalPoint);d=B(d,q.thousandsSep);b=(0>b?"-":"")+(n?k.substr(0,n)+d:"");b=0>+l[1]&&!N?"0":b+k.substr(n).replace(/(\d{3})(?=\d)/g,"$1"+d);v&&(b+=f+u.slice(-v));l[1]&&0!==+b&&(b+="e"+l[1]);return b}var z=e.defaultOptions,H=e.defaultTime,G=b.getNestedProperty,C=b.isNumber,B=b.pick,x=b.pInt;return {dateFormat:function(b,v,f){return H.dateFormat(b,v,f)},format:function(b,v,
    f){var d="{",q=!1,k=/f$/,l=/\.([0-9])/,N=z.lang,u=f&&f.time||H;f=f&&f.numberFormatter||D;for(var n=[];b;){var J=b.indexOf(d);if(-1===J)break;var E=b.slice(0,J);if(q){E=E.split(":");d=G(E.shift()||"",v);if(E.length&&"number"===typeof d)if(E=E.join(":"),k.test(E)){var m=parseInt((E.match(l)||["","-1"])[1],10);null!==d&&(d=f(d,m,N.decimalPoint,-1<E.indexOf(",")?N.thousandsSep:""));}else d=u.dateFormat(E,d);n.push(d);}else n.push(E);b=b.slice(J+1);d=(q=!q)?"}":"{";}n.push(b);return n.join("")},numberFormat:D}});
    O(e,"Core/Renderer/SVG/SVGElement.js",[e["Core/Animation/AnimationUtilities.js"],e["Core/Renderer/HTML/AST.js"],e["Core/Color/Color.js"],e["Core/Globals.js"],e["Core/Color/Palette.js"],e["Core/Utilities.js"]],function(e,b,I,z,H,G){var D=e.animate,B=e.animObject,x=e.stop,w=z.deg2rad,v=z.doc,f=z.noop,d=z.svg,q=z.SVG_NS,k=z.win,l=G.addEvent,N=G.attr,u=G.createElement,n=G.css,J=G.defined,E=G.erase,m=G.extend,c=G.fireEvent,g=G.isArray,a=G.isFunction,h=G.isNumber,r=G.isString,A=G.merge,y=G.objectEach,L=
    G.pick,P=G.pInt,R=G.syncTimeout,V=G.uniqueKey;e=function(){function e(){this.element=void 0;this.onEvents={};this.opacity=1;this.renderer=void 0;this.SVG_NS=q;this.symbolCustomAttribs="x y width height r start end innerR anchorX anchorY rounded".split(" ");}e.prototype._defaultGetter=function(a){a=L(this[a+"Value"],this[a],this.element?this.element.getAttribute(a):null,0);/^[\-0-9\.]+$/.test(a)&&(a=parseFloat(a));return a};e.prototype._defaultSetter=function(a,t,p){p.setAttribute(t,a);};e.prototype.add=
    function(a){var t=this.renderer,p=this.element;a&&(this.parentGroup=a);this.parentInverted=a&&a.inverted;"undefined"!==typeof this.textStr&&"text"===this.element.nodeName&&t.buildText(this);this.added=!0;if(!a||a.handleZ||this.zIndex)var c=this.zIndexSetter();c||(a?a.element:t.box).appendChild(p);if(this.onAdd)this.onAdd();return this};e.prototype.addClass=function(a,t){var p=t?"":this.attr("class")||"";a=(a||"").split(/ /g).reduce(function(a,t){-1===p.indexOf(t)&&a.push(t);return a},p?[p]:[]).join(" ");
    a!==p&&this.attr("class",a);return this};e.prototype.afterSetters=function(){this.doTransform&&(this.updateTransform(),this.doTransform=!1);};e.prototype.align=function(a,t,p){var c={},g=this.renderer,d=g.alignedObjects,F,h,K;if(a){if(this.alignOptions=a,this.alignByTranslate=t,!p||r(p))this.alignTo=F=p||"renderer",E(d,this),d.push(this),p=void 0;}else a=this.alignOptions,t=this.alignByTranslate,F=this.alignTo;p=L(p,g[F],"scrollablePlotBox"===F?g.plotBox:void 0,g);F=a.align;var M=a.verticalAlign;g=
    (p.x||0)+(a.x||0);d=(p.y||0)+(a.y||0);"right"===F?h=1:"center"===F&&(h=2);h&&(g+=(p.width-(a.width||0))/h);c[t?"translateX":"x"]=Math.round(g);"bottom"===M?K=1:"middle"===M&&(K=2);K&&(d+=(p.height-(a.height||0))/K);c[t?"translateY":"y"]=Math.round(d);this[this.placed?"animate":"attr"](c);this.placed=!0;this.alignAttr=c;return this};e.prototype.alignSetter=function(a){var t={left:"start",center:"middle",right:"end"};t[a]&&(this.alignValue=a,this.element.setAttribute("text-anchor",t[a]));};e.prototype.animate=
    function(a,t,p){var c=this,g=B(L(t,this.renderer.globalAnimation,!0));t=g.defer;L(v.hidden,v.msHidden,v.webkitHidden,!1)&&(g.duration=0);0!==g.duration?(p&&(g.complete=p),R(function(){c.element&&D(c,a,g);},t)):(this.attr(a,void 0,p),y(a,function(a,p){g.step&&g.step.call(this,a,{prop:p,pos:1,elem:this});},this));return this};e.prototype.applyTextOutline=function(a){var t=this.element;-1!==a.indexOf("contrast")&&(a=a.replace(/contrast/g,this.renderer.getContrast(t.style.fill)));var p=a.split(" ");a=p[p.length-
    1];if((p=p[0])&&"none"!==p&&z.svg){this.fakeTS=!0;this.ySetter=this.xSetter;p=p.replace(/(^[\d\.]+)(.*?)$/g,function(a,p,t){return 2*Number(p)+t});this.removeTextOutline();var c=v.createElementNS(q,"tspan");N(c,{"class":"highcharts-text-outline",fill:a,stroke:a,"stroke-width":p,"stroke-linejoin":"round"});[].forEach.call(t.childNodes,function(a){var p=a.cloneNode(!0);p.removeAttribute&&["fill","stroke","stroke-width","stroke"].forEach(function(a){return p.removeAttribute(a)});c.appendChild(p);});var g=
    v.createElementNS(q,"tspan");g.textContent="\u200b";["x","y"].forEach(function(a){var p=t.getAttribute(a);p&&g.setAttribute(a,p);});c.appendChild(g);t.insertBefore(c,t.firstChild);}};e.prototype.attr=function(a,t,p,c){var g=this.element,d=this.symbolCustomAttribs,h,r=this,K,m;if("string"===typeof a&&"undefined"!==typeof t){var M=a;a={};a[M]=t;}"string"===typeof a?r=(this[a+"Getter"]||this._defaultGetter).call(this,a,g):(y(a,function(p,t){K=!1;c||x(this,t);this.symbolName&&-1!==d.indexOf(t)&&(h||(this.symbolAttr(a),
    h=!0),K=!0);!this.rotation||"x"!==t&&"y"!==t||(this.doTransform=!0);K||(m=this[t+"Setter"]||this._defaultSetter,m.call(this,p,t,g),!this.styledMode&&this.shadows&&/^(width|height|visibility|x|y|d|transform|cx|cy|r)$/.test(t)&&this.updateShadows(t,p,m));},this),this.afterSetters());p&&p.call(this);return r};e.prototype.clip=function(a){return this.attr("clip-path",a?"url("+this.renderer.url+"#"+a.id+")":"none")};e.prototype.crisp=function(a,t){t=t||a.strokeWidth||0;var p=Math.round(t)%2/2;a.x=Math.floor(a.x||
    this.x||0)+p;a.y=Math.floor(a.y||this.y||0)+p;a.width=Math.floor((a.width||this.width||0)-2*p);a.height=Math.floor((a.height||this.height||0)-2*p);J(a.strokeWidth)&&(a.strokeWidth=t);return a};e.prototype.complexColor=function(a,t,p){var d=this.renderer,h,r,F,m,K,M,f,b,l,n,u=[],q;c(this.renderer,"complexColor",{args:arguments},function(){a.radialGradient?r="radialGradient":a.linearGradient&&(r="linearGradient");if(r){F=a[r];K=d.gradients;M=a.stops;l=p.radialReference;g(F)&&(a[r]=F={x1:F[0],y1:F[1],
    x2:F[2],y2:F[3],gradientUnits:"userSpaceOnUse"});"radialGradient"===r&&l&&!J(F.gradientUnits)&&(m=F,F=A(F,d.getRadialAttr(l,m),{gradientUnits:"userSpaceOnUse"}));y(F,function(a,p){"id"!==p&&u.push(p,a);});y(M,function(a){u.push(a);});u=u.join(",");if(K[u])n=K[u].attr("id");else {F.id=n=V();var c=K[u]=d.createElement(r).attr(F).add(d.defs);c.radAttr=m;c.stops=[];M.forEach(function(a){0===a[1].indexOf("rgba")?(h=I.parse(a[1]),f=h.get("rgb"),b=h.get("a")):(f=a[1],b=1);a=d.createElement("stop").attr({offset:a[0],
    "stop-color":f,"stop-opacity":b}).add(c);c.stops.push(a);});}q="url("+d.url+"#"+n+")";p.setAttribute(t,q);p.gradient=u;a.toString=function(){return q};}});};e.prototype.css=function(a){var t=this.styles,p={},c=this.element,g=["textOutline","textOverflow","width"],h="",F=!t;a&&a.color&&(a.fill=a.color);t&&y(a,function(a,c){t&&t[c]!==a&&(p[c]=a,F=!0);});if(F){t&&(a=m(t,p));if(a)if(null===a.width||"auto"===a.width)delete this.textWidth;else if("text"===c.nodeName.toLowerCase()&&a.width)var r=this.textWidth=
    P(a.width);this.styles=a;r&&!d&&this.renderer.forExport&&delete a.width;if(c.namespaceURI===this.SVG_NS){var K=function(a,p){return "-"+p.toLowerCase()};y(a,function(a,p){-1===g.indexOf(p)&&(h+=p.replace(/([A-Z])/g,K)+":"+a+";");});h&&N(c,"style",h);}else n(c,a);this.added&&("text"===this.element.nodeName&&this.renderer.buildText(this),a&&a.textOutline&&this.applyTextOutline(a.textOutline));}return this};e.prototype.dashstyleSetter=function(a){var t=this["stroke-width"];"inherit"===t&&(t=1);if(a=a&&a.toLowerCase()){var p=
    a.replace("shortdashdotdot","3,1,1,1,1,1,").replace("shortdashdot","3,1,1,1").replace("shortdot","1,1,").replace("shortdash","3,1,").replace("longdash","8,3,").replace(/dot/g,"1,3,").replace("dash","4,3,").replace(/,$/,"").split(",");for(a=p.length;a--;)p[a]=""+P(p[a])*L(t,NaN);a=p.join(",").replace(/NaN/g,"none");this.element.setAttribute("stroke-dasharray",a);}};e.prototype.destroy=function(){var a=this,t=a.element||{},p=a.renderer,c=t.ownerSVGElement,g=p.isSVG&&"SPAN"===t.nodeName&&a.parentGroup||
    void 0;t.onclick=t.onmouseout=t.onmouseover=t.onmousemove=t.point=null;x(a);if(a.clipPath&&c){var d=a.clipPath;[].forEach.call(c.querySelectorAll("[clip-path],[CLIP-PATH]"),function(a){-1<a.getAttribute("clip-path").indexOf(d.element.id)&&a.removeAttribute("clip-path");});a.clipPath=d.destroy();}if(a.stops){for(c=0;c<a.stops.length;c++)a.stops[c].destroy();a.stops.length=0;a.stops=void 0;}a.safeRemoveChild(t);for(p.styledMode||a.destroyShadows();g&&g.div&&0===g.div.childNodes.length;)t=g.parentGroup,
    a.safeRemoveChild(g.div),delete g.div,g=t;a.alignTo&&E(p.alignedObjects,a);y(a,function(p,c){a[c]&&a[c].parentGroup===a&&a[c].destroy&&a[c].destroy();delete a[c];});};e.prototype.destroyShadows=function(){(this.shadows||[]).forEach(function(a){this.safeRemoveChild(a);},this);this.shadows=void 0;};e.prototype.destroyTextPath=function(a,c){var p=a.getElementsByTagName("text")[0];if(p){if(p.removeAttribute("dx"),p.removeAttribute("dy"),c.element.setAttribute("id",""),this.textPathWrapper&&p.getElementsByTagName("textPath").length){for(a=
    this.textPathWrapper.element.childNodes;a.length;)p.appendChild(a[0]);p.removeChild(this.textPathWrapper.element);}}else if(a.getAttribute("dx")||a.getAttribute("dy"))a.removeAttribute("dx"),a.removeAttribute("dy");this.textPathWrapper&&(this.textPathWrapper=this.textPathWrapper.destroy());};e.prototype.dSetter=function(a,c,p){g(a)&&("string"===typeof a[0]&&(a=this.renderer.pathToSegments(a)),this.pathArray=a,a=a.reduce(function(a,p,c){return p&&p.join?(c?a+" ":"")+p.join(" "):(p||"").toString()},""));
    /(NaN| {2}|^$)/.test(a)&&(a="M 0 0");this[c]!==a&&(p.setAttribute(c,a),this[c]=a);};e.prototype.fadeOut=function(a){var c=this;c.animate({opacity:0},{duration:L(a,150),complete:function(){c.attr({y:-9999}).hide();}});};e.prototype.fillSetter=function(a,c,p){"string"===typeof a?p.setAttribute(c,a):a&&this.complexColor(a,c,p);};e.prototype.getBBox=function(c,t){var p=this.renderer,g=this.element,d=this.styles,h=this.textStr,F=p.cache,r=p.cacheKeys,K=g.namespaceURI===this.SVG_NS;t=L(t,this.rotation,0);var A=
    p.styledMode?g&&e.prototype.getStyle.call(g,"font-size"):d&&d.fontSize,f;if(J(h)){var b=h.toString();-1===b.indexOf("<")&&(b=b.replace(/[0-9]/g,"0"));b+=["",t,A,this.textWidth,d&&d.textOverflow,d&&d.fontWeight].join();}b&&!c&&(f=F[b]);if(!f){if(K||p.forExport){try{var y=this.fakeTS&&function(a){var p=g.querySelector(".highcharts-text-outline");p&&n(p,{display:a});};a(y)&&y("none");f=g.getBBox?m({},g.getBBox()):{width:g.offsetWidth,height:g.offsetHeight};a(y)&&y("");}catch(Y){}if(!f||0>f.width)f={width:0,
    height:0};}else f=this.htmlGetBBox();p.isSVG&&(c=f.width,p=f.height,K&&(f.height=p={"11px,17":14,"13px,20":16}[d&&d.fontSize+","+Math.round(p)]||p),t&&(d=t*w,f.width=Math.abs(p*Math.sin(d))+Math.abs(c*Math.cos(d)),f.height=Math.abs(p*Math.cos(d))+Math.abs(c*Math.sin(d))));if(b&&0<f.height){for(;250<r.length;)delete F[r.shift()];F[b]||r.push(b);F[b]=f;}}return f};e.prototype.getStyle=function(a){return k.getComputedStyle(this.element||this,"").getPropertyValue(a)};e.prototype.hasClass=function(a){return -1!==
    (""+this.attr("class")).split(" ").indexOf(a)};e.prototype.hide=function(a){a?this.attr({y:-9999}):this.attr({visibility:"hidden"});return this};e.prototype.htmlGetBBox=function(){return {height:0,width:0,x:0,y:0}};e.prototype.init=function(a,t){this.element="span"===t?u(t):v.createElementNS(this.SVG_NS,t);this.renderer=a;c(this,"afterInit");};e.prototype.invert=function(a){this.inverted=a;this.updateTransform();return this};e.prototype.on=function(a,c){var p=this.onEvents;if(p[a])p[a]();p[a]=l(this.element,
    a,c);return this};e.prototype.opacitySetter=function(a,c,p){this.opacity=a=Number(Number(a).toFixed(3));p.setAttribute(c,a);};e.prototype.removeClass=function(a){return this.attr("class",(""+this.attr("class")).replace(r(a)?new RegExp("(^| )"+a+"( |$)"):a," ").replace(/ +/g," ").trim())};e.prototype.removeTextOutline=function(){var a=this.element.querySelector("tspan.highcharts-text-outline");a&&this.safeRemoveChild(a);};e.prototype.safeRemoveChild=function(a){var c=a.parentNode;c&&c.removeChild(a);};
    e.prototype.setRadialReference=function(a){var c=this.element.gradient&&this.renderer.gradients[this.element.gradient];this.element.radialReference=a;c&&c.radAttr&&c.animate(this.renderer.getRadialAttr(a,c.radAttr));return this};e.prototype.setTextPath=function(a,c){var p=this.element,t=this.text?this.text.element:p,g={textAnchor:"text-anchor"},d=!1,F=this.textPathWrapper,r=!F;c=A(!0,{enabled:!0,attributes:{dy:-5,startOffset:"50%",textAnchor:"middle"}},c);var K=b.filterUserAttributes(c.attributes);
    if(a&&c&&c.enabled){F&&null===F.element.parentNode?(r=!0,F=F.destroy()):F&&this.removeTextOutline.call(F.parentGroup);this.options&&this.options.padding&&(K.dx=-this.options.padding);F||(this.textPathWrapper=F=this.renderer.createElement("textPath"),d=!0);var m=F.element;(c=a.element.getAttribute("id"))||a.element.setAttribute("id",c=V());if(r)for(t.setAttribute("y",0),h(K.dx)&&t.setAttribute("x",-K.dx),a=[].slice.call(t.childNodes),r=0;r<a.length;r++){var l=a[r];l.nodeType!==Node.TEXT_NODE&&"tspan"!==
    l.nodeName||m.appendChild(l);}d&&F&&F.add({element:t});m.setAttributeNS("http://www.w3.org/1999/xlink","href",this.renderer.url+"#"+c);J(K.dy)&&(m.parentNode.setAttribute("dy",K.dy),delete K.dy);J(K.dx)&&(m.parentNode.setAttribute("dx",K.dx),delete K.dx);y(K,function(a,p){m.setAttribute(g[p]||p,a);});p.removeAttribute("transform");this.removeTextOutline.call(F);this.text&&!this.renderer.styledMode&&this.attr({fill:"none","stroke-width":0});this.applyTextOutline=this.updateTransform=f;}else F&&(delete this.updateTransform,
    delete this.applyTextOutline,this.destroyTextPath(p,a),this.updateTransform(),this.options&&this.options.rotation&&this.applyTextOutline(this.options.style.textOutline));return this};e.prototype.shadow=function(a,c,p){var t=[],g=this.element,d=this.oldShadowOptions,h={color:H.neutralColor100,offsetX:1,offsetY:1,opacity:.15,width:3},r=!1,K;!0===a?K=h:"object"===typeof a&&(K=m(h,a));K&&(K&&d&&y(K,function(a,p){a!==d[p]&&(r=!0);}),r&&this.destroyShadows(),this.oldShadowOptions=K);if(!K)this.destroyShadows();
    else if(!this.shadows){var A=K.opacity/K.width;var f=this.parentInverted?"translate(-1,-1)":"translate("+K.offsetX+", "+K.offsetY+")";for(h=1;h<=K.width;h++){var b=g.cloneNode(!1);var l=2*K.width+1-2*h;N(b,{stroke:a.color||H.neutralColor100,"stroke-opacity":A*h,"stroke-width":l,transform:f,fill:"none"});b.setAttribute("class",(b.getAttribute("class")||"")+" highcharts-shadow");p&&(N(b,"height",Math.max(N(b,"height")-l,0)),b.cutHeight=l);c?c.element.appendChild(b):g.parentNode&&g.parentNode.insertBefore(b,
    g);t.push(b);}this.shadows=t;}return this};e.prototype.show=function(a){return this.attr({visibility:a?"inherit":"visible"})};e.prototype.strokeSetter=function(a,c,p){this[c]=a;this.stroke&&this["stroke-width"]?(e.prototype.fillSetter.call(this,this.stroke,"stroke",p),p.setAttribute("stroke-width",this["stroke-width"]),this.hasStroke=!0):"stroke-width"===c&&0===a&&this.hasStroke?(p.removeAttribute("stroke"),this.hasStroke=!1):this.renderer.styledMode&&this["stroke-width"]&&(p.setAttribute("stroke-width",
    this["stroke-width"]),this.hasStroke=!0);};e.prototype.strokeWidth=function(){if(!this.renderer.styledMode)return this["stroke-width"]||0;var a=this.getStyle("stroke-width"),c=0;if(a.indexOf("px")===a.length-2)c=P(a);else if(""!==a){var p=v.createElementNS(q,"rect");N(p,{width:a,"stroke-width":0});this.element.parentNode.appendChild(p);c=p.getBBox().width;p.parentNode.removeChild(p);}return c};e.prototype.symbolAttr=function(a){var c=this;"x y r start end width height innerR anchorX anchorY clockwise".split(" ").forEach(function(p){c[p]=
    L(a[p],c[p]);});c.attr({d:c.renderer.symbols[c.symbolName](c.x,c.y,c.width,c.height,c)});};e.prototype.textSetter=function(a){a!==this.textStr&&(delete this.textPxLength,this.textStr=a,this.added&&this.renderer.buildText(this));};e.prototype.titleSetter=function(a){var c=this.element,p=c.getElementsByTagName("title")[0]||v.createElementNS(this.SVG_NS,"title");c.insertBefore?c.insertBefore(p,c.firstChild):c.appendChild(p);p.textContent=String(L(a,"")).replace(/<[^>]*>/g,"").replace(/&lt;/g,"<").replace(/&gt;/g,
    ">");};e.prototype.toFront=function(){var a=this.element;a.parentNode.appendChild(a);return this};e.prototype.translate=function(a,c){return this.attr({translateX:a,translateY:c})};e.prototype.updateShadows=function(a,c,p){var t=this.shadows;if(t)for(var g=t.length;g--;)p.call(t[g],"height"===a?Math.max(c-(t[g].cutHeight||0),0):"d"===a?this.d:c,a,t[g]);};e.prototype.updateTransform=function(){var a=this.scaleX,c=this.scaleY,p=this.inverted,g=this.rotation,d=this.matrix,h=this.element,F=this.translateX||
    0,r=this.translateY||0;p&&(F+=this.width,r+=this.height);F=["translate("+F+","+r+")"];J(d)&&F.push("matrix("+d.join(",")+")");p?F.push("rotate(90) scale(-1,1)"):g&&F.push("rotate("+g+" "+L(this.rotationOriginX,h.getAttribute("x"),0)+" "+L(this.rotationOriginY,h.getAttribute("y")||0)+")");(J(a)||J(c))&&F.push("scale("+L(a,1)+" "+L(c,1)+")");F.length&&h.setAttribute("transform",F.join(" "));};e.prototype.visibilitySetter=function(a,c,p){"inherit"===a?p.removeAttribute(c):this[c]!==a&&p.setAttribute(c,
    a);this[c]=a;};e.prototype.xGetter=function(a){"circle"===this.element.nodeName&&("x"===a?a="cx":"y"===a&&(a="cy"));return this._defaultGetter(a)};e.prototype.zIndexSetter=function(a,c){var p=this.renderer,g=this.parentGroup,t=(g||p).element||p.box,d=this.element;p=t===p.box;var h=!1;var r=this.added;var K;J(a)?(d.setAttribute("data-z-index",a),a=+a,this[c]===a&&(r=!1)):J(this[c])&&d.removeAttribute("data-z-index");this[c]=a;if(r){(a=this.zIndex)&&g&&(g.handleZ=!0);c=t.childNodes;for(K=c.length-1;0<=
    K&&!h;K--){g=c[K];r=g.getAttribute("data-z-index");var m=!J(r);if(g!==d)if(0>a&&m&&!p&&!K)t.insertBefore(d,c[K]),h=!0;else if(P(r)<=a||m&&(!J(a)||0<=a))t.insertBefore(d,c[K+1]||null),h=!0;}h||(t.insertBefore(d,c[p?3:0]||null),h=!0);}return h};return e}();e.prototype["stroke-widthSetter"]=e.prototype.strokeSetter;e.prototype.yGetter=e.prototype.xGetter;e.prototype.matrixSetter=e.prototype.rotationOriginXSetter=e.prototype.rotationOriginYSetter=e.prototype.rotationSetter=e.prototype.scaleXSetter=e.prototype.scaleYSetter=
    e.prototype.translateXSetter=e.prototype.translateYSetter=e.prototype.verticalAlignSetter=function(a,c){this[c]=a;this.doTransform=!0;};return e});O(e,"Core/Renderer/SVG/SVGLabel.js",[e["Core/Renderer/SVG/SVGElement.js"],e["Core/Utilities.js"]],function(e,b){function D(b,f){C(b)?b!==this[f]&&(this[f]=b,this.updateTextPadding()):this[f]=void 0;}var z=this&&this.__extends||function(){var b=function(f,d){b=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(d,b){d.__proto__=b;}||function(d,
    b){for(var f in b)b.hasOwnProperty(f)&&(d[f]=b[f]);};return b(f,d)};return function(f,d){function q(){this.constructor=f;}b(f,d);f.prototype=null===d?Object.create(d):(q.prototype=d.prototype,new q);}}(),H=b.defined,G=b.extend,C=b.isNumber,B=b.merge,x=b.pick,w=b.removeEvent;return function(b){function f(d,q,k,l,e,u,n,v,E,m){var c=b.call(this)||this;c.paddingSetter=D;c.paddingLeftSetter=D;c.paddingRightSetter=D;c.init(d,"g");c.textStr=q;c.x=k;c.y=l;c.anchorX=u;c.anchorY=n;c.baseline=E;c.className=m;"button"!==
    m&&c.addClass("highcharts-label");m&&c.addClass("highcharts-"+m);c.text=d.text("",0,0,v).attr({zIndex:1});if("string"===typeof e){var g=/^url\((.*?)\)$/.test(e);if(c.renderer.symbols[e]||g)c.symbolKey=e;}c.bBox=f.emptyBBox;c.padding=3;c.baselineOffset=0;c.needsBox=d.styledMode||g;c.deferredAttr={};c.alignFactor=0;return c}z(f,b);f.prototype.alignSetter=function(d){d={left:0,center:.5,right:1}[d];d!==this.alignFactor&&(this.alignFactor=d,this.bBox&&C(this.xSetting)&&this.attr({x:this.xSetting}));};f.prototype.anchorXSetter=
    function(d,b){this.anchorX=d;this.boxAttr(b,Math.round(d)-this.getCrispAdjust()-this.xSetting);};f.prototype.anchorYSetter=function(d,b){this.anchorY=d;this.boxAttr(b,d-this.ySetting);};f.prototype.boxAttr=function(d,b){this.box?this.box.attr(d,b):this.deferredAttr[d]=b;};f.prototype.css=function(d){if(d){var b={},k=void 0;d=B(d);f.textProps.forEach(function(f){"undefined"!==typeof d[f]&&(b[f]=d[f],delete d[f]);});this.text.css(b);k="width"in b;"fontSize"in b||"fontWeight"in b?this.updateTextPadding():
    k&&this.updateBoxSize();}return e.prototype.css.call(this,d)};f.prototype.destroy=function(){w(this.element,"mouseenter");w(this.element,"mouseleave");this.text&&this.text.destroy();this.box&&(this.box=this.box.destroy());e.prototype.destroy.call(this);};f.prototype.fillSetter=function(d,b){d&&(this.needsBox=!0);this.fill=d;this.boxAttr(b,d);};f.prototype.getBBox=function(){this.textStr&&0===this.bBox.width&&0===this.bBox.height&&this.updateBoxSize();var d=this.padding,b=x(this.paddingLeft,d);return {width:this.width,
    height:this.height,x:this.bBox.x-b,y:this.bBox.y-d}};f.prototype.getCrispAdjust=function(){return this.renderer.styledMode&&this.box?this.box.strokeWidth()%2/2:(this["stroke-width"]?parseInt(this["stroke-width"],10):0)%2/2};f.prototype.heightSetter=function(d){this.heightSetting=d;};f.prototype.on=function(d,b){var f=this,l=f.text,q=l&&"SPAN"===l.element.tagName?l:void 0;if(q){var u=function(l){("mouseenter"===d||"mouseleave"===d)&&l.relatedTarget instanceof Element&&(f.element.compareDocumentPosition(l.relatedTarget)&
    Node.DOCUMENT_POSITION_CONTAINED_BY||q.element.compareDocumentPosition(l.relatedTarget)&Node.DOCUMENT_POSITION_CONTAINED_BY)||b.call(f.element,l);};q.on(d,u);}e.prototype.on.call(f,d,u||b);return f};f.prototype.onAdd=function(){var d=this.textStr;this.text.add(this);this.attr({text:H(d)?d:"",x:this.x,y:this.y});this.box&&H(this.anchorX)&&this.attr({anchorX:this.anchorX,anchorY:this.anchorY});};f.prototype.rSetter=function(d,b){this.boxAttr(b,d);};f.prototype.shadow=function(d){d&&!this.renderer.styledMode&&
    (this.updateBoxSize(),this.box&&this.box.shadow(d));return this};f.prototype.strokeSetter=function(d,b){this.stroke=d;this.boxAttr(b,d);};f.prototype["stroke-widthSetter"]=function(d,b){d&&(this.needsBox=!0);this["stroke-width"]=d;this.boxAttr(b,d);};f.prototype["text-alignSetter"]=function(d){this.textAlign=d;};f.prototype.textSetter=function(d){"undefined"!==typeof d&&this.text.attr({text:d});this.updateTextPadding();};f.prototype.updateBoxSize=function(){var d=this.text.element.style,b={},e=this.padding,
    l=this.bBox=C(this.widthSetting)&&C(this.heightSetting)&&!this.textAlign||!H(this.text.textStr)?f.emptyBBox:this.text.getBBox();this.width=this.getPaddedWidth();this.height=(this.heightSetting||l.height||0)+2*e;this.baselineOffset=e+Math.min(this.renderer.fontMetrics(d&&d.fontSize,this.text).b,l.height||Infinity);this.needsBox&&(this.box||(d=this.box=this.symbolKey?this.renderer.symbol(this.symbolKey):this.renderer.rect(),d.addClass(("button"===this.className?"":"highcharts-label-box")+(this.className?
    " highcharts-"+this.className+"-box":"")),d.add(this)),d=this.getCrispAdjust(),b.x=d,b.y=(this.baseline?-this.baselineOffset:0)+d,b.width=Math.round(this.width),b.height=Math.round(this.height),this.box.attr(G(b,this.deferredAttr)),this.deferredAttr={});};f.prototype.updateTextPadding=function(){var d=this.text;this.updateBoxSize();var b=this.baseline?0:this.baselineOffset,f=x(this.paddingLeft,this.padding);H(this.widthSetting)&&this.bBox&&("center"===this.textAlign||"right"===this.textAlign)&&(f+=
    {center:.5,right:1}[this.textAlign]*(this.widthSetting-this.bBox.width));if(f!==d.x||b!==d.y)d.attr("x",f),d.hasBoxWidthChanged&&(this.bBox=d.getBBox(!0)),"undefined"!==typeof b&&d.attr("y",b);d.x=f;d.y=b;};f.prototype.widthSetter=function(d){this.widthSetting=C(d)?d:void 0;};f.prototype.getPaddedWidth=function(){var d=this.padding,b=x(this.paddingLeft,d);d=x(this.paddingRight,d);return (this.widthSetting||this.bBox.width||0)+b+d};f.prototype.xSetter=function(d){this.x=d;this.alignFactor&&(d-=this.alignFactor*
    this.getPaddedWidth(),this["forceAnimate:x"]=!0);this.xSetting=Math.round(d);this.attr("translateX",this.xSetting);};f.prototype.ySetter=function(d){this.ySetting=this.y=Math.round(d);this.attr("translateY",this.ySetting);};f.emptyBBox={width:0,height:0,x:0,y:0};f.textProps="color direction fontFamily fontSize fontStyle fontWeight lineHeight textAlign textDecoration textOutline textOverflow width".split(" ");return f}(e)});O(e,"Core/Renderer/SVG/TextBuilder.js",[e["Core/Globals.js"],e["Core/Utilities.js"],
    e["Core/Renderer/HTML/AST.js"]],function(e,b,I){var D=e.doc,H=e.SVG_NS,G=b.attr,C=b.isString,B=b.objectEach,x=b.pick;return function(){function b(b){var f=b.styles;this.renderer=b.renderer;this.svgElement=b;this.width=b.textWidth;this.textLineHeight=f&&f.lineHeight;this.textOutline=f&&f.textOutline;this.ellipsis=!(!f||"ellipsis"!==f.textOverflow);this.noWrap=!(!f||"nowrap"!==f.whiteSpace);this.fontSize=f&&f.fontSize;}b.prototype.buildSVG=function(){var b=this.svgElement,f=b.element,d=b.renderer,e=
    x(b.textStr,"").toString(),k=-1!==e.indexOf("<"),l=f.childNodes,N=l.length;d=this.width&&!b.added&&d.box;var u=/<br.*?>/g;var n=[e,this.ellipsis,this.noWrap,this.textLineHeight,this.textOutline,this.fontSize,this.width].join();if(n!==b.textCache){b.textCache=n;for(delete b.actualWidth;N--;)f.removeChild(l[N]);k||this.ellipsis||this.width||-1!==e.indexOf(" ")&&(!this.noWrap||u.test(e))?""!==e&&(d&&d.appendChild(f),e=new I(e),this.modifyTree(e.nodes),e.addToDOM(b.element),this.modifyDOM(),this.ellipsis&&
    -1!==(f.textContent||"").indexOf("\u2026")&&b.attr("title",this.unescapeEntities(b.textStr||"",["&lt;","&gt;"])),d&&d.removeChild(f)):f.appendChild(D.createTextNode(this.unescapeEntities(e)));C(this.textOutline)&&b.applyTextOutline&&b.applyTextOutline(this.textOutline);}};b.prototype.modifyDOM=function(){var b=this,f=this.svgElement,d=G(f.element,"x");[].forEach.call(f.element.querySelectorAll("tspan.highcharts-br"),function(f){f.nextSibling&&f.previousSibling&&G(f,{dy:b.getLineHeight(f.nextSibling),
    x:d});});var e=this.width||0;if(e){var k=function(l,u){var n=l.textContent||"",k=n.replace(/([^\^])-/g,"$1- ").split(" "),q=!b.noWrap&&(1<k.length||1<f.element.childNodes.length),m=b.getLineHeight(u),c=0,g=f.actualWidth;if(b.ellipsis)n&&b.truncate(l,n,void 0,0,Math.max(0,e-parseInt(b.fontSize||12,10)),function(a,c){return a.substring(0,c)+"\u2026"});else if(q){n=[];for(q=[];u.firstChild&&u.firstChild!==l;)q.push(u.firstChild),u.removeChild(u.firstChild);for(;k.length;)k.length&&!b.noWrap&&0<c&&(n.push(l.textContent||
    ""),l.textContent=k.join(" ").replace(/- /g,"-")),b.truncate(l,void 0,k,0===c?g||0:0,e,function(a,c){return k.slice(0,c).join(" ").replace(/- /g,"-")}),g=f.actualWidth,c++;q.forEach(function(a){u.insertBefore(a,l);});n.forEach(function(a){u.insertBefore(D.createTextNode(a),l);a=D.createElementNS(H,"tspan");a.textContent="\u200b";G(a,{dy:m,x:d});u.insertBefore(a,l);});}},l=function(d){[].slice.call(d.childNodes).forEach(function(b){b.nodeType===Node.TEXT_NODE?k(b,d):(-1!==b.className.baseVal.indexOf("highcharts-br")&&
    (f.actualWidth=0),l(b));});};l(f.element);}};b.prototype.getLineHeight=function(b){var f;b=b.nodeType===Node.TEXT_NODE?b.parentElement:b;this.renderer.styledMode||(f=b&&/(px|em)$/.test(b.style.fontSize)?b.style.fontSize:this.fontSize||this.renderer.style.fontSize||12);return this.textLineHeight?parseInt(this.textLineHeight.toString(),10):this.renderer.fontMetrics(f,b||this.svgElement.element).h};b.prototype.modifyTree=function(b){var f=this,d=function(e,k){var l=e.tagName,q=f.renderer.styledMode,u=e.attributes||
    {};if("b"===l||"strong"===l)q?u["class"]="highcharts-strong":u.style="font-weight:bold;"+(u.style||"");else if("i"===l||"em"===l)q?u["class"]="highcharts-emphasized":u.style="font-style:italic;"+(u.style||"");C(u.style)&&(u.style=u.style.replace(/(;| |^)color([ :])/,"$1fill$2"));"br"===l&&(u["class"]="highcharts-br",e.textContent="\u200b",(k=b[k+1])&&k.textContent&&(k.textContent=k.textContent.replace(/^ +/gm,"")));"#text"!==l&&"a"!==l&&(e.tagName="tspan");e.attributes=u;e.children&&e.children.filter(function(d){return "#text"!==
    d.tagName}).forEach(d);};for(b.forEach(d);b[0]&&"tspan"===b[0].tagName&&!b[0].children;)b.splice(0,1);};b.prototype.truncate=function(b,f,d,e,k,l){var q=this.svgElement,u=q.renderer,n=q.rotation,J=[],E=d?1:0,m=(f||d||"").length,c=m,g,a=function(a,c){c=c||a;var g=b.parentNode;if(g&&"undefined"===typeof J[c])if(g.getSubStringLength)try{J[c]=e+g.getSubStringLength(0,d?c+1:c);}catch(L){}else u.getSpanWidth&&(b.textContent=l(f||d,a),J[c]=e+u.getSpanWidth(q,b));return J[c]};q.rotation=0;var h=a(b.textContent.length);
    if(e+h>k){for(;E<=m;)c=Math.ceil((E+m)/2),d&&(g=l(d,c)),h=a(c,g&&g.length-1),E===m?E=m+1:h>k?m=c-1:E=c;0===m?b.textContent="":f&&m===f.length-1||(b.textContent=g||l(f||d,c));}d&&d.splice(0,c);q.actualWidth=h;q.rotation=n;};b.prototype.unescapeEntities=function(b,f){B(this.renderer.escapes,function(d,e){f&&-1!==f.indexOf(d)||(b=b.toString().replace(new RegExp(d,"g"),e));});return b};return b}()});O(e,"Core/Renderer/SVG/SVGRenderer.js",[e["Core/Color/Color.js"],e["Core/Globals.js"],e["Core/Color/Palette.js"],
    e["Core/Renderer/SVG/SVGElement.js"],e["Core/Renderer/SVG/SVGLabel.js"],e["Core/Renderer/HTML/AST.js"],e["Core/Renderer/SVG/TextBuilder.js"],e["Core/Utilities.js"]],function(e,b,I,z,H,G,C,B){var x=B.addEvent,w=B.attr,v=B.createElement,f=B.css,d=B.defined,q=B.destroyObjectProperties,k=B.extend,l=B.isArray,N=B.isNumber,u=B.isObject,n=B.isString,J=B.merge,E=B.pick,m=B.pInt,c=B.uniqueKey,g=b.charts,a=b.deg2rad,h=b.doc,r=b.isFirefox,A=b.isMS,y=b.isWebKit,L=b.noop,P=b.SVG_NS,R=b.symbolSizes,V=b.win,Q;B=
    function(){function t(a,c,g,t,d,h,r){this.width=this.url=this.style=this.isSVG=this.imgCount=this.height=this.gradients=this.globalAnimation=this.defs=this.chartIndex=this.cacheKeys=this.cache=this.boxWrapper=this.box=this.alignedObjects=void 0;this.init(a,c,g,t,d,h,r);}t.prototype.init=function(a,c,g,t,d,b,K){var p=this.createElement("svg").attr({version:"1.1","class":"highcharts-root"});K||p.css(this.getStyle(t));t=p.element;a.appendChild(t);w(a,"dir","ltr");-1===a.innerHTML.indexOf("xmlns")&&w(t,
    "xmlns",this.SVG_NS);this.isSVG=!0;this.box=t;this.boxWrapper=p;this.alignedObjects=[];this.url=this.getReferenceURL();this.createElement("desc").add().element.appendChild(h.createTextNode("Created with Highcharts 9.1.0"));this.defs=this.createElement("defs").add();this.allowHTML=b;this.forExport=d;this.styledMode=K;this.gradients={};this.cache={};this.cacheKeys=[];this.imgCount=0;this.setSize(c,g,!1);var F;r&&a.getBoundingClientRect&&(c=function(){f(a,{left:0,top:0});F=a.getBoundingClientRect();
    f(a,{left:Math.ceil(F.left)-F.left+"px",top:Math.ceil(F.top)-F.top+"px"});},c(),this.unSubPixelFix=x(V,"resize",c));};t.prototype.definition=function(a){return (new G([a])).addToDOM(this.defs.element)};t.prototype.getReferenceURL=function(){if((r||y)&&h.getElementsByTagName("base").length){if(!d(Q)){var a=c();a=(new G([{tagName:"svg",attributes:{width:8,height:8},children:[{tagName:"defs",children:[{tagName:"clipPath",attributes:{id:a},children:[{tagName:"rect",attributes:{width:4,height:4}}]}]},{tagName:"rect",
    attributes:{id:"hitme",width:8,height:8,"clip-path":"url(#"+a+")",fill:"rgba(0,0,0,0.001)"}}]}])).addToDOM(h.body);f(a,{position:"fixed",top:0,left:0,zIndex:9E5});var g=h.elementFromPoint(6,6);Q="hitme"===(g&&g.id);h.body.removeChild(a);}if(Q)return V.location.href.split("#")[0].replace(/<[^>]*>/g,"").replace(/([\('\)])/g,"\\$1").replace(/ /g,"%20")}return ""};t.prototype.getStyle=function(a){return this.style=k({fontFamily:'"Lucida Grande", "Lucida Sans Unicode", Arial, Helvetica, sans-serif',fontSize:"12px"},
    a)};t.prototype.setStyle=function(a){this.boxWrapper.css(this.getStyle(a));};t.prototype.isHidden=function(){return !this.boxWrapper.getBBox().width};t.prototype.destroy=function(){var a=this.defs;this.box=null;this.boxWrapper=this.boxWrapper.destroy();q(this.gradients||{});this.gradients=null;a&&(this.defs=a.destroy());this.unSubPixelFix&&this.unSubPixelFix();return this.alignedObjects=null};t.prototype.createElement=function(a){var c=new this.Element;c.init(this,a);return c};t.prototype.getRadialAttr=
    function(a,c){return {cx:a[0]-a[2]/2+(c.cx||0)*a[2],cy:a[1]-a[2]/2+(c.cy||0)*a[2],r:(c.r||0)*a[2]}};t.prototype.buildText=function(a){(new C(a)).buildSVG();};t.prototype.getContrast=function(a){a=e.parse(a).rgba;a[0]*=1;a[1]*=1.2;a[2]*=.5;return 459<a[0]+a[1]+a[2]?"#000000":"#FFFFFF"};t.prototype.button=function(a,c,g,t,d,h,r,b,m,f){var p=this.label(a,c,g,m,void 0,void 0,f,void 0,"button"),F=0,K=this.styledMode,y=d?J(d):{};a=y&&y.style||{};y=G.filterUserAttributes(y);p.attr(J({padding:8,r:2},y));if(!K){y=
    J({fill:I.neutralColor3,stroke:I.neutralColor20,"stroke-width":1,style:{color:I.neutralColor80,cursor:"pointer",fontWeight:"normal"}},{style:a},y);var l=y.style;delete y.style;h=J(y,{fill:I.neutralColor10},G.filterUserAttributes(h||{}));var S=h.style;delete h.style;r=J(y,{fill:I.highlightColor10,style:{color:I.neutralColor100,fontWeight:"bold"}},G.filterUserAttributes(r||{}));var u=r.style;delete r.style;b=J(y,{style:{color:I.neutralColor20}},G.filterUserAttributes(b||{}));var n=b.style;delete b.style;}x(p.element,
    A?"mouseover":"mouseenter",function(){3!==F&&p.setState(1);});x(p.element,A?"mouseout":"mouseleave",function(){3!==F&&p.setState(F);});p.setState=function(a){1!==a&&(p.state=F=a);p.removeClass(/highcharts-button-(normal|hover|pressed|disabled)/).addClass("highcharts-button-"+["normal","hover","pressed","disabled"][a||0]);K||p.attr([y,h,r,b][a||0]).css([l,S,u,n][a||0]);};K||p.attr(y).css(k({cursor:"default"},l));return p.on("touchstart",function(a){return a.stopPropagation()}).on("click",function(a){3!==
    F&&t.call(p,a);})};t.prototype.crispLine=function(a,c,g){void 0===g&&(g="round");var p=a[0],t=a[1];p[1]===t[1]&&(p[1]=t[1]=Math[g](p[1])-c%2/2);p[2]===t[2]&&(p[2]=t[2]=Math[g](p[2])+c%2/2);return a};t.prototype.path=function(a){var c=this.styledMode?{}:{fill:"none"};l(a)?c.d=a:u(a)&&k(c,a);return this.createElement("path").attr(c)};t.prototype.circle=function(a,c,g){a=u(a)?a:"undefined"===typeof a?{}:{x:a,y:c,r:g};c=this.createElement("circle");c.xSetter=c.ySetter=function(a,c,p){p.setAttribute("c"+
    c,a);};return c.attr(a)};t.prototype.arc=function(a,c,g,t,d,h){u(a)?(t=a,c=t.y,g=t.r,a=t.x):t={innerR:t,start:d,end:h};a=this.symbol("arc",a,c,g,g,t);a.r=g;return a};t.prototype.rect=function(a,c,g,t,d,h){d=u(a)?a.r:d;var p=this.createElement("rect");a=u(a)?a:"undefined"===typeof a?{}:{x:a,y:c,width:Math.max(g,0),height:Math.max(t,0)};this.styledMode||("undefined"!==typeof h&&(a["stroke-width"]=h,a=p.crisp(a)),a.fill="none");d&&(a.r=d);p.rSetter=function(a,c,g){p.r=a;w(g,{rx:a,ry:a});};p.rGetter=function(){return p.r||
    0};return p.attr(a)};t.prototype.setSize=function(a,c,g){this.width=a;this.height=c;this.boxWrapper.animate({width:a,height:c},{step:function(){this.attr({viewBox:"0 0 "+this.attr("width")+" "+this.attr("height")});},duration:E(g,!0)?void 0:0});this.alignElements();};t.prototype.g=function(a){var c=this.createElement("g");return a?c.attr({"class":"highcharts-"+a}):c};t.prototype.image=function(a,c,g,t,d,h){var p={preserveAspectRatio:"none"},r=function(a,c){a.setAttributeNS?a.setAttributeNS("http://www.w3.org/1999/xlink",
    "href",c):a.setAttribute("hc-svg-href",c);},F=function(c){r(b.element,a);h.call(b,c);};1<arguments.length&&k(p,{x:c,y:g,width:t,height:d});var b=this.createElement("image").attr(p);h?(r(b.element,"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="),p=new V.Image,x(p,"load",F),p.src=a,p.complete&&F({})):r(b.element,a);return b};t.prototype.symbol=function(a,c,t,r,F,b){var p=this,m=/^url\((.*?)\)$/,A=m.test(a),y=!A&&(this.symbols[a]?a:"circle"),l=y&&this.symbols[y],u;if(l){"number"===
    typeof c&&(u=l.call(this.symbols,Math.round(c||0),Math.round(t||0),r||0,F||0,b));var n=this.path(u);p.styledMode||n.attr("fill","none");k(n,{symbolName:y,x:c,y:t,width:r,height:F});b&&k(n,b);}else if(A){var e=a.match(m)[1];n=this.image(e);n.imgwidth=E(R[e]&&R[e].width,b&&b.width);n.imgheight=E(R[e]&&R[e].height,b&&b.height);var S=function(){n.attr({width:n.width,height:n.height});};["width","height"].forEach(function(a){n[a+"Setter"]=function(a,c){var p=this["img"+c];this[c]=a;d(p)&&(b&&"within"===
    b.backgroundSize&&this.width&&this.height&&(p=Math.round(p*Math.min(this.width/this.imgwidth,this.height/this.imgheight))),this.element&&this.element.setAttribute(c,p),this.alignByTranslate||(a=((this[c]||0)-p)/2,this.attr("width"===c?{translateX:a}:{translateY:a})));};});d(c)&&n.attr({x:c,y:t});n.isImg=!0;d(n.imgwidth)&&d(n.imgheight)?S():(n.attr({width:0,height:0}),v("img",{onload:function(){var a=g[p.chartIndex];0===this.width&&(f(this,{position:"absolute",top:"-999em"}),h.body.appendChild(this));
    R[e]={width:this.width,height:this.height};n.imgwidth=this.width;n.imgheight=this.height;n.element&&S();this.parentNode&&this.parentNode.removeChild(this);p.imgCount--;if(!p.imgCount&&a&&!a.hasLoaded)a.onload();},src:e}),this.imgCount++);}return n};t.prototype.clipRect=function(a,g,t,d){var p=c()+"-",h=this.createElement("clipPath").attr({id:p}).add(this.defs);a=this.rect(a,g,t,d,0).add(h);a.id=p;a.clipPath=h;a.count=0;return a};t.prototype.text=function(a,c,g,t){var p={};if(t&&(this.allowHTML||!this.forExport))return this.html(a,
    c,g);p.x=Math.round(c||0);g&&(p.y=Math.round(g));d(a)&&(p.text=a);a=this.createElement("text").attr(p);t||(a.xSetter=function(a,c,p){var g=p.getElementsByTagName("tspan"),t=p.getAttribute(c),d;for(d=0;d<g.length;d++){var h=g[d];h.getAttribute(c)===t&&h.setAttribute(c,a);}p.setAttribute(c,a);});return a};t.prototype.fontMetrics=function(a,c){a=!this.styledMode&&/px/.test(a)||!V.getComputedStyle?a||c&&c.style&&c.style.fontSize||this.style&&this.style.fontSize:c&&z.prototype.getStyle.call(c,"font-size");
    a=/px/.test(a)?m(a):12;c=24>a?a+3:Math.round(1.2*a);return {h:c,b:Math.round(.8*c),f:a}};t.prototype.rotCorr=function(c,g,t){var p=c;g&&t&&(p=Math.max(p*Math.cos(g*a),4));return {x:-c/3*Math.sin(g*a),y:p}};t.prototype.pathToSegments=function(a){for(var c=[],g=[],p={A:8,C:7,H:2,L:3,M:3,Q:5,S:5,T:3,V:2},t=0;t<a.length;t++)n(g[0])&&N(a[t])&&g.length===p[g[0].toUpperCase()]&&a.splice(t,0,g[0].replace("M","L").replace("m","l")),"string"===typeof a[t]&&(g.length&&c.push(g.slice(0)),g.length=0),g.push(a[t]);
    c.push(g.slice(0));return c};t.prototype.label=function(a,c,g,t,d,h,r,b,m){return new H(this,a,c,g,t,d,h,r,b,m)};t.prototype.alignElements=function(){this.alignedObjects.forEach(function(a){return a.align()});};return t}();B.prototype.Element=z;B.prototype.SVG_NS=P;B.prototype.draw=L;B.prototype.escapes={"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"};var M=function(a,c,g,d,h){h=h&&h.r||0;return [["M",a+h,c],["L",a+g-h,c],["C",a+g,c,a+g,c,a+g,c+h],["L",a+g,c+d-h],["C",a+g,c+d,a+g,c+d,a+
    g-h,c+d],["L",a+h,c+d],["C",a,c+d,a,c+d,a,c+d-h],["L",a,c+h],["C",a,c,a,c,a+h,c]]};L=function(a,c,g,d,h){return h&&h.r?M(a,c,g,d,h):[["M",a,c],["L",a+g,c],["L",a+g,c+d],["L",a,c+d],["Z"]]};B.prototype.symbols={circle:function(a,c,g,d){return this.arc(a+g/2,c+d/2,g/2,d/2,{start:.5*Math.PI,end:2.5*Math.PI,open:!1})},rect:L,square:L,triangle:function(a,c,g,d){return [["M",a+g/2,c],["L",a+g,c+d],["L",a,c+d],["Z"]]},"triangle-down":function(a,c,g,d){return [["M",a,c],["L",a+g,c],["L",a+g/2,c+d],["Z"]]},
    diamond:function(a,c,g,d){return [["M",a+g/2,c],["L",a+g,c+d/2],["L",a+g/2,c+d],["L",a,c+d/2],["Z"]]},arc:function(a,c,g,h,r){var t=[];if(r){var p=r.start||0,b=E(r.r,g);g=E(r.r,h||g);var m=(r.end||0)-.001;h=r.innerR;var f=E(r.open,.001>Math.abs((r.end||0)-p-2*Math.PI)),A=Math.cos(p),y=Math.sin(p),l=Math.cos(m),n=Math.sin(m);p=E(r.longArc,.001>m-p-Math.PI?0:1);t.push(["M",a+b*A,c+g*y],["A",b,g,0,p,E(r.clockwise,1),a+b*l,c+g*n]);d(h)&&t.push(f?["M",a+h*l,c+h*n]:["L",a+h*l,c+h*n],["A",h,h,0,p,d(r.clockwise)?
    1-r.clockwise:0,a+h*A,c+h*y]);f||t.push(["Z"]);}return t},callout:function(a,c,g,d,h){var p=Math.min(h&&h.r||0,g,d),t=p+6,r=h&&h.anchorX;h=h&&h.anchorY||0;var b=M(a,c,g,d,{r:p});if(!N(r))return b;a+r>=g?h>c+t&&h<c+d-t?b.splice(3,1,["L",a+g,h-6],["L",a+g+6,h],["L",a+g,h+6],["L",a+g,c+d-p]):b.splice(3,1,["L",a+g,d/2],["L",r,h],["L",a+g,d/2],["L",a+g,c+d-p]):0>=a+r?h>c+t&&h<c+d-t?b.splice(7,1,["L",a,h+6],["L",a-6,h],["L",a,h-6],["L",a,c+p]):b.splice(7,1,["L",a,d/2],["L",r,h],["L",a,d/2],["L",a,c+p]):
    h&&h>d&&r>a+t&&r<a+g-t?b.splice(5,1,["L",r+6,c+d],["L",r,c+d+6],["L",r-6,c+d],["L",a+p,c+d]):h&&0>h&&r>a+t&&r<a+g-t&&b.splice(1,1,["L",r-6,c],["L",r,c-6],["L",r+6,c],["L",g-p,c]);return b}};b.SVGRenderer=B;b.Renderer=b.SVGRenderer;return b.Renderer});O(e,"Core/Renderer/HTML/HTMLElement.js",[e["Core/Globals.js"],e["Core/Renderer/SVG/SVGElement.js"],e["Core/Utilities.js"]],function(e,b,I){var D=e.isFirefox,H=e.isMS,G=e.isWebKit,C=e.win,B=I.css,x=I.defined,w=I.extend,v=I.pick,f=I.pInt;w(b.prototype,
    {htmlCss:function(d){var b="SPAN"===this.element.tagName&&d&&"width"in d,f=v(b&&d.width,void 0);if(b){delete d.width;this.textWidth=f;var l=!0;}d&&"ellipsis"===d.textOverflow&&(d.whiteSpace="nowrap",d.overflow="hidden");this.styles=w(this.styles,d);B(this.element,d);l&&this.htmlUpdateTransform();return this},htmlGetBBox:function(){var d=this.element;return {x:d.offsetLeft,y:d.offsetTop,width:d.offsetWidth,height:d.offsetHeight}},htmlUpdateTransform:function(){if(this.added){var d=this.renderer,b=this.element,
    e=this.translateX||0,l=this.translateY||0,N=this.x||0,u=this.y||0,n=this.textAlign||"left",J={left:0,center:.5,right:1}[n],E=this.styles;E=E&&E.whiteSpace;B(b,{marginLeft:e,marginTop:l});!d.styledMode&&this.shadows&&this.shadows.forEach(function(a){B(a,{marginLeft:e+1,marginTop:l+1});});this.inverted&&[].forEach.call(b.childNodes,function(a){d.invertChild(a,b);});if("SPAN"===b.tagName){var m=this.rotation,c=void 0;c=this.textWidth&&f(this.textWidth);var g=[m,n,b.innerHTML,this.textWidth,this.textAlign].join(),
    a;(a=c!==this.oldTextWidth)&&!(a=c>this.oldTextWidth)&&((a=this.textPxLength)||(B(b,{width:"",whiteSpace:E||"nowrap"}),a=b.offsetWidth),a=a>c);a&&(/[ \-]/.test(b.textContent||b.innerText)||"ellipsis"===b.style.textOverflow)?(B(b,{width:c+"px",display:"block",whiteSpace:E||"normal"}),this.oldTextWidth=c,this.hasBoxWidthChanged=!0):this.hasBoxWidthChanged=!1;g!==this.cTT&&(c=d.fontMetrics(b.style.fontSize,b).b,!x(m)||m===(this.oldRotation||0)&&n===this.oldAlign||this.setSpanRotation(m,J,c),this.getSpanCorrection(!x(m)&&
    this.textPxLength||b.offsetWidth,c,J,m,n));B(b,{left:N+(this.xCorr||0)+"px",top:u+(this.yCorr||0)+"px"});this.cTT=g;this.oldRotation=m;this.oldAlign=n;}}else this.alignOnAdd=!0;},setSpanRotation:function(d,b,f){var l={},e=H&&!/Edge/.test(C.navigator.userAgent)?"-ms-transform":G?"-webkit-transform":D?"MozTransform":C.opera?"-o-transform":void 0;e&&(l[e]=l.transform="rotate("+d+"deg)",l[e+(D?"Origin":"-origin")]=l.transformOrigin=100*b+"% "+f+"px",B(this.element,l));},getSpanCorrection:function(d,b,f){this.xCorr=
    -d*f;this.yCorr=-b;}});return b});O(e,"Core/Renderer/HTML/HTMLRenderer.js",[e["Core/Renderer/HTML/AST.js"],e["Core/Renderer/SVG/SVGElement.js"],e["Core/Renderer/SVG/SVGRenderer.js"],e["Core/Utilities.js"]],function(e,b,I,z){var D=z.attr,G=z.createElement,C=z.extend,B=z.pick;C(I.prototype,{html:function(x,w,v){var f=this.createElement("span"),d=f.element,q=f.renderer,k=q.isSVG,l=function(d,f){["opacity","visibility"].forEach(function(l){d[l+"Setter"]=function(n,e,m){var c=d.div?d.div.style:f;b.prototype[l+
    "Setter"].call(this,n,e,m);c&&(c[e]=n);};});d.addedSetters=!0;};f.textSetter=function(d){d!==this.textStr&&(delete this.bBox,delete this.oldTextWidth,e.setElementHTML(this.element,B(d,"")),this.textStr=d,f.doTransform=!0);};k&&l(f,f.element.style);f.xSetter=f.ySetter=f.alignSetter=f.rotationSetter=function(d,b){"align"===b?f.alignValue=f.textAlign=d:f[b]=d;f.doTransform=!0;};f.afterSetters=function(){this.doTransform&&(this.htmlUpdateTransform(),this.doTransform=!1);};f.attr({text:x,x:Math.round(w),y:Math.round(v)}).css({position:"absolute"});
    q.styledMode||f.css({fontFamily:this.style.fontFamily,fontSize:this.style.fontSize});d.style.whiteSpace="nowrap";f.css=f.htmlCss;k&&(f.add=function(b){var e=q.box.parentNode,n=[];if(this.parentGroup=b){var k=b.div;if(!k){for(;b;)n.push(b),b=b.parentGroup;n.reverse().forEach(function(d){function b(c,g){d[g]=c;"translateX"===g?a.left=c+"px":a.top=c+"px";d.doTransform=!0;}var c=D(d.element,"class"),g=d.styles||{};k=d.div=d.div||G("div",c?{className:c}:void 0,{position:"absolute",left:(d.translateX||0)+
    "px",top:(d.translateY||0)+"px",display:d.display,opacity:d.opacity,cursor:g.cursor,pointerEvents:g.pointerEvents},k||e);var a=k.style;C(d,{classSetter:function(a){return function(c){this.element.setAttribute("class",c);a.className=c;}}(k),on:function(){n[0].div&&f.on.apply({element:n[0].div,onEvents:f.onEvents},arguments);return d},translateXSetter:b,translateYSetter:b});d.addedSetters||l(d);});}}else k=e;k.appendChild(d);f.added=!0;f.alignOnAdd&&f.htmlUpdateTransform();return f});return f}});return I});
    O(e,"Core/Axis/Tick.js",[e["Core/FormatUtilities.js"],e["Core/Globals.js"],e["Core/Utilities.js"]],function(e,b,I){var D=b.deg2rad,H=I.clamp,G=I.correctFloat,C=I.defined,B=I.destroyObjectProperties,x=I.extend,w=I.fireEvent,v=I.isNumber,f=I.merge,d=I.objectEach,q=I.pick;I=function(){function b(d,b,f,e,k){this.isNewLabel=this.isNew=!0;this.axis=d;this.pos=b;this.type=f||"";this.parameters=k||{};this.tickmarkOffset=this.parameters.tickmarkOffset;this.options=this.parameters.options;w(this,"init");
    f||e||this.addLabel();}b.prototype.addLabel=function(){var d=this,b=d.axis,f=b.options,n=b.chart,k=b.categories,E=b.logarithmic,m=b.names,c=d.pos,g=q(d.options&&d.options.labels,f.labels),a=b.tickPositions,h=c===a[0],r=c===a[a.length-1],A=d.label,y=(!g.step||1===g.step)&&1===b.tickInterval;a=a.info;var L,P;k=this.parameters.category||(k?q(k[c],m[c],c):c);E&&v(k)&&(k=G(E.lin2log(k)));if(b.dateTime&&a){var R=n.time.resolveDTLFormat(f.dateTimeLabelFormats[!f.grid&&a.higherRanks[c]||a.unitName]);var V=
    R.main;}d.isFirst=h;d.isLast=r;var Q={axis:b,chart:n,dateTimeLabelFormat:V,isFirst:h,isLast:r,pos:c,tick:d,tickPositionInfo:a,value:k};w(this,"labelFormat",Q);var M=function(a){return g.formatter?g.formatter.call(a,a):g.format?(a.text=b.defaultLabelFormatter.call(a),e.format(g.format,a,n)):b.defaultLabelFormatter.call(a,a)};f=M.call(Q,Q);if(P=R&&R.list)d.shortenLabel=function(){for(L=0;L<P.length;L++)if(x(Q,{dateTimeLabelFormat:P[L]}),A.attr({text:M.call(Q,Q)}),A.getBBox().width<b.getSlotWidth(d)-
    2*g.padding)return;A.attr({text:""});};y&&b._addedPlotLB&&d.moveLabel(f,g);C(A)||d.movedLabel?A&&A.textStr!==f&&!y&&(!A.textWidth||g.style.width||A.styles.width||A.css({width:null}),A.attr({text:f}),A.textPxLength=A.getBBox().width):(d.label=A=d.createLabel({x:0,y:0},f,g),d.rotation=0);};b.prototype.createLabel=function(d,b,e){var n=this.axis,l=n.chart;if(d=C(b)&&e.enabled?l.renderer.text(b,d.x,d.y,e.useHTML).add(n.labelGroup):null)l.styledMode||d.css(f(e.style)),d.textPxLength=d.getBBox().width;return d};
    b.prototype.destroy=function(){B(this,this.axis);};b.prototype.getPosition=function(d,b,f,e){var n=this.axis,l=n.chart,m=e&&l.oldChartHeight||l.chartHeight;d={x:d?G(n.translate(b+f,null,null,e)+n.transB):n.left+n.offset+(n.opposite?(e&&l.oldChartWidth||l.chartWidth)-n.right-n.left:0),y:d?m-n.bottom+n.offset-(n.opposite?n.height:0):G(m-n.translate(b+f,null,null,e)-n.transB)};d.y=H(d.y,-1E5,1E5);w(this,"afterGetPosition",{pos:d});return d};b.prototype.getLabelPosition=function(d,b,f,e,k,q,m,c){var g=
    this.axis,a=g.transA,h=g.isLinked&&g.linkedParent?g.linkedParent.reversed:g.reversed,r=g.staggerLines,A=g.tickRotCorr||{x:0,y:0},y=k.y,n=e||g.reserveSpaceDefault?0:-g.labelOffset*("center"===g.labelAlign?.5:1),l={};C(y)||(y=0===g.side?f.rotation?-8:-f.getBBox().height:2===g.side?A.y+8:Math.cos(f.rotation*D)*(A.y-f.getBBox(!1,0).height/2));d=d+k.x+n+A.x-(q&&e?q*a*(h?-1:1):0);b=b+y-(q&&!e?q*a*(h?1:-1):0);r&&(f=m/(c||1)%r,g.opposite&&(f=r-f-1),b+=g.labelOffset/r*f);l.x=d;l.y=Math.round(b);w(this,"afterGetLabelPosition",
    {pos:l,tickmarkOffset:q,index:m});return l};b.prototype.getLabelSize=function(){return this.label?this.label.getBBox()[this.axis.horiz?"height":"width"]:0};b.prototype.getMarkPath=function(d,b,f,e,k,q){return q.crispLine([["M",d,b],["L",d+(k?0:-f),b+(k?f:0)]],e)};b.prototype.handleOverflow=function(d){var b=this.axis,f=b.options.labels,e=d.x,l=b.chart.chartWidth,k=b.chart.spacing,m=q(b.labelLeft,Math.min(b.pos,k[3]));k=q(b.labelRight,Math.max(b.isRadial?0:b.pos+b.len,l-k[1]));var c=this.label,g=this.rotation,
    a={left:0,center:.5,right:1}[b.labelAlign||c.attr("align")],h=c.getBBox().width,r=b.getSlotWidth(this),A=r,y=1,L,P={};if(g||"justify"!==f.overflow)0>g&&e-a*h<m?L=Math.round(e/Math.cos(g*D)-m):0<g&&e+a*h>k&&(L=Math.round((l-e)/Math.cos(g*D)));else if(l=e+(1-a)*h,e-a*h<m?A=d.x+A*(1-a)-m:l>k&&(A=k-d.x+A*a,y=-1),A=Math.min(r,A),A<r&&"center"===b.labelAlign&&(d.x+=y*(r-A-a*(r-Math.min(h,A)))),h>A||b.autoRotation&&(c.styles||{}).width)L=A;L&&(this.shortenLabel?this.shortenLabel():(P.width=Math.floor(L)+
    "px",(f.style||{}).textOverflow||(P.textOverflow="ellipsis"),c.css(P)));};b.prototype.moveLabel=function(b,f){var e=this,n=e.label,l=!1,k=e.axis,m=k.reversed;n&&n.textStr===b?(e.movedLabel=n,l=!0,delete e.label):d(k.ticks,function(c){l||c.isNew||c===e||!c.label||c.label.textStr!==b||(e.movedLabel=c.label,l=!0,c.labelPos=e.movedLabel.xy,delete c.label);});if(!l&&(e.labelPos||n)){var c=e.labelPos||n.xy;n=k.horiz?m?0:k.width+k.left:c.x;k=k.horiz?c.y:m?k.width+k.left:0;e.movedLabel=e.createLabel({x:n,y:k},
    b,f);e.movedLabel&&e.movedLabel.attr({opacity:0});}};b.prototype.render=function(d,b,f){var e=this.axis,l=e.horiz,k=this.pos,m=q(this.tickmarkOffset,e.tickmarkOffset);k=this.getPosition(l,k,m,b);m=k.x;var c=k.y;e=l&&m===e.pos+e.len||!l&&c===e.pos?-1:1;l=q(f,this.label&&this.label.newOpacity,1);f=q(f,1);this.isActive=!0;this.renderGridLine(b,f,e);this.renderMark(k,f,e);this.renderLabel(k,b,l,d);this.isNew=!1;w(this,"afterRender");};b.prototype.renderGridLine=function(d,b,f){var e=this.axis,l=e.options,
    k=this.gridLine,m={},c=this.pos,g=this.type,a=q(this.tickmarkOffset,e.tickmarkOffset),h=e.chart.renderer,r=l.gridLineWidth,A=l.gridLineColor,y=l.gridLineDashStyle;"minor"===this.type&&(r=l.minorGridLineWidth,A=l.minorGridLineColor,y=l.minorGridLineDashStyle);k||(e.chart.styledMode||(m.stroke=A,m["stroke-width"]=r||0,m.dashstyle=y),g||(m.zIndex=1),d&&(b=0),this.gridLine=k=h.path().attr(m).addClass("highcharts-"+(g?g+"-":"")+"grid-line").add(e.gridGroup));if(k&&(f=e.getPlotLinePath({value:c+a,lineWidth:k.strokeWidth()*
    f,force:"pass",old:d})))k[d||this.isNew?"attr":"animate"]({d:f,opacity:b});};b.prototype.renderMark=function(d,b,f){var e=this.axis,l=e.options,k=e.chart.renderer,m=this.type,c=e.tickSize(m?m+"Tick":"tick"),g=this.mark,a=!g,h=d.x;d=d.y;var r=q(l["minor"!==m?"tickWidth":"minorTickWidth"],!m&&e.isXAxis?1:0);l=l["minor"!==m?"tickColor":"minorTickColor"];c&&(e.opposite&&(c[0]=-c[0]),a&&(this.mark=g=k.path().addClass("highcharts-"+(m?m+"-":"")+"tick").add(e.axisGroup),e.chart.styledMode||g.attr({stroke:l,
    "stroke-width":r})),g[a?"attr":"animate"]({d:this.getMarkPath(h,d,c[0],g.strokeWidth()*f,e.horiz,k),opacity:b}));};b.prototype.renderLabel=function(d,b,f,e){var l=this.axis,n=l.horiz,m=l.options,c=this.label,g=m.labels,a=g.step;l=q(this.tickmarkOffset,l.tickmarkOffset);var h=!0,r=d.x;d=d.y;c&&v(r)&&(c.xy=d=this.getLabelPosition(r,d,c,n,g,l,e,a),this.isFirst&&!this.isLast&&!m.showFirstLabel||this.isLast&&!this.isFirst&&!m.showLastLabel?h=!1:!n||g.step||g.rotation||b||0===f||this.handleOverflow(d),a&&
    e%a&&(h=!1),h&&v(d.y)?(d.opacity=f,c[this.isNewLabel?"attr":"animate"](d),this.isNewLabel=!1):(c.attr("y",-9999),this.isNewLabel=!0));};b.prototype.replaceMovedLabel=function(){var d=this.label,b=this.axis,f=b.reversed;if(d&&!this.isNew){var e=b.horiz?f?b.left:b.width+b.left:d.xy.x;f=b.horiz?d.xy.y:f?b.width+b.top:b.top;d.animate({x:e,y:f,opacity:0},void 0,d.destroy);delete this.label;}b.isDirty=!0;this.label=this.movedLabel;delete this.movedLabel;};return b}();b.Tick=I;return b.Tick});O(e,"Core/Axis/Axis.js",
    [e["Core/Animation/AnimationUtilities.js"],e["Core/Color/Color.js"],e["Core/Globals.js"],e["Core/Color/Palette.js"],e["Core/Options.js"],e["Core/Axis/Tick.js"],e["Core/Utilities.js"]],function(e,b,I,z,H,G,C){var B=e.animObject,x=H.defaultOptions,w=C.addEvent,v=C.arrayMax,f=C.arrayMin,d=C.clamp,q=C.correctFloat,k=C.defined,l=C.destroyObjectProperties,N=C.erase,u=C.error,n=C.extend,J=C.fireEvent,E=C.getMagnitude,m=C.isArray,c=C.isFunction,g=C.isNumber,a=C.isString,h=C.merge,r=C.normalizeTickInterval,
    A=C.objectEach,y=C.pick,L=C.relativeLength,P=C.removeEvent,R=C.splat,V=C.syncTimeout;var Q=I.deg2rad;e=function(){function e(a,c){this.zoomEnabled=this.width=this.visible=this.userOptions=this.translationSlope=this.transB=this.transA=this.top=this.ticks=this.tickRotCorr=this.tickPositions=this.tickmarkOffset=this.tickInterval=this.tickAmount=this.side=this.series=this.right=this.positiveValuesOnly=this.pos=this.pointRangePadding=this.pointRange=this.plotLinesAndBandsGroups=this.plotLinesAndBands=
    this.paddedTicks=this.overlap=this.options=this.offset=this.names=this.minPixelPadding=this.minorTicks=this.minorTickInterval=this.min=this.maxLabelLength=this.max=this.len=this.left=this.labelFormatter=this.labelEdge=this.isLinked=this.height=this.hasVisibleSeries=this.hasNames=this.coll=this.closestPointRange=this.chart=this.categories=this.bottom=this.alternateBands=void 0;this.init(a,c);}e.prototype.init=function(a,d){var b=d.isX,h=this;h.chart=a;h.horiz=a.inverted&&!h.isZAxis?!b:b;h.isXAxis=b;
    h.coll=h.coll||(b?"xAxis":"yAxis");J(this,"init",{userOptions:d});h.opposite=y(d.opposite,h.opposite);h.side=y(d.side,h.side,h.horiz?h.opposite?0:2:h.opposite?1:3);h.setOptions(d);var p=this.options,t=p.labels,r=p.type;h.userOptions=d;h.minPixelPadding=0;h.reversed=y(p.reversed,h.reversed);h.visible=p.visible;h.zoomEnabled=p.zoomEnabled;h.hasNames="category"===r||!0===p.categories;h.categories=p.categories||h.hasNames;h.names||(h.names=[],h.names.keys={});h.plotLinesAndBandsGroups={};h.positiveValuesOnly=
    !!h.logarithmic;h.isLinked=k(p.linkedTo);h.ticks={};h.labelEdge=[];h.minorTicks={};h.plotLinesAndBands=[];h.alternateBands={};h.len=0;h.minRange=h.userMinRange=p.minRange||p.maxZoom;h.range=p.range;h.offset=p.offset||0;h.max=null;h.min=null;d=y(p.crosshair,R(a.options.tooltip.crosshairs)[b?0:1]);h.crosshair=!0===d?{}:d;d=h.options.events;-1===a.axes.indexOf(h)&&(b?a.axes.splice(a.xAxis.length,0,h):a.axes.push(h),a[h.coll].push(h));h.series=h.series||[];a.inverted&&!h.isZAxis&&b&&"undefined"===typeof h.reversed&&
    (h.reversed=!0);h.labelRotation=g(t.rotation)?t.rotation:void 0;A(d,function(a,d){c(a)&&w(h,d,a);});J(this,"afterInit");};e.prototype.setOptions=function(a){this.options=h(e.defaultOptions,"yAxis"===this.coll&&e.defaultYAxisOptions,[e.defaultTopAxisOptions,e.defaultRightAxisOptions,e.defaultBottomAxisOptions,e.defaultLeftAxisOptions][this.side],h(x[this.coll],a));J(this,"afterSetOptions",{userOptions:a});};e.prototype.defaultLabelFormatter=function(){var a=this.axis,c=g(this.value)?this.value:NaN,d=
    a.chart.time,h=this.dateTimeLabelFormat,b=x.lang,r=b.numericSymbols;b=b.numericSymbolMagnitude||1E3;var e=r&&r.length,f=a.logarithmic?Math.abs(c):a.tickInterval,m=this.chart.numberFormatter;if(a.categories)var A=""+this.value;else if(h)A=d.dateFormat(h,c);else if(e&&1E3<=f)for(;e--&&"undefined"===typeof A;)a=Math.pow(b,e+1),f>=a&&0===10*c%a&&null!==r[e]&&0!==c&&(A=m(c/a,-1)+r[e]);"undefined"===typeof A&&(A=1E4<=Math.abs(c)?m(c,-1):m(c,-1,void 0,""));return A};e.prototype.getSeriesExtremes=function(){var a=
    this,c=a.chart,d;J(this,"getSeriesExtremes",null,function(){a.hasVisibleSeries=!1;a.dataMin=a.dataMax=a.threshold=null;a.softThreshold=!a.isXAxis;a.stacking&&a.stacking.buildStacks();a.series.forEach(function(h){if(h.visible||!c.options.chart.ignoreHiddenSeries){var b=h.options,p=b.threshold;a.hasVisibleSeries=!0;a.positiveValuesOnly&&0>=p&&(p=null);if(a.isXAxis){if(b=h.xData,b.length){b=a.logarithmic?b.filter(a.validatePositiveValue):b;d=h.getXExtremes(b);var t=d.min;var r=d.max;g(t)||t instanceof
    Date||(b=b.filter(g),d=h.getXExtremes(b),t=d.min,r=d.max);b.length&&(a.dataMin=Math.min(y(a.dataMin,t),t),a.dataMax=Math.max(y(a.dataMax,r),r));}}else if(h=h.applyExtremes(),g(h.dataMin)&&(t=h.dataMin,a.dataMin=Math.min(y(a.dataMin,t),t)),g(h.dataMax)&&(r=h.dataMax,a.dataMax=Math.max(y(a.dataMax,r),r)),k(p)&&(a.threshold=p),!b.softThreshold||a.positiveValuesOnly)a.softThreshold=!1;}});});J(this,"afterGetSeriesExtremes");};e.prototype.translate=function(a,c,d,h,b,r){var p=this.linkedParent||this,t=1,e=
    0,f=h&&p.old?p.old.transA:p.transA;h=h&&p.old?p.old.min:p.min;var F=p.minPixelPadding;b=(p.isOrdinal||p.brokenAxis&&p.brokenAxis.hasBreaks||p.logarithmic&&b)&&p.lin2val;f||(f=p.transA);d&&(t*=-1,e=p.len);p.reversed&&(t*=-1,e-=t*(p.sector||p.len));c?(a=(a*t+e-F)/f+h,b&&(a=p.lin2val(a))):(b&&(a=p.val2lin(a)),a=g(h)?t*(a-h)*f+e+t*F+(g(r)?f*r:0):void 0);return a};e.prototype.toPixels=function(a,c){return this.translate(a,!1,!this.horiz,null,!0)+(c?0:this.pos)};e.prototype.toValue=function(a,c){return this.translate(a-
    (c?0:this.pos),!0,!this.horiz,null,!0)};e.prototype.getPlotLinePath=function(a){function c(a,c,g){if("pass"!==l&&a<c||a>g)l?a=d(a,c,g):v=!0;return a}var h=this,b=h.chart,t=h.left,r=h.top,e=a.old,f=a.value,m=a.translatedValue,A=a.lineWidth,l=a.force,n,k,u,L,q=e&&b.oldChartHeight||b.chartHeight,P=e&&b.oldChartWidth||b.chartWidth,v,da=h.transB;a={value:f,lineWidth:A,old:e,force:l,acrossPanes:a.acrossPanes,translatedValue:m};J(this,"getPlotLinePath",a,function(a){m=y(m,h.translate(f,null,null,e));m=d(m,
    -1E5,1E5);n=u=Math.round(m+da);k=L=Math.round(q-m-da);g(m)?h.horiz?(k=r,L=q-h.bottom,n=u=c(n,t,t+h.width)):(n=t,u=P-h.right,k=L=c(k,r,r+h.height)):(v=!0,l=!1);a.path=v&&!l?null:b.renderer.crispLine([["M",n,k],["L",u,L]],A||1);});return a.path};e.prototype.getLinearTickPositions=function(a,c,d){var g=q(Math.floor(c/a)*a);d=q(Math.ceil(d/a)*a);var h=[],b;q(g+a)===g&&(b=20);if(this.single)return [c];for(c=g;c<=d;){h.push(c);c=q(c+a,b);if(c===p)break;var p=c;}return h};e.prototype.getMinorTickInterval=function(){var a=
    this.options;return !0===a.minorTicks?y(a.minorTickInterval,"auto"):!1===a.minorTicks?null:a.minorTickInterval};e.prototype.getMinorTickPositions=function(){var a=this.options,c=this.tickPositions,d=this.minorTickInterval,g=[],h=this.pointRangePadding||0,b=this.min-h;h=this.max+h;var r=h-b;if(r&&r/d<this.len/3){var e=this.logarithmic;if(e)this.paddedTicks.forEach(function(a,c,h){c&&g.push.apply(g,e.getLogTickPositions(d,h[c-1],h[c],!0));});else if(this.dateTime&&"auto"===this.getMinorTickInterval())g=
    g.concat(this.getTimeTicks(this.dateTime.normalizeTimeTickInterval(d),b,h,a.startOfWeek));else for(a=b+(c[0]-b)%d;a<=h&&a!==g[0];a+=d)g.push(a);}0!==g.length&&this.trimTicks(g);return g};e.prototype.adjustForMinRange=function(){var a=this.options,c=this.min,d=this.max,g=this.logarithmic,h=0,b,r,e,m;this.isXAxis&&"undefined"===typeof this.minRange&&!g&&(k(a.min)||k(a.max)?this.minRange=null:(this.series.forEach(function(a){e=a.xData;m=a.xIncrement?1:e.length-1;if(1<e.length)for(b=m;0<b;b--)if(r=e[b]-
    e[b-1],!h||r<h)h=r;}),this.minRange=Math.min(5*h,this.dataMax-this.dataMin)));if(d-c<this.minRange){var A=this.dataMax-this.dataMin>=this.minRange;var l=this.minRange;var n=(l-d+c)/2;n=[c-n,y(a.min,c-n)];A&&(n[2]=this.logarithmic?this.logarithmic.log2lin(this.dataMin):this.dataMin);c=v(n);d=[c+l,y(a.max,c+l)];A&&(d[2]=g?g.log2lin(this.dataMax):this.dataMax);d=f(d);d-c<l&&(n[0]=d-l,n[1]=y(a.min,d-l),c=v(n));}this.min=c;this.max=d;};e.prototype.getClosest=function(){var a;this.categories?a=1:this.series.forEach(function(c){var d=
    c.closestPointRange,g=c.visible||!c.chart.options.chart.ignoreHiddenSeries;!c.noSharedTooltip&&k(d)&&g&&(a=k(a)?Math.min(a,d):d);});return a};e.prototype.nameToX=function(a){var c=m(this.categories),d=c?this.categories:this.names,g=a.options.x;a.series.requireSorting=!1;k(g)||(g=this.options.uniqueNames?c?d.indexOf(a.name):y(d.keys[a.name],-1):a.series.autoIncrement());if(-1===g){if(!c)var h=d.length;}else h=g;"undefined"!==typeof h&&(this.names[h]=a.name,this.names.keys[a.name]=h);return h};e.prototype.updateNames=
    function(){var a=this,c=this.names;0<c.length&&(Object.keys(c.keys).forEach(function(a){delete c.keys[a];}),c.length=0,this.minRange=this.userMinRange,(this.series||[]).forEach(function(c){c.xIncrement=null;if(!c.points||c.isDirtyData)a.max=Math.max(a.max,c.xData.length-1),c.processData(),c.generatePoints();c.data.forEach(function(d,g){if(d&&d.options&&"undefined"!==typeof d.name){var h=a.nameToX(d);"undefined"!==typeof h&&h!==d.x&&(d.x=h,c.xData[g]=h);}});}));};e.prototype.setAxisTranslation=function(){var c=
    this,d=c.max-c.min,g=c.axisPointRange||0,h=0,b=0,r=c.linkedParent,e=!!c.categories,f=c.transA,m=c.isXAxis;if(m||e||g){var A=c.getClosest();r?(h=r.minPointOffset,b=r.pointRangePadding):c.series.forEach(function(d){var p=e?1:m?y(d.options.pointRange,A,0):c.axisPointRange||0,r=d.options.pointPlacement;g=Math.max(g,p);if(!c.single||e)d=d.is("xrange")?!m:m,h=Math.max(h,d&&a(r)?0:p/2),b=Math.max(b,d&&"on"===r?0:p);});r=c.ordinal&&c.ordinal.slope&&A?c.ordinal.slope/A:1;c.minPointOffset=h*=r;c.pointRangePadding=
    b*=r;c.pointRange=Math.min(g,c.single&&e?1:d);m&&(c.closestPointRange=A);}c.translationSlope=c.transA=f=c.staticScale||c.len/(d+b||1);c.transB=c.horiz?c.left:c.bottom;c.minPixelPadding=f*h;J(this,"afterSetAxisTranslation");};e.prototype.minFromRange=function(){return this.max-this.range};e.prototype.setTickInterval=function(a){var c=this,d=c.chart,h=c.logarithmic,b=c.options,e=c.isXAxis,t=c.isLinked,f=b.maxPadding,m=b.minPadding,A=b.tickInterval,l=b.tickPixelInterval,n=c.categories,L=g(c.threshold)?
    c.threshold:null,P=c.softThreshold;c.dateTime||n||t||this.getTickAmount();var v=y(c.userMin,b.min);var w=y(c.userMax,b.max);if(t){c.linkedParent=d[c.coll][b.linkedTo];var R=c.linkedParent.getExtremes();c.min=y(R.min,R.dataMin);c.max=y(R.max,R.dataMax);b.type!==c.linkedParent.options.type&&u(11,1,d);}else {if(P&&k(L))if(c.dataMin>=L)R=L,m=0;else if(c.dataMax<=L){var Q=L;f=0;}c.min=y(v,R,c.dataMin);c.max=y(w,Q,c.dataMax);}h&&(c.positiveValuesOnly&&!a&&0>=Math.min(c.min,y(c.dataMin,c.min))&&u(10,1,d),c.min=
    q(h.log2lin(c.min),16),c.max=q(h.log2lin(c.max),16));c.range&&k(c.max)&&(c.userMin=c.min=v=Math.max(c.dataMin,c.minFromRange()),c.userMax=w=c.max,c.range=null);J(c,"foundExtremes");c.beforePadding&&c.beforePadding();c.adjustForMinRange();!(n||c.axisPointRange||c.stacking&&c.stacking.usePercentage||t)&&k(c.min)&&k(c.max)&&(d=c.max-c.min)&&(!k(v)&&m&&(c.min-=d*m),!k(w)&&f&&(c.max+=d*f));g(c.userMin)||(g(b.softMin)&&b.softMin<c.min&&(c.min=v=b.softMin),g(b.floor)&&(c.min=Math.max(c.min,b.floor)));g(c.userMax)||
    (g(b.softMax)&&b.softMax>c.max&&(c.max=w=b.softMax),g(b.ceiling)&&(c.max=Math.min(c.max,b.ceiling)));P&&k(c.dataMin)&&(L=L||0,!k(v)&&c.min<L&&c.dataMin>=L?c.min=c.options.minRange?Math.min(L,c.max-c.minRange):L:!k(w)&&c.max>L&&c.dataMax<=L&&(c.max=c.options.minRange?Math.max(L,c.min+c.minRange):L));g(c.min)&&g(c.max)&&!this.chart.polar&&c.min>c.max&&(k(c.options.min)?c.max=c.min:k(c.options.max)&&(c.min=c.max));c.tickInterval=c.min===c.max||"undefined"===typeof c.min||"undefined"===typeof c.max?1:
    t&&c.linkedParent&&!A&&l===c.linkedParent.options.tickPixelInterval?A=c.linkedParent.tickInterval:y(A,this.tickAmount?(c.max-c.min)/Math.max(this.tickAmount-1,1):void 0,n?1:(c.max-c.min)*l/Math.max(c.len,l));e&&!a&&c.series.forEach(function(a){a.processData(c.min!==(c.old&&c.old.min)||c.max!==(c.old&&c.old.max));});c.setAxisTranslation();J(this,"initialAxisTranslation");c.pointRange&&!A&&(c.tickInterval=Math.max(c.pointRange,c.tickInterval));a=y(b.minTickInterval,c.dateTime&&!c.series.some(function(a){return a.noSharedTooltip})?
    c.closestPointRange:0);!A&&c.tickInterval<a&&(c.tickInterval=a);c.dateTime||c.logarithmic||A||(c.tickInterval=r(c.tickInterval,void 0,E(c.tickInterval),y(b.allowDecimals,.5>c.tickInterval||void 0!==this.tickAmount),!!this.tickAmount));this.tickAmount||(c.tickInterval=c.unsquish());this.setTickPositions();};e.prototype.setTickPositions=function(){var a=this.options,c=a.tickPositions;var d=this.getMinorTickInterval();var g=a.tickPositioner,h=this.hasVerticalPanning(),b="colorAxis"===this.coll,r=(b||
    !h)&&a.startOnTick;h=(b||!h)&&a.endOnTick;this.tickmarkOffset=this.categories&&"between"===a.tickmarkPlacement&&1===this.tickInterval?.5:0;this.minorTickInterval="auto"===d&&this.tickInterval?this.tickInterval/5:d;this.single=this.min===this.max&&k(this.min)&&!this.tickAmount&&(parseInt(this.min,10)===this.min||!1!==a.allowDecimals);this.tickPositions=d=c&&c.slice();!d&&(this.ordinal&&this.ordinal.positions||!((this.max-this.min)/this.tickInterval>Math.max(2*this.len,200))?d=this.dateTime?this.getTimeTicks(this.dateTime.normalizeTimeTickInterval(this.tickInterval,
    a.units),this.min,this.max,a.startOfWeek,this.ordinal&&this.ordinal.positions,this.closestPointRange,!0):this.logarithmic?this.logarithmic.getLogTickPositions(this.tickInterval,this.min,this.max):this.getLinearTickPositions(this.tickInterval,this.min,this.max):(d=[this.min,this.max],u(19,!1,this.chart)),d.length>this.len&&(d=[d[0],d.pop()],d[0]===d[1]&&(d.length=1)),this.tickPositions=d,g&&(g=g.apply(this,[this.min,this.max])))&&(this.tickPositions=d=g);this.paddedTicks=d.slice(0);this.trimTicks(d,
    r,h);this.isLinked||(this.single&&2>d.length&&!this.categories&&!this.series.some(function(a){return a.is("heatmap")&&"between"===a.options.pointPlacement})&&(this.min-=.5,this.max+=.5),c||g||this.adjustTickAmount());J(this,"afterSetTickPositions");};e.prototype.trimTicks=function(a,c,d){var g=a[0],h=a[a.length-1],b=!this.isOrdinal&&this.minPointOffset||0;J(this,"trimTicks");if(!this.isLinked){if(c&&-Infinity!==g)this.min=g;else for(;this.min-b>a[0];)a.shift();if(d)this.max=h;else for(;this.max+b<
    a[a.length-1];)a.pop();0===a.length&&k(g)&&!this.options.tickPositions&&a.push((h+g)/2);}};e.prototype.alignToOthers=function(){var a={},c,d=this.options;!1!==this.chart.options.chart.alignTicks&&d.alignTicks&&!1!==d.startOnTick&&!1!==d.endOnTick&&!this.logarithmic&&this.chart[this.coll].forEach(function(d){var g=d.options;g=[d.horiz?g.left:g.top,g.width,g.height,g.pane].join();d.series.length&&(a[g]?c=!0:a[g]=1);});return c};e.prototype.getTickAmount=function(){var a=this.options,c=a.tickAmount,d=
    a.tickPixelInterval;!k(a.tickInterval)&&!c&&this.len<d&&!this.isRadial&&!this.logarithmic&&a.startOnTick&&a.endOnTick&&(c=2);!c&&this.alignToOthers()&&(c=Math.ceil(this.len/d)+1);4>c&&(this.finalTickAmt=c,c=5);this.tickAmount=c;};e.prototype.adjustTickAmount=function(){var a=this.options,c=this.tickInterval,d=this.tickPositions,h=this.tickAmount,b=this.finalTickAmt,r=d&&d.length,e=y(this.threshold,this.softThreshold?0:null);if(this.hasData()&&g(this.min)&&g(this.max)){if(r<h){for(;d.length<h;)d.length%
    2||this.min===e?d.push(q(d[d.length-1]+c)):d.unshift(q(d[0]-c));this.transA*=(r-1)/(h-1);this.min=a.startOnTick?d[0]:Math.min(this.min,d[0]);this.max=a.endOnTick?d[d.length-1]:Math.max(this.max,d[d.length-1]);}else r>h&&(this.tickInterval*=2,this.setTickPositions());if(k(b)){for(c=a=d.length;c--;)(3===b&&1===c%2||2>=b&&0<c&&c<a-1)&&d.splice(c,1);this.finalTickAmt=void 0;}}};e.prototype.setScale=function(){var a,c=!1,d=!1;this.series.forEach(function(a){c=c||a.isDirtyData||a.isDirty;d=d||a.xAxis&&a.xAxis.isDirty||
    !1;});this.setAxisSize();(a=this.len!==(this.old&&this.old.len))||c||d||this.isLinked||this.forceRedraw||this.userMin!==(this.old&&this.old.userMin)||this.userMax!==(this.old&&this.old.userMax)||this.alignToOthers()?(this.stacking&&this.stacking.resetStacks(),this.forceRedraw=!1,this.getSeriesExtremes(),this.setTickInterval(),this.isDirty||(this.isDirty=a||this.min!==(this.old&&this.old.min)||this.max!==(this.old&&this.old.max))):this.stacking&&this.stacking.cleanStacks();c&&this.panningState&&(this.panningState.isDirty=
    !0);J(this,"afterSetScale");};e.prototype.setExtremes=function(a,c,d,g,h){var b=this,r=b.chart;d=y(d,!0);b.series.forEach(function(a){delete a.kdTree;});h=n(h,{min:a,max:c});J(b,"setExtremes",h,function(){b.userMin=a;b.userMax=c;b.eventArgs=h;d&&r.redraw(g);});};e.prototype.zoom=function(a,c){var d=this,g=this.dataMin,h=this.dataMax,b=this.options,r=Math.min(g,y(b.min,g)),e=Math.max(h,y(b.max,h));a={newMin:a,newMax:c};J(this,"zoom",a,function(a){var c=a.newMin,b=a.newMax;if(c!==d.min||b!==d.max)d.allowZoomOutside||
    (k(g)&&(c<r&&(c=r),c>e&&(c=e)),k(h)&&(b<r&&(b=r),b>e&&(b=e))),d.displayBtn="undefined"!==typeof c||"undefined"!==typeof b,d.setExtremes(c,b,!1,void 0,{trigger:"zoom"});a.zoomed=!0;});return a.zoomed};e.prototype.setAxisSize=function(){var a=this.chart,c=this.options,d=c.offsets||[0,0,0,0],g=this.horiz,h=this.width=Math.round(L(y(c.width,a.plotWidth-d[3]+d[1]),a.plotWidth)),b=this.height=Math.round(L(y(c.height,a.plotHeight-d[0]+d[2]),a.plotHeight)),r=this.top=Math.round(L(y(c.top,a.plotTop+d[0]),a.plotHeight,
    a.plotTop));c=this.left=Math.round(L(y(c.left,a.plotLeft+d[3]),a.plotWidth,a.plotLeft));this.bottom=a.chartHeight-b-r;this.right=a.chartWidth-h-c;this.len=Math.max(g?h:b,0);this.pos=g?c:r;};e.prototype.getExtremes=function(){var a=this.logarithmic;return {min:a?q(a.lin2log(this.min)):this.min,max:a?q(a.lin2log(this.max)):this.max,dataMin:this.dataMin,dataMax:this.dataMax,userMin:this.userMin,userMax:this.userMax}};e.prototype.getThreshold=function(a){var c=this.logarithmic,d=c?c.lin2log(this.min):this.min;
    c=c?c.lin2log(this.max):this.max;null===a||-Infinity===a?a=d:Infinity===a?a=c:d>a?a=d:c<a&&(a=c);return this.translate(a,0,1,0,1)};e.prototype.autoLabelAlign=function(a){var c=(y(a,0)-90*this.side+720)%360;a={align:"center"};J(this,"autoLabelAlign",a,function(a){15<c&&165>c?a.align="right":195<c&&345>c&&(a.align="left");});return a.align};e.prototype.tickSize=function(a){var c=this.options,d=c["tick"===a?"tickLength":"minorTickLength"],g=y(c["tick"===a?"tickWidth":"minorTickWidth"],"tick"===a&&this.isXAxis&&
    !this.categories?1:0);if(g&&d){"inside"===c[a+"Position"]&&(d=-d);var h=[d,g];}a={tickSize:h};J(this,"afterTickSize",a);return a.tickSize};e.prototype.labelMetrics=function(){var a=this.tickPositions&&this.tickPositions[0]||0;return this.chart.renderer.fontMetrics(this.options.labels.style.fontSize,this.ticks[a]&&this.ticks[a].label)};e.prototype.unsquish=function(){var a=this.options.labels,c=this.horiz,d=this.tickInterval,h=d,b=this.len/(((this.categories?1:0)+this.max-this.min)/d),r,e=a.rotation,
    f=this.labelMetrics(),m,A=Number.MAX_VALUE,l=Math.max(this.max-this.min,0),n=function(a){var c=a/(b||1);c=1<c?Math.ceil(c):1;c*d>l&&Infinity!==a&&Infinity!==b&&l&&(c=Math.ceil(l/d));return q(c*d)};if(c){if(!a.staggerLines&&!a.step)if(g(e))var k=[e];else b<a.autoRotationLimit&&(k=a.autoRotation);k&&k.forEach(function(a){if(a===e||a&&-90<=a&&90>=a){m=n(Math.abs(f.h/Math.sin(Q*a)));var c=m+Math.abs(a/360);c<A&&(A=c,r=a,h=m);}});}else a.step||(h=n(f.h));this.autoRotation=k;this.labelRotation=y(r,g(e)?e:
    0);return h};e.prototype.getSlotWidth=function(a){var c=this.chart,d=this.horiz,h=this.options.labels,b=Math.max(this.tickPositions.length-(this.categories?0:1),1),r=c.margin[3];if(a&&g(a.slotWidth))return a.slotWidth;if(d&&2>h.step)return h.rotation?0:(this.staggerLines||1)*this.len/b;if(!d){a=h.style.width;if(void 0!==a)return parseInt(String(a),10);if(r)return r-c.spacing[3]}return .33*c.chartWidth};e.prototype.renderUnsquish=function(){var c=this.chart,d=c.renderer,g=this.tickPositions,h=this.ticks,
    b=this.options.labels,r=b.style,e=this.horiz,f=this.getSlotWidth(),m=Math.max(1,Math.round(f-2*b.padding)),A={},y=this.labelMetrics(),l=r.textOverflow,n=0;a(b.rotation)||(A.rotation=b.rotation||0);g.forEach(function(a){a=h[a];a.movedLabel&&a.replaceMovedLabel();a&&a.label&&a.label.textPxLength>n&&(n=a.label.textPxLength);});this.maxLabelLength=n;if(this.autoRotation)n>m&&n>y.h?A.rotation=this.labelRotation:this.labelRotation=0;else if(f){var k=m;if(!l){var L="clip";for(m=g.length;!e&&m--;){var u=g[m];
    if(u=h[u].label)u.styles&&"ellipsis"===u.styles.textOverflow?u.css({textOverflow:"clip"}):u.textPxLength>f&&u.css({width:f+"px"}),u.getBBox().height>this.len/g.length-(y.h-y.f)&&(u.specificTextOverflow="ellipsis");}}}A.rotation&&(k=n>.5*c.chartHeight?.33*c.chartHeight:n,l||(L="ellipsis"));if(this.labelAlign=b.align||this.autoLabelAlign(this.labelRotation))A.align=this.labelAlign;g.forEach(function(a){var c=(a=h[a])&&a.label,d=r.width,g={};c&&(c.attr(A),a.shortenLabel?a.shortenLabel():k&&!d&&"nowrap"!==
    r.whiteSpace&&(k<c.textPxLength||"SPAN"===c.element.tagName)?(g.width=k+"px",l||(g.textOverflow=c.specificTextOverflow||L),c.css(g)):c.styles&&c.styles.width&&!g.width&&!d&&c.css({width:null}),delete c.specificTextOverflow,a.rotation=A.rotation);},this);this.tickRotCorr=d.rotCorr(y.b,this.labelRotation||0,0!==this.side);};e.prototype.hasData=function(){return this.series.some(function(a){return a.hasData()})||this.options.showEmpty&&k(this.min)&&k(this.max)};e.prototype.addTitle=function(a){var c=this.chart.renderer,
    d=this.horiz,g=this.opposite,b=this.options.title,r,e=this.chart.styledMode;this.axisTitle||((r=b.textAlign)||(r=(d?{low:"left",middle:"center",high:"right"}:{low:g?"right":"left",middle:"center",high:g?"left":"right"})[b.align]),this.axisTitle=c.text(b.text||"",0,0,b.useHTML).attr({zIndex:7,rotation:b.rotation,align:r}).addClass("highcharts-axis-title"),e||this.axisTitle.css(h(b.style)),this.axisTitle.add(this.axisGroup),this.axisTitle.isNew=!0);e||b.style.width||this.isRadial||this.axisTitle.css({width:this.len+
    "px"});this.axisTitle[a?"show":"hide"](a);};e.prototype.generateTick=function(a){var c=this.ticks;c[a]?c[a].addLabel():c[a]=new G(this,a);};e.prototype.getOffset=function(){var a=this,c=this,d=c.chart,g=d.renderer,h=c.options,b=c.tickPositions,r=c.ticks,e=c.horiz,f=c.side,m=d.inverted&&!c.isZAxis?[1,0,3,2][f]:f,l,n=0,L=0,u=h.title,P=h.labels,q=0,v=d.axisOffset;d=d.clipOffset;var w=[-1,1,1,-1][f],da=h.className,ia=c.axisParent;var E=c.hasData();c.showAxis=l=E||h.showEmpty;c.staggerLines=c.horiz&&P.staggerLines||
    void 0;if(!c.axisGroup){var R=function(c,d,h){return g.g(c).attr({zIndex:h}).addClass("highcharts-"+a.coll.toLowerCase()+d+" "+(a.isRadial?"highcharts-radial-axis"+d+" ":"")+(da||"")).add(ia)};c.gridGroup=R("grid","-grid",h.gridZIndex);c.axisGroup=R("axis","",h.zIndex);c.labelGroup=R("axis-labels","-labels",P.zIndex);}E||c.isLinked?(b.forEach(function(a,d){c.generateTick(a,d);}),c.renderUnsquish(),c.reserveSpaceDefault=0===f||2===f||{1:"left",3:"right"}[f]===c.labelAlign,y(P.reserveSpace,"center"===
    c.labelAlign?!0:null,c.reserveSpaceDefault)&&b.forEach(function(a){q=Math.max(r[a].getLabelSize(),q);}),c.staggerLines&&(q*=c.staggerLines),c.labelOffset=q*(c.opposite?-1:1)):A(r,function(a,c){a.destroy();delete r[c];});if(u&&u.text&&!1!==u.enabled&&(c.addTitle(l),l&&!1!==u.reserveSpace)){c.titleOffset=n=c.axisTitle.getBBox()[e?"height":"width"];var Q=u.offset;L=k(Q)?0:y(u.margin,e?5:10);}c.renderLine();c.offset=w*y(h.offset,v[f]?v[f]+(h.margin||0):0);c.tickRotCorr=c.tickRotCorr||{x:0,y:0};u=0===f?-c.labelMetrics().h:
    2===f?c.tickRotCorr.y:0;L=Math.abs(q)+L;q&&(L=L-u+w*(e?y(P.y,c.tickRotCorr.y+8*w):P.x));c.axisTitleMargin=y(Q,L);c.getMaxLabelDimensions&&(c.maxLabelDimensions=c.getMaxLabelDimensions(r,b));e=this.tickSize("tick");v[f]=Math.max(v[f],(c.axisTitleMargin||0)+n+w*c.offset,L,b&&b.length&&e?e[0]+w*c.offset:0);h=h.offset?0:2*Math.floor(c.axisLine.strokeWidth()/2);d[m]=Math.max(d[m],h);J(this,"afterGetOffset");};e.prototype.getLinePath=function(a){var c=this.chart,d=this.opposite,g=this.offset,h=this.horiz,
    b=this.left+(d?this.width:0)+g;g=c.chartHeight-this.bottom-(d?this.height:0)+g;d&&(a*=-1);return c.renderer.crispLine([["M",h?this.left:b,h?g:this.top],["L",h?c.chartWidth-this.right:b,h?g:c.chartHeight-this.bottom]],a)};e.prototype.renderLine=function(){this.axisLine||(this.axisLine=this.chart.renderer.path().addClass("highcharts-axis-line").add(this.axisGroup),this.chart.styledMode||this.axisLine.attr({stroke:this.options.lineColor,"stroke-width":this.options.lineWidth,zIndex:7}));};e.prototype.getTitlePosition=
    function(){var a=this.horiz,c=this.left,d=this.top,g=this.len,h=this.options.title,b=a?c:d,r=this.opposite,e=this.offset,f=h.x,m=h.y,A=this.axisTitle,y=this.chart.renderer.fontMetrics(h.style.fontSize,A);A=Math.max(A.getBBox(null,0).height-y.h-1,0);g={low:b+(a?0:g),middle:b+g/2,high:b+(a?g:0)}[h.align];c=(a?d+this.height:c)+(a?1:-1)*(r?-1:1)*this.axisTitleMargin+[-A,A,y.f,-A][this.side];a={x:a?g+f:c+(r?this.width:0)+e+f,y:a?c+m-(r?this.height:0)+e:g+m};J(this,"afterGetTitlePosition",{titlePosition:a});
    return a};e.prototype.renderMinorTick=function(a){var c=this.chart.hasRendered&&this.old,d=this.minorTicks;d[a]||(d[a]=new G(this,a,"minor"));c&&d[a].isNew&&d[a].render(null,!0);d[a].render(null,!1,1);};e.prototype.renderTick=function(a,c){var d=this.ticks,g=this.chart.hasRendered&&this.old;if(!this.isLinked||a>=this.min&&a<=this.max||this.grid&&this.grid.isColumn)d[a]||(d[a]=new G(this,a)),g&&d[a].isNew&&d[a].render(c,!0,-1),d[a].render(c);};e.prototype.render=function(){var a=this,c=a.chart,d=a.logarithmic,
    h=a.options,b=a.isLinked,r=a.tickPositions,e=a.axisTitle,f=a.ticks,m=a.minorTicks,y=a.alternateBands,l=h.stackLabels,n=h.alternateGridColor,k=a.tickmarkOffset,L=a.axisLine,u=a.showAxis,q=B(c.renderer.globalAnimation),P,v;a.labelEdge.length=0;a.overlap=!1;[f,m,y].forEach(function(a){A(a,function(a){a.isActive=!1;});});if(a.hasData()||b)a.minorTickInterval&&!a.categories&&a.getMinorTickPositions().forEach(function(c){a.renderMinorTick(c);}),r.length&&(r.forEach(function(c,d){a.renderTick(c,d);}),k&&(0===
    a.min||a.single)&&(f[-1]||(f[-1]=new G(a,-1,null,!0)),f[-1].render(-1))),n&&r.forEach(function(g,h){v="undefined"!==typeof r[h+1]?r[h+1]+k:a.max-k;0===h%2&&g<a.max&&v<=a.max+(c.polar?-k:k)&&(y[g]||(y[g]=new I.PlotLineOrBand(a)),P=g+k,y[g].options={from:d?d.lin2log(P):P,to:d?d.lin2log(v):v,color:n,className:"highcharts-alternate-grid"},y[g].render(),y[g].isActive=!0);}),a._addedPlotLB||(a._addedPlotLB=!0,(h.plotLines||[]).concat(h.plotBands||[]).forEach(function(c){a.addPlotBandOrLine(c);}));[f,m,y].forEach(function(a){var d,
    g=[],h=q.duration;A(a,function(a,c){a.isActive||(a.render(c,!1,0),a.isActive=!1,g.push(c));});V(function(){for(d=g.length;d--;)a[g[d]]&&!a[g[d]].isActive&&(a[g[d]].destroy(),delete a[g[d]]);},a!==y&&c.hasRendered&&h?h:0);});L&&(L[L.isPlaced?"animate":"attr"]({d:this.getLinePath(L.strokeWidth())}),L.isPlaced=!0,L[u?"show":"hide"](u));e&&u&&(h=a.getTitlePosition(),g(h.y)?(e[e.isNew?"attr":"animate"](h),e.isNew=!1):(e.attr("y",-9999),e.isNew=!0));l&&l.enabled&&a.stacking&&a.stacking.renderStackTotals();
    a.old={len:a.len,max:a.max,min:a.min,transA:a.transA,userMax:a.userMax,userMin:a.userMin};a.isDirty=!1;J(this,"afterRender");};e.prototype.redraw=function(){this.visible&&(this.render(),this.plotLinesAndBands.forEach(function(a){a.render();}));this.series.forEach(function(a){a.isDirty=!0;});};e.prototype.getKeepProps=function(){return this.keepProps||e.keepProps};e.prototype.destroy=function(a){var c=this,d=c.plotLinesAndBands,g;J(this,"destroy",{keepEvents:a});a||P(c);[c.ticks,c.minorTicks,c.alternateBands].forEach(function(a){l(a);});
    if(d)for(a=d.length;a--;)d[a].destroy();"axisLine axisTitle axisGroup gridGroup labelGroup cross scrollbar".split(" ").forEach(function(a){c[a]&&(c[a]=c[a].destroy());});for(g in c.plotLinesAndBandsGroups)c.plotLinesAndBandsGroups[g]=c.plotLinesAndBandsGroups[g].destroy();A(c,function(a,d){-1===c.getKeepProps().indexOf(d)&&delete c[d];});};e.prototype.drawCrosshair=function(a,c){var d=this.crosshair,g=y(d&&d.snap,!0),h,r=this.cross,e=this.chart;J(this,"drawCrosshair",{e:a,point:c});a||(a=this.cross&&
    this.cross.e);if(d&&!1!==(k(c)||!g)){g?k(c)&&(h=y("colorAxis"!==this.coll?c.crosshairPos:null,this.isXAxis?c.plotX:this.len-c.plotY)):h=a&&(this.horiz?a.chartX-this.pos:this.len-a.chartY+this.pos);if(k(h)){var f={value:c&&(this.isXAxis?c.x:y(c.stackY,c.y)),translatedValue:h};e.polar&&n(f,{isCrosshair:!0,chartX:a&&a.chartX,chartY:a&&a.chartY,point:c});f=this.getPlotLinePath(f)||null;}if(!k(f)){this.hideCrosshair();return}g=this.categories&&!this.isRadial;r||(this.cross=r=e.renderer.path().addClass("highcharts-crosshair highcharts-crosshair-"+
    (g?"category ":"thin ")+(d.className||"")).attr({zIndex:y(d.zIndex,2)}).add(),e.styledMode||(r.attr({stroke:d.color||(g?b.parse(z.highlightColor20).setOpacity(.25).get():z.neutralColor20),"stroke-width":y(d.width,1)}).css({"pointer-events":"none"}),d.dashStyle&&r.attr({dashstyle:d.dashStyle})));r.show().attr({d:f});g&&!d.width&&r.attr({"stroke-width":this.transA});this.cross.e=a;}else this.hideCrosshair();J(this,"afterDrawCrosshair",{e:a,point:c});};e.prototype.hideCrosshair=function(){this.cross&&
    this.cross.hide();J(this,"afterHideCrosshair");};e.prototype.hasVerticalPanning=function(){var a=this.chart.options.chart.panning;return !!(a&&a.enabled&&/y/.test(a.type))};e.prototype.validatePositiveValue=function(a){return g(a)&&0<a};e.prototype.update=function(a,c){var d=this.chart,g=a&&a.events||{};a=h(this.userOptions,a);A(d.options[this.coll].events,function(a,c){"undefined"===typeof g[c]&&(g[c]=void 0);});this.destroy(!0);this.init(d,n(a,{events:g}));d.isDirtyBox=!0;y(c,!0)&&d.redraw();};e.prototype.remove=
    function(a){for(var c=this.chart,d=this.coll,g=this.series,h=g.length;h--;)g[h]&&g[h].remove(!1);N(c.axes,this);N(c[d],this);c[d].forEach(function(a,c){a.options.index=a.userOptions.index=c;});this.destroy();c.isDirtyBox=!0;y(a,!0)&&c.redraw();};e.prototype.setTitle=function(a,c){this.update({title:a},c);};e.prototype.setCategories=function(a,c){this.update({categories:a},c);};e.defaultOptions={alignTicks:!0,allowDecimals:void 0,zIndex:2,zoomEnabled:!0,dateTimeLabelFormats:{millisecond:{main:"%H:%M:%S.%L",
    range:!1},second:{main:"%H:%M:%S",range:!1},minute:{main:"%H:%M",range:!1},hour:{main:"%H:%M",range:!1},day:{main:"%e. %b"},week:{main:"%e. %b"},month:{main:"%b '%y"},year:{main:"%Y"}},endOnTick:!1,gridLineDashStyle:"Solid",gridZIndex:1,labels:{autoRotation:void 0,autoRotationLimit:80,distance:void 0,enabled:!0,indentation:10,overflow:"justify",padding:5,reserveSpace:void 0,rotation:void 0,staggerLines:0,step:0,useHTML:!1,x:0,zIndex:7,style:{color:z.neutralColor60,cursor:"default",fontSize:"11px"}},
    maxPadding:.01,minorGridLineDashStyle:"Solid",minorTickLength:2,minorTickPosition:"outside",minPadding:.01,offset:void 0,opposite:!1,reversed:void 0,reversedStacks:!1,showEmpty:!0,showFirstLabel:!0,showLastLabel:!0,startOfWeek:1,startOnTick:!1,tickLength:10,tickPixelInterval:100,tickmarkPlacement:"between",tickPosition:"outside",title:{align:"middle",rotation:0,useHTML:!1,x:0,y:0,style:{color:z.neutralColor60}},type:"linear",uniqueNames:!0,visible:!0,minorGridLineColor:z.neutralColor5,minorGridLineWidth:1,
    minorTickColor:z.neutralColor40,lineColor:z.highlightColor20,lineWidth:1,gridLineColor:z.neutralColor10,gridLineWidth:void 0,tickColor:z.highlightColor20};e.defaultYAxisOptions={reversedStacks:!0,endOnTick:!0,maxPadding:.05,minPadding:.05,tickPixelInterval:72,showLastLabel:!0,labels:{x:-8},startOnTick:!0,title:{rotation:270,text:"Values"},stackLabels:{animation:{},allowOverlap:!1,enabled:!1,crop:!0,overflow:"justify",formatter:function(){var a=this.axis.chart.numberFormatter;return a(this.total,-1)},
    style:{color:z.neutralColor100,fontSize:"11px",fontWeight:"bold",textOutline:"1px contrast"}},gridLineWidth:1,lineWidth:0};e.defaultLeftAxisOptions={labels:{x:-15},title:{rotation:270}};e.defaultRightAxisOptions={labels:{x:15},title:{rotation:90}};e.defaultBottomAxisOptions={labels:{autoRotation:[-45],x:0},margin:15,title:{rotation:0}};e.defaultTopAxisOptions={labels:{autoRotation:[-45],x:0},margin:15,title:{rotation:0}};e.keepProps="extKey hcEvents names series userMax userMin".split(" ");return e}();
    I.Axis=e;return I.Axis});O(e,"Core/Axis/DateTimeAxis.js",[e["Core/Axis/Axis.js"],e["Core/Utilities.js"]],function(e,b){var D=b.addEvent,z=b.getMagnitude,H=b.normalizeTickInterval,G=b.timeUnits,C=function(){function b(b){this.axis=b;}b.prototype.normalizeTimeTickInterval=function(b,e){var v=e||[["millisecond",[1,2,5,10,20,25,50,100,200,500]],["second",[1,2,5,10,15,30]],["minute",[1,2,5,10,15,30]],["hour",[1,2,3,4,6,8,12]],["day",[1,2]],["week",[1,2]],["month",[1,2,3,4,6]],["year",null]];e=v[v.length-
    1];var f=G[e[0]],d=e[1],q;for(q=0;q<v.length&&!(e=v[q],f=G[e[0]],d=e[1],v[q+1]&&b<=(f*d[d.length-1]+G[v[q+1][0]])/2);q++);f===G.year&&b<5*f&&(d=[1,2,5]);b=H(b/f,d,"year"===e[0]?Math.max(z(b/f),1):1);return {unitRange:f,count:b,unitName:e[0]}};return b}();b=function(){function b(){}b.compose=function(b){b.keepProps.push("dateTime");b.prototype.getTimeTicks=function(){return this.chart.time.getTimeTicks.apply(this.chart.time,arguments)};D(b,"init",function(b){"datetime"!==b.userOptions.type?this.dateTime=
    void 0:this.dateTime||(this.dateTime=new C(this));});};b.AdditionsClass=C;return b}();b.compose(e);return b});O(e,"Core/Axis/LogarithmicAxis.js",[e["Core/Axis/Axis.js"],e["Core/Utilities.js"]],function(e,b){var D=b.addEvent,z=b.getMagnitude,H=b.normalizeTickInterval,G=b.pick,C=function(){function b(b){this.axis=b;}b.prototype.getLogTickPositions=function(b,e,v,f){var d=this.axis,q=d.len,k=d.options,l=[];f||(this.minorAutoInterval=void 0);if(.5<=b)b=Math.round(b),l=d.getLinearTickPositions(b,e,v);else if(.08<=
    b){var w=Math.floor(e),u,n=k=void 0;for(q=.3<b?[1,2,4]:.15<b?[1,2,4,6,8]:[1,2,3,4,5,6,7,8,9];w<v+1&&!n;w++){var J=q.length;for(u=0;u<J&&!n;u++){var E=this.log2lin(this.lin2log(w)*q[u]);E>e&&(!f||k<=v)&&"undefined"!==typeof k&&l.push(k);k>v&&(n=!0);k=E;}}}else e=this.lin2log(e),v=this.lin2log(v),b=f?d.getMinorTickInterval():k.tickInterval,b=G("auto"===b?null:b,this.minorAutoInterval,k.tickPixelInterval/(f?5:1)*(v-e)/((f?q/d.tickPositions.length:q)||1)),b=H(b,void 0,z(b)),l=d.getLinearTickPositions(b,
    e,v).map(this.log2lin),f||(this.minorAutoInterval=b/5);f||(d.tickInterval=b);return l};b.prototype.lin2log=function(b){return Math.pow(10,b)};b.prototype.log2lin=function(b){return Math.log(b)/Math.LN10};return b}();b=function(){function b(){}b.compose=function(b){b.keepProps.push("logarithmic");D(b,"init",function(b){var e=this.logarithmic;"logarithmic"!==b.userOptions.type?this.logarithmic=void 0:e||(this.logarithmic=new C(this));});D(b,"afterInit",function(){var b=this.logarithmic;b&&(this.lin2val=
    function(e){return b.lin2log(e)},this.val2lin=function(e){return b.log2lin(e)});});};return b}();b.compose(e);return b});O(e,"Core/Axis/PlotLineOrBand.js",[e["Core/Axis/Axis.js"],e["Core/Globals.js"],e["Core/Color/Palette.js"],e["Core/Utilities.js"]],function(e,b,I,z){var D=z.arrayMax,G=z.arrayMin,C=z.defined,B=z.destroyObjectProperties,x=z.erase,w=z.extend,v=z.fireEvent,f=z.isNumber,d=z.merge,q=z.objectEach,k=z.pick;z=function(){function b(d,b){this.axis=d;b&&(this.options=b,this.id=b.id);}b.prototype.render=
    function(){v(this,"render");var b=this,e=b.axis,f=e.horiz,l=e.logarithmic,E=b.options,m=E.label,c=b.label,g=E.to,a=E.from,h=E.value,r=C(a)&&C(g),A=C(h),y=b.svgElem,L=!y,P=[],R=E.color,w=k(E.zIndex,0),Q=E.events;P={"class":"highcharts-plot-"+(r?"band ":"line ")+(E.className||"")};var M={},t=e.chart.renderer,p=r?"bands":"lines";l&&(a=l.log2lin(a),g=l.log2lin(g),h=l.log2lin(h));e.chart.styledMode||(A?(P.stroke=R||I.neutralColor40,P["stroke-width"]=k(E.width,1),E.dashStyle&&(P.dashstyle=E.dashStyle)):
    r&&(P.fill=R||I.highlightColor10,E.borderWidth&&(P.stroke=E.borderColor,P["stroke-width"]=E.borderWidth)));M.zIndex=w;p+="-"+w;(l=e.plotLinesAndBandsGroups[p])||(e.plotLinesAndBandsGroups[p]=l=t.g("plot-"+p).attr(M).add());L&&(b.svgElem=y=t.path().attr(P).add(l));if(A)P=e.getPlotLinePath({value:h,lineWidth:y.strokeWidth(),acrossPanes:E.acrossPanes});else if(r)P=e.getPlotBandPath(a,g,E);else return;!b.eventsAdded&&Q&&(q(Q,function(a,c){y.on(c,function(a){Q[c].apply(b,[a]);});}),b.eventsAdded=!0);(L||
    !y.d)&&P&&P.length?y.attr({d:P}):y&&(P?(y.show(!0),y.animate({d:P})):y.d&&(y.hide(),c&&(b.label=c=c.destroy())));m&&(C(m.text)||C(m.formatter))&&P&&P.length&&0<e.width&&0<e.height&&!P.isFlat?(m=d({align:f&&r&&"center",x:f?!r&&4:10,verticalAlign:!f&&r&&"middle",y:f?r?16:10:r?6:-4,rotation:f&&!r&&90},m),this.renderLabel(m,P,r,w)):c&&c.hide();return b};b.prototype.renderLabel=function(d,b,e,f){var l=this.label,m=this.axis.chart.renderer;l||(l={align:d.textAlign||d.align,rotation:d.rotation,"class":"highcharts-plot-"+
    (e?"band":"line")+"-label "+(d.className||"")},l.zIndex=f,f=this.getLabelText(d),this.label=l=m.text(f,0,0,d.useHTML).attr(l).add(),this.axis.chart.styledMode||l.css(d.style));m=b.xBounds||[b[0][1],b[1][1],e?b[2][1]:b[0][1]];b=b.yBounds||[b[0][2],b[1][2],e?b[2][2]:b[0][2]];e=G(m);f=G(b);l.align(d,!1,{x:e,y:f,width:D(m)-e,height:D(b)-f});l.show(!0);};b.prototype.getLabelText=function(d){return C(d.formatter)?d.formatter.call(this):d.text};b.prototype.destroy=function(){x(this.axis.plotLinesAndBands,
    this);delete this.axis;B(this);};return b}();w(e.prototype,{getPlotBandPath:function(d,b,e){void 0===e&&(e=this.options);var l=this.getPlotLinePath({value:b,force:!0,acrossPanes:e.acrossPanes});e=this.getPlotLinePath({value:d,force:!0,acrossPanes:e.acrossPanes});var k=[],q=this.horiz,m=1;d=!f(this.min)||!f(this.max)||d<this.min&&b<this.min||d>this.max&&b>this.max;if(e&&l){if(d){var c=e.toString()===l.toString();m=0;}for(d=0;d<e.length;d+=2){b=e[d];var g=e[d+1],a=l[d],h=l[d+1];"M"!==b[0]&&"L"!==b[0]||
    "M"!==g[0]&&"L"!==g[0]||"M"!==a[0]&&"L"!==a[0]||"M"!==h[0]&&"L"!==h[0]||(q&&a[1]===b[1]?(a[1]+=m,h[1]+=m):q||a[2]!==b[2]||(a[2]+=m,h[2]+=m),k.push(["M",b[1],b[2]],["L",g[1],g[2]],["L",h[1],h[2]],["L",a[1],a[2]],["Z"]));k.isFlat=c;}}return k},addPlotBand:function(d){return this.addPlotBandOrLine(d,"plotBands")},addPlotLine:function(d){return this.addPlotBandOrLine(d,"plotLines")},addPlotBandOrLine:function(d,e){var f=this,l=new b.PlotLineOrBand(this,d),k=this.userOptions;this.visible&&(l=l.render());
    if(l){this._addedPlotLB||(this._addedPlotLB=!0,(k.plotLines||[]).concat(k.plotBands||[]).forEach(function(d){f.addPlotBandOrLine(d);}));if(e){var q=k[e]||[];q.push(d);k[e]=q;}this.plotLinesAndBands.push(l);}return l},removePlotBandOrLine:function(d){for(var b=this.plotLinesAndBands,e=this.options,f=this.userOptions,l=b.length;l--;)b[l].id===d&&b[l].destroy();[e.plotLines||[],f.plotLines||[],e.plotBands||[],f.plotBands||[]].forEach(function(b){for(l=b.length;l--;)(b[l]||{}).id===d&&x(b,b[l]);});},removePlotBand:function(d){this.removePlotBandOrLine(d);},
    removePlotLine:function(d){this.removePlotBandOrLine(d);}});b.PlotLineOrBand=z;return b.PlotLineOrBand});O(e,"Core/Tooltip.js",[e["Core/FormatUtilities.js"],e["Core/Globals.js"],e["Core/Color/Palette.js"],e["Core/Utilities.js"]],function(e,b,I,z){var D=e.format,G=b.doc,C=z.clamp,B=z.css,x=z.defined,w=z.discardElement,v=z.extend,f=z.fireEvent,d=z.isArray,q=z.isNumber,k=z.isString,l=z.merge,N=z.pick,u=z.splat,n=z.syncTimeout,J=z.timeUnits;e=function(){function e(d,c){this.container=void 0;this.crosshairs=
    [];this.distance=0;this.isHidden=!0;this.isSticky=!1;this.now={};this.options={};this.outside=!1;this.chart=d;this.init(d,c);}e.prototype.applyFilter=function(){var d=this.chart;d.renderer.definition({tagName:"filter",attributes:{id:"drop-shadow-"+d.index,opacity:.5},children:[{tagName:"feGaussianBlur",attributes:{"in":"SourceAlpha",stdDeviation:1}},{tagName:"feOffset",attributes:{dx:1,dy:1}},{tagName:"feComponentTransfer",children:[{tagName:"feFuncA",attributes:{type:"linear",slope:.3}}]},{tagName:"feMerge",
    children:[{tagName:"feMergeNode"},{tagName:"feMergeNode",attributes:{"in":"SourceGraphic"}}]}]});d.renderer.definition({tagName:"style",textContent:".highcharts-tooltip-"+d.index+"{filter:url(#drop-shadow-"+d.index+")}"});};e.prototype.bodyFormatter=function(d){return d.map(function(c){var d=c.series.tooltipOptions;return (d[(c.point.formatPrefix||"point")+"Formatter"]||c.point.tooltipFormatter).call(c.point,d[(c.point.formatPrefix||"point")+"Format"]||"")})};e.prototype.cleanSplit=function(d){this.chart.series.forEach(function(c){var b=
    c&&c.tt;b&&(!b.isActive||d?c.tt=b.destroy():b.isActive=!1);});};e.prototype.defaultFormatter=function(d){var c=this.points||u(this);var b=[d.tooltipFooterHeaderFormatter(c[0])];b=b.concat(d.bodyFormatter(c));b.push(d.tooltipFooterHeaderFormatter(c[0],!0));return b};e.prototype.destroy=function(){this.label&&(this.label=this.label.destroy());this.split&&this.tt&&(this.cleanSplit(this.chart,!0),this.tt=this.tt.destroy());this.renderer&&(this.renderer=this.renderer.destroy(),w(this.container));z.clearTimeout(this.hideTimer);
    z.clearTimeout(this.tooltipTimeout);};e.prototype.getAnchor=function(d,c){var b=this.chart;var a=b.pointer;var h=b.inverted,e=b.plotTop,f=b.plotLeft,m=0,l=0,k,n;d=u(d);this.followPointer&&c?("undefined"===typeof c.chartX&&(c=a.normalize(c)),a=[c.chartX-f,c.chartY-e]):d[0].tooltipPos?a=d[0].tooltipPos:(d.forEach(function(a){k=a.series.yAxis;n=a.series.xAxis;m+=a.plotX||0;l+=a.plotLow?(a.plotLow+(a.plotHigh||0))/2:a.plotY||0;n&&k&&(h?(m+=e+b.plotHeight-n.len-n.pos,l+=f+b.plotWidth-k.len-k.pos):(m+=n.pos-
    f,l+=k.pos-e));}),m/=d.length,l/=d.length,a=[h?b.plotWidth-l:m,h?b.plotHeight-m:l],this.shared&&1<d.length&&c&&(h?a[0]=c.chartX-f:a[1]=c.chartY-e));return a.map(Math.round)};e.prototype.getDateFormat=function(d,c,b,a){var h=this.chart.time,g=h.dateFormat("%m-%d %H:%M:%S.%L",c),e={millisecond:15,second:12,minute:9,hour:6,day:3},f="millisecond";for(m in J){if(d===J.week&&+h.dateFormat("%w",c)===b&&"00:00:00.000"===g.substr(6)){var m="week";break}if(J[m]>d){m=f;break}if(e[m]&&g.substr(e[m])!=="01-01 00:00:00.000".substr(e[m]))break;
    "week"!==m&&(f=m);}if(m)var l=h.resolveDTLFormat(a[m]).main;return l};e.prototype.getLabel=function(){var d=this,c=this.chart.renderer,g=this.chart.styledMode,a=this.options,h="tooltip"+(x(a.className)?" "+a.className:""),e=a.style&&a.style.pointerEvents||(!this.followPointer&&a.stickOnContact?"auto":"none"),f,y=function(){d.inContact=!0;},l=function(){var a=d.chart.hoverSeries;d.inContact=!1;if(a&&a.onMouseOut)a.onMouseOut();};if(!this.label){if(this.outside){var k=this.chart.options.chart.style;this.container=
    f=b.doc.createElement("div");f.className="highcharts-tooltip-container";B(f,{position:"absolute",top:"1px",pointerEvents:e,zIndex:Math.max(this.options.style&&this.options.style.zIndex||0,(k&&k.zIndex||0)+3)});b.doc.body.appendChild(f);this.renderer=c=new b.Renderer(f,0,0,k,void 0,void 0,c.styledMode);}this.split?this.label=c.g(h):(this.label=c.label("",0,0,a.shape||"callout",null,null,a.useHTML,null,h).attr({padding:a.padding,r:a.borderRadius}),g||this.label.attr({fill:a.backgroundColor,"stroke-width":a.borderWidth}).css(a.style).css({pointerEvents:e}).shadow(a.shadow));
    g&&(this.applyFilter(),this.label.addClass("highcharts-tooltip-"+this.chart.index));if(d.outside&&!d.split){var n=this.label,q=n.xSetter,u=n.ySetter;n.xSetter=function(a){q.call(n,d.distance);f.style.left=a+"px";};n.ySetter=function(a){u.call(n,d.distance);f.style.top=a+"px";};}this.label.on("mouseenter",y).on("mouseleave",l).attr({zIndex:8}).add();}return this.label};e.prototype.getPosition=function(d,c,b){var a=this.chart,h=this.distance,g={},e=a.inverted&&b.h||0,f,m=this.outside,l=m?G.documentElement.clientWidth-
    2*h:a.chartWidth,k=m?Math.max(G.body.scrollHeight,G.documentElement.scrollHeight,G.body.offsetHeight,G.documentElement.offsetHeight,G.documentElement.clientHeight):a.chartHeight,n=a.pointer.getChartPosition(),q=function(g){var e="x"===g;return [g,e?l:k,e?d:c].concat(m?[e?d*n.scaleX:c*n.scaleY,e?n.left-h+(b.plotX+a.plotLeft)*n.scaleX:n.top-h+(b.plotY+a.plotTop)*n.scaleY,0,e?l:k]:[e?d:c,e?b.plotX+a.plotLeft:b.plotY+a.plotTop,e?a.plotLeft:a.plotTop,e?a.plotLeft+a.plotWidth:a.plotTop+a.plotHeight])},u=
    q("y"),t=q("x"),p=!this.followPointer&&N(b.ttBelow,!a.inverted===!!b.negative),v=function(a,c,d,b,r,f,A){var y=m?"y"===a?h*n.scaleY:h*n.scaleX:h,l=(d-b)/2,F=b<r-h,k=r+h+b<c,K=r-y-d+l;r=r+y-l;if(p&&k)g[a]=r;else if(!p&&F)g[a]=K;else if(F)g[a]=Math.min(A-b,0>K-e?K:K-e);else if(k)g[a]=Math.max(f,r+e+d>c?r:r+e);else return !1},w=function(a,c,d,b,e){var r;e<h||e>c-h?r=!1:g[a]=e<d/2?1:e>c-b/2?c-b-2:e-d/2;return r},E=function(a){var c=u;u=t;t=c;f=a;},F=function(){!1!==v.apply(0,u)?!1!==w.apply(0,t)||f||(E(!0),
    F()):f?g.x=g.y=0:(E(!0),F());};(a.inverted||1<this.len)&&E();F();return g};e.prototype.getXDateFormat=function(d,c,b){c=c.dateTimeLabelFormats;var a=b&&b.closestPointRange;return (a?this.getDateFormat(a,d.x,b.options.startOfWeek,c):c.day)||c.year};e.prototype.hide=function(d){var c=this;z.clearTimeout(this.hideTimer);d=N(d,this.options.hideDelay,500);this.isHidden||(this.hideTimer=n(function(){c.getLabel().fadeOut(d?void 0:d);c.isHidden=!0;},d));};e.prototype.init=function(d,c){this.chart=d;this.options=
    c;this.crosshairs=[];this.now={x:0,y:0};this.isHidden=!0;this.split=c.split&&!d.inverted&&!d.polar;this.shared=c.shared||this.split;this.outside=N(c.outside,!(!d.scrollablePixelsX&&!d.scrollablePixelsY));};e.prototype.isStickyOnContact=function(){return !(this.followPointer||!this.options.stickOnContact||!this.inContact)};e.prototype.move=function(d,c,b,a){var h=this,g=h.now,e=!1!==h.options.animation&&!h.isHidden&&(1<Math.abs(d-g.x)||1<Math.abs(c-g.y)),f=h.followPointer||1<h.len;v(g,{x:e?(2*g.x+d)/
    3:d,y:e?(g.y+c)/2:c,anchorX:f?void 0:e?(2*g.anchorX+b)/3:b,anchorY:f?void 0:e?(g.anchorY+a)/2:a});h.getLabel().attr(g);h.drawTracker();e&&(z.clearTimeout(this.tooltipTimeout),this.tooltipTimeout=setTimeout(function(){h&&h.move(d,c,b,a);},32));};e.prototype.refresh=function(b,c){var g=this.chart,a=this.options,h=u(b),e=h[0],m={},y=[],l=a.formatter||this.defaultFormatter;m=this.shared;var k=g.styledMode;if(a.enabled){z.clearTimeout(this.hideTimer);this.followPointer=!this.split&&e.series.tooltipOptions.followPointer;
    var n=this.getAnchor(b,c);var q=n[0];var v=n[1];!m||!d(b)&&b.series&&b.series.noSharedTooltip?m=e.getLabelConfig():(g.pointer.applyInactiveState(h),h.forEach(function(a){a.setState("hover");y.push(a.getLabelConfig());}),m={x:e.category,y:e.y},m.points=y);this.len=y.length;b=l.call(m,this);l=e.series;this.distance=N(l.tooltipOptions.distance,16);if(!1===b)this.hide();else {if(this.split)this.renderSplit(b,h);else if(h=q,m=v,c&&g.pointer.isDirectTouch&&(h=c.chartX-g.plotLeft,m=c.chartY-g.plotTop),g.polar||
    !1===l.options.clip||l.shouldShowTooltip(h,m))c=this.getLabel(),a.style.width&&!k||c.css({width:this.chart.spacingBox.width+"px"}),c.attr({text:b&&b.join?b.join(""):b}),c.removeClass(/highcharts-color-[\d]+/g).addClass("highcharts-color-"+N(e.colorIndex,l.colorIndex)),k||c.attr({stroke:a.borderColor||e.color||l.color||I.neutralColor60}),this.updatePosition({plotX:q,plotY:v,negative:e.negative,ttBelow:e.ttBelow,h:n[2]||0});else {this.hide();return}this.isHidden&&this.label&&this.label.attr({opacity:1}).show();
    this.isHidden=!1;}f(this,"refresh");}};e.prototype.renderSplit=function(d,c){function g(c,d,b,g,h){void 0===h&&(h=!0);b?(d=X?0:ba,c=C(c-g/2,S.left,S.right-g-(a.outside?U:0))):(d-=B,c=h?c-g-J:c+J,c=C(c,h?c:S.left,S.right));return {x:c,y:d}}var a=this,h=a.chart,e=a.chart,f=e.chartWidth,m=e.chartHeight,l=e.plotHeight,n=e.plotLeft,q=e.plotTop,u=e.pointer,w=e.scrollablePixelsY;w=void 0===w?0:w;var E=e.scrollablePixelsX,t=e.scrollingContainer;t=void 0===t?{scrollLeft:0,scrollTop:0}:t;var p=t.scrollLeft;t=
    t.scrollTop;var x=e.styledMode,J=a.distance,D=a.options,F=a.options.positioner,S=a.outside&&"number"!==typeof E?G.documentElement.getBoundingClientRect():{left:p,right:p+f,top:t,bottom:t+m},K=a.getLabel(),T=this.renderer||h.renderer,X=!(!h.xAxis[0]||!h.xAxis[0].opposite);h=u.getChartPosition();var U=h.left;h=h.top;var B=q+t,z=0,ba=l-w;k(d)&&(d=[!1,d]);d=d.slice(0,c.length+1).reduce(function(d,b,h){if(!1!==b&&""!==b){h=c[h-1]||{isHeader:!0,plotX:c[0].plotX,plotY:l,series:{}};var e=h.isHeader,r=e?a:
    h.series;b=b.toString();var f=r.tt,m=h.isHeader;var A=h.series;var y="highcharts-color-"+N(h.colorIndex,A.colorIndex,"none");f||(f={padding:D.padding,r:D.borderRadius},x||(f.fill=D.backgroundColor,f["stroke-width"]=D.borderWidth),f=T.label("",0,0,D[m?"headerShape":"shape"]||"callout",void 0,void 0,D.useHTML).addClass((m?"highcharts-tooltip-header ":"")+"highcharts-tooltip-box "+y).attr(f).add(K));f.isActive=!0;f.attr({text:b});x||f.css(D.style).shadow(D.shadow).attr({stroke:D.borderColor||h.color||
    A.color||I.neutralColor80});r=r.tt=f;m=r.getBBox();b=m.width+r.strokeWidth();e&&(z=m.height,ba+=z,X&&(B-=z));A=h.plotX;A=void 0===A?0:A;y=h.plotY;y=void 0===y?0:y;f=h.series;if(h.isHeader){A=n+A;var k=q+l/2;}else {var p=f.xAxis,t=f.yAxis;A=p.pos+C(A,-J,p.len+J);f.shouldShowTooltip(0,t.pos-q+y,{ignoreX:!0})&&(k=t.pos+y);}A=C(A,S.left-J,S.right+J);"number"===typeof k?(m=m.height+1,y=F?F.call(a,b,m,h):g(A,k,e,b),d.push({align:F?0:void 0,anchorX:A,anchorY:k,boxWidth:b,point:h,rank:N(y.rank,e?1:0),size:m,
    target:y.y,tt:r,x:y.x})):r.isActive=!1;}return d},[]);!F&&d.some(function(c){var d=(a.outside?U:0)+c.anchorX;return d<S.left&&d+c.boxWidth<S.right?!0:d<U-S.left+c.boxWidth&&S.right-d>d})&&(d=d.map(function(a){var c=g(a.anchorX,a.anchorY,a.point.isHeader,a.boxWidth,!1);return v(a,{target:c.y,x:c.x})}));a.cleanSplit();b.distribute(d,ba);var H=U,ca=U;d.forEach(function(c){var d=c.x,b=c.boxWidth;c=c.isHeader;c||(a.outside&&U+d<H&&(H=U+d),!c&&a.outside&&H+b>ca&&(ca=U+d));});d.forEach(function(c){var d=c.x,
    b=c.anchorX,h=c.pos,g=c.point.isHeader;h={visibility:"undefined"===typeof h?"hidden":"inherit",x:d,y:h+B,anchorX:b,anchorY:c.anchorY};if(a.outside&&d<b){var e=U-H;0<e&&(g||(h.x=d+e,h.anchorX=b+e),g&&(h.x=(ca-H)/2,h.anchorX=b+e));}c.tt.attr(h);});d=a.container;w=a.renderer;a.outside&&d&&w&&(e=K.getBBox(),w.setSize(e.width+e.x,e.height+e.y,!1),d.style.left=H+"px",d.style.top=h+"px");};e.prototype.drawTracker=function(){if(this.followPointer||!this.options.stickOnContact)this.tracker&&this.tracker.destroy();
    else {var d=this.chart,c=this.label,b=d.hoverPoint;if(c&&b){var a={x:0,y:0,width:0,height:0};b=this.getAnchor(b);var h=c.getBBox();b[0]+=d.plotLeft-c.translateX;b[1]+=d.plotTop-c.translateY;a.x=Math.min(0,b[0]);a.y=Math.min(0,b[1]);a.width=0>b[0]?Math.max(Math.abs(b[0]),h.width-b[0]):Math.max(Math.abs(b[0]),h.width);a.height=0>b[1]?Math.max(Math.abs(b[1]),h.height-Math.abs(b[1])):Math.max(Math.abs(b[1]),h.height);this.tracker?this.tracker.attr(a):(this.tracker=c.renderer.rect(a).addClass("highcharts-tracker").add(c),
    d.styledMode||this.tracker.attr({fill:"rgba(0,0,0,0)"}));}}};e.prototype.styledModeFormat=function(d){return d.replace('style="font-size: 10px"','class="highcharts-header"').replace(/style="color:{(point|series)\.color}"/g,'class="highcharts-color-{$1.colorIndex}"')};e.prototype.tooltipFooterHeaderFormatter=function(d,c){var b=c?"footer":"header",a=d.series,h=a.tooltipOptions,e=h.xDateFormat,m=a.xAxis,l=m&&"datetime"===m.options.type&&q(d.key),k=h[b+"Format"];c={isFooter:c,labelConfig:d};f(this,"headerFormatter",
    c,function(c){l&&!e&&(e=this.getXDateFormat(d,h,m));l&&e&&(d.point&&d.point.tooltipDateKeys||["key"]).forEach(function(a){k=k.replace("{point."+a+"}","{point."+a+":"+e+"}");});a.chart.styledMode&&(k=this.styledModeFormat(k));c.text=D(k,{point:d,series:a},this.chart);});return c.text};e.prototype.update=function(d){this.destroy();l(!0,this.chart.options.tooltip.userOptions,d);this.init(this.chart,l(!0,this.options,d));};e.prototype.updatePosition=function(d){var c=this.chart,b=c.pointer,a=this.getLabel(),
    h=d.plotX+c.plotLeft;c=d.plotY+c.plotTop;b=b.getChartPosition();d=(this.options.positioner||this.getPosition).call(this,a.width,a.height,d);if(this.outside){var e=(this.options.borderWidth||0)+2*this.distance;this.renderer.setSize(a.width+e,a.height+e,!1);if(1!==b.scaleX||1!==b.scaleY)B(this.container,{transform:"scale("+b.scaleX+", "+b.scaleY+")"}),h*=b.scaleX,c*=b.scaleY;h+=b.left-d.x;c+=b.top-d.y;}this.move(Math.round(d.x),Math.round(d.y||0),h,c);};return e}();b.Tooltip=e;return b.Tooltip});O(e,
    "Core/Pointer.js",[e["Core/Color/Color.js"],e["Core/Globals.js"],e["Core/Color/Palette.js"],e["Core/Tooltip.js"],e["Core/Utilities.js"]],function(e,b,I,z,H){var D=e.parse,C=b.charts,B=b.noop,x=H.addEvent,w=H.attr,v=H.css,f=H.defined,d=H.extend,q=H.find,k=H.fireEvent,l=H.isNumber,N=H.isObject,u=H.objectEach,n=H.offset,J=H.pick,E=H.splat;e=function(){function e(c,d){this.lastValidTouch={};this.pinchDown=[];this.runChartClick=!1;this.eventsToUnbind=[];this.chart=c;this.hasDragged=!1;this.options=
    d;this.init(c,d);}e.prototype.applyInactiveState=function(c){var d=[],a;(c||[]).forEach(function(c){a=c.series;d.push(a);a.linkedParent&&d.push(a.linkedParent);a.linkedSeries&&(d=d.concat(a.linkedSeries));a.navigatorSeries&&d.push(a.navigatorSeries);});this.chart.series.forEach(function(a){-1===d.indexOf(a)?a.setState("inactive",!0):a.options.inactiveOtherPoints&&a.setAllPointsToState("inactive");});};e.prototype.destroy=function(){var c=this;this.eventsToUnbind.forEach(function(c){return c()});this.eventsToUnbind=
    [];b.chartCount||(b.unbindDocumentMouseUp&&(b.unbindDocumentMouseUp=b.unbindDocumentMouseUp()),b.unbindDocumentTouchEnd&&(b.unbindDocumentTouchEnd=b.unbindDocumentTouchEnd()));clearInterval(c.tooltipTimeout);u(c,function(d,a){c[a]=void 0;});};e.prototype.drag=function(c){var d=this.chart,a=d.options.chart,b=c.chartX,e=c.chartY,f=this.zoomHor,l=this.zoomVert,m=d.plotLeft,k=d.plotTop,n=d.plotWidth,q=d.plotHeight,u=this.selectionMarker,v=this.mouseDownX||0,t=this.mouseDownY||0,p=N(a.panning)?a.panning&&
    a.panning.enabled:a.panning,w=a.panKey&&c[a.panKey+"Key"];if(!u||!u.touch)if(b<m?b=m:b>m+n&&(b=m+n),e<k?e=k:e>k+q&&(e=k+q),this.hasDragged=Math.sqrt(Math.pow(v-b,2)+Math.pow(t-e,2)),10<this.hasDragged){var E=d.isInsidePlot(v-m,t-k,{visiblePlotOnly:!0});d.hasCartesianSeries&&(this.zoomX||this.zoomY)&&E&&!w&&!u&&(this.selectionMarker=u=d.renderer.rect(m,k,f?1:n,l?1:q,0).attr({"class":"highcharts-selection-marker",zIndex:7}).add(),d.styledMode||u.attr({fill:a.selectionMarkerFill||D(I.highlightColor80).setOpacity(.25).get()}));
    u&&f&&(b-=v,u.attr({width:Math.abs(b),x:(0<b?0:b)+v}));u&&l&&(b=e-t,u.attr({height:Math.abs(b),y:(0<b?0:b)+t}));E&&!u&&p&&d.pan(c,a.panning);}};e.prototype.dragStart=function(c){var d=this.chart;d.mouseIsDown=c.type;d.cancelClick=!1;d.mouseDownX=this.mouseDownX=c.chartX;d.mouseDownY=this.mouseDownY=c.chartY;};e.prototype.drop=function(c){var b=this,a=this.chart,h=this.hasPinched;if(this.selectionMarker){var e={originalEvent:c,xAxis:[],yAxis:[]},A=this.selectionMarker,m=A.attr?A.attr("x"):A.x,n=A.attr?
    A.attr("y"):A.y,q=A.attr?A.attr("width"):A.width,u=A.attr?A.attr("height"):A.height,w;if(this.hasDragged||h)a.axes.forEach(function(a){if(a.zoomEnabled&&f(a.min)&&(h||b[{xAxis:"zoomX",yAxis:"zoomY"}[a.coll]])&&l(m)&&l(n)){var d=a.horiz,g="touchend"===c.type?a.minPixelPadding:0,r=a.toValue((d?m:n)+g);d=a.toValue((d?m+q:n+u)-g);e[a.coll].push({axis:a,min:Math.min(r,d),max:Math.max(r,d)});w=!0;}}),w&&k(a,"selection",e,function(c){a.zoom(d(c,h?{animation:!1}:null));});l(a.index)&&(this.selectionMarker=
    this.selectionMarker.destroy());h&&this.scaleGroups();}a&&l(a.index)&&(v(a.container,{cursor:a._cursor}),a.cancelClick=10<this.hasDragged,a.mouseIsDown=this.hasDragged=this.hasPinched=!1,this.pinchDown=[]);};e.prototype.findNearestKDPoint=function(c,d,a){var b=this.chart,g=b.hoverPoint;b=b.tooltip;if(g&&b&&b.isStickyOnContact())return g;var e;c.forEach(function(c){var b=!(c.noSharedTooltip&&d)&&0>c.options.findNearestPointBy.indexOf("y");c=c.searchPoint(a,b);if((b=N(c,!0)&&c.series)&&!(b=!N(e,!0))){b=
    e.distX-c.distX;var h=e.dist-c.dist,g=(c.series.group&&c.series.group.zIndex)-(e.series.group&&e.series.group.zIndex);b=0<(0!==b&&d?b:0!==h?h:0!==g?g:e.series.index>c.series.index?-1:1);}b&&(e=c);});return e};e.prototype.getChartCoordinatesFromPoint=function(c,d){var a=c.series,b=a.xAxis;a=a.yAxis;var g=c.shapeArgs;if(b&&a){var e=J(c.clientX,c.plotX),f=c.plotY||0;c.isNode&&g&&l(g.x)&&l(g.y)&&(e=g.x,f=g.y);return d?{chartX:a.len+a.pos-f,chartY:b.len+b.pos-e}:{chartX:e+b.pos,chartY:f+a.pos}}if(g&&g.x&&
    g.y)return {chartX:g.x,chartY:g.y}};e.prototype.getChartPosition=function(){if(this.chartPosition)return this.chartPosition;var c=this.chart.container,d=n(c);this.chartPosition={left:d.left,top:d.top,scaleX:1,scaleY:1};var a=c.offsetWidth;c=c.offsetHeight;2<a&&2<c&&(this.chartPosition.scaleX=d.width/a,this.chartPosition.scaleY=d.height/c);return this.chartPosition};e.prototype.getCoordinates=function(c){var d={xAxis:[],yAxis:[]};this.chart.axes.forEach(function(a){d[a.isXAxis?"xAxis":"yAxis"].push({axis:a,
    value:a.toValue(c[a.horiz?"chartX":"chartY"])});});return d};e.prototype.getHoverData=function(c,d,a,b,e,f){var h,g=[];b=!(!b||!c);var r=d&&!d.stickyTracking,l={chartX:f?f.chartX:void 0,chartY:f?f.chartY:void 0,shared:e};k(this,"beforeGetHoverData",l);r=r?[d]:a.filter(function(a){return l.filter?l.filter(a):a.visible&&!(!e&&a.directTouch)&&J(a.options.enableMouseTracking,!0)&&a.stickyTracking});d=(h=b||!f?c:this.findNearestKDPoint(r,e,f))&&h.series;h&&(e&&!d.noSharedTooltip?(r=a.filter(function(a){return l.filter?
    l.filter(a):a.visible&&!(!e&&a.directTouch)&&J(a.options.enableMouseTracking,!0)&&!a.noSharedTooltip}),r.forEach(function(a){var c=q(a.points,function(a){return a.x===h.x&&!a.isNull});N(c)&&(a.chart.isBoosting&&(c=a.getPoint(c)),g.push(c));})):g.push(h));l={hoverPoint:h};k(this,"afterGetHoverData",l);return {hoverPoint:l.hoverPoint,hoverSeries:d,hoverPoints:g}};e.prototype.getPointFromEvent=function(c){c=c.target;for(var d;c&&!d;)d=c.point,c=c.parentNode;return d};e.prototype.onTrackerMouseOut=function(c){c=
    c.relatedTarget||c.toElement;var d=this.chart.hoverSeries;this.isDirectTouch=!1;if(!(!d||!c||d.stickyTracking||this.inClass(c,"highcharts-tooltip")||this.inClass(c,"highcharts-series-"+d.index)&&this.inClass(c,"highcharts-tracker")))d.onMouseOut();};e.prototype.inClass=function(c,d){for(var a;c;){if(a=w(c,"class")){if(-1!==a.indexOf(d))return !0;if(-1!==a.indexOf("highcharts-container"))return !1}c=c.parentNode;}};e.prototype.init=function(c,d){this.options=d;this.chart=c;this.runChartClick=!(!d.chart.events||
    !d.chart.events.click);this.pinchDown=[];this.lastValidTouch={};z&&(c.tooltip=new z(c,d.tooltip),this.followTouchMove=J(d.tooltip.followTouchMove,!0));this.setDOMEvents();};e.prototype.normalize=function(c,b){var a=c.touches,h=a?a.length?a.item(0):J(a.changedTouches,c.changedTouches)[0]:c;b||(b=this.getChartPosition());a=h.pageX-b.left;h=h.pageY-b.top;a/=b.scaleX;h/=b.scaleY;return d(c,{chartX:Math.round(a),chartY:Math.round(h)})};e.prototype.onContainerClick=function(c){var b=this.chart,a=b.hoverPoint;
    c=this.normalize(c);var h=b.plotLeft,e=b.plotTop;b.cancelClick||(a&&this.inClass(c.target,"highcharts-tracker")?(k(a.series,"click",d(c,{point:a})),b.hoverPoint&&a.firePointEvent("click",c)):(d(c,this.getCoordinates(c)),b.isInsidePlot(c.chartX-h,c.chartY-e,{visiblePlotOnly:!0})&&k(b,"click",c)));};e.prototype.onContainerMouseDown=function(c){var d=1===((c.buttons||c.button)&1);c=this.normalize(c);if(b.isFirefox&&0!==c.button)this.onContainerMouseMove(c);if("undefined"===typeof c.button||d)this.zoomOption(c),
    d&&c.preventDefault&&c.preventDefault(),this.dragStart(c);};e.prototype.onContainerMouseLeave=function(c){var d=C[J(b.hoverChartIndex,-1)],a=this.chart.tooltip;c=this.normalize(c);d&&(c.relatedTarget||c.toElement)&&(d.pointer.reset(),d.pointer.chartPosition=void 0);a&&!a.isHidden&&this.reset();};e.prototype.onContainerMouseEnter=function(c){delete this.chartPosition;};e.prototype.onContainerMouseMove=function(c){var d=this.chart;c=this.normalize(c);this.setHoverChartIndex();c.preventDefault||(c.returnValue=
    !1);("mousedown"===d.mouseIsDown||this.touchSelect(c))&&this.drag(c);d.openMenu||!this.inClass(c.target,"highcharts-tracker")&&!d.isInsidePlot(c.chartX-d.plotLeft,c.chartY-d.plotTop,{visiblePlotOnly:!0})||this.runPointActions(c);};e.prototype.onDocumentTouchEnd=function(c){C[b.hoverChartIndex]&&C[b.hoverChartIndex].pointer.drop(c);};e.prototype.onContainerTouchMove=function(c){if(this.touchSelect(c))this.onContainerMouseMove(c);else this.touch(c);};e.prototype.onContainerTouchStart=function(c){if(this.touchSelect(c))this.onContainerMouseDown(c);
    else this.zoomOption(c),this.touch(c,!0);};e.prototype.onDocumentMouseMove=function(c){var d=this.chart,a=this.chartPosition;c=this.normalize(c,a);var b=d.tooltip;!a||b&&b.isStickyOnContact()||d.isInsidePlot(c.chartX-d.plotLeft,c.chartY-d.plotTop,{visiblePlotOnly:!0})||this.inClass(c.target,"highcharts-tracker")||this.reset();};e.prototype.onDocumentMouseUp=function(c){var d=C[J(b.hoverChartIndex,-1)];d&&d.pointer.drop(c);};e.prototype.pinch=function(c){var b=this,a=b.chart,h=b.pinchDown,e=c.touches||
    [],f=e.length,l=b.lastValidTouch,m=b.hasZoom,k=b.selectionMarker,n={},q=1===f&&(b.inClass(c.target,"highcharts-tracker")&&a.runTrackerClick||b.runChartClick),u={};1<f&&(b.initiated=!0);m&&b.initiated&&!q&&!1!==c.cancelable&&c.preventDefault();[].map.call(e,function(a){return b.normalize(a)});"touchstart"===c.type?([].forEach.call(e,function(a,c){h[c]={chartX:a.chartX,chartY:a.chartY};}),l.x=[h[0].chartX,h[1]&&h[1].chartX],l.y=[h[0].chartY,h[1]&&h[1].chartY],a.axes.forEach(function(c){if(c.zoomEnabled){var d=
    a.bounds[c.horiz?"h":"v"],b=c.minPixelPadding,h=c.toPixels(Math.min(J(c.options.min,c.dataMin),c.dataMin)),e=c.toPixels(Math.max(J(c.options.max,c.dataMax),c.dataMax)),g=Math.max(h,e);d.min=Math.min(c.pos,Math.min(h,e)-b);d.max=Math.max(c.pos+c.len,g+b);}}),b.res=!0):b.followTouchMove&&1===f?this.runPointActions(b.normalize(c)):h.length&&(k||(b.selectionMarker=k=d({destroy:B,touch:!0},a.plotBox)),b.pinchTranslate(h,e,n,k,u,l),b.hasPinched=m,b.scaleGroups(n,u),b.res&&(b.res=!1,this.reset(!1,0)));};e.prototype.pinchTranslate=
    function(c,d,a,b,e,f){this.zoomHor&&this.pinchTranslateDirection(!0,c,d,a,b,e,f);this.zoomVert&&this.pinchTranslateDirection(!1,c,d,a,b,e,f);};e.prototype.pinchTranslateDirection=function(c,d,a,b,e,f,l,m){var h=this.chart,g=c?"x":"y",r=c?"X":"Y",k="chart"+r,n=c?"width":"height",A=h["plot"+(c?"Left":"Top")],y,q,u=m||1,L=h.inverted,F=h.bounds[c?"h":"v"],v=1===d.length,K=d[0][k],w=a[0][k],E=!v&&d[1][k],x=!v&&a[1][k];a=function(){"number"===typeof x&&20<Math.abs(K-E)&&(u=m||Math.abs(w-x)/Math.abs(K-E));
    q=(A-w)/u+K;y=h["plot"+(c?"Width":"Height")]/u;};a();d=q;if(d<F.min){d=F.min;var J=!0;}else d+y>F.max&&(d=F.max-y,J=!0);J?(w-=.8*(w-l[g][0]),"number"===typeof x&&(x-=.8*(x-l[g][1])),a()):l[g]=[w,x];L||(f[g]=q-A,f[n]=y);f=L?1/u:u;e[n]=y;e[g]=d;b[L?c?"scaleY":"scaleX":"scale"+r]=u;b["translate"+r]=f*A+(w-f*K);};e.prototype.reset=function(c,d){var a=this.chart,b=a.hoverSeries,e=a.hoverPoint,g=a.hoverPoints,f=a.tooltip,l=f&&f.shared?g:e;c&&l&&E(l).forEach(function(a){a.series.isCartesian&&"undefined"===
    typeof a.plotX&&(c=!1);});if(c)f&&l&&E(l).length&&(f.refresh(l),f.shared&&g?g.forEach(function(a){a.setState(a.state,!0);a.series.isCartesian&&(a.series.xAxis.crosshair&&a.series.xAxis.drawCrosshair(null,a),a.series.yAxis.crosshair&&a.series.yAxis.drawCrosshair(null,a));}):e&&(e.setState(e.state,!0),a.axes.forEach(function(a){a.crosshair&&e.series[a.coll]===a&&a.drawCrosshair(null,e);})));else {if(e)e.onMouseOut();g&&g.forEach(function(a){a.setState();});if(b)b.onMouseOut();f&&f.hide(d);this.unDocMouseMove&&
    (this.unDocMouseMove=this.unDocMouseMove());a.axes.forEach(function(a){a.hideCrosshair();});this.hoverX=a.hoverPoints=a.hoverPoint=null;}};e.prototype.runPointActions=function(c,d){var a=this.chart,h=a.tooltip&&a.tooltip.options.enabled?a.tooltip:void 0,e=h?h.shared:!1,g=d||a.hoverPoint,f=g&&g.series||a.hoverSeries;f=this.getHoverData(g,f,a.series,(!c||"touchmove"!==c.type)&&(!!d||f&&f.directTouch&&this.isDirectTouch),e,c);g=f.hoverPoint;var l=f.hoverPoints;d=(f=f.hoverSeries)&&f.tooltipOptions.followPointer&&
    !f.tooltipOptions.split;e=e&&f&&!f.noSharedTooltip;if(g&&(g!==a.hoverPoint||h&&h.isHidden)){(a.hoverPoints||[]).forEach(function(a){-1===l.indexOf(a)&&a.setState();});if(a.hoverSeries!==f)f.onMouseOver();this.applyInactiveState(l);(l||[]).forEach(function(a){a.setState("hover");});a.hoverPoint&&a.hoverPoint.firePointEvent("mouseOut");if(!g.series)return;a.hoverPoints=l;a.hoverPoint=g;g.firePointEvent("mouseOver");h&&h.refresh(e?l:g,c);}else d&&h&&!h.isHidden&&(g=h.getAnchor([{}],c),a.isInsidePlot(g[0],
    g[1],{visiblePlotOnly:!0})&&h.updatePosition({plotX:g[0],plotY:g[1]}));this.unDocMouseMove||(this.unDocMouseMove=x(a.container.ownerDocument,"mousemove",function(a){var c=C[b.hoverChartIndex];if(c)c.pointer.onDocumentMouseMove(a);}),this.eventsToUnbind.push(this.unDocMouseMove));a.axes.forEach(function(d){var b=J((d.crosshair||{}).snap,!0),h;b&&((h=a.hoverPoint)&&h.series[d.coll]===d||(h=q(l,function(a){return a.series[d.coll]===d})));h||!b?d.drawCrosshair(c,h):d.hideCrosshair();});};e.prototype.scaleGroups=
    function(c,d){var a=this.chart,b;a.series.forEach(function(h){b=c||h.getPlotBox();h.xAxis&&h.xAxis.zoomEnabled&&h.group&&(h.group.attr(b),h.markerGroup&&(h.markerGroup.attr(b),h.markerGroup.clip(d?a.clipRect:null)),h.dataLabelsGroup&&h.dataLabelsGroup.attr(b));});a.clipRect.attr(d||a.clipBox);};e.prototype.setDOMEvents=function(){var c=this,d=this.chart.container,a=d.ownerDocument;d.onmousedown=this.onContainerMouseDown.bind(this);d.onmousemove=this.onContainerMouseMove.bind(this);d.onclick=this.onContainerClick.bind(this);
    this.eventsToUnbind.push(x(d,"mouseenter",this.onContainerMouseEnter.bind(this)));this.eventsToUnbind.push(x(d,"mouseleave",this.onContainerMouseLeave.bind(this)));b.unbindDocumentMouseUp||(b.unbindDocumentMouseUp=x(a,"mouseup",this.onDocumentMouseUp.bind(this)));for(var h=this.chart.renderTo.parentElement;h&&"BODY"!==h.tagName;)this.eventsToUnbind.push(x(h,"scroll",function(){delete c.chartPosition;})),h=h.parentElement;b.hasTouch&&(this.eventsToUnbind.push(x(d,"touchstart",this.onContainerTouchStart.bind(this),
    {passive:!1})),this.eventsToUnbind.push(x(d,"touchmove",this.onContainerTouchMove.bind(this),{passive:!1})),b.unbindDocumentTouchEnd||(b.unbindDocumentTouchEnd=x(a,"touchend",this.onDocumentTouchEnd.bind(this),{passive:!1})));};e.prototype.setHoverChartIndex=function(){var c=this.chart,d=b.charts[J(b.hoverChartIndex,-1)];if(d&&d!==c)d.pointer.onContainerMouseLeave({relatedTarget:!0});d&&d.mouseIsDown||(b.hoverChartIndex=c.index);};e.prototype.touch=function(c,d){var a=this.chart;this.setHoverChartIndex();
    if(1===c.touches.length)if(c=this.normalize(c),(a.isInsidePlot(c.chartX-a.plotLeft,c.chartY-a.plotTop,{visiblePlotOnly:!0}))&&!a.openMenu){d&&this.runPointActions(c);if("touchmove"===c.type){d=this.pinchDown;var e=d[0]?4<=Math.sqrt(Math.pow(d[0].chartX-c.chartX,2)+Math.pow(d[0].chartY-c.chartY,2)):!1;}J(e,!0)&&this.pinch(c);}else d&&this.reset();else 2===c.touches.length&&this.pinch(c);};e.prototype.touchSelect=function(c){return !(!this.chart.options.chart.zoomBySingleTouch||!c.touches||1!==c.touches.length)};
    e.prototype.zoomOption=function(c){var d=this.chart,a=d.options.chart,b=a.zoomType||"";d=d.inverted;/touch/.test(c.type)&&(b=J(a.pinchType,b));this.zoomX=c=/x/.test(b);this.zoomY=b=/y/.test(b);this.zoomHor=c&&!d||b&&d;this.zoomVert=b&&!d||c&&d;this.hasZoom=c||b;};return e}();return b.Pointer=e});O(e,"Core/MSPointer.js",[e["Core/Globals.js"],e["Core/Pointer.js"],e["Core/Utilities.js"]],function(e,b,I){function D(){var d=[];d.item=function(d){return this[d]};f(q,function(b){d.push({pageX:b.pageX,pageY:b.pageY,
    target:b.target});});return d}function H(d,b,f,k){"touch"!==d.pointerType&&d.pointerType!==d.MSPOINTER_TYPE_TOUCH||!C[e.hoverChartIndex]||(k(d),k=C[e.hoverChartIndex].pointer,k[b]({type:f,target:d.currentTarget,preventDefault:x,touches:D()}));}var G=this&&this.__extends||function(){var d=function(b,e){d=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(d,b){d.__proto__=b;}||function(d,b){for(var e in b)b.hasOwnProperty(e)&&(d[e]=b[e]);};return d(b,e)};return function(b,e){function f(){this.constructor=
    b;}d(b,e);b.prototype=null===e?Object.create(e):(f.prototype=e.prototype,new f);}}(),C=e.charts,B=e.doc,x=e.noop,w=I.addEvent,v=I.css,f=I.objectEach,d=I.removeEvent,q={},k=!!e.win.PointerEvent;return function(b){function e(){return null!==b&&b.apply(this,arguments)||this}G(e,b);e.prototype.batchMSEvents=function(d){d(this.chart.container,k?"pointerdown":"MSPointerDown",this.onContainerPointerDown);d(this.chart.container,k?"pointermove":"MSPointerMove",this.onContainerPointerMove);d(B,k?"pointerup":
    "MSPointerUp",this.onDocumentPointerUp);};e.prototype.destroy=function(){this.batchMSEvents(d);b.prototype.destroy.call(this);};e.prototype.init=function(d,e){b.prototype.init.call(this,d,e);this.hasZoom&&v(d.container,{"-ms-touch-action":"none","touch-action":"none"});};e.prototype.onContainerPointerDown=function(d){H(d,"onContainerTouchStart","touchstart",function(d){q[d.pointerId]={pageX:d.pageX,pageY:d.pageY,target:d.currentTarget};});};e.prototype.onContainerPointerMove=function(d){H(d,"onContainerTouchMove",
    "touchmove",function(d){q[d.pointerId]={pageX:d.pageX,pageY:d.pageY};q[d.pointerId].target||(q[d.pointerId].target=d.currentTarget);});};e.prototype.onDocumentPointerUp=function(d){H(d,"onDocumentTouchEnd","touchend",function(d){delete q[d.pointerId];});};e.prototype.setDOMEvents=function(){b.prototype.setDOMEvents.call(this);(this.hasZoom||this.followTouchMove)&&this.batchMSEvents(w);};return e}(b)});O(e,"Core/Series/Point.js",[e["Core/Renderer/HTML/AST.js"],e["Core/Animation/AnimationUtilities.js"],
    e["Core/FormatUtilities.js"],e["Core/Globals.js"],e["Core/Options.js"],e["Core/Utilities.js"]],function(e,b,I,z,H,G){var D=b.animObject,B=I.format,x=H.defaultOptions,w=G.addEvent,v=G.defined,f=G.erase,d=G.extend,q=G.fireEvent,k=G.getNestedProperty,l=G.isArray,N=G.isFunction,u=G.isNumber,n=G.isObject,J=G.merge,E=G.objectEach,m=G.pick,c=G.syncTimeout,g=G.removeEvent,a=G.uniqueKey;b=function(){function b(){this.colorIndex=this.category=void 0;this.formatPrefix="point";this.id=void 0;this.isNull=!1;
    this.percentage=this.options=this.name=void 0;this.selected=!1;this.total=this.series=void 0;this.visible=!0;this.x=void 0;}b.prototype.animateBeforeDestroy=function(){var a=this,c={x:a.startXPos,opacity:0},b,e=a.getGraphicalProps();e.singular.forEach(function(d){b="dataLabel"===d;a[d]=a[d].animate(b?{x:a[d].startXPos,y:a[d].startYPos,opacity:0}:c);});e.plural.forEach(function(c){a[c].forEach(function(c){c.element&&c.animate(d({x:a.startXPos},c.startYPos?{x:c.startXPos,y:c.startYPos}:{}));});});};b.prototype.applyOptions=
    function(a,c){var e=this.series,h=e.options.pointValKey||e.pointValKey;a=b.prototype.optionsToObject.call(this,a);d(this,a);this.options=this.options?d(this.options,a):a;a.group&&delete this.group;a.dataLabels&&delete this.dataLabels;h&&(this.y=b.prototype.getNestedProperty.call(this,h));this.formatPrefix=(this.isNull=m(this.isValid&&!this.isValid(),null===this.x||!u(this.y)))?"null":"point";this.selected&&(this.state="select");"name"in this&&"undefined"===typeof c&&e.xAxis&&e.xAxis.hasNames&&(this.x=
    e.xAxis.nameToX(this));"undefined"===typeof this.x&&e&&(this.x="undefined"===typeof c?e.autoIncrement(this):c);return this};b.prototype.destroy=function(){function a(){if(d.graphic||d.dataLabel||d.dataLabels)g(d),d.destroyElements();for(m in d)d[m]=null;}var d=this,b=d.series,e=b.chart;b=b.options.dataSorting;var h=e.hoverPoints,l=D(d.series.chart.renderer.globalAnimation),m;d.legendItem&&e.legend.destroyItem(d);h&&(d.setState(),f(h,d),h.length||(e.hoverPoints=null));if(d===e.hoverPoint)d.onMouseOut();
    b&&b.enabled?(this.animateBeforeDestroy(),c(a,l.duration)):a();e.pointCount--;};b.prototype.destroyElements=function(a){var c=this;a=c.getGraphicalProps(a);a.singular.forEach(function(a){c[a]=c[a].destroy();});a.plural.forEach(function(a){c[a].forEach(function(a){a.element&&a.destroy();});delete c[a];});};b.prototype.firePointEvent=function(a,c,d){var b=this,e=this.series.options;(e.point.events[a]||b.options&&b.options.events&&b.options.events[a])&&b.importEvents();"click"===a&&e.allowPointSelect&&(d=
    function(a){b.select&&b.select(null,a.ctrlKey||a.metaKey||a.shiftKey);});q(b,a,c,d);};b.prototype.getClassName=function(){return "highcharts-point"+(this.selected?" highcharts-point-select":"")+(this.negative?" highcharts-negative":"")+(this.isNull?" highcharts-null-point":"")+("undefined"!==typeof this.colorIndex?" highcharts-color-"+this.colorIndex:"")+(this.options.className?" "+this.options.className:"")+(this.zone&&this.zone.className?" "+this.zone.className.replace("highcharts-negative",""):"")};
    b.prototype.getGraphicalProps=function(a){var c=this,d=[],b,e={singular:[],plural:[]};a=a||{graphic:1,dataLabel:1};a.graphic&&d.push("graphic","upperGraphic","shadowGroup");a.dataLabel&&d.push("dataLabel","dataLabelUpper","connector");for(b=d.length;b--;){var h=d[b];c[h]&&e.singular.push(h);}["dataLabel","connector"].forEach(function(d){var b=d+"s";a[d]&&c[b]&&e.plural.push(b);});return e};b.prototype.getLabelConfig=function(){return {x:this.category,y:this.y,color:this.color,colorIndex:this.colorIndex,
    key:this.name||this.category,series:this.series,point:this,percentage:this.percentage,total:this.total||this.stackTotal}};b.prototype.getNestedProperty=function(a){if(a)return 0===a.indexOf("custom.")?k(a,this.options):this[a]};b.prototype.getZone=function(){var a=this.series,c=a.zones;a=a.zoneAxis||"y";var d=0,b;for(b=c[d];this[a]>=b.value;)b=c[++d];this.nonZonedColor||(this.nonZonedColor=this.color);this.color=b&&b.color&&!this.options.color?b.color:this.nonZonedColor;return b};b.prototype.hasNewShapeType=
    function(){return (this.graphic&&(this.graphic.symbolName||this.graphic.element.nodeName))!==this.shapeType};b.prototype.init=function(c,d,b){this.series=c;this.applyOptions(d,b);this.id=v(this.id)?this.id:a();this.resolveColor();c.chart.pointCount++;q(this,"afterInit");return this};b.prototype.optionsToObject=function(a){var c={},d=this.series,e=d.options.keys,h=e||d.pointArrayMap||["y"],g=h.length,f=0,r=0;if(u(a)||null===a)c[h[0]]=a;else if(l(a))for(!e&&a.length>g&&(d=typeof a[0],"string"===d?c.name=
    a[0]:"number"===d&&(c.x=a[0]),f++);r<g;)e&&"undefined"===typeof a[f]||(0<h[r].indexOf(".")?b.prototype.setNestedProperty(c,a[f],h[r]):c[h[r]]=a[f]),f++,r++;else "object"===typeof a&&(c=a,a.dataLabels&&(d._hasPointLabels=!0),a.marker&&(d._hasPointMarkers=!0));return c};b.prototype.resolveColor=function(){var a=this.series;var c=a.chart.options.chart.colorCount;var d=a.chart.styledMode;delete this.nonZonedColor;if(a.options.colorByPoint){if(!d){c=a.options.colors||a.chart.options.colors;var b=c[a.colorCounter];
    c=c.length;}d=a.colorCounter;a.colorCounter++;a.colorCounter===c&&(a.colorCounter=0);}else d||(b=a.color),d=a.colorIndex;this.colorIndex=m(this.options.colorIndex,d);this.color=m(this.options.color,b);};b.prototype.setNestedProperty=function(a,c,d){d.split(".").reduce(function(a,d,b,e){a[d]=e.length-1===b?c:n(a[d],!0)?a[d]:{};return a[d]},a);return a};b.prototype.tooltipFormatter=function(a){var c=this.series,d=c.tooltipOptions,b=m(d.valueDecimals,""),e=d.valuePrefix||"",h=d.valueSuffix||"";c.chart.styledMode&&
    (a=c.chart.tooltip.styledModeFormat(a));(c.pointArrayMap||["y"]).forEach(function(c){c="{point."+c;if(e||h)a=a.replace(RegExp(c+"}","g"),e+c+"}"+h);a=a.replace(RegExp(c+"}","g"),c+":,."+b+"f}");});return B(a,{point:this,series:this.series},c.chart)};b.prototype.update=function(a,c,d,b){function e(){h.applyOptions(a);var b=f&&h.hasDummyGraphic;b=null===h.y?!b:b;f&&b&&(h.graphic=f.destroy(),delete h.hasDummyGraphic);n(a,!0)&&(f&&f.element&&a&&a.marker&&"undefined"!==typeof a.marker.symbol&&(h.graphic=
    f.destroy()),a&&a.dataLabels&&h.dataLabel&&(h.dataLabel=h.dataLabel.destroy()),h.connector&&(h.connector=h.connector.destroy()));r=h.index;g.updateParallelArrays(h,r);k.data[r]=n(k.data[r],!0)||n(a,!0)?h.options:m(a,k.data[r]);g.isDirty=g.isDirtyData=!0;!g.fixedBox&&g.hasCartesianSeries&&(l.isDirtyBox=!0);"point"===k.legendType&&(l.isDirtyLegend=!0);c&&l.redraw(d);}var h=this,g=h.series,f=h.graphic,r,l=g.chart,k=g.options;c=m(c,!0);!1===b?e():h.firePointEvent("update",{options:a},e);};b.prototype.remove=
    function(a,c){this.series.removePoint(this.series.data.indexOf(this),a,c);};b.prototype.select=function(a,c){var d=this,b=d.series,e=b.chart;this.selectedStaging=a=m(a,!d.selected);d.firePointEvent(a?"select":"unselect",{accumulate:c},function(){d.selected=d.options.selected=a;b.options.data[b.data.indexOf(d)]=d.options;d.setState(a&&"select");c||e.getSelectedPoints().forEach(function(a){var c=a.series;a.selected&&a!==d&&(a.selected=a.options.selected=!1,c.options.data[c.data.indexOf(a)]=a.options,
    a.setState(e.hoverPoints&&c.options.inactiveOtherPoints?"inactive":""),a.firePointEvent("unselect"));});});delete this.selectedStaging;};b.prototype.onMouseOver=function(a){var c=this.series.chart,d=c.pointer;a=a?d.normalize(a):d.getChartCoordinatesFromPoint(this,c.inverted);d.runPointActions(a,this);};b.prototype.onMouseOut=function(){var a=this.series.chart;this.firePointEvent("mouseOut");this.series.options.inactiveOtherPoints||(a.hoverPoints||[]).forEach(function(a){a.setState();});a.hoverPoints=a.hoverPoint=
    null;};b.prototype.importEvents=function(){if(!this.hasImportedEvents){var a=this,c=J(a.series.options.point,a.options).events;a.events=c;E(c,function(c,d){N(c)&&w(a,d,c);});this.hasImportedEvents=!0;}};b.prototype.setState=function(a,c){var b=this.series,h=this.state,g=b.options.states[a||"normal"]||{},f=x.plotOptions[b.type].marker&&b.options.marker,r=f&&!1===f.enabled,l=f&&f.states&&f.states[a||"normal"]||{},k=!1===l.enabled,n=b.stateMarkerGraphic,p=this.marker||{},A=b.chart,v=b.halo,w,F=f&&b.markerAttribs;
    a=a||"";if(!(a===this.state&&!c||this.selected&&"select"!==a||!1===g.enabled||a&&(k||r&&!1===l.enabled)||a&&p.states&&p.states[a]&&!1===p.states[a].enabled)){this.state=a;F&&(w=b.markerAttribs(this,a));if(this.graphic&&!this.hasDummyGraphic){h&&this.graphic.removeClass("highcharts-point-"+h);a&&this.graphic.addClass("highcharts-point-"+a);if(!A.styledMode){var S=b.pointAttribs(this,a);var K=m(A.options.chart.animation,g.animation);b.options.inactiveOtherPoints&&u(S.opacity)&&((this.dataLabels||[]).forEach(function(a){a&&
    a.animate({opacity:S.opacity},K);}),this.connector&&this.connector.animate({opacity:S.opacity},K));this.graphic.animate(S,K);}w&&this.graphic.animate(w,m(A.options.chart.animation,l.animation,f.animation));n&&n.hide();}else {if(a&&l){h=p.symbol||b.symbol;n&&n.currentSymbol!==h&&(n=n.destroy());if(w)if(n)n[c?"animate":"attr"]({x:w.x,y:w.y});else h&&(b.stateMarkerGraphic=n=A.renderer.symbol(h,w.x,w.y,w.width,w.height).add(b.markerGroup),n.currentSymbol=h);!A.styledMode&&n&&n.attr(b.pointAttribs(this,a));}n&&
    (n[a&&this.isInside?"show":"hide"](),n.element.point=this);}g=g.halo;w=(n=this.graphic||n)&&n.visibility||"inherit";g&&g.size&&n&&"hidden"!==w&&!this.isCluster?(v||(b.halo=v=A.renderer.path().add(n.parentGroup)),v.show()[c?"animate":"attr"]({d:this.haloPath(g.size)}),v.attr({"class":"highcharts-halo highcharts-color-"+m(this.colorIndex,b.colorIndex)+(this.className?" "+this.className:""),visibility:w,zIndex:-1}),v.point=this,A.styledMode||v.attr(d({fill:this.color||b.color,"fill-opacity":g.opacity},
    e.filterUserAttributes(g.attributes||{})))):v&&v.point&&v.point.haloPath&&v.animate({d:v.point.haloPath(0)},null,v.hide);q(this,"afterSetState",{state:a});}};b.prototype.haloPath=function(a){return this.series.chart.renderer.symbols.circle(Math.floor(this.plotX)-a,this.plotY-a,2*a,2*a)};return b}();return z.Point=b});O(e,"Core/Legend.js",[e["Core/Animation/AnimationUtilities.js"],e["Core/FormatUtilities.js"],e["Core/Globals.js"],e["Core/Series/Point.js"],e["Core/Utilities.js"]],function(e,b,I,z,H){var D=
    e.animObject,C=e.setAnimation,B=b.format;e=I.isFirefox;var x=I.marginNames;b=I.win;var w=H.addEvent,v=H.createElement,f=H.css,d=H.defined,q=H.discardElement,k=H.find,l=H.fireEvent,N=H.isNumber,u=H.merge,n=H.pick,J=H.relativeLength,E=H.stableSort,m=H.syncTimeout;H=H.wrap;var c=function(){function c(a,c){this.allItems=[];this.contentGroup=this.box=void 0;this.display=!1;this.group=void 0;this.offsetWidth=this.maxLegendWidth=this.maxItemWidth=this.legendWidth=this.legendHeight=this.lastLineHeight=this.lastItemY=
    this.itemY=this.itemX=this.itemMarginTop=this.itemMarginBottom=this.itemHeight=this.initialItemY=0;this.options={};this.padding=0;this.pages=[];this.proximate=!1;this.scrollGroup=void 0;this.widthOption=this.totalItemWidth=this.titleHeight=this.symbolWidth=this.symbolHeight=0;this.chart=a;this.init(a,c);}c.prototype.init=function(a,c){this.chart=a;this.setOptions(c);c.enabled&&(this.render(),w(this.chart,"endResize",function(){this.legend.positionCheckboxes();}),this.proximate?this.unchartrender=w(this.chart,
    "render",function(){this.legend.proximatePositions();this.legend.positionItems();}):this.unchartrender&&this.unchartrender());};c.prototype.setOptions=function(a){var c=n(a.padding,8);this.options=a;this.chart.styledMode||(this.itemStyle=a.itemStyle,this.itemHiddenStyle=u(this.itemStyle,a.itemHiddenStyle));this.itemMarginTop=a.itemMarginTop||0;this.itemMarginBottom=a.itemMarginBottom||0;this.padding=c;this.initialItemY=c-5;this.symbolWidth=n(a.symbolWidth,16);this.pages=[];this.proximate="proximate"===
    a.layout&&!this.chart.inverted;this.baseline=void 0;};c.prototype.update=function(a,c){var d=this.chart;this.setOptions(u(!0,this.options,a));this.destroy();d.isDirtyLegend=d.isDirtyBox=!0;n(c,!0)&&d.redraw();l(this,"afterUpdate");};c.prototype.colorizeItem=function(a,c){a.legendGroup[c?"removeClass":"addClass"]("highcharts-legend-item-hidden");if(!this.chart.styledMode){var d=this.options,b=a.legendItem,e=a.legendLine,h=a.legendSymbol,g=this.itemHiddenStyle.color;d=c?d.itemStyle.color:g;var f=c?a.color||
    g:g,m=a.options&&a.options.marker,k={fill:f};b&&b.css({fill:d,color:d});e&&e.attr({stroke:f});h&&(m&&h.isMarker&&(k=a.pointAttribs(),c||(k.stroke=k.fill=g)),h.attr(k));}l(this,"afterColorizeItem",{item:a,visible:c});};c.prototype.positionItems=function(){this.allItems.forEach(this.positionItem,this);this.chart.isResizing||this.positionCheckboxes();};c.prototype.positionItem=function(a){var c=this,b=this.options,e=b.symbolPadding,g=!b.rtl,f=a._legendItemPos;b=f[0];f=f[1];var k=a.checkbox,m=a.legendGroup;
    m&&m.element&&(e={translateX:g?b:this.legendWidth-b-2*e-4,translateY:f},g=function(){l(c,"afterPositionItem",{item:a});},d(m.translateY)?m.animate(e,void 0,g):(m.attr(e),g()));k&&(k.x=b,k.y=f);};c.prototype.destroyItem=function(a){var c=a.checkbox;["legendItem","legendLine","legendSymbol","legendGroup"].forEach(function(c){a[c]&&(a[c]=a[c].destroy());});c&&q(a.checkbox);};c.prototype.destroy=function(){function a(a){this[a]&&(this[a]=this[a].destroy());}this.getAllItems().forEach(function(c){["legendItem",
    "legendGroup"].forEach(a,c);});"clipRect up down pager nav box title group".split(" ").forEach(a,this);this.display=null;};c.prototype.positionCheckboxes=function(){var a=this.group&&this.group.alignAttr,c=this.clipHeight||this.legendHeight,d=this.titleHeight;if(a){var b=a.translateY;this.allItems.forEach(function(e){var h=e.checkbox;if(h){var g=b+d+h.y+(this.scrollOffset||0)+3;f(h,{left:a.translateX+e.checkboxOffset+h.x-20+"px",top:g+"px",display:this.proximate||g>b-6&&g<b+c-6?"":"none"});}},this);}};
    c.prototype.renderTitle=function(){var a=this.options,c=this.padding,d=a.title,b=0;d.text&&(this.title||(this.title=this.chart.renderer.label(d.text,c-3,c-4,null,null,null,a.useHTML,null,"legend-title").attr({zIndex:1}),this.chart.styledMode||this.title.css(d.style),this.title.add(this.group)),d.width||this.title.css({width:this.maxLegendWidth+"px"}),a=this.title.getBBox(),b=a.height,this.offsetWidth=a.width,this.contentGroup.attr({translateY:b}));this.titleHeight=b;};c.prototype.setText=function(a){var c=
    this.options;a.legendItem.attr({text:c.labelFormat?B(c.labelFormat,a,this.chart):c.labelFormatter.call(a)});};c.prototype.renderItem=function(a){var c=this.chart,d=c.renderer,b=this.options,e=this.symbolWidth,g=b.symbolPadding||0,f=this.itemStyle,l=this.itemHiddenStyle,k="horizontal"===b.layout?n(b.itemDistance,20):0,m=!b.rtl,q=a.legendItem,t=!a.series,p=!t&&a.series.drawLegendSymbol?a.series:a,v=p.options,w=this.createCheckboxForItem&&v&&v.showCheckbox;v=e+g+k+(w?20:0);var E=b.useHTML,F=a.options.className;
    q||(a.legendGroup=d.g("legend-item").addClass("highcharts-"+p.type+"-series highcharts-color-"+a.colorIndex+(F?" "+F:"")+(t?" highcharts-series-"+a.index:"")).attr({zIndex:1}).add(this.scrollGroup),a.legendItem=q=d.text("",m?e+g:-g,this.baseline||0,E),c.styledMode||q.css(u(a.visible?f:l)),q.attr({align:m?"left":"right",zIndex:2}).add(a.legendGroup),this.baseline||(this.fontMetrics=d.fontMetrics(c.styledMode?12:f.fontSize,q),this.baseline=this.fontMetrics.f+3+this.itemMarginTop,q.attr("y",this.baseline),
    this.symbolHeight=b.symbolHeight||this.fontMetrics.f,b.squareSymbol&&(this.symbolWidth=n(b.symbolWidth,Math.max(this.symbolHeight,16)),v=this.symbolWidth+g+k+(w?20:0),m&&q.attr("x",this.symbolWidth+g))),p.drawLegendSymbol(this,a),this.setItemEvents&&this.setItemEvents(a,q,E));w&&!a.checkbox&&this.createCheckboxForItem&&this.createCheckboxForItem(a);this.colorizeItem(a,a.visible);!c.styledMode&&f.width||q.css({width:(b.itemWidth||this.widthOption||c.spacingBox.width)-v+"px"});this.setText(a);c=q.getBBox();
    a.itemWidth=a.checkboxOffset=b.itemWidth||a.legendItemWidth||c.width+v;this.maxItemWidth=Math.max(this.maxItemWidth,a.itemWidth);this.totalItemWidth+=a.itemWidth;this.itemHeight=a.itemHeight=Math.round(a.legendItemHeight||c.height||this.symbolHeight);};c.prototype.layoutItem=function(a){var c=this.options,d=this.padding,b="horizontal"===c.layout,e=a.itemHeight,g=this.itemMarginBottom,f=this.itemMarginTop,l=b?n(c.itemDistance,20):0,m=this.maxLegendWidth;c=c.alignColumns&&this.totalItemWidth>m?this.maxItemWidth:
    a.itemWidth;b&&this.itemX-d+c>m&&(this.itemX=d,this.lastLineHeight&&(this.itemY+=f+this.lastLineHeight+g),this.lastLineHeight=0);this.lastItemY=f+this.itemY+g;this.lastLineHeight=Math.max(e,this.lastLineHeight);a._legendItemPos=[this.itemX,this.itemY];b?this.itemX+=c:(this.itemY+=f+e+g,this.lastLineHeight=e);this.offsetWidth=this.widthOption||Math.max((b?this.itemX-d-(a.checkbox?0:l):c)+d,this.offsetWidth);};c.prototype.getAllItems=function(){var a=[];this.chart.series.forEach(function(c){var b=c&&
    c.options;c&&n(b.showInLegend,d(b.linkedTo)?!1:void 0,!0)&&(a=a.concat(c.legendItems||("point"===b.legendType?c.data:c)));});l(this,"afterGetAllItems",{allItems:a});return a};c.prototype.getAlignment=function(){var a=this.options;return this.proximate?a.align.charAt(0)+"tv":a.floating?"":a.align.charAt(0)+a.verticalAlign.charAt(0)+a.layout.charAt(0)};c.prototype.adjustMargins=function(a,c){var b=this.chart,e=this.options,h=this.getAlignment();h&&[/(lth|ct|rth)/,/(rtv|rm|rbv)/,/(rbh|cb|lbh)/,/(lbv|lm|ltv)/].forEach(function(g,
    f){g.test(h)&&!d(a[f])&&(b[x[f]]=Math.max(b[x[f]],b.legend[(f+1)%2?"legendHeight":"legendWidth"]+[1,-1,-1,1][f]*e[f%2?"x":"y"]+n(e.margin,12)+c[f]+(b.titleOffset[f]||0)));});};c.prototype.proximatePositions=function(){var a=this.chart,c=[],d="left"===this.options.align;this.allItems.forEach(function(b){var e;var h=d;if(b.yAxis){b.xAxis.options.reversed&&(h=!h);b.points&&(e=k(h?b.points:b.points.slice(0).reverse(),function(a){return N(a.plotY)}));h=this.itemMarginTop+b.legendItem.getBBox().height+this.itemMarginBottom;
    var g=b.yAxis.top-a.plotTop;b.visible?(e=e?e.plotY:b.yAxis.height,e+=g-.3*h):e=g+b.yAxis.height;c.push({target:e,size:h,item:b});}},this);I.distribute(c,a.plotHeight);c.forEach(function(c){c.item._legendItemPos[1]=a.plotTop-a.spacing[0]+c.pos;});};c.prototype.render=function(){var a=this.chart,c=a.renderer,d=this.group,b=this.box,e=this.options,g=this.padding;this.itemX=g;this.itemY=this.initialItemY;this.lastItemY=this.offsetWidth=0;this.widthOption=J(e.width,a.spacingBox.width-g);var f=a.spacingBox.width-
    2*g-e.x;-1<["rm","lm"].indexOf(this.getAlignment().substring(0,2))&&(f/=2);this.maxLegendWidth=this.widthOption||f;d||(this.group=d=c.g("legend").attr({zIndex:7}).add(),this.contentGroup=c.g().attr({zIndex:1}).add(d),this.scrollGroup=c.g().add(this.contentGroup));this.renderTitle();var m=this.getAllItems();E(m,function(a,c){return (a.options&&a.options.legendIndex||0)-(c.options&&c.options.legendIndex||0)});e.reversed&&m.reverse();this.allItems=m;this.display=f=!!m.length;this.itemHeight=this.totalItemWidth=
    this.maxItemWidth=this.lastLineHeight=0;m.forEach(this.renderItem,this);m.forEach(this.layoutItem,this);m=(this.widthOption||this.offsetWidth)+g;var k=this.lastItemY+this.lastLineHeight+this.titleHeight;k=this.handleOverflow(k);k+=g;b||(this.box=b=c.rect().addClass("highcharts-legend-box").attr({r:e.borderRadius}).add(d),b.isNew=!0);a.styledMode||b.attr({stroke:e.borderColor,"stroke-width":e.borderWidth||0,fill:e.backgroundColor||"none"}).shadow(e.shadow);0<m&&0<k&&(b[b.isNew?"attr":"animate"](b.crisp.call({},
    {x:0,y:0,width:m,height:k},b.strokeWidth())),b.isNew=!1);b[f?"show":"hide"]();a.styledMode&&"none"===d.getStyle("display")&&(m=k=0);this.legendWidth=m;this.legendHeight=k;f&&this.align();this.proximate||this.positionItems();l(this,"afterRender");};c.prototype.align=function(a){void 0===a&&(a=this.chart.spacingBox);var c=this.chart,d=this.options,b=a.y;/(lth|ct|rth)/.test(this.getAlignment())&&0<c.titleOffset[0]?b+=c.titleOffset[0]:/(lbh|cb|rbh)/.test(this.getAlignment())&&0<c.titleOffset[2]&&(b-=c.titleOffset[2]);
    b!==a.y&&(a=u(a,{y:b}));this.group.align(u(d,{width:this.legendWidth,height:this.legendHeight,verticalAlign:this.proximate?"top":d.verticalAlign}),!0,a);};c.prototype.handleOverflow=function(a){var c=this,d=this.chart,b=d.renderer,e=this.options,g=e.y,f=this.padding;g=d.spacingBox.height+("top"===e.verticalAlign?-g:g)-f;var m=e.maxHeight,k,l=this.clipRect,q=e.navigation,t=n(q.animation,!0),p=q.arrowSize||12,u=this.nav,v=this.pages,w,F=this.allItems,S=function(a){"number"===typeof a?l.attr({height:a}):
    l&&(c.clipRect=l.destroy(),c.contentGroup.clip());c.contentGroup.div&&(c.contentGroup.div.style.clip=a?"rect("+f+"px,9999px,"+(f+a)+"px,0)":"auto");},K=function(a){c[a]=b.circle(0,0,1.3*p).translate(p/2,p/2).add(u);d.styledMode||c[a].attr("fill","rgba(0,0,0,0.0001)");return c[a]};"horizontal"!==e.layout||"middle"===e.verticalAlign||e.floating||(g/=2);m&&(g=Math.min(g,m));v.length=0;a&&0<g&&a>g&&!1!==q.enabled?(this.clipHeight=k=Math.max(g-20-this.titleHeight-f,0),this.currentPage=n(this.currentPage,
    1),this.fullHeight=a,F.forEach(function(a,c){var d=a._legendItemPos[1],b=Math.round(a.legendItem.getBBox().height),e=v.length;if(!e||d-v[e-1]>k&&(w||d)!==v[e-1])v.push(w||d),e++;a.pageIx=e-1;w&&(F[c-1].pageIx=e-1);c===F.length-1&&d+b-v[e-1]>k&&d!==w&&(v.push(d),a.pageIx=e);d!==w&&(w=d);}),l||(l=c.clipRect=b.clipRect(0,f,9999,0),c.contentGroup.clip(l)),S(k),u||(this.nav=u=b.g().attr({zIndex:1}).add(this.group),this.up=b.symbol("triangle",0,0,p,p).add(u),K("upTracker").on("click",function(){c.scroll(-1,
    t);}),this.pager=b.text("",15,10).addClass("highcharts-legend-navigation"),d.styledMode||this.pager.css(q.style),this.pager.add(u),this.down=b.symbol("triangle-down",0,0,p,p).add(u),K("downTracker").on("click",function(){c.scroll(1,t);})),c.scroll(0),a=g):u&&(S(),this.nav=u.destroy(),this.scrollGroup.attr({translateY:1}),this.clipHeight=0);return a};c.prototype.scroll=function(a,c){var d=this,b=this.chart,e=this.pages,h=e.length,g=this.currentPage+a;a=this.clipHeight;var f=this.options.navigation,k=
    this.pager,q=this.padding;g>h&&(g=h);0<g&&("undefined"!==typeof c&&C(c,b),this.nav.attr({translateX:q,translateY:a+this.padding+7+this.titleHeight,visibility:"visible"}),[this.up,this.upTracker].forEach(function(a){a.attr({"class":1===g?"highcharts-legend-nav-inactive":"highcharts-legend-nav-active"});}),k.attr({text:g+"/"+h}),[this.down,this.downTracker].forEach(function(a){a.attr({x:18+this.pager.getBBox().width,"class":g===h?"highcharts-legend-nav-inactive":"highcharts-legend-nav-active"});},this),
    b.styledMode||(this.up.attr({fill:1===g?f.inactiveColor:f.activeColor}),this.upTracker.css({cursor:1===g?"default":"pointer"}),this.down.attr({fill:g===h?f.inactiveColor:f.activeColor}),this.downTracker.css({cursor:g===h?"default":"pointer"})),this.scrollOffset=-e[g-1]+this.initialItemY,this.scrollGroup.animate({translateY:this.scrollOffset}),this.currentPage=g,this.positionCheckboxes(),c=D(n(c,b.renderer.globalAnimation,!0)),m(function(){l(d,"afterScroll",{currentPage:g});},c.duration));};c.prototype.setItemEvents=
    function(a,c,d){var b=this,e=b.chart.renderer.boxWrapper,h=a instanceof z,g="highcharts-legend-"+(h?"point":"series")+"-active",f=b.chart.styledMode;(d?[c,a.legendSymbol]:[a.legendGroup]).forEach(function(d){if(d)d.on("mouseover",function(){a.visible&&b.allItems.forEach(function(c){a!==c&&c.setState("inactive",!h);});a.setState("hover");a.visible&&e.addClass(g);f||c.css(b.options.itemHoverStyle);}).on("mouseout",function(){b.chart.styledMode||c.css(u(a.visible?b.itemStyle:b.itemHiddenStyle));b.allItems.forEach(function(c){a!==
    c&&c.setState("",!h);});e.removeClass(g);a.setState();}).on("click",function(c){var d=function(){a.setVisible&&a.setVisible();b.allItems.forEach(function(c){a!==c&&c.setState(a.visible?"inactive":"",!h);});};e.removeClass(g);c={browserEvent:c};a.firePointEvent?a.firePointEvent("legendItemClick",c,d):l(a,"legendItemClick",c,d);});});};c.prototype.createCheckboxForItem=function(a){a.checkbox=v("input",{type:"checkbox",className:"highcharts-legend-checkbox",checked:a.selected,defaultChecked:a.selected},this.options.itemCheckboxStyle,
    this.chart.container);w(a.checkbox,"click",function(c){l(a.series||a,"checkboxClick",{checked:c.target.checked,item:a},function(){a.select();});});};return c}();(/Trident\/7\.0/.test(b.navigator&&b.navigator.userAgent)||e)&&H(c.prototype,"positionItem",function(c,a){var d=this,b=function(){a._legendItemPos&&c.call(d,a);};b();d.bubbleLegend||setTimeout(b);});I.Legend=c;return I.Legend});O(e,"Core/Series/SeriesRegistry.js",[e["Core/Globals.js"],e["Core/Options.js"],e["Core/Series/Point.js"],e["Core/Utilities.js"]],
    function(e,b,I,z){var D=b.defaultOptions,G=z.error,C=z.extendClass,B=z.merge,x;(function(b){function v(e,d){var f=D.plotOptions||{},k=d.defaultOptions;d.prototype.pointClass||(d.prototype.pointClass=I);d.prototype.type=e;k&&(f[e]=k);b.seriesTypes[e]=d;}b.seriesTypes=e.seriesTypes;b.getSeries=function(e,d){void 0===d&&(d={});var f=e.options.chart;f=d.type||f.type||f.defaultSeriesType||"";var k=b.seriesTypes[f];b||G(17,!0,e,{missingModuleFor:f});f=new k;"function"===typeof f.init&&f.init(e,d);return f};
    b.registerSeriesType=v;b.seriesType=function(e,d,q,k,l){var f=D.plotOptions||{};d=d||"";f[e]=B(f[d],q);v(e,C(b.seriesTypes[d]||function(){},k));b.seriesTypes[e].prototype.type=e;l&&(b.seriesTypes[e].prototype.pointClass=C(I,l));return b.seriesTypes[e]};})(x||(x={}));e.seriesType=x.seriesType;return x});O(e,"Core/Chart/Chart.js",[e["Core/Animation/AnimationUtilities.js"],e["Core/Axis/Axis.js"],e["Core/FormatUtilities.js"],e["Core/Globals.js"],e["Core/Legend.js"],e["Core/MSPointer.js"],e["Core/Options.js"],
    e["Core/Color/Palette.js"],e["Core/Pointer.js"],e["Core/Series/SeriesRegistry.js"],e["Core/Time.js"],e["Core/Utilities.js"],e["Core/Renderer/HTML/AST.js"]],function(e,b,I,z,H,G,C,B,x,w,v,f,d){var q=e.animate,k=e.animObject,l=e.setAnimation,D=I.numberFormat,u=z.charts,n=z.doc,J=z.win,E=C.defaultOptions,m=C.defaultTime,c=w.seriesTypes,g=f.addEvent,a=f.attr,h=f.cleanRecursively,r=f.createElement,A=f.css,y=f.defined,L=f.discardElement,P=f.erase,R=f.error,V=f.extend,Q=f.find,M=f.fireEvent,t=f.getStyle,
    p=f.isArray,O=f.isFunction,Z=f.isNumber,ea=f.isObject,F=f.isString,S=f.merge,K=f.objectEach,T=f.pick,X=f.pInt,U=f.relativeLength,fa=f.removeEvent,Y=f.splat,ba=f.syncTimeout,ha=f.uniqueKey,ca=z.marginNames,aa=function(){function e(a,c,d){this.series=this.renderTo=this.renderer=this.pointer=this.pointCount=this.plotWidth=this.plotTop=this.plotLeft=this.plotHeight=this.plotBox=this.options=this.numberFormatter=this.margin=this.legend=this.labelCollectors=this.isResizing=this.index=this.container=this.colorCounter=
    this.clipBox=this.chartWidth=this.chartHeight=this.bounds=this.axisOffset=this.axes=void 0;this.sharedClips={};this.yAxis=this.xAxis=this.userOptions=this.titleOffset=this.time=this.symbolCounter=this.spacingBox=this.spacing=void 0;this.getArgs(a,c,d);}e.prototype.getArgs=function(a,c,d){F(a)||a.nodeName?(this.renderTo=a,this.init(c,d)):this.init(a,c);};e.prototype.init=function(a,c){var d=a.plotOptions||{};M(this,"init",{args:arguments},function(){var b=S(E,a),e=b.chart;K(b.plotOptions,function(a,
    c){ea(a)&&(a.tooltip=d[c]&&S(d[c].tooltip)||void 0);});b.tooltip.userOptions=a.chart&&a.chart.forExport&&a.tooltip.userOptions||a.tooltip;this.userOptions=a;var h=e.events;this.margin=[];this.spacing=[];this.bounds={h:{},v:{}};this.labelCollectors=[];this.callback=c;this.isResizing=0;this.options=b;this.axes=[];this.series=[];this.time=a.time&&Object.keys(a.time).length?new v(a.time):z.time;this.numberFormatter=e.numberFormatter||D;this.styledMode=e.styledMode;this.hasCartesianSeries=e.showAxes;var f=
    this;f.index=u.length;u.push(f);z.chartCount++;h&&K(h,function(a,c){O(a)&&g(f,c,a);});f.xAxis=[];f.yAxis=[];f.pointCount=f.colorCounter=f.symbolCounter=0;M(f,"afterInit");f.firstRender();});};e.prototype.initSeries=function(a){var d=this.options.chart;d=a.type||d.type||d.defaultSeriesType;var b=c[d];b||R(17,!0,this,{missingModuleFor:d});d=new b;"function"===typeof d.init&&d.init(this,a);return d};e.prototype.setSeriesData=function(){this.getSeriesOrderByLinks().forEach(function(a){a.points||a.data||
    !a.enabledDataSorting||a.setData(a.options.data,!1);});};e.prototype.getSeriesOrderByLinks=function(){return this.series.concat().sort(function(a,c){return a.linkedSeries.length||c.linkedSeries.length?c.linkedSeries.length-a.linkedSeries.length:0})};e.prototype.orderSeries=function(a){var c=this.series;for(a=a||0;a<c.length;a++)c[a]&&(c[a].index=a,c[a].name=c[a].getName());};e.prototype.isInsidePlot=function(a,c,d){void 0===d&&(d={});var b=this.inverted,e=this.plotBox,h=this.plotLeft,g=this.plotTop,
    f=this.scrollablePlotBox,m=this.scrollingContainer;m=void 0===m?{scrollLeft:0,scrollTop:0}:m;var k=m.scrollLeft;m=m.scrollTop;var l=d.series;e=d.visiblePlotOnly&&f||e;f=d.inverted?c:a;c=d.inverted?a:c;a={x:f,y:c,isInsidePlot:!0};if(!d.ignoreX){var F=l&&(b?l.yAxis:l.xAxis)||{pos:h,len:Infinity};f=d.paneCoordinates?F.pos+f:h+f;f>=Math.max(k+h,F.pos)&&f<=Math.min(k+h+e.width,F.pos+F.len)||(a.isInsidePlot=!1);}!d.ignoreY&&a.isInsidePlot&&(b=l&&(b?l.xAxis:l.yAxis)||{pos:g,len:Infinity},d=d.paneCoordinates?
    b.pos+c:g+c,d>=Math.max(m+g,b.pos)&&d<=Math.min(m+g+e.height,b.pos+b.len)||(a.isInsidePlot=!1));M(this,"afterIsInsidePlot",a);return a.isInsidePlot};e.prototype.redraw=function(a){M(this,"beforeRedraw");var c=this.hasCartesianSeries?this.axes:this.colorAxis||[],d=this.series,b=this.pointer,e=this.legend,h=this.userOptions.legend,g=this.isDirtyLegend,f=this.isDirtyBox,m=this.renderer,k=m.isHidden(),F=[];this.setResponsive&&this.setResponsive(!1);l(this.hasRendered?a:!1,this);k&&this.temporaryDisplay();
    this.layOutTitles();for(a=d.length;a--;){var n=d[a];if(n.options.stacking||n.options.centerInCategory){var r=!0;if(n.isDirty){var K=!0;break}}}if(K)for(a=d.length;a--;)n=d[a],n.options.stacking&&(n.isDirty=!0);d.forEach(function(a){a.isDirty&&("point"===a.options.legendType?("function"===typeof a.updateTotals&&a.updateTotals(),g=!0):h&&(h.labelFormatter||h.labelFormat)&&(g=!0));a.isDirtyData&&M(a,"updatedData");});g&&e&&e.options.enabled&&(e.render(),this.isDirtyLegend=!1);r&&this.getStacks();c.forEach(function(a){a.updateNames();
    a.setScale();});this.getMargins();c.forEach(function(a){a.isDirty&&(f=!0);});c.forEach(function(a){var c=a.min+","+a.max;a.extKey!==c&&(a.extKey=c,F.push(function(){M(a,"afterSetExtremes",V(a.eventArgs,a.getExtremes()));delete a.eventArgs;}));(f||r)&&a.redraw();});f&&this.drawChartBox();M(this,"predraw");d.forEach(function(a){(f||a.isDirty)&&a.visible&&a.redraw();a.isDirtyData=!1;});b&&b.reset(!0);m.draw();M(this,"redraw");M(this,"render");k&&this.temporaryDisplay(!0);F.forEach(function(a){a.call();});};
    e.prototype.get=function(a){function c(c){return c.id===a||c.options&&c.options.id===a}var d=this.series,b;var e=Q(this.axes,c)||Q(this.series,c);for(b=0;!e&&b<d.length;b++)e=Q(d[b].points||[],c);return e};e.prototype.getAxes=function(){var a=this,c=this.options,d=c.xAxis=Y(c.xAxis||{});c=c.yAxis=Y(c.yAxis||{});M(this,"getAxes");d.forEach(function(a,c){a.index=c;a.isX=!0;});c.forEach(function(a,c){a.index=c;});d.concat(c).forEach(function(c){new b(a,c);});M(this,"afterGetAxes");};e.prototype.getSelectedPoints=
    function(){var a=[];this.series.forEach(function(c){a=a.concat(c.getPointsCollection().filter(function(a){return T(a.selectedStaging,a.selected)}));});return a};e.prototype.getSelectedSeries=function(){return this.series.filter(function(a){return a.selected})};e.prototype.setTitle=function(a,c,d){this.applyDescription("title",a);this.applyDescription("subtitle",c);this.applyDescription("caption",void 0);this.layOutTitles(d);};e.prototype.applyDescription=function(a,c){var d=this,b="title"===a?{color:B.neutralColor80,
    fontSize:this.options.isStock?"16px":"18px"}:{color:B.neutralColor60};b=this.options[a]=S(!this.styledMode&&{style:b},this.options[a],c);var e=this[a];e&&c&&(this[a]=e=e.destroy());b&&!e&&(e=this.renderer.text(b.text,0,0,b.useHTML).attr({align:b.align,"class":"highcharts-"+a,zIndex:b.zIndex||4}).add(),e.update=function(c){d[{title:"setTitle",subtitle:"setSubtitle",caption:"setCaption"}[a]](c);},this.styledMode||e.css(b.style),this[a]=e);};e.prototype.layOutTitles=function(a){var c=[0,0,0],d=this.renderer,
    b=this.spacingBox;["title","subtitle","caption"].forEach(function(a){var e=this[a],h=this.options[a],g=h.verticalAlign||"top";a="title"===a?-3:"top"===g?c[0]+2:0;if(e){if(!this.styledMode)var f=h.style.fontSize;f=d.fontMetrics(f,e).b;e.css({width:(h.width||b.width+(h.widthAdjust||0))+"px"});var m=Math.round(e.getBBox(h.useHTML).height);e.align(V({y:"bottom"===g?f:a+f,height:m},h),!1,"spacingBox");h.floating||("top"===g?c[0]=Math.ceil(c[0]+m):"bottom"===g&&(c[2]=Math.ceil(c[2]+m)));}},this);c[0]&&"top"===
    (this.options.title.verticalAlign||"top")&&(c[0]+=this.options.title.margin);c[2]&&"bottom"===this.options.caption.verticalAlign&&(c[2]+=this.options.caption.margin);var e=!this.titleOffset||this.titleOffset.join(",")!==c.join(",");this.titleOffset=c;M(this,"afterLayOutTitles");!this.isDirtyBox&&e&&(this.isDirtyBox=this.isDirtyLegend=e,this.hasRendered&&T(a,!0)&&this.isDirtyBox&&this.redraw());};e.prototype.getChartSize=function(){var a=this.options.chart,c=a.width;a=a.height;var d=this.renderTo;y(c)||
    (this.containerWidth=t(d,"width"));y(a)||(this.containerHeight=t(d,"height"));this.chartWidth=Math.max(0,c||this.containerWidth||600);this.chartHeight=Math.max(0,U(a,this.chartWidth)||(1<this.containerHeight?this.containerHeight:400));};e.prototype.temporaryDisplay=function(a){var c=this.renderTo;if(a)for(;c&&c.style;)c.hcOrigStyle&&(A(c,c.hcOrigStyle),delete c.hcOrigStyle),c.hcOrigDetached&&(n.body.removeChild(c),c.hcOrigDetached=!1),c=c.parentNode;else for(;c&&c.style;){n.body.contains(c)||c.parentNode||
    (c.hcOrigDetached=!0,n.body.appendChild(c));if("none"===t(c,"display",!1)||c.hcOricDetached)c.hcOrigStyle={display:c.style.display,height:c.style.height,overflow:c.style.overflow},a={display:"block",overflow:"hidden"},c!==this.renderTo&&(a.height=0),A(c,a),c.offsetWidth||c.style.setProperty("display","block","important");c=c.parentNode;if(c===n.body)break}};e.prototype.setClassName=function(a){this.container.className="highcharts-container "+(a||"");};e.prototype.getContainer=function(){var c=this.options,
    d=c.chart;var b=this.renderTo;var e=ha(),h,g;b||(this.renderTo=b=d.renderTo);F(b)&&(this.renderTo=b=n.getElementById(b));b||R(13,!0,this);var f=X(a(b,"data-highcharts-chart"));Z(f)&&u[f]&&u[f].hasRendered&&u[f].destroy();a(b,"data-highcharts-chart",this.index);b.innerHTML="";d.skipClone||b.offsetWidth||this.temporaryDisplay();this.getChartSize();f=this.chartWidth;var m=this.chartHeight;A(b,{overflow:"hidden"});this.styledMode||(h=V({position:"relative",overflow:"hidden",width:f+"px",height:m+"px",
    textAlign:"left",lineHeight:"normal",zIndex:0,"-webkit-tap-highlight-color":"rgba(0,0,0,0)",userSelect:"none","touch-action":"manipulation",outline:"none"},d.style||{}));this.container=b=r("div",{id:e},h,b);this._cursor=b.style.cursor;this.renderer=new (z[d.renderer]||z.Renderer)(b,f,m,null,d.forExport,c.exporting&&c.exporting.allowHTML,this.styledMode);l(void 0,this);this.setClassName(d.className);if(this.styledMode)for(g in c.defs)this.renderer.definition(c.defs[g]);else this.renderer.setStyle(d.style);
    this.renderer.chartIndex=this.index;M(this,"afterGetContainer");};e.prototype.getMargins=function(a){var c=this.spacing,d=this.margin,b=this.titleOffset;this.resetMargins();b[0]&&!y(d[0])&&(this.plotTop=Math.max(this.plotTop,b[0]+c[0]));b[2]&&!y(d[2])&&(this.marginBottom=Math.max(this.marginBottom,b[2]+c[2]));this.legend&&this.legend.display&&this.legend.adjustMargins(d,c);M(this,"getMargins");a||this.getAxisMargins();};e.prototype.getAxisMargins=function(){var a=this,c=a.axisOffset=[0,0,0,0],d=a.colorAxis,
    b=a.margin,e=function(a){a.forEach(function(a){a.visible&&a.getOffset();});};a.hasCartesianSeries?e(a.axes):d&&d.length&&e(d);ca.forEach(function(d,e){y(b[e])||(a[d]+=c[e]);});a.setChartSize();};e.prototype.reflow=function(a){var c=this,d=c.options.chart,b=c.renderTo,e=y(d.width)&&y(d.height),h=d.width||t(b,"width");d=d.height||t(b,"height");b=a?a.target:J;delete c.pointer.chartPosition;if(!e&&!c.isPrinting&&h&&d&&(b===J||b===n)){if(h!==c.containerWidth||d!==c.containerHeight)f.clearTimeout(c.reflowTimeout),
    c.reflowTimeout=ba(function(){c.container&&c.setSize(void 0,void 0,!1);},a?100:0);c.containerWidth=h;c.containerHeight=d;}};e.prototype.setReflow=function(a){var c=this;!1===a||this.unbindReflow?!1===a&&this.unbindReflow&&(this.unbindReflow=this.unbindReflow()):(this.unbindReflow=g(J,"resize",function(a){c.options&&c.reflow(a);}),g(this,"destroy",this.unbindReflow));};e.prototype.setSize=function(a,c,d){var b=this,e=b.renderer;b.isResizing+=1;l(d,b);d=e.globalAnimation;b.oldChartHeight=b.chartHeight;
    b.oldChartWidth=b.chartWidth;"undefined"!==typeof a&&(b.options.chart.width=a);"undefined"!==typeof c&&(b.options.chart.height=c);b.getChartSize();b.styledMode||(d?q:A)(b.container,{width:b.chartWidth+"px",height:b.chartHeight+"px"},d);b.setChartSize(!0);e.setSize(b.chartWidth,b.chartHeight,d);b.axes.forEach(function(a){a.isDirty=!0;a.setScale();});b.isDirtyLegend=!0;b.isDirtyBox=!0;b.layOutTitles();b.getMargins();b.redraw(d);b.oldChartHeight=null;M(b,"resize");ba(function(){b&&M(b,"endResize",null,
    function(){--b.isResizing;});},k(d).duration);};e.prototype.setChartSize=function(a){var c=this.inverted,d=this.renderer,b=this.chartWidth,e=this.chartHeight,h=this.options.chart,g=this.spacing,f=this.clipOffset,m,l,k,F;this.plotLeft=m=Math.round(this.plotLeft);this.plotTop=l=Math.round(this.plotTop);this.plotWidth=k=Math.max(0,Math.round(b-m-this.marginRight));this.plotHeight=F=Math.max(0,Math.round(e-l-this.marginBottom));this.plotSizeX=c?F:k;this.plotSizeY=c?k:F;this.plotBorderWidth=h.plotBorderWidth||
    0;this.spacingBox=d.spacingBox={x:g[3],y:g[0],width:b-g[3]-g[1],height:e-g[0]-g[2]};this.plotBox=d.plotBox={x:m,y:l,width:k,height:F};e=2*Math.floor(this.plotBorderWidth/2);c=Math.ceil(Math.max(e,f[3])/2);b=Math.ceil(Math.max(e,f[0])/2);this.clipBox={x:c,y:b,width:Math.floor(this.plotSizeX-Math.max(e,f[1])/2-c),height:Math.max(0,Math.floor(this.plotSizeY-Math.max(e,f[2])/2-b))};a||(this.axes.forEach(function(a){a.setAxisSize();a.setAxisTranslation();}),d.alignElements());M(this,"afterSetChartSize",
    {skipAxes:a});};e.prototype.resetMargins=function(){M(this,"resetMargins");var a=this,c=a.options.chart;["margin","spacing"].forEach(function(d){var b=c[d],e=ea(b)?b:[b,b,b,b];["Top","Right","Bottom","Left"].forEach(function(b,h){a[d][h]=T(c[d+b],e[h]);});});ca.forEach(function(c,d){a[c]=T(a.margin[d],a.spacing[d]);});a.axisOffset=[0,0,0,0];a.clipOffset=[0,0,0,0];};e.prototype.drawChartBox=function(){var a=this.options.chart,c=this.renderer,d=this.chartWidth,b=this.chartHeight,e=this.chartBackground,h=
    this.plotBackground,g=this.plotBorder,f=this.styledMode,m=this.plotBGImage,k=a.backgroundColor,l=a.plotBackgroundColor,F=a.plotBackgroundImage,n,r=this.plotLeft,K=this.plotTop,q=this.plotWidth,p=this.plotHeight,u=this.plotBox,v=this.clipRect,t=this.clipBox,w="animate";e||(this.chartBackground=e=c.rect().addClass("highcharts-background").add(),w="attr");if(f)var y=n=e.strokeWidth();else {y=a.borderWidth||0;n=y+(a.shadow?8:0);k={fill:k||"none"};if(y||e["stroke-width"])k.stroke=a.borderColor,k["stroke-width"]=
    y;e.attr(k).shadow(a.shadow);}e[w]({x:n/2,y:n/2,width:d-n-y%2,height:b-n-y%2,r:a.borderRadius});w="animate";h||(w="attr",this.plotBackground=h=c.rect().addClass("highcharts-plot-background").add());h[w](u);f||(h.attr({fill:l||"none"}).shadow(a.plotShadow),F&&(m?(F!==m.attr("href")&&m.attr("href",F),m.animate(u)):this.plotBGImage=c.image(F,r,K,q,p).add()));v?v.animate({width:t.width,height:t.height}):this.clipRect=c.clipRect(t);w="animate";g||(w="attr",this.plotBorder=g=c.rect().addClass("highcharts-plot-border").attr({zIndex:1}).add());
    f||g.attr({stroke:a.plotBorderColor,"stroke-width":a.plotBorderWidth||0,fill:"none"});g[w](g.crisp({x:r,y:K,width:q,height:p},-g.strokeWidth()));this.isDirtyBox=!1;M(this,"afterDrawChartBox");};e.prototype.propFromSeries=function(){var a=this,d=a.options.chart,b,e=a.options.series,h,g;["inverted","angular","polar"].forEach(function(f){b=c[d.type||d.defaultSeriesType];g=d[f]||b&&b.prototype[f];for(h=e&&e.length;!g&&h--;)(b=c[e[h].type])&&b.prototype[f]&&(g=!0);a[f]=g;});};e.prototype.linkSeries=function(){var a=
    this,c=a.series;c.forEach(function(a){a.linkedSeries.length=0;});c.forEach(function(c){var d=c.options.linkedTo;F(d)&&(d=":previous"===d?a.series[c.index-1]:a.get(d))&&d.linkedParent!==c&&(d.linkedSeries.push(c),c.linkedParent=d,d.enabledDataSorting&&c.setDataSortingOptions(),c.visible=T(c.options.visible,d.options.visible,c.visible));});M(this,"afterLinkSeries");};e.prototype.renderSeries=function(){this.series.forEach(function(a){a.translate();a.render();});};e.prototype.renderLabels=function(){var a=
    this,c=a.options.labels;c.items&&c.items.forEach(function(d){var b=V(c.style,d.style),e=X(b.left)+a.plotLeft,h=X(b.top)+a.plotTop+12;delete b.left;delete b.top;a.renderer.text(d.html,e,h).attr({zIndex:2}).css(b).add();});};e.prototype.render=function(){var a=this.axes,c=this.colorAxis,d=this.renderer,b=this.options,e=0,h=function(a){a.forEach(function(a){a.visible&&a.render();});};this.setTitle();this.legend=new H(this,b.legend);this.getStacks&&this.getStacks();this.getMargins(!0);this.setChartSize();
    b=this.plotWidth;a.some(function(a){if(a.horiz&&a.visible&&a.options.labels.enabled&&a.series.length)return e=21,!0});var g=this.plotHeight=Math.max(this.plotHeight-e,0);a.forEach(function(a){a.setScale();});this.getAxisMargins();var f=1.1<b/this.plotWidth;var m=1.05<g/this.plotHeight;if(f||m)a.forEach(function(a){(a.horiz&&f||!a.horiz&&m)&&a.setTickInterval(!0);}),this.getMargins();this.drawChartBox();this.hasCartesianSeries?h(a):c&&c.length&&h(c);this.seriesGroup||(this.seriesGroup=d.g("series-group").attr({zIndex:3}).add());
    this.renderSeries();this.renderLabels();this.addCredits();this.setResponsive&&this.setResponsive();this.hasRendered=!0;};e.prototype.addCredits=function(a){var c=this,d=S(!0,this.options.credits,a);d.enabled&&!this.credits&&(this.credits=this.renderer.text(d.text+(this.mapCredits||""),0,0).addClass("highcharts-credits").on("click",function(){d.href&&(J.location.href=d.href);}).attr({align:d.position.align,zIndex:8}),c.styledMode||this.credits.css(d.style),this.credits.add().align(d.position),this.credits.update=
    function(a){c.credits=c.credits.destroy();c.addCredits(a);});};e.prototype.destroy=function(){var a=this,c=a.axes,d=a.series,b=a.container,e,h=b&&b.parentNode;M(a,"destroy");a.renderer.forExport?P(u,a):u[a.index]=void 0;z.chartCount--;a.renderTo.removeAttribute("data-highcharts-chart");fa(a);for(e=c.length;e--;)c[e]=c[e].destroy();this.scroller&&this.scroller.destroy&&this.scroller.destroy();for(e=d.length;e--;)d[e]=d[e].destroy();"title subtitle chartBackground plotBackground plotBGImage plotBorder seriesGroup clipRect credits pointer rangeSelector legend resetZoomButton tooltip renderer".split(" ").forEach(function(c){var d=
    a[c];d&&d.destroy&&(a[c]=d.destroy());});b&&(b.innerHTML="",fa(b),h&&L(b));K(a,function(c,d){delete a[d];});};e.prototype.firstRender=function(){var a=this,c=a.options;if(!a.isReadyToRender||a.isReadyToRender()){a.getContainer();a.resetMargins();a.setChartSize();a.propFromSeries();a.getAxes();(p(c.series)?c.series:[]).forEach(function(c){a.initSeries(c);});a.linkSeries();a.setSeriesData();M(a,"beforeRender");x&&(a.pointer=z.hasTouch||!J.PointerEvent&&!J.MSPointerEvent?new x(a,c):new G(a,c));a.render();
    a.pointer.getChartPosition();if(!a.renderer.imgCount&&!a.hasLoaded)a.onload();a.temporaryDisplay(!0);}};e.prototype.onload=function(){this.callbacks.concat([this.callback]).forEach(function(a){a&&"undefined"!==typeof this.index&&a.apply(this,[this]);},this);M(this,"load");M(this,"render");y(this.index)&&this.setReflow(this.options.chart.reflow);this.hasLoaded=!0;};e.prototype.addSeries=function(a,c,d){var b,e=this;a&&(c=T(c,!0),M(e,"addSeries",{options:a},function(){b=e.initSeries(a);e.isDirtyLegend=
    !0;e.linkSeries();b.enabledDataSorting&&b.setData(a.data,!1);M(e,"afterAddSeries",{series:b});c&&e.redraw(d);}));return b};e.prototype.addAxis=function(a,c,d,b){return this.createAxis(c?"xAxis":"yAxis",{axis:a,redraw:d,animation:b})};e.prototype.addColorAxis=function(a,c,d){return this.createAxis("colorAxis",{axis:a,redraw:c,animation:d})};e.prototype.createAxis=function(a,c){var d="colorAxis"===a,e=c.redraw,h=c.animation;a=S(c.axis,{index:this[a].length,isX:"xAxis"===a});a=d?new z.ColorAxis(this,
    a):new b(this,a);d&&(this.isDirtyLegend=!0,this.axes.forEach(function(a){a.series=[];}),this.series.forEach(function(a){a.bindAxes();a.isDirtyData=!0;}));T(e,!0)&&this.redraw(h);return a};e.prototype.showLoading=function(a){var c=this,b=c.options,e=c.loadingDiv,h=c.loadingSpan,f=b.loading,m=function(){e&&A(e,{left:c.plotLeft+"px",top:c.plotTop+"px",width:c.plotWidth+"px",height:c.plotHeight+"px"});};e||(c.loadingDiv=e=r("div",{className:"highcharts-loading highcharts-loading-hidden"},null,c.container));
    h||(c.loadingSpan=h=r("span",{className:"highcharts-loading-inner"},null,e),g(c,"redraw",m));e.className="highcharts-loading";d.setElementHTML(h,T(a,b.lang.loading,""));c.styledMode||(A(e,V(f.style,{zIndex:10})),A(h,f.labelStyle),c.loadingShown||(A(e,{opacity:0,display:""}),q(e,{opacity:f.style.opacity||.5},{duration:f.showDuration||0})));c.loadingShown=!0;m();};e.prototype.hideLoading=function(){var a=this.options,c=this.loadingDiv;c&&(c.className="highcharts-loading highcharts-loading-hidden",this.styledMode||
    q(c,{opacity:0},{duration:a.loading.hideDuration||100,complete:function(){A(c,{display:"none"});}}));this.loadingShown=!1;};e.prototype.update=function(a,c,d,b){var e=this,g={credits:"addCredits",title:"setTitle",subtitle:"setSubtitle",caption:"setCaption"},f,k,l,n=a.isResponsiveOptions,r=[];M(e,"update",{options:a});n||e.setResponsive(!1,!0);a=h(a,e.options);e.userOptions=S(e.userOptions,a);if(f=a.chart){S(!0,e.options.chart,f);"className"in f&&e.setClassName(f.className);"reflow"in f&&e.setReflow(f.reflow);
    if("inverted"in f||"polar"in f||"type"in f){e.propFromSeries();var q=!0;}"alignTicks"in f&&(q=!0);K(f,function(a,c){-1!==e.propsRequireUpdateSeries.indexOf("chart."+c)&&(k=!0);-1!==e.propsRequireDirtyBox.indexOf(c)&&(e.isDirtyBox=!0);-1!==e.propsRequireReflow.indexOf(c)&&(n?e.isDirtyBox=!0:l=!0);});!e.styledMode&&"style"in f&&e.renderer.setStyle(f.style);}!e.styledMode&&a.colors&&(this.options.colors=a.colors);a.time&&(this.time===m&&(this.time=new v(a.time)),S(!0,e.options.time,a.time));K(a,function(c,
    d){if(e[d]&&"function"===typeof e[d].update)e[d].update(c,!1);else if("function"===typeof e[g[d]])e[g[d]](c);else "colors"!==d&&-1===e.collectionsWithUpdate.indexOf(d)&&S(!0,e.options[d],a[d]);"chart"!==d&&-1!==e.propsRequireUpdateSeries.indexOf(d)&&(k=!0);});this.collectionsWithUpdate.forEach(function(c){if(a[c]){var b=[];e[c].forEach(function(a,c){a.options.isInternal||b.push(T(a.options.index,c));});Y(a[c]).forEach(function(a,h){var g=y(a.id),f;g&&(f=e.get(a.id));!f&&e[c]&&(f=e[c][b?b[h]:h])&&g&&
    y(f.options.id)&&(f=void 0);f&&f.coll===c&&(f.update(a,!1),d&&(f.touched=!0));!f&&d&&e.collectionsWithInit[c]&&(e.collectionsWithInit[c][0].apply(e,[a].concat(e.collectionsWithInit[c][1]||[]).concat([!1])).touched=!0);});d&&e[c].forEach(function(a){a.touched||a.options.isInternal?delete a.touched:r.push(a);});}});r.forEach(function(a){a.chart&&a.remove(!1);});q&&e.axes.forEach(function(a){a.update({},!1);});k&&e.getSeriesOrderByLinks().forEach(function(a){a.chart&&a.update({},!1);},this);q=f&&f.width;f=
    f&&f.height;F(f)&&(f=U(f,q||e.chartWidth));l||Z(q)&&q!==e.chartWidth||Z(f)&&f!==e.chartHeight?e.setSize(q,f,b):T(c,!0)&&e.redraw(b);M(e,"afterUpdate",{options:a,redraw:c,animation:b});};e.prototype.setSubtitle=function(a,c){this.applyDescription("subtitle",a);this.layOutTitles(c);};e.prototype.setCaption=function(a,c){this.applyDescription("caption",a);this.layOutTitles(c);};e.prototype.showResetZoom=function(){function a(){c.zoomOut();}var c=this,d=E.lang,b=c.options.chart.resetZoomButton,e=b.theme,
    h=e.states,g="chart"===b.relativeTo||"spacingBox"===b.relativeTo?null:"scrollablePlotBox";M(this,"beforeShowResetZoom",null,function(){c.resetZoomButton=c.renderer.button(d.resetZoom,null,null,a,e,h&&h.hover).attr({align:b.position.align,title:d.resetZoomTitle}).addClass("highcharts-reset-zoom").add().align(b.position,!1,g);});M(this,"afterShowResetZoom");};e.prototype.zoomOut=function(){M(this,"selection",{resetSelection:!0},this.zoom);};e.prototype.zoom=function(a){var c=this,d,b=c.pointer,e=!1,h=
    c.inverted?b.mouseDownX:b.mouseDownY;!a||a.resetSelection?(c.axes.forEach(function(a){d=a.zoom();}),b.initiated=!1):a.xAxis.concat(a.yAxis).forEach(function(a){var g=a.axis,f=c.inverted?g.left:g.top,m=c.inverted?f+g.width:f+g.height,k=g.isXAxis,l=!1;if(!k&&h>=f&&h<=m||k||!y(h))l=!0;b[k?"zoomX":"zoomY"]&&l&&(d=g.zoom(a.min,a.max),g.displayBtn&&(e=!0));});var g=c.resetZoomButton;e&&!g?c.showResetZoom():!e&&ea(g)&&(c.resetZoomButton=g.destroy());d&&c.redraw(T(c.options.chart.animation,a&&a.animation,100>
    c.pointCount));};e.prototype.pan=function(a,c){var d=this,b=d.hoverPoints,e=d.options.chart,h=d.options.mapNavigation&&d.options.mapNavigation.enabled,g;c="object"===typeof c?c:{enabled:c,type:"x"};e&&e.panning&&(e.panning=c);var f=c.type;M(this,"pan",{originalEvent:a},function(){b&&b.forEach(function(a){a.setState();});var c=[1];"xy"===f?c=[1,0]:"y"===f&&(c=[0]);c.forEach(function(c){var b=d[c?"xAxis":"yAxis"][0],e=b.horiz,m=a[e?"chartX":"chartY"];e=e?"mouseDownX":"mouseDownY";var k=d[e],l=(b.pointRange||
    0)/2,F=b.reversed&&!d.inverted||!b.reversed&&d.inverted?-1:1,n=b.getExtremes(),r=b.toValue(k-m,!0)+l*F;F=b.toValue(k+b.len-m,!0)-l*F;var K=F<r;k=K?F:r;r=K?r:F;F=b.hasVerticalPanning();var q=b.panningState;!F||c||q&&!q.isDirty||b.series.forEach(function(a){var c=a.getProcessedData(!0);c=a.getExtremes(c.yData,!0);q||(q={startMin:Number.MAX_VALUE,startMax:-Number.MAX_VALUE});Z(c.dataMin)&&Z(c.dataMax)&&(q.startMin=Math.min(T(a.options.threshold,Infinity),c.dataMin,q.startMin),q.startMax=Math.max(T(a.options.threshold,
    -Infinity),c.dataMax,q.startMax));});c=Math.min(T(q&&q.startMin,n.dataMin),l?n.min:b.toValue(b.toPixels(n.min)-b.minPixelPadding));l=Math.max(T(q&&q.startMax,n.dataMax),l?n.max:b.toValue(b.toPixels(n.max)+b.minPixelPadding));b.panningState=q;b.isOrdinal||(F=c-k,0<F&&(r+=F,k=c),F=r-l,0<F&&(r=l,k-=F),b.series.length&&k!==n.min&&r!==n.max&&k>=c&&r<=l&&(b.setExtremes(k,r,!1,!1,{trigger:"pan"}),d.resetZoomButton||h||k===c||r===l||!f.match("y")||(d.showResetZoom(),b.displayBtn=!1),g=!0),d[e]=m);});g&&d.redraw(!1);
    A(d.container,{cursor:"move"});});};return e}();V(aa.prototype,{callbacks:[],collectionsWithInit:{xAxis:[aa.prototype.addAxis,[!0]],yAxis:[aa.prototype.addAxis,[!1]],series:[aa.prototype.addSeries]},collectionsWithUpdate:["xAxis","yAxis","zAxis","series"],propsRequireDirtyBox:"backgroundColor borderColor borderWidth borderRadius plotBackgroundColor plotBackgroundImage plotBorderColor plotBorderWidth plotShadow shadow".split(" "),propsRequireReflow:"margin marginTop marginRight marginBottom marginLeft spacing spacingTop spacingRight spacingBottom spacingLeft".split(" "),
    propsRequireUpdateSeries:"chart.inverted chart.polar chart.ignoreHiddenSeries chart.type colors plotOptions time tooltip".split(" ")});z.chart=function(a,c,d){return new aa(a,c,d)};z.Chart=aa;return aa});O(e,"Mixins/LegendSymbol.js",[e["Core/Globals.js"],e["Core/Utilities.js"]],function(e,b){var D=b.merge,z=b.pick;return e.LegendSymbolMixin={drawRectangle:function(b,e){var D=b.symbolHeight,B=b.options.squareSymbol;e.legendSymbol=this.chart.renderer.rect(B?(b.symbolWidth-D)/2:0,b.baseline-D+1,B?
    D:b.symbolWidth,D,z(b.options.symbolRadius,D/2)).addClass("highcharts-point").attr({zIndex:3}).add(e.legendGroup);},drawLineMarker:function(b){var e=this.options,C=e.marker,B=b.symbolWidth,x=b.symbolHeight,w=x/2,v=this.chart.renderer,f=this.legendGroup;b=b.baseline-Math.round(.3*b.fontMetrics.b);var d={};this.chart.styledMode||(d={"stroke-width":e.lineWidth||0},e.dashStyle&&(d.dashstyle=e.dashStyle));this.legendLine=v.path([["M",0,b],["L",B,b]]).addClass("highcharts-graph").attr(d).add(f);C&&!1!==
    C.enabled&&B&&(e=Math.min(z(C.radius,w),w),0===this.symbol.indexOf("url")&&(C=D(C,{width:x,height:x}),e=0),this.legendSymbol=C=v.symbol(this.symbol,B/2-e,b-e,2*e,2*e,C).addClass("highcharts-point").add(f),C.isMarker=!0);}}});O(e,"Core/Series/Series.js",[e["Core/Animation/AnimationUtilities.js"],e["Core/Globals.js"],e["Mixins/LegendSymbol.js"],e["Core/Options.js"],e["Core/Color/Palette.js"],e["Core/Series/Point.js"],e["Core/Series/SeriesRegistry.js"],e["Core/Renderer/SVG/SVGElement.js"],e["Core/Utilities.js"]],
    function(e,b,I,z,H,G,C,B,x){var w=e.animObject,v=e.setAnimation,f=b.hasTouch,d=b.svg,q=b.win,k=z.defaultOptions,l=C.seriesTypes,D=x.addEvent,u=x.arrayMax,n=x.arrayMin,J=x.clamp,E=x.cleanRecursively,m=x.correctFloat,c=x.defined,g=x.erase,a=x.error,h=x.extend,r=x.find,A=x.fireEvent,y=x.getNestedProperty,L=x.isArray,P=x.isFunction,R=x.isNumber,V=x.isString,Q=x.merge,M=x.objectEach,t=x.pick,p=x.removeEvent,O=x.splat,Z=x.syncTimeout;e=function(){function b(){this.zones=this.yAxis=this.xAxis=this.userOptions=
    this.tooltipOptions=this.processedYData=this.processedXData=this.points=this.options=this.linkedSeries=this.index=this.eventsToUnbind=this.eventOptions=this.data=this.chart=this._i=void 0;}b.prototype.init=function(a,c){A(this,"init",{options:c});var d=this,b=a.series,e;this.eventOptions=this.eventOptions||{};this.eventsToUnbind=[];d.chart=a;d.options=d.setOptions(c);var g=d.options;d.linkedSeries=[];d.bindAxes();h(d,{name:g.name,state:"",visible:!1!==g.visible,selected:!0===g.selected});c=g.events;
    M(c,function(a,c){P(a)&&d.eventOptions[c]!==a&&(P(d.eventOptions[c])&&p(d,c,d.eventOptions[c]),d.eventOptions[c]=a,D(d,c,a));});if(c&&c.click||g.point&&g.point.events&&g.point.events.click||g.allowPointSelect)a.runTrackerClick=!0;d.getColor();d.getSymbol();d.parallelArrays.forEach(function(a){d[a+"Data"]||(d[a+"Data"]=[]);});d.isCartesian&&(a.hasCartesianSeries=!0);b.length&&(e=b[b.length-1]);d._i=t(e&&e._i,-1)+1;d.opacity=d.options.opacity;a.orderSeries(this.insert(b));g.dataSorting&&g.dataSorting.enabled?
    d.setDataSortingOptions():d.points||d.data||d.setData(g.data,!1);A(this,"afterInit");};b.prototype.is=function(a){return l[a]&&this instanceof l[a]};b.prototype.insert=function(a){var c=this.options.index,d;if(R(c)){for(d=a.length;d--;)if(c>=t(a[d].options.index,a[d]._i)){a.splice(d+1,0,this);break}-1===d&&a.unshift(this);d+=1;}else a.push(this);return t(d,a.length-1)};b.prototype.bindAxes=function(){var c=this,d=c.options,b=c.chart,e;A(this,"bindAxes",null,function(){(c.axisTypes||[]).forEach(function(h){var g=
    0;b[h].forEach(function(a){e=a.options;if(d[h]===g&&!e.isInternal||"undefined"!==typeof d[h]&&d[h]===e.id||"undefined"===typeof d[h]&&0===e.index)c.insert(a.series),c[h]=a,a.isDirty=!0;e.isInternal||g++;});c[h]||c.optionalAxis===h||a(18,!0,b);});});A(this,"afterBindAxes");};b.prototype.updateParallelArrays=function(a,c){var d=a.series,b=arguments,e=R(c)?function(b){var e="y"===b&&d.toYData?d.toYData(a):a[b];d[b+"Data"][c]=e;}:function(a){Array.prototype[c].apply(d[a+"Data"],Array.prototype.slice.call(b,
    2));};d.parallelArrays.forEach(e);};b.prototype.hasData=function(){return this.visible&&"undefined"!==typeof this.dataMax&&"undefined"!==typeof this.dataMin||this.visible&&this.yData&&0<this.yData.length};b.prototype.autoIncrement=function(){var a=this.options,c=this.xIncrement,d,b=a.pointIntervalUnit,e=this.chart.time;c=t(c,a.pointStart,0);this.pointInterval=d=t(this.pointInterval,a.pointInterval,1);b&&(a=new e.Date(c),"day"===b?e.set("Date",a,e.get("Date",a)+d):"month"===b?e.set("Month",a,e.get("Month",
    a)+d):"year"===b&&e.set("FullYear",a,e.get("FullYear",a)+d),d=a.getTime()-c);this.xIncrement=c+d;return c};b.prototype.setDataSortingOptions=function(){var a=this.options;h(this,{requireSorting:!1,sorted:!1,enabledDataSorting:!0,allowDG:!1});c(a.pointRange)||(a.pointRange=1);};b.prototype.setOptions=function(a){var d=this.chart,b=d.options,e=b.plotOptions,h=d.userOptions||{};a=Q(a);d=d.styledMode;var g={plotOptions:e,userOptions:a};A(this,"setOptions",g);var f=g.plotOptions[this.type],m=h.plotOptions||
    {};this.userOptions=g.userOptions;h=Q(f,e.series,h.plotOptions&&h.plotOptions[this.type],a);this.tooltipOptions=Q(k.tooltip,k.plotOptions.series&&k.plotOptions.series.tooltip,k.plotOptions[this.type].tooltip,b.tooltip.userOptions,e.series&&e.series.tooltip,e[this.type].tooltip,a.tooltip);this.stickyTracking=t(a.stickyTracking,m[this.type]&&m[this.type].stickyTracking,m.series&&m.series.stickyTracking,this.tooltipOptions.shared&&!this.noSharedTooltip?!0:h.stickyTracking);null===f.marker&&delete h.marker;
    this.zoneAxis=h.zoneAxis;b=this.zones=(h.zones||[]).slice();!h.negativeColor&&!h.negativeFillColor||h.zones||(e={value:h[this.zoneAxis+"Threshold"]||h.threshold||0,className:"highcharts-negative"},d||(e.color=h.negativeColor,e.fillColor=h.negativeFillColor),b.push(e));b.length&&c(b[b.length-1].value)&&b.push(d?{}:{color:this.color,fillColor:this.fillColor});A(this,"afterSetOptions",{options:h});return h};b.prototype.getName=function(){return t(this.options.name,"Series "+(this.index+1))};b.prototype.getCyclic=
    function(a,d,b){var e=this.chart,h=this.userOptions,g=a+"Index",f=a+"Counter",m=b?b.length:t(e.options.chart[a+"Count"],e[a+"Count"]);if(!d){var k=t(h[g],h["_"+g]);c(k)||(e.series.length||(e[f]=0),h["_"+g]=k=e[f]%m,e[f]+=1);b&&(d=b[k]);}"undefined"!==typeof k&&(this[g]=k);this[a]=d;};b.prototype.getColor=function(){this.chart.styledMode?this.getCyclic("color"):this.options.colorByPoint?this.color=H.neutralColor20:this.getCyclic("color",this.options.color||k.plotOptions[this.type].color,this.chart.options.colors);};
    b.prototype.getPointsCollection=function(){return (this.hasGroupedData?this.points:this.data)||[]};b.prototype.getSymbol=function(){this.getCyclic("symbol",this.options.marker.symbol,this.chart.options.symbols);};b.prototype.findPointIndex=function(a,c){var d=a.id,b=a.x,e=this.points,h,g=this.options.dataSorting;if(d)var f=this.chart.get(d);else if(this.linkedParent||this.enabledDataSorting){var m=g&&g.matchByName?"name":"index";f=r(e,function(c){return !c.touched&&c[m]===a[m]});if(!f)return}if(f){var k=
    f&&f.index;"undefined"!==typeof k&&(h=!0);}"undefined"===typeof k&&R(b)&&(k=this.xData.indexOf(b,c));-1!==k&&"undefined"!==typeof k&&this.cropped&&(k=k>=this.cropStart?k-this.cropStart:k);!h&&e[k]&&e[k].touched&&(k=void 0);return k};b.prototype.updateData=function(a,d){var b=this.options,e=b.dataSorting,h=this.points,g=[],f,k,m,l=this.requireSorting,n=a.length===h.length,r=!0;this.xIncrement=null;a.forEach(function(a,d){var k=c(a)&&this.pointClass.prototype.optionsToObject.call({series:this},a)||{};
    var r=k.x;if(k.id||R(r)){if(r=this.findPointIndex(k,m),-1===r||"undefined"===typeof r?g.push(a):h[r]&&a!==b.data[r]?(h[r].update(a,!1,null,!1),h[r].touched=!0,l&&(m=r+1)):h[r]&&(h[r].touched=!0),!n||d!==r||e&&e.enabled||this.hasDerivedData)f=!0;}else g.push(a);},this);if(f)for(a=h.length;a--;)(k=h[a])&&!k.touched&&k.remove&&k.remove(!1,d);else !n||e&&e.enabled?r=!1:(a.forEach(function(a,c){h[c].update&&a!==h[c].y&&h[c].update(a,!1,null,!1);}),g.length=0);h.forEach(function(a){a&&(a.touched=!1);});if(!r)return !1;
    g.forEach(function(a){this.addPoint(a,!1,null,null,!1);},this);null===this.xIncrement&&this.xData&&this.xData.length&&(this.xIncrement=u(this.xData),this.autoIncrement());return !0};b.prototype.setData=function(c,d,b,e){var h=this,g=h.points,f=g&&g.length||0,k,m=h.options,l=h.chart,r=m.dataSorting,n=null,q=h.xAxis;n=m.turboThreshold;var F=this.xData,p=this.yData,u=(k=h.pointArrayMap)&&k.length,v=m.keys,K=0,w=1,y;c=c||[];k=c.length;d=t(d,!0);r&&r.enabled&&(c=this.sortData(c));!1!==e&&k&&f&&!h.cropped&&
    !h.hasGroupedData&&h.visible&&!h.isSeriesBoosting&&(y=this.updateData(c,b));if(!y){h.xIncrement=null;h.colorCounter=0;this.parallelArrays.forEach(function(a){h[a+"Data"].length=0;});if(n&&k>n)if(n=h.getFirstValidPoint(c),R(n))for(b=0;b<k;b++)F[b]=this.autoIncrement(),p[b]=c[b];else if(L(n))if(u)for(b=0;b<k;b++)e=c[b],F[b]=e[0],p[b]=e.slice(1,u+1);else for(v&&(K=v.indexOf("x"),w=v.indexOf("y"),K=0<=K?K:0,w=0<=w?w:1),b=0;b<k;b++)e=c[b],F[b]=e[K],p[b]=e[w];else a(12,!1,l);else for(b=0;b<k;b++)"undefined"!==
    typeof c[b]&&(e={series:h},h.pointClass.prototype.applyOptions.apply(e,[c[b]]),h.updateParallelArrays(e,b));p&&V(p[0])&&a(14,!0,l);h.data=[];h.options.data=h.userOptions.data=c;for(b=f;b--;)g[b]&&g[b].destroy&&g[b].destroy();q&&(q.minRange=q.userMinRange);h.isDirty=l.isDirtyBox=!0;h.isDirtyData=!!g;b=!1;}"point"===m.legendType&&(this.processData(),this.generatePoints());d&&l.redraw(b);};b.prototype.sortData=function(a){var d=this,b=d.options.dataSorting.sortKey||"y",e=function(a,d){return c(d)&&a.pointClass.prototype.optionsToObject.call({series:a},
    d)||{}};a.forEach(function(c,b){a[b]=e(d,c);a[b].index=b;},this);a.concat().sort(function(a,c){a=y(b,a);c=y(b,c);return c<a?-1:c>a?1:0}).forEach(function(a,c){a.x=c;},this);d.linkedSeries&&d.linkedSeries.forEach(function(c){var d=c.options,b=d.data;d.dataSorting&&d.dataSorting.enabled||!b||(b.forEach(function(d,h){b[h]=e(c,d);a[h]&&(b[h].x=a[h].x,b[h].index=h);}),c.setData(b,!1));});return a};b.prototype.getProcessedData=function(c){var d=this.xData,b=this.yData,e=d.length;var h=0;var g=this.xAxis,f=
    this.options;var k=f.cropThreshold;var m=c||this.getExtremesFromAll||f.getExtremesFromAll,l=this.isCartesian;c=g&&g.val2lin;f=!(!g||!g.logarithmic);var n=this.requireSorting;if(g){g=g.getExtremes();var r=g.min;var q=g.max;}if(l&&this.sorted&&!m&&(!k||e>k||this.forceCrop))if(d[e-1]<r||d[0]>q)d=[],b=[];else if(this.yData&&(d[0]<r||d[e-1]>q)){h=this.cropData(this.xData,this.yData,r,q);d=h.xData;b=h.yData;h=h.start;var F=!0;}for(k=d.length||1;--k;)if(e=f?c(d[k])-c(d[k-1]):d[k]-d[k-1],0<e&&("undefined"===
    typeof p||e<p))var p=e;else 0>e&&n&&(a(15,!1,this.chart),n=!1);return {xData:d,yData:b,cropped:F,cropStart:h,closestPointRange:p}};b.prototype.processData=function(a){var c=this.xAxis;if(this.isCartesian&&!this.isDirty&&!c.isDirty&&!this.yAxis.isDirty&&!a)return !1;a=this.getProcessedData();this.cropped=a.cropped;this.cropStart=a.cropStart;this.processedXData=a.xData;this.processedYData=a.yData;this.closestPointRange=this.basePointRange=a.closestPointRange;};b.prototype.cropData=function(a,c,d,b,e){var h=
    a.length,g=0,f=h,k;e=t(e,this.cropShoulder);for(k=0;k<h;k++)if(a[k]>=d){g=Math.max(0,k-e);break}for(d=k;d<h;d++)if(a[d]>b){f=d+e;break}return {xData:a.slice(g,f),yData:c.slice(g,f),start:g,end:f}};b.prototype.generatePoints=function(){var a=this.options,c=a.data,d=this.data,b,e=this.processedXData,g=this.processedYData,f=this.pointClass,k=e.length,m=this.cropStart||0,l=this.hasGroupedData,n=a.keys,r=[],q;a=a.dataGrouping&&a.dataGrouping.groupAll?m:0;d||l||(d=[],d.length=c.length,d=this.data=d);n&&
    l&&(this.options.keys=!1);for(q=0;q<k;q++){var p=m+q;if(l){var u=(new f).init(this,[e[q]].concat(O(g[q])));u.dataGroup=this.groupMap[a+q];u.dataGroup.options&&(u.options=u.dataGroup.options,h(u,u.dataGroup.options),delete u.dataLabels);}else (u=d[p])||"undefined"===typeof c[p]||(d[p]=u=(new f).init(this,c[p],e[q]));u&&(u.index=l?a+q:p,r[q]=u);}this.options.keys=n;if(d&&(k!==(b=d.length)||l))for(q=0;q<b;q++)q!==m||l||(q+=k),d[q]&&(d[q].destroyElements(),d[q].plotX=void 0);this.data=d;this.points=r;A(this,
    "afterGeneratePoints");};b.prototype.getXExtremes=function(a){return {min:n(a),max:u(a)}};b.prototype.getExtremes=function(a,c){var d=this.xAxis,b=this.yAxis,e=this.processedXData||this.xData,h=[],g=0,f=0;var k=0;var m=this.requireSorting?this.cropShoulder:0,l=b?b.positiveValuesOnly:!1,r;a=a||this.stackedYData||this.processedYData||[];b=a.length;d&&(k=d.getExtremes(),f=k.min,k=k.max);for(r=0;r<b;r++){var q=e[r];var p=a[r];var F=(R(p)||L(p))&&(p.length||0<p||!l);q=c||this.getExtremesFromAll||this.options.getExtremesFromAll||
    this.cropped||!d||(e[r+m]||q)>=f&&(e[r-m]||q)<=k;if(F&&q)if(F=p.length)for(;F--;)R(p[F])&&(h[g++]=p[F]);else h[g++]=p;}a={dataMin:n(h),dataMax:u(h)};A(this,"afterGetExtremes",{dataExtremes:a});return a};b.prototype.applyExtremes=function(){var a=this.getExtremes();this.dataMin=a.dataMin;this.dataMax=a.dataMax;return a};b.prototype.getFirstValidPoint=function(a){for(var c=null,d=a.length,b=0;null===c&&b<d;)c=a[b],b++;return c};b.prototype.translate=function(){this.processedXData||this.processData();
    this.generatePoints();var a=this.options,d=a.stacking,b=this.xAxis,e=b.categories,h=this.enabledDataSorting,g=this.yAxis,f=this.points,k=f.length,l=!!this.modifyValue,r,n=this.pointPlacementToXValue(),q=!!n,p=a.threshold,u=a.startFromThreshold?p:0,v,w=this.zoneAxis||"y",y=Number.MAX_VALUE;for(r=0;r<k;r++){var E=f[r],x=E.x,D=E.y,B=E.low,P=d&&g.stacking&&g.stacking.stacks[(this.negStacks&&D<(u?0:p)?"-":"")+this.stackKey],N=void 0,C=void 0;if(g.positiveValuesOnly&&!g.validatePositiveValue(D)||b.positiveValuesOnly&&
    !b.validatePositiveValue(x))E.isNull=!0;E.plotX=v=m(J(b.translate(x,0,0,0,1,n,"flags"===this.type),-1E5,1E5));if(d&&this.visible&&P&&P[x]){var z=this.getStackIndicator(z,x,this.index);E.isNull||(N=P[x],C=N.points[z.key]);}L(C)&&(B=C[0],D=C[1],B===u&&z.key===P[x].base&&(B=t(R(p)&&p,g.min)),g.positiveValuesOnly&&0>=B&&(B=null),E.total=E.stackTotal=N.total,E.percentage=N.total&&E.y/N.total*100,E.stackY=D,this.irregularWidths||N.setOffset(this.pointXOffset||0,this.barW||0));E.yBottom=c(B)?J(g.translate(B,
    0,1,0,1),-1E5,1E5):null;l&&(D=this.modifyValue(D,E));E.plotY=void 0;R(D)&&(D=g.translate(D,!1,!0,!1,!0),"undefined"!==typeof D&&(E.plotY=J(D,-1E5,1E5)));E.isInside=this.isPointInside(E);E.clientX=q?m(b.translate(x,0,0,0,1,n)):v;E.negative=E[w]<(a[w+"Threshold"]||p||0);E.category=e&&"undefined"!==typeof e[E.x]?e[E.x]:E.x;if(!E.isNull&&!1!==E.visible){"undefined"!==typeof M&&(y=Math.min(y,Math.abs(v-M)));var M=v;}E.zone=this.zones.length&&E.getZone();!E.graphic&&this.group&&h&&(E.isNew=!0);}this.closestPointRangePx=
    y;A(this,"afterTranslate");};b.prototype.getValidPoints=function(a,c,d){var b=this.chart;return (a||this.points||[]).filter(function(a){return c&&!b.isInsidePlot(a.plotX,a.plotY,{inverted:b.inverted})?!1:!1!==a.visible&&(d||!a.isNull)})};b.prototype.getClipBox=function(a,c){var d=this.options,b=this.chart,e=b.inverted,h=this.xAxis,g=h&&this.yAxis,f=b.options.chart.scrollablePlotArea||{};a&&!1===d.clip&&g?a=e?{y:-b.chartWidth+g.len+g.pos,height:b.chartWidth,width:b.chartHeight,x:-b.chartHeight+h.len+
    h.pos}:{y:-g.pos,height:b.chartHeight,width:b.chartWidth,x:-h.pos}:(a=this.clipBox||b.clipBox,c&&(a.width=b.plotSizeX,a.x=(b.scrollablePixelsX||0)*(f.scrollPositionX||0)));return c?{width:a.width,x:a.x}:a};b.prototype.getSharedClipKey=function(a){if(this.sharedClipKey)return this.sharedClipKey;var c=[a&&a.duration,a&&a.easing,a&&a.defer,this.getClipBox(a).height,this.options.xAxis,this.options.yAxis].join();if(!1!==this.options.clip||a)this.sharedClipKey=c;return c};b.prototype.setClip=function(a){var c=
    this.chart,d=this.options,b=c.renderer,e=c.inverted,h=this.clipBox,g=this.getClipBox(a),f=this.getSharedClipKey(a),k=c.sharedClips[f],m=c.sharedClips[f+"m"];a&&(g.width=0,e&&(g.x=c.plotHeight+(!1!==d.clip?0:c.plotTop)));k?c.hasLoaded||k.attr(g):(a&&(c.sharedClips[f+"m"]=m=b.clipRect(e?(c.plotSizeX||0)+99:-99,e?-c.plotLeft:-c.plotTop,99,e?c.chartWidth:c.chartHeight)),c.sharedClips[f]=k=b.clipRect(g),k.count={length:0});a&&!k.count[this.index]&&(k.count[this.index]=!0,k.count.length+=1);if(!1!==d.clip||
    a)this.group.clip(a||h?k:c.clipRect),this.markerGroup.clip(m);a||(k.count[this.index]&&(delete k.count[this.index],--k.count.length),0===k.count.length&&(h||(c.sharedClips[f]=k.destroy()),m&&(c.sharedClips[f+"m"]=m.destroy())));};b.prototype.animate=function(a){var c=this.chart,d=w(this.options.animation),b=this.sharedClipKey;if(a)this.setClip(d);else if(b){a=c.sharedClips[b];b=c.sharedClips[b+"m"];var e=this.getClipBox(d,!0);a&&a.animate(e,d);b&&b.animate({width:e.width+99,x:e.x-(c.inverted?0:99)},
    d);}};b.prototype.afterAnimate=function(){this.setClip();A(this,"afterAnimate");this.finishedAnimating=!0;};b.prototype.drawPoints=function(){var a=this.points,c=this.chart,d,b,e=this.options.marker,h=this[this.specialGroup]||this.markerGroup,g=this.xAxis,f=t(e.enabled,!g||g.isRadial?!0:null,this.closestPointRangePx>=e.enabledThreshold*e.radius);if(!1!==e.enabled||this._hasPointMarkers)for(d=0;d<a.length;d++){var k=a[d];var m=(b=k.graphic)?"animate":"attr";var l=k.marker||{};var r=!!k.marker;if((f&&
    "undefined"===typeof l.enabled||l.enabled)&&!k.isNull&&!1!==k.visible){var n=t(l.symbol,this.symbol);var q=this.markerAttribs(k,k.selected&&"select");this.enabledDataSorting&&(k.startXPos=g.reversed?-(q.width||0):g.width);var p=!1!==k.isInside;b?b[p?"show":"hide"](p).animate(q):p&&(0<(q.width||0)||k.hasImage)&&(k.graphic=b=c.renderer.symbol(n,q.x,q.y,q.width,q.height,r?l:e).add(h),this.enabledDataSorting&&c.hasRendered&&(b.attr({x:k.startXPos}),m="animate"));b&&"animate"===m&&b[p?"show":"hide"](p).animate(q);
    if(b&&!c.styledMode)b[m](this.pointAttribs(k,k.selected&&"select"));b&&b.addClass(k.getClassName(),!0);}else b&&(k.graphic=b.destroy());}};b.prototype.markerAttribs=function(a,c){var d=this.options,b=d.marker,e=a.marker||{},h=e.symbol||b.symbol,g=t(e.radius,b.radius);c&&(b=b.states[c],c=e.states&&e.states[c],g=t(c&&c.radius,b&&b.radius,g+(b&&b.radiusPlus||0)));a.hasImage=h&&0===h.indexOf("url");a.hasImage&&(g=0);a={x:d.crisp?Math.floor(a.plotX-g):a.plotX-g,y:a.plotY-g};g&&(a.width=a.height=2*g);return a};
    b.prototype.pointAttribs=function(a,c){var d=this.options.marker,b=a&&a.options,e=b&&b.marker||{},h=this.color,g=b&&b.color,f=a&&a.color;b=t(e.lineWidth,d.lineWidth);var k=a&&a.zone&&a.zone.color;a=1;h=g||k||f||h;g=e.fillColor||d.fillColor||h;h=e.lineColor||d.lineColor||h;c=c||"normal";d=d.states[c];c=e.states&&e.states[c]||{};b=t(c.lineWidth,d.lineWidth,b+t(c.lineWidthPlus,d.lineWidthPlus,0));g=c.fillColor||d.fillColor||g;h=c.lineColor||d.lineColor||h;a=t(c.opacity,d.opacity,a);return {stroke:h,"stroke-width":b,
    fill:g,opacity:a}};b.prototype.destroy=function(a){var c=this,d=c.chart,b=/AppleWebKit\/533/.test(q.navigator.userAgent),e,h,f=c.data||[],k,m;A(c,"destroy");this.removeEvents(a);(c.axisTypes||[]).forEach(function(a){(m=c[a])&&m.series&&(g(m.series,c),m.isDirty=m.forceRedraw=!0);});c.legendItem&&c.chart.legend.destroyItem(c);for(h=f.length;h--;)(k=f[h])&&k.destroy&&k.destroy();c.clips&&c.clips.forEach(function(a){return a.destroy()});x.clearTimeout(c.animationTimeout);M(c,function(a,c){a instanceof
    B&&!a.survive&&(e=b&&"group"===c?"hide":"destroy",a[e]());});d.hoverSeries===c&&(d.hoverSeries=void 0);g(d.series,c);d.orderSeries();M(c,function(d,b){a&&"hcEvents"===b||delete c[b];});};b.prototype.applyZones=function(){var a=this,c=this.chart,d=c.renderer,b=this.zones,e,h,g=this.clips||[],f,k=this.graph,m=this.area,l=Math.max(c.chartWidth,c.chartHeight),r=this[(this.zoneAxis||"y")+"Axis"],n=c.inverted,q,p,u,v=!1,w,y;if(b.length&&(k||m)&&r&&"undefined"!==typeof r.min){var E=r.reversed;var A=r.horiz;
    k&&!this.showLine&&k.hide();m&&m.hide();var x=r.getExtremes();b.forEach(function(b,F){e=E?A?c.plotWidth:0:A?0:r.toPixels(x.min)||0;e=J(t(h,e),0,l);h=J(Math.round(r.toPixels(t(b.value,x.max),!0)||0),0,l);v&&(e=h=r.toPixels(x.max));q=Math.abs(e-h);p=Math.min(e,h);u=Math.max(e,h);r.isXAxis?(f={x:n?u:p,y:0,width:q,height:l},A||(f.x=c.plotHeight-f.x)):(f={x:0,y:n?u:p,width:l,height:q},A&&(f.y=c.plotWidth-f.y));n&&d.isVML&&(f=r.isXAxis?{x:0,y:E?p:u,height:f.width,width:c.chartWidth}:{x:f.y-c.plotLeft-c.spacingBox.x,
    y:0,width:f.height,height:c.chartHeight});g[F]?g[F].animate(f):g[F]=d.clipRect(f);w=a["zone-area-"+F];y=a["zone-graph-"+F];k&&y&&y.clip(g[F]);m&&w&&w.clip(g[F]);v=b.value>x.max;a.resetZones&&0===h&&(h=void 0);});this.clips=g;}else a.visible&&(k&&k.show(!0),m&&m.show(!0));};b.prototype.invertGroups=function(a){function c(){["group","markerGroup"].forEach(function(c){d[c]&&(b.renderer.isVML&&d[c].attr({width:d.yAxis.len,height:d.xAxis.len}),d[c].width=d.yAxis.len,d[c].height=d.xAxis.len,d[c].invert(d.isRadialSeries?
    !1:a));});}var d=this,b=d.chart;d.xAxis&&(d.eventsToUnbind.push(D(b,"resize",c)),c(),d.invertGroups=c);};b.prototype.plotGroup=function(a,d,b,e,h){var g=this[a],f=!g;b={visibility:b,zIndex:e||.1};"undefined"===typeof this.opacity||this.chart.styledMode||"inactive"===this.state||(b.opacity=this.opacity);f&&(this[a]=g=this.chart.renderer.g().add(h));g.addClass("highcharts-"+d+" highcharts-series-"+this.index+" highcharts-"+this.type+"-series "+(c(this.colorIndex)?"highcharts-color-"+this.colorIndex+" ":
    "")+(this.options.className||"")+(g.hasClass("highcharts-tracker")?" highcharts-tracker":""),!0);g.attr(b)[f?"attr":"animate"](this.getPlotBox());return g};b.prototype.getPlotBox=function(){var a=this.chart,c=this.xAxis,d=this.yAxis;a.inverted&&(c=d,d=this.xAxis);return {translateX:c?c.left:a.plotLeft,translateY:d?d.top:a.plotTop,scaleX:1,scaleY:1}};b.prototype.removeEvents=function(a){a||p(this);this.eventsToUnbind.length&&(this.eventsToUnbind.forEach(function(a){a();}),this.eventsToUnbind.length=
    0);};b.prototype.render=function(){var a=this,c=a.chart,d=a.options,b=w(d.animation),e=!a.finishedAnimating&&c.renderer.isSVG&&b.duration,h=a.visible?"inherit":"hidden",g=d.zIndex,f=a.hasRendered,k=c.seriesGroup,m=c.inverted;A(this,"render");var l=a.plotGroup("group","series",h,g,k);a.markerGroup=a.plotGroup("markerGroup","markers",h,g,k);e&&a.animate&&a.animate(!0);l.inverted=t(a.invertible,a.isCartesian)?m:!1;a.drawGraph&&(a.drawGraph(),a.applyZones());a.visible&&a.drawPoints();a.drawDataLabels&&
    a.drawDataLabels();a.redrawPoints&&a.redrawPoints();a.drawTracker&&!1!==a.options.enableMouseTracking&&a.drawTracker();a.invertGroups(m);!1===d.clip||a.sharedClipKey||f||l.clip(c.clipRect);e&&a.animate&&a.animate();f||(e&&b.defer&&(e+=b.defer),a.animationTimeout=Z(function(){a.afterAnimate();},e||0));a.isDirty=!1;a.hasRendered=!0;A(a,"afterRender");};b.prototype.redraw=function(){var a=this.chart,c=this.isDirty||this.isDirtyData,d=this.group,b=this.xAxis,e=this.yAxis;d&&(a.inverted&&d.attr({width:a.plotWidth,
    height:a.plotHeight}),d.animate({translateX:t(b&&b.left,a.plotLeft),translateY:t(e&&e.top,a.plotTop)}));this.translate();this.render();c&&delete this.kdTree;};b.prototype.searchPoint=function(a,c){var d=this.xAxis,b=this.yAxis,e=this.chart.inverted;return this.searchKDTree({clientX:e?d.len-a.chartY+d.pos:a.chartX-d.pos,plotY:e?b.len-a.chartX+b.pos:a.chartY-b.pos},c,a)};b.prototype.buildKDTree=function(a){function c(a,b,e){var h;if(h=a&&a.length){var g=d.kdAxisArray[b%e];a.sort(function(a,c){return a[g]-
    c[g]});h=Math.floor(h/2);return {point:a[h],left:c(a.slice(0,h),b+1,e),right:c(a.slice(h+1),b+1,e)}}}this.buildingKdTree=!0;var d=this,b=-1<d.options.findNearestPointBy.indexOf("y")?2:1;delete d.kdTree;Z(function(){d.kdTree=c(d.getValidPoints(null,!d.directTouch),b,b);d.buildingKdTree=!1;},d.options.kdNow||a&&"touchstart"===a.type?0:1);};b.prototype.searchKDTree=function(a,d,b){function e(a,d,b,m){var l=d.point,r=h.kdAxisArray[b%m],n=l;var q=c(a[g])&&c(l[g])?Math.pow(a[g]-l[g],2):null;var p=c(a[f])&&
    c(l[f])?Math.pow(a[f]-l[f],2):null;p=(q||0)+(p||0);l.dist=c(p)?Math.sqrt(p):Number.MAX_VALUE;l.distX=c(q)?Math.sqrt(q):Number.MAX_VALUE;r=a[r]-l[r];p=0>r?"left":"right";q=0>r?"right":"left";d[p]&&(p=e(a,d[p],b+1,m),n=p[k]<n[k]?p:l);d[q]&&Math.sqrt(r*r)<n[k]&&(a=e(a,d[q],b+1,m),n=a[k]<n[k]?a:n);return n}var h=this,g=this.kdAxisArray[0],f=this.kdAxisArray[1],k=d?"distX":"dist";d=-1<h.options.findNearestPointBy.indexOf("y")?2:1;this.kdTree||this.buildingKdTree||this.buildKDTree(b);if(this.kdTree)return e(a,
    this.kdTree,d,d)};b.prototype.pointPlacementToXValue=function(){var a=this.options,c=a.pointRange,d=this.xAxis;a=a.pointPlacement;"between"===a&&(a=d.reversed?-.5:.5);return R(a)?a*(c||d.pointRange):0};b.prototype.isPointInside=function(a){return "undefined"!==typeof a.plotY&&"undefined"!==typeof a.plotX&&0<=a.plotY&&a.plotY<=this.yAxis.len&&0<=a.plotX&&a.plotX<=this.xAxis.len};b.prototype.drawTracker=function(){var a=this,c=a.options,b=c.trackByArea,e=[].concat(b?a.areaPath:a.graphPath),h=a.chart,
    g=h.pointer,k=h.renderer,m=h.options.tooltip.snap,l=a.tracker,r=function(c){if(h.hoverSeries!==a)a.onMouseOver();},n="rgba(192,192,192,"+(d?.0001:.002)+")";l?l.attr({d:e}):a.graph&&(a.tracker=k.path(e).attr({visibility:a.visible?"visible":"hidden",zIndex:2}).addClass(b?"highcharts-tracker-area":"highcharts-tracker-line").add(a.group),h.styledMode||a.tracker.attr({"stroke-linecap":"round","stroke-linejoin":"round",stroke:n,fill:b?n:"none","stroke-width":a.graph.strokeWidth()+(b?0:2*m)}),[a.tracker,
    a.markerGroup,a.dataLabelsGroup].forEach(function(a){if(a&&(a.addClass("highcharts-tracker").on("mouseover",r).on("mouseout",function(a){g.onTrackerMouseOut(a);}),c.cursor&&!h.styledMode&&a.css({cursor:c.cursor}),f))a.on("touchstart",r);}));A(this,"afterDrawTracker");};b.prototype.addPoint=function(a,c,d,b,e){var h=this.options,g=this.data,f=this.chart,k=this.xAxis;k=k&&k.hasNames&&k.names;var m=h.data,l=this.xData,r;c=t(c,!0);var n={series:this};this.pointClass.prototype.applyOptions.apply(n,[a]);var q=
    n.x;var p=l.length;if(this.requireSorting&&q<l[p-1])for(r=!0;p&&l[p-1]>q;)p--;this.updateParallelArrays(n,"splice",p,0,0);this.updateParallelArrays(n,p);k&&n.name&&(k[q]=n.name);m.splice(p,0,a);r&&(this.data.splice(p,0,null),this.processData());"point"===h.legendType&&this.generatePoints();d&&(g[0]&&g[0].remove?g[0].remove(!1):(g.shift(),this.updateParallelArrays(n,"shift"),m.shift()));!1!==e&&A(this,"addPoint",{point:n});this.isDirtyData=this.isDirty=!0;c&&f.redraw(b);};b.prototype.removePoint=function(a,
    c,d){var b=this,e=b.data,h=e[a],g=b.points,f=b.chart,k=function(){g&&g.length===e.length&&g.splice(a,1);e.splice(a,1);b.options.data.splice(a,1);b.updateParallelArrays(h||{series:b},"splice",a,1);h&&h.destroy();b.isDirty=!0;b.isDirtyData=!0;c&&f.redraw();};v(d,f);c=t(c,!0);h?h.firePointEvent("remove",null,k):k();};b.prototype.remove=function(a,c,d,b){function e(){h.destroy(b);g.isDirtyLegend=g.isDirtyBox=!0;g.linkSeries();t(a,!0)&&g.redraw(c);}var h=this,g=h.chart;!1!==d?A(h,"remove",null,e):e();};b.prototype.update=
    function(c,d){c=E(c,this.userOptions);A(this,"update",{options:c});var b=this,e=b.chart,g=b.userOptions,f=b.initialType||b.type,k=e.options.plotOptions,m=c.type||g.type||e.options.chart.type,r=!(this.hasDerivedData||m&&m!==this.type||"undefined"!==typeof c.pointStart||"undefined"!==typeof c.pointInterval||b.hasOptionChanged("dataGrouping")||b.hasOptionChanged("pointStart")||b.hasOptionChanged("pointInterval")||b.hasOptionChanged("pointIntervalUnit")||b.hasOptionChanged("keys")),n=l[f].prototype,q,
    p=["eventOptions","navigatorSeries","baseSeries"],u=b.finishedAnimating&&{animation:!1},v={};m=m||f;r&&(p.push("data","isDirtyData","points","processedXData","processedYData","xIncrement","cropped","_hasPointMarkers","_hasPointLabels","clips","nodes","layout","mapMap","mapData","minY","maxY","minX","maxX"),!1!==c.visible&&p.push("area","graph"),b.parallelArrays.forEach(function(a){p.push(a+"Data");}),c.data&&(c.dataSorting&&h(b.options.dataSorting,c.dataSorting),this.setData(c.data,!1)));c=Q(g,u,{index:"undefined"===
    typeof g.index?b.index:g.index,pointStart:t(k&&k.series&&k.series.pointStart,g.pointStart,b.xData[0])},!r&&{data:b.options.data},c);r&&c.data&&(c.data=b.options.data);p=["group","markerGroup","dataLabelsGroup","transformGroup"].concat(p);p.forEach(function(a){p[a]=b[a];delete b[a];});g=!1;if(l[m]){if(g=m!==b.type,b.remove(!1,!1,!1,!0),g)if(Object.setPrototypeOf)Object.setPrototypeOf(b,l[m].prototype);else {k=Object.hasOwnProperty.call(b,"hcEvents")&&b.hcEvents;for(q in n)b[q]=void 0;h(b,l[m].prototype);
    k?b.hcEvents=k:delete b.hcEvents;}}else a(17,!0,e,{missingModuleFor:m});p.forEach(function(a){b[a]=p[a];});b.init(e,c);if(r&&this.points){var w=b.options;!1===w.visible?(v.graphic=1,v.dataLabel=1):b._hasPointLabels||(c=w.marker,m=w.dataLabels,c&&(!1===c.enabled||"symbol"in c)&&(v.graphic=1),m&&!1===m.enabled&&(v.dataLabel=1));this.points.forEach(function(a){a&&a.series&&(a.resolveColor(),Object.keys(v).length&&a.destroyElements(v),!1===w.showInLegend&&a.legendItem&&e.legend.destroyItem(a));},this);}b.initialType=
    f;e.linkSeries();g&&b.linkedSeries.length&&(b.isDirtyData=!0);A(this,"afterUpdate");t(d,!0)&&e.redraw(r?void 0:!1);};b.prototype.setName=function(a){this.name=this.options.name=this.userOptions.name=a;this.chart.isDirtyLegend=!0;};b.prototype.hasOptionChanged=function(a){var c=this.options[a],d=this.chart.options.plotOptions,b=this.userOptions[a];return b?c!==b:c!==t(d&&d[this.type]&&d[this.type][a],d&&d.series&&d.series[a],c)};b.prototype.onMouseOver=function(){var a=this.chart,c=a.hoverSeries;a.pointer.setHoverChartIndex();
    if(c&&c!==this)c.onMouseOut();this.options.events.mouseOver&&A(this,"mouseOver");this.setState("hover");a.hoverSeries=this;};b.prototype.onMouseOut=function(){var a=this.options,c=this.chart,d=c.tooltip,b=c.hoverPoint;c.hoverSeries=null;if(b)b.onMouseOut();this&&a.events.mouseOut&&A(this,"mouseOut");!d||this.stickyTracking||d.shared&&!this.noSharedTooltip||d.hide();c.series.forEach(function(a){a.setState("",!0);});};b.prototype.setState=function(a,c){var d=this,b=d.options,e=d.graph,h=b.inactiveOtherPoints,
    g=b.states,f=b.lineWidth,k=b.opacity,m=t(g[a||"normal"]&&g[a||"normal"].animation,d.chart.options.chart.animation);b=0;a=a||"";if(d.state!==a&&([d.group,d.markerGroup,d.dataLabelsGroup].forEach(function(c){c&&(d.state&&c.removeClass("highcharts-series-"+d.state),a&&c.addClass("highcharts-series-"+a));}),d.state=a,!d.chart.styledMode)){if(g[a]&&!1===g[a].enabled)return;a&&(f=g[a].lineWidth||f+(g[a].lineWidthPlus||0),k=t(g[a].opacity,k));if(e&&!e.dashstyle)for(g={"stroke-width":f},e.animate(g,m);d["zone-graph-"+
    b];)d["zone-graph-"+b].animate(g,m),b+=1;h||[d.group,d.markerGroup,d.dataLabelsGroup,d.labelBySeries].forEach(function(a){a&&a.animate({opacity:k},m);});}c&&h&&d.points&&d.setAllPointsToState(a||void 0);};b.prototype.setAllPointsToState=function(a){this.points.forEach(function(c){c.setState&&c.setState(a);});};b.prototype.setVisible=function(a,c){var d=this,b=d.chart,e=d.legendItem,h=b.options.chart.ignoreHiddenSeries,g=d.visible;var f=(d.visible=a=d.options.visible=d.userOptions.visible="undefined"===
    typeof a?!g:a)?"show":"hide";["group","dataLabelsGroup","markerGroup","tracker","tt"].forEach(function(a){if(d[a])d[a][f]();});if(b.hoverSeries===d||(b.hoverPoint&&b.hoverPoint.series)===d)d.onMouseOut();e&&b.legend.colorizeItem(d,a);d.isDirty=!0;d.options.stacking&&b.series.forEach(function(a){a.options.stacking&&a.visible&&(a.isDirty=!0);});d.linkedSeries.forEach(function(c){c.setVisible(a,!1);});h&&(b.isDirtyBox=!0);A(d,f);!1!==c&&b.redraw();};b.prototype.show=function(){this.setVisible(!0);};b.prototype.hide=
    function(){this.setVisible(!1);};b.prototype.select=function(a){this.selected=a=this.options.selected="undefined"===typeof a?!this.selected:a;this.checkbox&&(this.checkbox.checked=a);A(this,a?"select":"unselect");};b.prototype.shouldShowTooltip=function(a,c,d){void 0===d&&(d={});d.series=this;d.visiblePlotOnly=!0;return this.chart.isInsidePlot(a,c,d)};b.defaultOptions={lineWidth:2,allowPointSelect:!1,crisp:!0,showCheckbox:!1,animation:{duration:1E3},events:{},marker:{enabledThreshold:2,lineColor:H.backgroundColor,
    lineWidth:0,radius:4,states:{normal:{animation:!0},hover:{animation:{duration:50},enabled:!0,radiusPlus:2,lineWidthPlus:1},select:{fillColor:H.neutralColor20,lineColor:H.neutralColor100,lineWidth:2}}},point:{events:{}},dataLabels:{animation:{},align:"center",defer:!0,formatter:function(){var a=this.series.chart.numberFormatter;return "number"!==typeof this.y?"":a(this.y,-1)},padding:5,style:{fontSize:"11px",fontWeight:"bold",color:"contrast",textOutline:"1px contrast"},verticalAlign:"bottom",x:0,y:0},
    cropThreshold:300,opacity:1,pointRange:0,softThreshold:!0,states:{normal:{animation:!0},hover:{animation:{duration:50},lineWidthPlus:1,marker:{},halo:{size:10,opacity:.25}},select:{animation:{duration:0}},inactive:{animation:{duration:50},opacity:.2}},stickyTracking:!0,turboThreshold:1E3,findNearestPointBy:"x"};return b}();h(e.prototype,{axisTypes:["xAxis","yAxis"],coll:"series",colorCounter:0,cropShoulder:1,directTouch:!1,drawLegendSymbol:I.drawLineMarker,isCartesian:!0,kdAxisArray:["clientX","plotY"],
    parallelArrays:["x","y"],pointClass:G,requireSorting:!0,sorted:!0});C.series=e;return e});O(e,"Extensions/ScrollablePlotArea.js",[e["Core/Animation/AnimationUtilities.js"],e["Core/Axis/Axis.js"],e["Core/Chart/Chart.js"],e["Core/Series/Series.js"],e["Core/Globals.js"],e["Core/Utilities.js"]],function(e,b,I,z,H,G){var D=e.stop,B=G.addEvent,x=G.createElement,w=G.merge,v=G.pick;B(I,"afterSetChartSize",function(b){var d=this.options.chart.scrollablePlotArea,e=d&&d.minWidth;d=d&&d.minHeight;if(!this.renderer.forExport){if(e){if(this.scrollablePixelsX=
    e=Math.max(0,e-this.chartWidth)){this.scrollablePlotBox=this.renderer.scrollablePlotBox=w(this.plotBox);this.plotBox.width=this.plotWidth+=e;this.inverted?this.clipBox.height+=e:this.clipBox.width+=e;var f={1:{name:"right",value:e}};}}else d&&(this.scrollablePixelsY=e=Math.max(0,d-this.chartHeight))&&(this.scrollablePlotBox=this.renderer.scrollablePlotBox=w(this.plotBox),this.plotBox.height=this.plotHeight+=e,this.inverted?this.clipBox.width+=e:this.clipBox.height+=e,f={2:{name:"bottom",value:e}});
    f&&!b.skipAxes&&this.axes.forEach(function(d){f[d.side]?d.getPlotLinePath=function(){var b=f[d.side].name,e=this[b];this[b]=e-f[d.side].value;var k=H.Axis.prototype.getPlotLinePath.apply(this,arguments);this[b]=e;return k}:(d.setAxisSize(),d.setAxisTranslation());});}});B(I,"render",function(){this.scrollablePixelsX||this.scrollablePixelsY?(this.setUpScrolling&&this.setUpScrolling(),this.applyFixed()):this.fixedDiv&&this.applyFixed();});I.prototype.setUpScrolling=function(){var b=this,d={WebkitOverflowScrolling:"touch",
    overflowX:"hidden",overflowY:"hidden"};this.scrollablePixelsX&&(d.overflowX="auto");this.scrollablePixelsY&&(d.overflowY="auto");this.scrollingParent=x("div",{className:"highcharts-scrolling-parent"},{position:"relative"},this.renderTo);this.scrollingContainer=x("div",{className:"highcharts-scrolling"},d,this.scrollingParent);B(this.scrollingContainer,"scroll",function(){b.pointer&&delete b.pointer.chartPosition;});this.innerContainer=x("div",{className:"highcharts-inner-container"},null,this.scrollingContainer);
    this.innerContainer.appendChild(this.container);this.setUpScrolling=null;};I.prototype.moveFixedElements=function(){var b=this.container,d=this.fixedRenderer,e=".highcharts-contextbutton .highcharts-credits .highcharts-legend .highcharts-legend-checkbox .highcharts-navigator-series .highcharts-navigator-xaxis .highcharts-navigator-yaxis .highcharts-navigator .highcharts-reset-zoom .highcharts-drillup-button .highcharts-scrollbar .highcharts-subtitle .highcharts-title".split(" "),k;this.scrollablePixelsX&&
    !this.inverted?k=".highcharts-yaxis":this.scrollablePixelsX&&this.inverted?k=".highcharts-xaxis":this.scrollablePixelsY&&!this.inverted?k=".highcharts-xaxis":this.scrollablePixelsY&&this.inverted&&(k=".highcharts-yaxis");k&&e.push(k+":not(.highcharts-radial-axis)",k+"-labels:not(.highcharts-radial-axis-labels)");e.forEach(function(e){[].forEach.call(b.querySelectorAll(e),function(b){(b.namespaceURI===d.SVG_NS?d.box:d.box.parentNode).appendChild(b);b.style.pointerEvents="auto";});});};I.prototype.applyFixed=
    function(){var b=!this.fixedDiv;var d=this.options.chart;var e=d.scrollablePlotArea;b?(this.fixedDiv=x("div",{className:"highcharts-fixed"},{position:"absolute",overflow:"hidden",pointerEvents:"none",zIndex:(d.style&&d.style.zIndex||0)+2,top:0},null,!0),this.scrollingContainer&&this.scrollingContainer.parentNode.insertBefore(this.fixedDiv,this.scrollingContainer),this.renderTo.style.overflow="visible",this.fixedRenderer=d=new H.Renderer(this.fixedDiv,this.chartWidth,this.chartHeight,this.options.chart.style),
    this.scrollableMask=d.path().attr({fill:this.options.chart.backgroundColor||"#fff","fill-opacity":v(e.opacity,.85),zIndex:-1}).addClass("highcharts-scrollable-mask").add(),B(this,"afterShowResetZoom",this.moveFixedElements),B(this,"afterDrilldown",this.moveFixedElements),B(this,"afterLayOutTitles",this.moveFixedElements)):this.fixedRenderer.setSize(this.chartWidth,this.chartHeight);if(this.scrollableDirty||b)this.scrollableDirty=!1,this.moveFixedElements();d=this.chartWidth+(this.scrollablePixelsX||
    0);var k=this.chartHeight+(this.scrollablePixelsY||0);D(this.container);this.container.style.width=d+"px";this.container.style.height=k+"px";this.renderer.boxWrapper.attr({width:d,height:k,viewBox:[0,0,d,k].join(" ")});this.chartBackground.attr({width:d,height:k});this.scrollingContainer.style.height=this.chartHeight+"px";b&&(e.scrollPositionX&&(this.scrollingContainer.scrollLeft=this.scrollablePixelsX*e.scrollPositionX),e.scrollPositionY&&(this.scrollingContainer.scrollTop=this.scrollablePixelsY*
    e.scrollPositionY));k=this.axisOffset;b=this.plotTop-k[0]-1;e=this.plotLeft-k[3]-1;d=this.plotTop+this.plotHeight+k[2]+1;k=this.plotLeft+this.plotWidth+k[1]+1;var l=this.plotLeft+this.plotWidth-(this.scrollablePixelsX||0),w=this.plotTop+this.plotHeight-(this.scrollablePixelsY||0);b=this.scrollablePixelsX?[["M",0,b],["L",this.plotLeft-1,b],["L",this.plotLeft-1,d],["L",0,d],["Z"],["M",l,b],["L",this.chartWidth,b],["L",this.chartWidth,d],["L",l,d],["Z"]]:this.scrollablePixelsY?[["M",e,0],["L",e,this.plotTop-
    1],["L",k,this.plotTop-1],["L",k,0],["Z"],["M",e,w],["L",e,this.chartHeight],["L",k,this.chartHeight],["L",k,w],["Z"]]:[["M",0,0]];"adjustHeight"!==this.redrawTrigger&&this.scrollableMask.attr({d:b});};B(b,"afterInit",function(){this.chart.scrollableDirty=!0;});B(z,"show",function(){this.chart.scrollableDirty=!0;});});O(e,"Core/Axis/StackingAxis.js",[e["Core/Animation/AnimationUtilities.js"],e["Core/Utilities.js"]],function(e,b){var D=e.getDeferredAnimation,z=b.addEvent,H=b.destroyObjectProperties,G=
    b.fireEvent,C=b.isNumber,B=b.objectEach,x=function(){function b(b){this.oldStacks={};this.stacks={};this.stacksTouched=0;this.axis=b;}b.prototype.buildStacks=function(){var b=this.axis,e=b.series,d=b.options.reversedStacks,q=e.length,k;if(!b.isXAxis){this.usePercentage=!1;for(k=q;k--;){var l=e[d?k:q-k-1];l.setStackedPoints();l.setGroupedPoints();}for(k=0;k<q;k++)e[k].modifyStacks();G(b,"afterBuildStacks");}};b.prototype.cleanStacks=function(){if(!this.axis.isXAxis){if(this.oldStacks)var b=this.stacks=
    this.oldStacks;B(b,function(b){B(b,function(d){d.cumulative=d.total;});});}};b.prototype.resetStacks=function(){var b=this,e=this.stacks;this.axis.isXAxis||B(e,function(d){B(d,function(e,f){C(e.touched)&&e.touched<b.stacksTouched?(e.destroy(),delete d[f]):(e.total=null,e.cumulative=null);});});};b.prototype.renderStackTotals=function(){var b=this.axis,e=b.chart,d=e.renderer,q=this.stacks;b=D(e,b.options.stackLabels&&b.options.stackLabels.animation||!1);var k=this.stackTotalGroup=this.stackTotalGroup||d.g("stack-labels").attr({visibility:"visible",
    zIndex:6,opacity:0}).add();k.translate(e.plotLeft,e.plotTop);B(q,function(d){B(d,function(d){d.render(k);});});k.animate({opacity:1},b);};return b}();return function(){function b(){}b.compose=function(e){z(e,"init",b.onInit);z(e,"destroy",b.onDestroy);};b.onDestroy=function(){var b=this.stacking;if(b){var e=b.stacks;B(e,function(d,b){H(d);e[b]=null;});b&&b.stackTotalGroup&&b.stackTotalGroup.destroy();}};b.onInit=function(){this.stacking||(this.stacking=new x(this));};return b}()});O(e,"Extensions/Stacking.js",
    [e["Core/Axis/Axis.js"],e["Core/Chart/Chart.js"],e["Core/FormatUtilities.js"],e["Core/Globals.js"],e["Core/Series/Series.js"],e["Core/Axis/StackingAxis.js"],e["Core/Utilities.js"]],function(e,b,I,z,H,G,C){var D=I.format,x=C.correctFloat,w=C.defined,v=C.destroyObjectProperties,f=C.isArray,d=C.isNumber,q=C.objectEach,k=C.pick;var l=function(){function b(d,b,e,f,k){var c=d.chart.inverted;this.axis=d;this.isNegative=e;this.options=b=b||{};this.x=f;this.total=null;this.points={};this.hasValidPoints=
    !1;this.stack=k;this.rightCliff=this.leftCliff=0;this.alignOptions={align:b.align||(c?e?"left":"right":"center"),verticalAlign:b.verticalAlign||(c?"middle":e?"bottom":"top"),y:b.y,x:b.x};this.textAlign=b.textAlign||(c?e?"right":"left":"center");}b.prototype.destroy=function(){v(this,this.axis);};b.prototype.render=function(d){var b=this.axis.chart,e=this.options,f=e.format;f=f?D(f,this,b):e.formatter.call(this);this.label?this.label.attr({text:f,visibility:"hidden"}):(this.label=b.renderer.label(f,
    null,null,e.shape,null,null,e.useHTML,!1,"stack-labels"),f={r:e.borderRadius||0,text:f,rotation:e.rotation,padding:k(e.padding,5),visibility:"hidden"},b.styledMode||(f.fill=e.backgroundColor,f.stroke=e.borderColor,f["stroke-width"]=e.borderWidth,this.label.css(e.style)),this.label.attr(f),this.label.added||this.label.add(d));this.label.labelrank=b.plotSizeY;};b.prototype.setOffset=function(b,e,f,l,m){var c=this.axis,g=c.chart;l=c.translate(c.stacking.usePercentage?100:l?l:this.total,0,0,0,1);f=c.translate(f?
    f:0);f=w(l)&&Math.abs(l-f);b=k(m,g.xAxis[0].translate(this.x))+b;c=w(l)&&this.getStackBox(g,this,b,l,e,f,c);e=this.label;f=this.isNegative;b="justify"===k(this.options.overflow,"justify");var a=this.textAlign;e&&c&&(m=e.getBBox(),l=e.padding,a="left"===a?g.inverted?-l:l:"right"===a?m.width:g.inverted&&"center"===a?m.width/2:g.inverted?f?m.width+l:-l:m.width/2,f=g.inverted?m.height/2:f?-l:m.height,this.alignOptions.x=k(this.options.x,0),this.alignOptions.y=k(this.options.y,0),c.x-=a,c.y-=f,e.align(this.alignOptions,
    null,c),g.isInsidePlot(e.alignAttr.x+a-this.alignOptions.x,e.alignAttr.y+f-this.alignOptions.y)?e.show():(e.alignAttr.y=-9999,b=!1),b&&H.prototype.justifyDataLabel.call(this.axis,e,this.alignOptions,e.alignAttr,m,c),e.attr({x:e.alignAttr.x,y:e.alignAttr.y}),k(!b&&this.options.crop,!0)&&((g=d(e.x)&&d(e.y)&&g.isInsidePlot(e.x-l+e.width,e.y)&&g.isInsidePlot(e.x+l,e.y))||e.hide()));};b.prototype.getStackBox=function(d,b,e,f,k,c,g){var a=b.axis.reversed,h=d.inverted,m=g.height+g.pos-(h?d.plotLeft:d.plotTop);
    b=b.isNegative&&!a||!b.isNegative&&a;return {x:h?b?f-g.right:f-c+g.pos-d.plotLeft:e+d.xAxis[0].transB-d.plotLeft,y:h?g.height-e-k:b?m-f-c:m-f,width:h?c:k,height:h?k:c}};return b}();b.prototype.getStacks=function(){var d=this,b=d.inverted;d.yAxis.forEach(function(d){d.stacking&&d.stacking.stacks&&d.hasVisibleSeries&&(d.stacking.oldStacks=d.stacking.stacks);});d.series.forEach(function(e){var f=e.xAxis&&e.xAxis.options||{};!e.options.stacking||!0!==e.visible&&!1!==d.options.chart.ignoreHiddenSeries||
    (e.stackKey=[e.type,k(e.options.stack,""),b?f.top:f.left,b?f.height:f.width].join());});};G.compose(e);H.prototype.setGroupedPoints=function(){var d=this.yAxis.stacking;this.options.centerInCategory&&(this.is("column")||this.is("columnrange"))&&!this.options.stacking&&1<this.chart.series.length?H.prototype.setStackedPoints.call(this,"group"):d&&q(d.stacks,function(b,e){"group"===e.slice(-5)&&(q(b,function(d){return d.destroy()}),delete d.stacks[e]);});};H.prototype.setStackedPoints=function(d){var b=
    d||this.options.stacking;if(b&&(!0===this.visible||!1===this.chart.options.chart.ignoreHiddenSeries)){var e=this.processedXData,q=this.processedYData,v=[],m=q.length,c=this.options,g=c.threshold,a=k(c.startFromThreshold&&g,0);c=c.stack;d=d?this.type+","+b:this.stackKey;var h="-"+d,r=this.negStacks,A=this.yAxis,y=A.stacking.stacks,D=A.stacking.oldStacks,B,C;A.stacking.stacksTouched+=1;for(C=0;C<m;C++){var z=e[C];var Q=q[C];var M=this.getStackIndicator(M,z,this.index);var t=M.key;var p=(B=r&&Q<(a?0:
    g))?h:d;y[p]||(y[p]={});y[p][z]||(D[p]&&D[p][z]?(y[p][z]=D[p][z],y[p][z].total=null):y[p][z]=new l(A,A.options.stackLabels,B,z,c));p=y[p][z];null!==Q?(p.points[t]=p.points[this.index]=[k(p.cumulative,a)],w(p.cumulative)||(p.base=t),p.touched=A.stacking.stacksTouched,0<M.index&&!1===this.singleStacks&&(p.points[t][0]=p.points[this.index+","+z+",0"][0])):p.points[t]=p.points[this.index]=null;"percent"===b?(B=B?d:h,r&&y[B]&&y[B][z]?(B=y[B][z],p.total=B.total=Math.max(B.total,p.total)+Math.abs(Q)||0):
    p.total=x(p.total+(Math.abs(Q)||0))):"group"===b?(f(Q)&&(Q=Q[0]),null!==Q&&(p.total=(p.total||0)+1)):p.total=x(p.total+(Q||0));p.cumulative="group"===b?(p.total||1)-1:k(p.cumulative,a)+(Q||0);null!==Q&&(p.points[t].push(p.cumulative),v[C]=p.cumulative,p.hasValidPoints=!0);}"percent"===b&&(A.stacking.usePercentage=!0);"group"!==b&&(this.stackedYData=v);A.stacking.oldStacks={};}};H.prototype.modifyStacks=function(){var d=this,b=d.stackKey,e=d.yAxis.stacking.stacks,f=d.processedXData,k,m=d.options.stacking;
    d[m+"Stacker"]&&[b,"-"+b].forEach(function(c){for(var b=f.length,a,h;b--;)if(a=f[b],k=d.getStackIndicator(k,a,d.index,c),h=(a=e[c]&&e[c][a])&&a.points[k.key])d[m+"Stacker"](h,a,b);});};H.prototype.percentStacker=function(d,b,e){b=b.total?100/b.total:0;d[0]=x(d[0]*b);d[1]=x(d[1]*b);this.stackedYData[e]=d[1];};H.prototype.getStackIndicator=function(d,b,e,f){!w(d)||d.x!==b||f&&d.key!==f?d={x:b,index:0,key:f}:d.index++;d.key=[e,b,d.index].join();return d};z.StackItem=l;return z.StackItem});O(e,"Series/Line/LineSeries.js",
    [e["Core/Color/Palette.js"],e["Core/Series/Series.js"],e["Core/Series/SeriesRegistry.js"],e["Core/Utilities.js"]],function(e,b,I,z){var D=this&&this.__extends||function(){var b=function(e,w){b=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(b,e){b.__proto__=e;}||function(b,e){for(var d in e)e.hasOwnProperty(d)&&(b[d]=e[d]);};return b(e,w)};return function(e,w){function v(){this.constructor=e;}b(e,w);e.prototype=null===w?Object.create(w):(v.prototype=w.prototype,new v);}}(),G=z.defined,
    C=z.merge;z=function(B){function x(){var b=null!==B&&B.apply(this,arguments)||this;b.data=void 0;b.options=void 0;b.points=void 0;return b}D(x,B);x.prototype.drawGraph=function(){var b=this,v=this.options,f=(this.gappedPath||this.getGraphPath).call(this),d=this.chart.styledMode,q=[["graph","highcharts-graph"]];d||q[0].push(v.lineColor||this.color||e.neutralColor20,v.dashStyle);q=b.getZonesGraphs(q);q.forEach(function(e,l){var k=e[0],q=b[k],n=q?"animate":"attr";q?(q.endX=b.preventGraphAnimation?null:
    f.xMap,q.animate({d:f})):f.length&&(b[k]=q=b.chart.renderer.path(f).addClass(e[1]).attr({zIndex:1}).add(b.group));q&&!d&&(k={stroke:e[2],"stroke-width":v.lineWidth,fill:b.fillGraph&&b.color||"none"},e[3]?k.dashstyle=e[3]:"square"!==v.linecap&&(k["stroke-linecap"]=k["stroke-linejoin"]="round"),q[n](k).shadow(2>l&&v.shadow));q&&(q.startX=f.xMap,q.isArea=f.isArea);});};x.prototype.getGraphPath=function(b,e,f){var d=this,q=d.options,k=q.step,l,v=[],u=[],n;b=b||d.points;(l=b.reversed)&&b.reverse();(k={right:1,
    center:2}[k]||k&&3)&&l&&(k=4-k);b=this.getValidPoints(b,!1,!(q.connectNulls&&!e&&!f));b.forEach(function(l,w){var m=l.plotX,c=l.plotY,g=b[w-1];(l.leftCliff||g&&g.rightCliff)&&!f&&(n=!0);l.isNull&&!G(e)&&0<w?n=!q.connectNulls:l.isNull&&!e?n=!0:(0===w||n?w=[["M",l.plotX,l.plotY]]:d.getPointSpline?w=[d.getPointSpline(b,l,w)]:k?(w=1===k?[["L",g.plotX,c]]:2===k?[["L",(g.plotX+m)/2,g.plotY],["L",(g.plotX+m)/2,c]]:[["L",m,g.plotY]],w.push(["L",m,c])):w=[["L",m,c]],u.push(l.x),k&&(u.push(l.x),2===k&&u.push(l.x)),
    v.push.apply(v,w),n=!1);});v.xMap=u;return d.graphPath=v};x.prototype.getZonesGraphs=function(b){this.zones.forEach(function(e,f){f=["zone-graph-"+f,"highcharts-graph highcharts-zone-graph-"+f+" "+(e.className||"")];this.chart.styledMode||f.push(e.color||this.color,e.dashStyle||this.options.dashStyle);b.push(f);},this);return b};x.defaultOptions=C(b.defaultOptions,{});return x}(b);I.registerSeriesType("line",z);return z});O(e,"Series/Area/AreaSeries.js",[e["Core/Color/Color.js"],e["Mixins/LegendSymbol.js"],
    e["Core/Series/SeriesRegistry.js"],e["Core/Utilities.js"]],function(e,b,I,z){var D=this&&this.__extends||function(){var b=function(e,d){b=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(b,d){b.__proto__=d;}||function(b,d){for(var e in d)d.hasOwnProperty(e)&&(b[e]=d[e]);};return b(e,d)};return function(e,d){function f(){this.constructor=e;}b(e,d);e.prototype=null===d?Object.create(d):(f.prototype=d.prototype,new f);}}(),G=e.parse,C=I.seriesTypes.line;e=z.extend;var B=z.merge,x=z.objectEach,
    w=z.pick;z=function(b){function e(){var d=null!==b&&b.apply(this,arguments)||this;d.data=void 0;d.options=void 0;d.points=void 0;return d}D(e,b);e.prototype.drawGraph=function(){this.areaPath=[];b.prototype.drawGraph.apply(this);var d=this,e=this.areaPath,f=this.options,l=[["area","highcharts-area",this.color,f.fillColor]];this.zones.forEach(function(b,e){l.push(["zone-area-"+e,"highcharts-area highcharts-zone-area-"+e+" "+b.className,b.color||d.color,b.fillColor||f.fillColor]);});l.forEach(function(b){var k=
    b[0],l=d[k],q=l?"animate":"attr",v={};l?(l.endX=d.preventGraphAnimation?null:e.xMap,l.animate({d:e})):(v.zIndex=0,l=d[k]=d.chart.renderer.path(e).addClass(b[1]).add(d.group),l.isArea=!0);d.chart.styledMode||(v.fill=w(b[3],G(b[2]).setOpacity(w(f.fillOpacity,.75)).get()));l[q](v);l.startX=e.xMap;l.shiftUnit=f.step?2:1;});};e.prototype.getGraphPath=function(b){var d=C.prototype.getGraphPath,e=this.options,f=e.stacking,v=this.yAxis,u,n=[],x=[],E=this.index,m=v.stacking.stacks[this.stackKey],c=e.threshold,
    g=Math.round(v.getThreshold(e.threshold));e=w(e.connectNulls,"percent"===f);var a=function(a,d,e){var h=b[a];a=f&&m[h.x].points[E];var k=h[e+"Null"]||0;e=h[e+"Cliff"]||0;h=!0;if(e||k){var l=(k?a[0]:a[1])+e;var q=a[0]+e;h=!!k;}else !f&&b[d]&&b[d].isNull&&(l=q=c);"undefined"!==typeof l&&(x.push({plotX:r,plotY:null===l?g:v.getThreshold(l),isNull:h,isCliff:!0}),n.push({plotX:r,plotY:null===q?g:v.getThreshold(q),doCurve:!1}));};b=b||this.points;f&&(b=this.getStackPoints(b));for(u=0;u<b.length;u++){f||(b[u].leftCliff=
    b[u].rightCliff=b[u].leftNull=b[u].rightNull=void 0);var h=b[u].isNull;var r=w(b[u].rectPlotX,b[u].plotX);var A=f?w(b[u].yBottom,g):g;if(!h||e)e||a(u,u-1,"left"),h&&!f&&e||(x.push(b[u]),n.push({x:u,plotX:r,plotY:A})),e||a(u,u+1,"right");}u=d.call(this,x,!0,!0);n.reversed=!0;h=d.call(this,n,!0,!0);(A=h[0])&&"M"===A[0]&&(h[0]=["L",A[1],A[2]]);h=u.concat(h);h.length&&h.push(["Z"]);d=d.call(this,x,!1,e);h.xMap=u.xMap;this.areaPath=h;return d};e.prototype.getStackPoints=function(b){var d=this,e=[],f=[],
    v=this.xAxis,u=this.yAxis,n=u.stacking.stacks[this.stackKey],D={},E=u.series,m=E.length,c=u.options.reversedStacks?1:-1,g=E.indexOf(d);b=b||this.points;if(this.options.stacking){for(var a=0;a<b.length;a++)b[a].leftNull=b[a].rightNull=void 0,D[b[a].x]=b[a];x(n,function(a,c){null!==a.total&&f.push(c);});f.sort(function(a,c){return a-c});var h=E.map(function(a){return a.visible});f.forEach(function(a,b){var k=0,l,r;if(D[a]&&!D[a].isNull)e.push(D[a]),[-1,1].forEach(function(e){var k=1===e?"rightNull":
    "leftNull",q=0,t=n[f[b+e]];if(t)for(var p=g;0<=p&&p<m;){var v=E[p].index;l=t.points[v];l||(v===d.index?D[a][k]=!0:h[p]&&(r=n[a].points[v])&&(q-=r[1]-r[0]));p+=c;}D[a][1===e?"rightCliff":"leftCliff"]=q;});else {for(var q=g;0<=q&&q<m;){if(l=n[a].points[E[q].index]){k=l[1];break}q+=c;}k=w(k,0);k=u.translate(k,0,1,0,1);e.push({isNull:!0,plotX:v.translate(a,0,0,0,1),x:a,plotY:k,yBottom:k});}});}return e};e.defaultOptions=B(C.defaultOptions,{threshold:0});return e}(C);e(z.prototype,{singleStacks:!1,drawLegendSymbol:b.drawRectangle});
    I.registerSeriesType("area",z);return z});O(e,"Series/Spline/SplineSeries.js",[e["Core/Series/SeriesRegistry.js"],e["Core/Utilities.js"]],function(e,b){var D=this&&this.__extends||function(){var b=function(e,x){b=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(b,e){b.__proto__=e;}||function(b,e){for(var f in e)e.hasOwnProperty(f)&&(b[f]=e[f]);};return b(e,x)};return function(e,x){function w(){this.constructor=e;}b(e,x);e.prototype=null===x?Object.create(x):(w.prototype=x.prototype,
    new w);}}(),z=e.seriesTypes.line,H=b.merge,G=b.pick;b=function(b){function e(){var e=null!==b&&b.apply(this,arguments)||this;e.data=void 0;e.options=void 0;e.points=void 0;return e}D(e,b);e.prototype.getPointSpline=function(b,e,v){var f=e.plotX||0,d=e.plotY||0,q=b[v-1];v=b[v+1];if(q&&!q.isNull&&!1!==q.doCurve&&!e.isCliff&&v&&!v.isNull&&!1!==v.doCurve&&!e.isCliff){b=q.plotY||0;var k=v.plotX||0;v=v.plotY||0;var l=0;var w=(1.5*f+(q.plotX||0))/2.5;var u=(1.5*d+b)/2.5;k=(1.5*f+k)/2.5;var n=(1.5*d+v)/2.5;
    k!==w&&(l=(n-u)*(k-f)/(k-w)+d-n);u+=l;n+=l;u>b&&u>d?(u=Math.max(b,d),n=2*d-u):u<b&&u<d&&(u=Math.min(b,d),n=2*d-u);n>v&&n>d?(n=Math.max(v,d),u=2*d-n):n<v&&n<d&&(n=Math.min(v,d),u=2*d-n);e.rightContX=k;e.rightContY=n;}e=["C",G(q.rightContX,q.plotX,0),G(q.rightContY,q.plotY,0),G(w,f,0),G(u,d,0),f,d];q.rightContX=q.rightContY=void 0;return e};e.defaultOptions=H(z.defaultOptions);return e}(z);e.registerSeriesType("spline",b);return b});O(e,"Series/AreaSpline/AreaSplineSeries.js",[e["Series/Area/AreaSeries.js"],
    e["Series/Spline/SplineSeries.js"],e["Mixins/LegendSymbol.js"],e["Core/Series/SeriesRegistry.js"],e["Core/Utilities.js"]],function(e,b,I,z,H){var D=this&&this.__extends||function(){var b=function(e,f){b=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(b,e){b.__proto__=e;}||function(b,e){for(var d in e)e.hasOwnProperty(d)&&(b[d]=e[d]);};return b(e,f)};return function(e,f){function d(){this.constructor=e;}b(e,f);e.prototype=null===f?Object.create(f):(d.prototype=f.prototype,new d);}}(),C=
    e.prototype,B=H.extend,x=H.merge;H=function(w){function v(){var b=null!==w&&w.apply(this,arguments)||this;b.data=void 0;b.points=void 0;b.options=void 0;return b}D(v,w);v.defaultOptions=x(b.defaultOptions,e.defaultOptions);return v}(b);B(H.prototype,{getGraphPath:C.getGraphPath,getStackPoints:C.getStackPoints,drawGraph:C.drawGraph,drawLegendSymbol:I.drawRectangle});z.registerSeriesType("areaspline",H);return H});O(e,"Series/Column/ColumnSeries.js",[e["Core/Animation/AnimationUtilities.js"],e["Core/Color/Color.js"],
    e["Core/Globals.js"],e["Mixins/LegendSymbol.js"],e["Core/Color/Palette.js"],e["Core/Series/Series.js"],e["Core/Series/SeriesRegistry.js"],e["Core/Utilities.js"]],function(e,b,I,z,H,G,C,B){var x=this&&this.__extends||function(){var c=function(b,a){c=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(a,c){a.__proto__=c;}||function(a,c){for(var b in c)c.hasOwnProperty(b)&&(a[b]=c[b]);};return c(b,a)};return function(b,a){function d(){this.constructor=b;}c(b,a);b.prototype=null===a?Object.create(a):
    (d.prototype=a.prototype,new d);}}(),w=e.animObject,v=b.parse,f=I.hasTouch;e=I.noop;var d=B.clamp,q=B.css,k=B.defined,l=B.extend,D=B.fireEvent,u=B.isArray,n=B.isNumber,J=B.merge,E=B.pick,m=B.objectEach;B=function(c){function b(){var a=null!==c&&c.apply(this,arguments)||this;a.borderWidth=void 0;a.data=void 0;a.group=void 0;a.options=void 0;a.points=void 0;return a}x(b,c);b.prototype.animate=function(a){var c=this,b=this.yAxis,e=c.options,g=this.chart.inverted,f={},k=g?"translateX":"translateY";if(a)f.scaleY=
    .001,a=d(b.toPixels(e.threshold),b.pos,b.pos+b.len),g?f.translateX=a-b.len:f.translateY=a,c.clipBox&&c.setClip(),c.group.attr(f);else {var m=Number(c.group.attr(k));c.group.animate({scaleY:1},l(w(c.options.animation),{step:function(a,d){c.group&&(f[k]=m+d.pos*(b.pos-m),c.group.attr(f));}}));}};b.prototype.init=function(a,b){c.prototype.init.apply(this,arguments);var d=this;a=d.chart;a.hasRendered&&a.series.forEach(function(a){a.type===d.type&&(a.isDirty=!0);});};b.prototype.getColumnMetrics=function(){var a=
    this,c=a.options,b=a.xAxis,d=a.yAxis,e=b.options.reversedStacks;e=b.reversed&&!e||!b.reversed&&e;var g,f={},k=0;!1===c.grouping?k=1:a.chart.series.forEach(function(c){var b=c.yAxis,e=c.options;if(c.type===a.type&&(c.visible||!a.chart.options.chart.ignoreHiddenSeries)&&d.len===b.len&&d.pos===b.pos){if(e.stacking&&"group"!==e.stacking){g=c.stackKey;"undefined"===typeof f[g]&&(f[g]=k++);var h=f[g];}else !1!==e.grouping&&(h=k++);c.columnIndex=h;}});var m=Math.min(Math.abs(b.transA)*(b.ordinal&&b.ordinal.slope||
    c.pointRange||b.closestPointRange||b.tickInterval||1),b.len),l=m*c.groupPadding,n=(m-2*l)/(k||1);c=Math.min(c.maxPointWidth||b.len,E(c.pointWidth,n*(1-2*c.pointPadding)));a.columnMetrics={width:c,offset:(n-c)/2+(l+((a.columnIndex||0)+(e?1:0))*n-m/2)*(e?-1:1),paddedWidth:n,columnCount:k};return a.columnMetrics};b.prototype.crispCol=function(a,c,b,d){var e=this.chart,h=this.borderWidth,g=-(h%2?.5:0);h=h%2?.5:1;e.inverted&&e.renderer.isVML&&(h+=1);this.options.crisp&&(b=Math.round(a+b)+g,a=Math.round(a)+
    g,b-=a);d=Math.round(c+d)+h;g=.5>=Math.abs(c)&&.5<d;c=Math.round(c)+h;d-=c;g&&d&&(--c,d+=1);return {x:a,y:c,width:b,height:d}};b.prototype.adjustForMissingColumns=function(a,c,b,d){var e=this,h=this.options.stacking;if(!b.isNull&&1<d.columnCount){var g=0,f=0;m(this.yAxis.stacking&&this.yAxis.stacking.stacks,function(a){if("number"===typeof b.x&&(a=a[b.x.toString()])){var c=a.points[e.index],d=a.total;h?(c&&(g=f),a.hasValidPoints&&f++):u(c)&&(g=c[1],f=d||0);}});a=(b.plotX||0)+((f-1)*d.paddedWidth+c)/
    2-c-g*d.paddedWidth;}return a};b.prototype.translate=function(){var a=this,c=a.chart,b=a.options,e=a.dense=2>a.closestPointRange*a.xAxis.transA;e=a.borderWidth=E(b.borderWidth,e?0:1);var g=a.xAxis,f=a.yAxis,m=b.threshold,l=a.translatedThreshold=f.getThreshold(m),q=E(b.minPointLength,5),v=a.getColumnMetrics(),u=v.width,t=a.barW=Math.max(u,1+2*e),p=a.pointXOffset=v.offset,w=a.dataMin,x=a.dataMax;c.inverted&&(l-=.5);b.pointPadding&&(t=Math.ceil(t));G.prototype.translate.apply(a);a.points.forEach(function(e){var h=
    E(e.yBottom,l),r=999+Math.abs(h),y=u,A=e.plotX||0;r=d(e.plotY,-r,f.len+r);A+=p;var D=t,B=Math.min(r,h),z=Math.max(r,h)-B;if(q&&Math.abs(z)<q){z=q;var C=!f.reversed&&!e.negative||f.reversed&&e.negative;n(m)&&n(x)&&e.y===m&&x<=m&&(f.min||0)<m&&(w!==x||(f.max||0)<=m)&&(C=!C);B=Math.abs(B-l)>q?h-q:l-(C?q:0);}k(e.options.pointWidth)&&(y=D=Math.ceil(e.options.pointWidth),A-=Math.round((y-u)/2));b.centerInCategory&&(A=a.adjustForMissingColumns(A,y,e,v));e.barX=A;e.pointWidth=y;e.tooltipPos=c.inverted?[d(f.len+
    f.pos-c.plotLeft-r,f.pos-c.plotLeft,f.len+f.pos-c.plotLeft),g.len+g.pos-c.plotTop-A-D/2,z]:[g.left-c.plotLeft+A+D/2,d(r+f.pos-c.plotTop,f.pos-c.plotTop,f.len+f.pos-c.plotTop),z];e.shapeType=a.pointClass.prototype.shapeType||"rect";e.shapeArgs=a.crispCol.apply(a,e.isNull?[A,l,D,0]:[A,B,D,z]);});};b.prototype.drawGraph=function(){this.group[this.dense?"addClass":"removeClass"]("highcharts-dense-data");};b.prototype.pointAttribs=function(a,c){var b=this.options,d=this.pointAttrToOptions||{};var e=d.stroke||
    "borderColor";var h=d["stroke-width"]||"borderWidth",g=a&&a.color||this.color,f=a&&a[e]||b[e]||g,k=a&&a[h]||b[h]||this[h]||0;d=a&&a.options.dashStyle||b.dashStyle;var m=E(a&&a.opacity,b.opacity,1);if(a&&this.zones.length){var l=a.getZone();g=a.options.color||l&&(l.color||a.nonZonedColor)||this.color;l&&(f=l.borderColor||f,d=l.dashStyle||d,k=l.borderWidth||k);}c&&a&&(a=J(b.states[c],a.options.states&&a.options.states[c]||{}),c=a.brightness,g=a.color||"undefined"!==typeof c&&v(g).brighten(a.brightness).get()||
    g,f=a[e]||f,k=a[h]||k,d=a.dashStyle||d,m=E(a.opacity,m));e={fill:g,stroke:f,"stroke-width":k,opacity:m};d&&(e.dashstyle=d);return e};b.prototype.drawPoints=function(){var a=this,c=this.chart,b=a.options,d=c.renderer,e=b.animationLimit||250,g;a.points.forEach(function(h){var f=h.graphic,k=!!f,m=f&&c.pointCount<e?"animate":"attr";if(n(h.plotY)&&null!==h.y){g=h.shapeArgs;f&&h.hasNewShapeType()&&(f=f.destroy());a.enabledDataSorting&&(h.startXPos=a.xAxis.reversed?-(g?g.width||0:0):a.xAxis.width);f||(h.graphic=
    f=d[h.shapeType](g).add(h.group||a.group))&&a.enabledDataSorting&&c.hasRendered&&c.pointCount<e&&(f.attr({x:h.startXPos}),k=!0,m="animate");if(f&&k)f[m](J(g));if(b.borderRadius)f[m]({r:b.borderRadius});c.styledMode||f[m](a.pointAttribs(h,h.selected&&"select")).shadow(!1!==h.allowShadow&&b.shadow,null,b.stacking&&!b.borderRadius);f&&(f.addClass(h.getClassName(),!0),f.attr({visibility:h.visible?"inherit":"hidden"}));}else f&&(h.graphic=f.destroy());});};b.prototype.drawTracker=function(){var a=this,c=
    a.chart,b=c.pointer,d=function(a){var c=b.getPointFromEvent(a);"undefined"!==typeof c&&(b.isDirectTouch=!0,c.onMouseOver(a));},e;a.points.forEach(function(a){e=u(a.dataLabels)?a.dataLabels:a.dataLabel?[a.dataLabel]:[];a.graphic&&(a.graphic.element.point=a);e.forEach(function(c){c.div?c.div.point=a:c.element.point=a;});});a._hasTracking||(a.trackerGroups.forEach(function(e){if(a[e]){a[e].addClass("highcharts-tracker").on("mouseover",d).on("mouseout",function(a){b.onTrackerMouseOut(a);});if(f)a[e].on("touchstart",
    d);!c.styledMode&&a.options.cursor&&a[e].css(q).css({cursor:a.options.cursor});}}),a._hasTracking=!0);D(this,"afterDrawTracker");};b.prototype.remove=function(){var a=this,c=a.chart;c.hasRendered&&c.series.forEach(function(c){c.type===a.type&&(c.isDirty=!0);});G.prototype.remove.apply(a,arguments);};b.defaultOptions=J(G.defaultOptions,{borderRadius:0,centerInCategory:!1,groupPadding:.2,marker:null,pointPadding:.1,minPointLength:0,cropThreshold:50,pointRange:null,states:{hover:{halo:!1,brightness:.1},
    select:{color:H.neutralColor20,borderColor:H.neutralColor100}},dataLabels:{align:void 0,verticalAlign:void 0,y:void 0},startFromThreshold:!0,stickyTracking:!1,tooltip:{distance:6},threshold:0,borderColor:H.backgroundColor});return b}(G);l(B.prototype,{cropShoulder:0,directTouch:!0,drawLegendSymbol:z.drawRectangle,getSymbol:e,negStacks:!0,trackerGroups:["group","dataLabelsGroup"]});C.registerSeriesType("column",B);return B});O(e,"Series/Bar/BarSeries.js",[e["Series/Column/ColumnSeries.js"],e["Core/Series/SeriesRegistry.js"],
    e["Core/Utilities.js"]],function(e,b,I){var D=this&&this.__extends||function(){var b=function(e,x){b=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(b,e){b.__proto__=e;}||function(b,e){for(var f in e)e.hasOwnProperty(f)&&(b[f]=e[f]);};return b(e,x)};return function(e,x){function w(){this.constructor=e;}b(e,x);e.prototype=null===x?Object.create(x):(w.prototype=x.prototype,new w);}}(),H=I.extend,G=I.merge;I=function(b){function B(){var e=null!==b&&b.apply(this,arguments)||this;e.data=void 0;
    e.options=void 0;e.points=void 0;return e}D(B,b);B.defaultOptions=G(e.defaultOptions,{});return B}(e);H(I.prototype,{inverted:!0});b.registerSeriesType("bar",I);return I});O(e,"Series/Scatter/ScatterSeries.js",[e["Series/Column/ColumnSeries.js"],e["Series/Line/LineSeries.js"],e["Core/Series/SeriesRegistry.js"],e["Core/Utilities.js"]],function(e,b,I,z){var D=this&&this.__extends||function(){var b=function(e,v){b=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(b,d){b.__proto__=d;}||
    function(b,d){for(var e in d)d.hasOwnProperty(e)&&(b[e]=d[e]);};return b(e,v)};return function(e,v){function f(){this.constructor=e;}b(e,v);e.prototype=null===v?Object.create(v):(f.prototype=v.prototype,new f);}}(),G=z.addEvent,C=z.extend,B=z.merge;z=function(e){function w(){var b=null!==e&&e.apply(this,arguments)||this;b.data=void 0;b.options=void 0;b.points=void 0;return b}D(w,e);w.prototype.applyJitter=function(){var b=this,e=this.options.jitter,d=this.points.length;e&&this.points.forEach(function(f,
    k){["x","y"].forEach(function(l,q){var v="plot"+l.toUpperCase();if(e[l]&&!f.isNull){var n=b[l+"Axis"];var w=e[l]*n.transA;if(n&&!n.isLog){var E=Math.max(0,f[v]-w);n=Math.min(n.len,f[v]+w);q=1E4*Math.sin(k+q*d);f[v]=E+(n-E)*(q-Math.floor(q));"x"===l&&(f.clientX=f.plotX);}}});});};w.prototype.drawGraph=function(){(this.options.lineWidth||0===this.options.lineWidth&&this.graph&&this.graph.strokeWidth())&&e.prototype.drawGraph.call(this);};w.defaultOptions=B(b.defaultOptions,{lineWidth:0,findNearestPointBy:"xy",
    jitter:{x:0,y:0},marker:{enabled:!0},tooltip:{headerFormat:'<span style="color:{point.color}">\u25cf</span> <span style="font-size: 10px"> {series.name}</span><br/>',pointFormat:"x: <b>{point.x}</b><br/>y: <b>{point.y}</b><br/>"}});return w}(b);C(z.prototype,{drawTracker:e.prototype.drawTracker,sorted:!1,requireSorting:!1,noSharedTooltip:!0,trackerGroups:["group","markerGroup","dataLabelsGroup"],takeOrdinalPosition:!1});G(z,"afterTranslate",function(){this.applyJitter();});I.registerSeriesType("scatter",
    z);return z});O(e,"Mixins/CenteredSeries.js",[e["Core/Globals.js"],e["Core/Series/Series.js"],e["Core/Utilities.js"]],function(e,b,I){var D=I.isNumber,H=I.pick,G=I.relativeLength,C=e.deg2rad;return e.CenteredSeriesMixin={getCenter:function(){var e=this.options,D=this.chart,w=2*(e.slicedOffset||0),v=D.plotWidth-2*w,f=D.plotHeight-2*w,d=e.center,q=Math.min(v,f),k=e.size,l=e.innerSize||0;"string"===typeof k&&(k=parseFloat(k));"string"===typeof l&&(l=parseFloat(l));e=[H(d[0],"50%"),H(d[1],"50%"),H(k&&
    0>k?void 0:e.size,"100%"),H(l&&0>l?void 0:e.innerSize||0,"0%")];!D.angular||this instanceof b||(e[3]=0);for(d=0;4>d;++d)k=e[d],D=2>d||2===d&&/%$/.test(k),e[d]=G(k,[v,f,q,e[2]][d])+(D?w:0);e[3]>e[2]&&(e[3]=e[2]);return e},getStartAndEndRadians:function(b,e){b=D(b)?b:0;e=D(e)&&e>b&&360>e-b?e:b+360;return {start:C*(b+-90),end:C*(e+-90)}}}});O(e,"Series/Pie/PiePoint.js",[e["Core/Animation/AnimationUtilities.js"],e["Core/Series/Point.js"],e["Core/Utilities.js"]],function(e,b,I){var D=this&&this.__extends||
    function(){var b=function(e,d){b=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(b,d){b.__proto__=d;}||function(b,d){for(var e in d)d.hasOwnProperty(e)&&(b[e]=d[e]);};return b(e,d)};return function(e,d){function f(){this.constructor=e;}b(e,d);e.prototype=null===d?Object.create(d):(f.prototype=d.prototype,new f);}}(),H=e.setAnimation,G=I.addEvent,C=I.defined;e=I.extend;var B=I.isNumber,x=I.pick,w=I.relativeLength;I=function(e){function f(){var b=null!==e&&e.apply(this,arguments)||this;
    b.labelDistance=void 0;b.options=void 0;b.series=void 0;return b}D(f,e);f.prototype.getConnectorPath=function(){var b=this.labelPosition,e=this.series.options.dataLabels,f=e.connectorShape,l=this.connectorShapes;l[f]&&(f=l[f]);return f.call(this,{x:b.final.x,y:b.final.y,alignment:b.alignment},b.connectorPosition,e)};f.prototype.getTranslate=function(){return this.sliced?this.slicedTranslation:{translateX:0,translateY:0}};f.prototype.haloPath=function(b){var d=this.shapeArgs;return this.sliced||!this.visible?
    []:this.series.chart.renderer.symbols.arc(d.x,d.y,d.r+b,d.r+b,{innerR:d.r-1,start:d.start,end:d.end})};f.prototype.init=function(){b.prototype.init.apply(this,arguments);var d=this;d.name=x(d.name,"Slice");var e=function(b){d.slice("select"===b.type);};G(d,"select",e);G(d,"unselect",e);return d};f.prototype.isValid=function(){return B(this.y)&&0<=this.y};f.prototype.setVisible=function(b,e){var d=this,f=d.series,q=f.chart,v=f.options.ignoreHiddenPoint;e=x(e,v);b!==d.visible&&(d.visible=d.options.visible=
    b="undefined"===typeof b?!d.visible:b,f.options.data[f.data.indexOf(d)]=d.options,["graphic","dataLabel","connector","shadowGroup"].forEach(function(e){if(d[e])d[e][b?"show":"hide"](b);}),d.legendItem&&q.legend.colorizeItem(d,b),b||"hover"!==d.state||d.setState(""),v&&(f.isDirty=!0),e&&q.redraw());};f.prototype.slice=function(b,e,f){var d=this.series;H(f,d.chart);x(e,!0);this.sliced=this.options.sliced=C(b)?b:!this.sliced;d.options.data[d.data.indexOf(this)]=this.options;this.graphic&&this.graphic.animate(this.getTranslate());
    this.shadowGroup&&this.shadowGroup.animate(this.getTranslate());};return f}(b);e(I.prototype,{connectorShapes:{fixedOffset:function(b,e,d){var f=e.breakAt;e=e.touchingSliceAt;return [["M",b.x,b.y],d.softConnector?["C",b.x+("left"===b.alignment?-5:5),b.y,2*f.x-e.x,2*f.y-e.y,f.x,f.y]:["L",f.x,f.y],["L",e.x,e.y]]},straight:function(b,e){e=e.touchingSliceAt;return [["M",b.x,b.y],["L",e.x,e.y]]},crookedLine:function(b,e,d){e=e.touchingSliceAt;var f=this.series,k=f.center[0],l=f.chart.plotWidth,v=f.chart.plotLeft;
    f=b.alignment;var u=this.shapeArgs.r;d=w(d.crookDistance,1);l="left"===f?k+u+(l+v-k-u)*(1-d):v+(k-u)*d;d=["L",l,b.y];k=!0;if("left"===f?l>b.x||l<e.x:l<b.x||l>e.x)k=!1;b=[["M",b.x,b.y]];k&&b.push(d);b.push(["L",e.x,e.y]);return b}}});return I});O(e,"Series/Pie/PieSeries.js",[e["Mixins/CenteredSeries.js"],e["Series/Column/ColumnSeries.js"],e["Core/Globals.js"],e["Mixins/LegendSymbol.js"],e["Core/Color/Palette.js"],e["Series/Pie/PiePoint.js"],e["Core/Series/Series.js"],e["Core/Series/SeriesRegistry.js"],
    e["Core/Renderer/SVG/SVGRenderer.js"],e["Core/Utilities.js"]],function(e,b,I,z,H,G,C,B,x,w){var v=this&&this.__extends||function(){var b=function(d,e){b=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(b,c){b.__proto__=c;}||function(b,c){for(var d in c)c.hasOwnProperty(d)&&(b[d]=c[d]);};return b(d,e)};return function(d,e){function f(){this.constructor=d;}b(d,e);d.prototype=null===e?Object.create(e):(f.prototype=e.prototype,new f);}}(),f=e.getStartAndEndRadians;I=I.noop;var d=w.clamp,q=
    w.extend,k=w.fireEvent,l=w.merge,D=w.pick,u=w.relativeLength;w=function(b){function e(){var d=null!==b&&b.apply(this,arguments)||this;d.center=void 0;d.data=void 0;d.maxLabelDistance=void 0;d.options=void 0;d.points=void 0;return d}v(e,b);e.prototype.animate=function(b){var d=this,c=d.points,e=d.startAngleRad;b||c.forEach(function(a){var c=a.graphic,b=a.shapeArgs;c&&b&&(c.attr({r:D(a.startR,d.center&&d.center[3]/2),start:e,end:e}),c.animate({r:b.r,start:b.start,end:b.end},d.options.animation));});};
    e.prototype.drawEmpty=function(){var b=this.startAngleRad,d=this.endAngleRad,c=this.options;if(0===this.total&&this.center){var e=this.center[0];var a=this.center[1];this.graph||(this.graph=this.chart.renderer.arc(e,a,this.center[1]/2,0,b,d).addClass("highcharts-empty-series").add(this.group));this.graph.attr({d:x.prototype.symbols.arc(e,a,this.center[2]/2,0,{start:b,end:d,innerR:this.center[3]/2})});this.chart.styledMode||this.graph.attr({"stroke-width":c.borderWidth,fill:c.fillColor||"none",stroke:c.color||
    H.neutralColor20});}else this.graph&&(this.graph=this.graph.destroy());};e.prototype.drawPoints=function(){var b=this.chart.renderer;this.points.forEach(function(d){d.graphic&&d.hasNewShapeType()&&(d.graphic=d.graphic.destroy());d.graphic||(d.graphic=b[d.shapeType](d.shapeArgs).add(d.series.group),d.delayedRendering=!0);});};e.prototype.generatePoints=function(){b.prototype.generatePoints.call(this);this.updateTotals();};e.prototype.getX=function(b,e,c){var g=this.center,a=this.radii?this.radii[c.index]||
    0:g[2]/2;b=Math.asin(d((b-g[1])/(a+c.labelDistance),-1,1));return g[0]+(e?-1:1)*Math.cos(b)*(a+c.labelDistance)+(0<c.labelDistance?(e?-1:1)*this.options.dataLabels.padding:0)};e.prototype.hasData=function(){return !!this.processedXData.length};e.prototype.redrawPoints=function(){var b=this,d=b.chart,c=d.renderer,e,a,h,f,k=b.options.shadow;this.drawEmpty();!k||b.shadowGroup||d.styledMode||(b.shadowGroup=c.g("shadow").attr({zIndex:-1}).add(b.group));b.points.forEach(function(g){var m={};a=g.graphic;
    if(!g.isNull&&a){var r=void 0;f=g.shapeArgs;e=g.getTranslate();d.styledMode||(r=g.shadowGroup,k&&!r&&(r=g.shadowGroup=c.g("shadow").add(b.shadowGroup)),r&&r.attr(e),h=b.pointAttribs(g,g.selected&&"select"));g.delayedRendering?(a.setRadialReference(b.center).attr(f).attr(e),d.styledMode||a.attr(h).attr({"stroke-linejoin":"round"}).shadow(k,r),g.delayedRendering=!1):(a.setRadialReference(b.center),d.styledMode||l(!0,m,h),l(!0,m,f,e),a.animate(m));a.attr({visibility:g.visible?"inherit":"hidden"});a.addClass(g.getClassName(),
    !0);}else a&&(g.graphic=a.destroy());});};e.prototype.sortByAngle=function(b,d){b.sort(function(c,b){return "undefined"!==typeof c.angle&&(b.angle-c.angle)*d});};e.prototype.translate=function(b){this.generatePoints();var d=0,c=this.options,e=c.slicedOffset,a=e+(c.borderWidth||0),h=f(c.startAngle,c.endAngle),l=this.startAngleRad=h.start;h=(this.endAngleRad=h.end)-l;var n=this.points,q=c.dataLabels.distance;c=c.ignoreHiddenPoint;var v,w=n.length;b||(this.center=b=this.getCenter());for(v=0;v<w;v++){var x=
    n[v];var E=l+d*h;!x.isValid()||c&&!x.visible||(d+=x.percentage/100);var z=l+d*h;var B={x:b[0],y:b[1],r:b[2]/2,innerR:b[3]/2,start:Math.round(1E3*E)/1E3,end:Math.round(1E3*z)/1E3};x.shapeType="arc";x.shapeArgs=B;x.labelDistance=D(x.options.dataLabels&&x.options.dataLabels.distance,q);x.labelDistance=u(x.labelDistance,B.r);this.maxLabelDistance=Math.max(this.maxLabelDistance||0,x.labelDistance);z=(z+E)/2;z>1.5*Math.PI?z-=2*Math.PI:z<-Math.PI/2&&(z+=2*Math.PI);x.slicedTranslation={translateX:Math.round(Math.cos(z)*
    e),translateY:Math.round(Math.sin(z)*e)};B=Math.cos(z)*b[2]/2;var t=Math.sin(z)*b[2]/2;x.tooltipPos=[b[0]+.7*B,b[1]+.7*t];x.half=z<-Math.PI/2||z>Math.PI/2?1:0;x.angle=z;E=Math.min(a,x.labelDistance/5);x.labelPosition={natural:{x:b[0]+B+Math.cos(z)*x.labelDistance,y:b[1]+t+Math.sin(z)*x.labelDistance},"final":{},alignment:0>x.labelDistance?"center":x.half?"right":"left",connectorPosition:{breakAt:{x:b[0]+B+Math.cos(z)*E,y:b[1]+t+Math.sin(z)*E},touchingSliceAt:{x:b[0]+B,y:b[1]+t}}};}k(this,"afterTranslate");};
    e.prototype.updateTotals=function(){var b,d=0,c=this.points,e=c.length,a=this.options.ignoreHiddenPoint;for(b=0;b<e;b++){var h=c[b];!h.isValid()||a&&!h.visible||(d+=h.y);}this.total=d;for(b=0;b<e;b++)h=c[b],h.percentage=0<d&&(h.visible||!a)?h.y/d*100:0,h.total=d;};e.defaultOptions=l(C.defaultOptions,{center:[null,null],clip:!1,colorByPoint:!0,dataLabels:{allowOverlap:!0,connectorPadding:5,connectorShape:"fixedOffset",crookDistance:"70%",distance:30,enabled:!0,formatter:function(){return this.point.isNull?
    void 0:this.point.name},softConnector:!0,x:0},fillColor:void 0,ignoreHiddenPoint:!0,inactiveOtherPoints:!0,legendType:"point",marker:null,size:null,showInLegend:!1,slicedOffset:10,stickyTracking:!1,tooltip:{followPointer:!0},borderColor:H.backgroundColor,borderWidth:1,lineWidth:void 0,states:{hover:{brightness:.1}}});return e}(C);q(w.prototype,{axisTypes:[],directTouch:!0,drawGraph:void 0,drawLegendSymbol:z.drawRectangle,drawTracker:b.prototype.drawTracker,getCenter:e.getCenter,getSymbol:I,isCartesian:!1,
    noSharedTooltip:!0,pointAttribs:b.prototype.pointAttribs,pointClass:G,requireSorting:!1,searchPoint:I,trackerGroups:["group","dataLabelsGroup"]});B.registerSeriesType("pie",w);return w});O(e,"Core/Series/DataLabels.js",[e["Core/Animation/AnimationUtilities.js"],e["Core/FormatUtilities.js"],e["Core/Globals.js"],e["Core/Color/Palette.js"],e["Core/Series/Series.js"],e["Core/Series/SeriesRegistry.js"],e["Core/Utilities.js"]],function(e,b,I,z,H,G,C){var D=e.getDeferredAnimation,x=b.format;e=I.noop;
    G=G.seriesTypes;var w=C.arrayMax,v=C.clamp,f=C.defined,d=C.extend,q=C.fireEvent,k=C.isArray,l=C.merge,N=C.objectEach,u=C.pick,n=C.relativeLength,J=C.splat,E=C.stableSort;I.distribute=function(b,c,d){function a(a,c){return a.target-c.target}var e,g=!0,f=b,k=[];var l=0;var m=f.reducedLen||c;for(e=b.length;e--;)l+=b[e].size;if(l>m){E(b,function(a,c){return (c.rank||0)-(a.rank||0)});for(l=e=0;l<=m;)l+=b[e].size,e++;k=b.splice(e-1,b.length);}E(b,a);for(b=b.map(function(a){return {size:a.size,targets:[a.target],
    align:u(a.align,.5)}});g;){for(e=b.length;e--;)g=b[e],l=(Math.min.apply(0,g.targets)+Math.max.apply(0,g.targets))/2,g.pos=v(l-g.size*g.align,0,c-g.size);e=b.length;for(g=!1;e--;)0<e&&b[e-1].pos+b[e-1].size>b[e].pos&&(b[e-1].size+=b[e].size,b[e-1].targets=b[e-1].targets.concat(b[e].targets),b[e-1].align=.5,b[e-1].pos+b[e-1].size>c&&(b[e-1].pos=c-b[e-1].size),b.splice(e,1),g=!0);}f.push.apply(f,k);e=0;b.some(function(a){var b=0;if(a.targets.some(function(){f[e].pos=a.pos+b;if("undefined"!==typeof d&&
    Math.abs(f[e].pos-f[e].target)>d)return f.slice(0,e+1).forEach(function(a){delete a.pos;}),f.reducedLen=(f.reducedLen||c)-.1*c,f.reducedLen>.1*c&&I.distribute(f,c,d),!0;b+=f[e].size;e++;}))return !0});E(f,a);};H.prototype.drawDataLabels=function(){function b(a,c){var b=c.filter;return b?(c=b.operator,a=a[b.property],b=b.value,">"===c&&a>b||"<"===c&&a<b||">="===c&&a>=b||"<="===c&&a<=b||"=="===c&&a==b||"==="===c&&a===b?!0:!1):!0}function c(a,c){var b=[],d;if(k(a)&&!k(c))b=a.map(function(a){return l(a,c)});
    else if(k(c)&&!k(a))b=c.map(function(c){return l(a,c)});else if(k(a)||k(c))for(d=Math.max(a.length,c.length);d--;)b[d]=l(a[d],c[d]);else b=l(a,c);return b}var d=this,a=d.chart,e=d.options,r=e.dataLabels,n=d.points,v,w=d.hasRendered||0,E=r.animation;E=r.defer?D(a,E,d):{defer:0,duration:0};var B=a.renderer;r=c(c(a.options.plotOptions&&a.options.plotOptions.series&&a.options.plotOptions.series.dataLabels,a.options.plotOptions&&a.options.plotOptions[d.type]&&a.options.plotOptions[d.type].dataLabels),
    r);q(this,"drawDataLabels");if(k(r)||r.enabled||d._hasPointLabels){var C=d.plotGroup("dataLabelsGroup","data-labels",w?"inherit":"hidden",r.zIndex||6);C.attr({opacity:+w});!w&&(w=d.dataLabelsGroup)&&(d.visible&&C.show(!0),w[e.animation?"animate":"attr"]({opacity:1},E));n.forEach(function(g){v=J(c(r,g.dlOptions||g.options&&g.options.dataLabels));v.forEach(function(c,h){var k=c.enabled&&(!g.isNull||g.dataLabelOnNull)&&b(g,c),l=g.dataLabels?g.dataLabels[h]:g.dataLabel,m=g.connectors?g.connectors[h]:
    g.connector,r=u(c.distance,g.labelDistance),n=!l;if(k){var q=g.getLabelConfig();var t=u(c[g.formatPrefix+"Format"],c.format);q=f(t)?x(t,q,a):(c[g.formatPrefix+"Formatter"]||c.formatter).call(q,c);t=c.style;var v=c.rotation;a.styledMode||(t.color=u(c.color,t.color,d.color,z.neutralColor100),"contrast"===t.color?(g.contrastColor=B.getContrast(g.color||d.color),t.color=!f(r)&&c.inside||0>r||e.stacking?g.contrastColor:z.neutralColor100):delete g.contrastColor,e.cursor&&(t.cursor=e.cursor));var w={r:c.borderRadius||
    0,rotation:v,padding:c.padding,zIndex:1};a.styledMode||(w.fill=c.backgroundColor,w.stroke=c.borderColor,w["stroke-width"]=c.borderWidth);N(w,function(a,c){"undefined"===typeof a&&delete w[c];});}!l||k&&f(q)?k&&f(q)&&(l?w.text=q:(g.dataLabels=g.dataLabels||[],l=g.dataLabels[h]=v?B.text(q,0,-9999,c.useHTML).addClass("highcharts-data-label"):B.label(q,0,-9999,c.shape,null,null,c.useHTML,null,"data-label"),h||(g.dataLabel=l),l.addClass(" highcharts-data-label-color-"+g.colorIndex+" "+(c.className||"")+
    (c.useHTML?" highcharts-tracker":""))),l.options=c,l.attr(w),a.styledMode||l.css(t).shadow(c.shadow),l.added||l.add(C),c.textPath&&!c.useHTML&&(l.setTextPath(g.getDataLabelPath&&g.getDataLabelPath(l)||g.graphic,c.textPath),g.dataLabelPath&&!c.textPath.enabled&&(g.dataLabelPath=g.dataLabelPath.destroy())),d.alignDataLabel(g,l,c,null,n)):(g.dataLabel=g.dataLabel&&g.dataLabel.destroy(),g.dataLabels&&(1===g.dataLabels.length?delete g.dataLabels:delete g.dataLabels[h]),h||delete g.dataLabel,m&&(g.connector=
    g.connector.destroy(),g.connectors&&(1===g.connectors.length?delete g.connectors:delete g.connectors[h])));});});}q(this,"afterDrawDataLabels");};H.prototype.alignDataLabel=function(b,c,e,a,f){var g=this,h=this.chart,k=this.isCartesian&&h.inverted,l=this.enabledDataSorting,m=u(b.dlBox&&b.dlBox.centerX,b.plotX,-9999),n=u(b.plotY,-9999),q=c.getBBox(),v=e.rotation,w=e.align,t=h.isInsidePlot(m,Math.round(n),{inverted:k,paneCoordinates:!0,series:g}),p="justify"===u(e.overflow,l?"none":"justify"),D=this.visible&&
    !1!==b.visible&&(b.series.forceDL||l&&!p||t||u(e.inside,!!this.options.stacking)&&a&&h.isInsidePlot(m,k?a.x+1:a.y+a.height-1,{inverted:k,paneCoordinates:!0,series:g}));var x=function(a){l&&g.xAxis&&!p&&g.setDataLabelStartPos(b,c,f,t,a);};if(D){var z=h.renderer.fontMetrics(h.styledMode?void 0:e.style.fontSize,c).b;a=d({x:k?this.yAxis.len-n:m,y:Math.round(k?this.xAxis.len-m:n),width:0,height:0},a);d(e,{width:q.width,height:q.height});v?(p=!1,m=h.renderer.rotCorr(z,v),m={x:a.x+(e.x||0)+a.width/2+m.x,
    y:a.y+(e.y||0)+{top:0,middle:.5,bottom:1}[e.verticalAlign]*a.height},x(m),c[f?"attr":"animate"](m).attr({align:w}),x=(v+720)%360,x=180<x&&360>x,"left"===w?m.y-=x?q.height:0:"center"===w?(m.x-=q.width/2,m.y-=q.height/2):"right"===w&&(m.x-=q.width,m.y-=x?0:q.height),c.placed=!0,c.alignAttr=m):(x(a),c.align(e,void 0,a),m=c.alignAttr);p&&0<=a.height?this.justifyDataLabel(c,e,m,q,a,f):u(e.crop,!0)&&(D=h.isInsidePlot(m.x,m.y,{paneCoordinates:!0,series:g})&&h.isInsidePlot(m.x+q.width,m.y+q.height,{paneCoordinates:!0,
    series:g}));if(e.shape&&!v)c[f?"attr":"animate"]({anchorX:k?h.plotWidth-b.plotY:b.plotX,anchorY:k?h.plotHeight-b.plotX:b.plotY});}f&&l&&(c.placed=!1);D||l&&!p||(c.hide(!0),c.placed=!1);};H.prototype.setDataLabelStartPos=function(b,c,d,a,e){var g=this.chart,f=g.inverted,h=this.xAxis,k=h.reversed,l=f?c.height/2:c.width/2;b=(b=b.pointWidth)?b/2:0;h=f?e.x:k?-l-b:h.width-l+b;e=f?k?this.yAxis.height-l+b:-l-b:e.y;c.startXPos=h;c.startYPos=e;a?"hidden"===c.visibility&&(c.show(),c.attr({opacity:0}).animate({opacity:1})):
    c.attr({opacity:1}).animate({opacity:0},void 0,c.hide);g.hasRendered&&(d&&c.attr({x:c.startXPos,y:c.startYPos}),c.placed=!0);};H.prototype.justifyDataLabel=function(b,c,d,a,e,f){var g=this.chart,h=c.align,k=c.verticalAlign,l=b.box?0:b.padding||0,m=c.x;m=void 0===m?0:m;var n=c.y;var r=void 0===n?0:n;n=(d.x||0)+l;if(0>n){"right"===h&&0<=m?(c.align="left",c.inside=!0):m-=n;var q=!0;}n=(d.x||0)+a.width-l;n>g.plotWidth&&("left"===h&&0>=m?(c.align="right",c.inside=!0):m+=g.plotWidth-n,q=!0);n=d.y+l;0>n&&
    ("bottom"===k&&0<=r?(c.verticalAlign="top",c.inside=!0):r-=n,q=!0);n=(d.y||0)+a.height-l;n>g.plotHeight&&("top"===k&&0>=r?(c.verticalAlign="bottom",c.inside=!0):r+=g.plotHeight-n,q=!0);q&&(c.x=m,c.y=r,b.placed=!f,b.align(c,void 0,e));return q};G.pie&&(G.pie.prototype.dataLabelPositioners={radialDistributionY:function(b){return b.top+b.distributeBox.pos},radialDistributionX:function(b,c,d,a){return b.getX(d<c.top+2||d>c.bottom-2?a:d,c.half,c)},justify:function(b,c,d){return d[0]+(b.half?-1:1)*(c+b.labelDistance)},
    alignToPlotEdges:function(b,c,d,a){b=b.getBBox().width;return c?b+a:d-b-a},alignToConnectors:function(b,c,d,a){var e=0,g;b.forEach(function(a){g=a.dataLabel.getBBox().width;g>e&&(e=g);});return c?e+a:d-e-a}},G.pie.prototype.drawDataLabels=function(){var b=this,c=b.data,d,a=b.chart,e=b.options.dataLabels||{},k=e.connectorPadding,n,q=a.plotWidth,v=a.plotHeight,x=a.plotLeft,D=Math.round(a.chartWidth/3),E,B=b.center,C=B[2]/2,t=B[1],p,G,J,N,F=[[],[]],O,K,T,X,U=[0,0,0,0],W=b.dataLabelPositioners,Y;b.visible&&
    (e.enabled||b._hasPointLabels)&&(c.forEach(function(a){a.dataLabel&&a.visible&&a.dataLabel.shortened&&(a.dataLabel.attr({width:"auto"}).css({width:"auto",textOverflow:"clip"}),a.dataLabel.shortened=!1);}),H.prototype.drawDataLabels.apply(b),c.forEach(function(a){a.dataLabel&&(a.visible?(F[a.half].push(a),a.dataLabel._pos=null,!f(e.style.width)&&!f(a.options.dataLabels&&a.options.dataLabels.style&&a.options.dataLabels.style.width)&&a.dataLabel.getBBox().width>D&&(a.dataLabel.css({width:Math.round(.7*
    D)+"px"}),a.dataLabel.shortened=!0)):(a.dataLabel=a.dataLabel.destroy(),a.dataLabels&&1===a.dataLabels.length&&delete a.dataLabels));}),F.forEach(function(c,g){var h=c.length,l=[],m;if(h){b.sortByAngle(c,g-.5);if(0<b.maxLabelDistance){var n=Math.max(0,t-C-b.maxLabelDistance);var r=Math.min(t+C+b.maxLabelDistance,a.plotHeight);c.forEach(function(b){0<b.labelDistance&&b.dataLabel&&(b.top=Math.max(0,t-C-b.labelDistance),b.bottom=Math.min(t+C+b.labelDistance,a.plotHeight),m=b.dataLabel.getBBox().height||
    21,b.distributeBox={target:b.labelPosition.natural.y-b.top+m/2,size:m,rank:b.y},l.push(b.distributeBox));});n=r+m-n;I.distribute(l,n,n/5);}for(X=0;X<h;X++){d=c[X];J=d.labelPosition;p=d.dataLabel;T=!1===d.visible?"hidden":"inherit";K=n=J.natural.y;l&&f(d.distributeBox)&&("undefined"===typeof d.distributeBox.pos?T="hidden":(N=d.distributeBox.size,K=W.radialDistributionY(d)));delete d.positionIndex;if(e.justify)O=W.justify(d,C,B);else switch(e.alignTo){case "connectors":O=W.alignToConnectors(c,g,q,x);
    break;case "plotEdges":O=W.alignToPlotEdges(p,g,q,x);break;default:O=W.radialDistributionX(b,d,K,n);}p._attr={visibility:T,align:J.alignment};Y=d.options.dataLabels||{};p._pos={x:O+u(Y.x,e.x)+({left:k,right:-k}[J.alignment]||0),y:K+u(Y.y,e.y)-10};J.final.x=O;J.final.y=K;u(e.crop,!0)&&(G=p.getBBox().width,n=null,O-G<k&&1===g?(n=Math.round(G-O+k),U[3]=Math.max(n,U[3])):O+G>q-k&&0===g&&(n=Math.round(O+G-q+k),U[1]=Math.max(n,U[1])),0>K-N/2?U[0]=Math.max(Math.round(-K+N/2),U[0]):K+N/2>v&&(U[2]=Math.max(Math.round(K+
    N/2-v),U[2])),p.sideOverflow=n);}}}),0===w(U)||this.verifyDataLabelOverflow(U))&&(this.placeDataLabels(),this.points.forEach(function(c){Y=l(e,c.options.dataLabels);if(n=u(Y.connectorWidth,1)){var d;E=c.connector;if((p=c.dataLabel)&&p._pos&&c.visible&&0<c.labelDistance){T=p._attr.visibility;if(d=!E)c.connector=E=a.renderer.path().addClass("highcharts-data-label-connector  highcharts-color-"+c.colorIndex+(c.className?" "+c.className:"")).add(b.dataLabelsGroup),a.styledMode||E.attr({"stroke-width":n,
    stroke:Y.connectorColor||c.color||z.neutralColor60});E[d?"attr":"animate"]({d:c.getConnectorPath()});E.attr("visibility",T);}else E&&(c.connector=E.destroy());}}));},G.pie.prototype.placeDataLabels=function(){this.points.forEach(function(b){var c=b.dataLabel,d;c&&b.visible&&((d=c._pos)?(c.sideOverflow&&(c._attr.width=Math.max(c.getBBox().width-c.sideOverflow,0),c.css({width:c._attr.width+"px",textOverflow:(this.options.dataLabels.style||{}).textOverflow||"ellipsis"}),c.shortened=!0),c.attr(c._attr),
    c[c.moved?"animate":"attr"](d),c.moved=!0):c&&c.attr({y:-9999}));delete b.distributeBox;},this);},G.pie.prototype.alignDataLabel=e,G.pie.prototype.verifyDataLabelOverflow=function(b){var c=this.center,d=this.options,a=d.center,e=d.minSize||80,f=null!==d.size;if(!f){if(null!==a[0])var k=Math.max(c[2]-Math.max(b[1],b[3]),e);else k=Math.max(c[2]-b[1]-b[3],e),c[0]+=(b[3]-b[1])/2;null!==a[1]?k=v(k,e,c[2]-Math.max(b[0],b[2])):(k=v(k,e,c[2]-b[0]-b[2]),c[1]+=(b[0]-b[2])/2);k<c[2]?(c[2]=k,c[3]=Math.min(n(d.innerSize||
    0,k),k),this.translate(c),this.drawDataLabels&&this.drawDataLabels()):f=!0;}return f});G.column&&(G.column.prototype.alignDataLabel=function(b,c,d,a,e){var f=this.chart.inverted,g=b.series,h=b.dlBox||b.shapeArgs,k=u(b.below,b.plotY>u(this.translatedThreshold,g.yAxis.len)),m=u(d.inside,!!this.options.stacking);h&&(a=l(h),0>a.y&&(a.height+=a.y,a.y=0),h=a.y+a.height-g.yAxis.len,0<h&&h<a.height&&(a.height-=h),f&&(a={x:g.yAxis.len-a.y-a.height,y:g.xAxis.len-a.x-a.width,width:a.height,height:a.width}),m||
    (f?(a.x+=k?0:a.width,a.width=0):(a.y+=k?a.height:0,a.height=0)));d.align=u(d.align,!f||m?"center":k?"right":"left");d.verticalAlign=u(d.verticalAlign,f||m?"middle":k?"top":"bottom");H.prototype.alignDataLabel.call(this,b,c,d,a,e);d.inside&&b.contrastColor&&c.css({color:b.contrastColor});});});O(e,"Extensions/OverlappingDataLabels.js",[e["Core/Chart/Chart.js"],e["Core/Utilities.js"]],function(e,b){function D(b,e){var f=!1;if(b){var d=b.newOpacity;b.oldOpacity!==d&&(b.alignAttr&&b.placed?(b[d?"removeClass":
    "addClass"]("highcharts-data-label-hidden"),f=!0,b.alignAttr.opacity=d,b[b.isOld?"animate":"attr"](b.alignAttr,null,function(){e.styledMode||b.css({pointerEvents:d?"auto":"none"});b.visibility=d?"inherit":"hidden";}),H(e,"afterHideOverlappingLabel")):b.attr({opacity:d}));b.isOld=!0;}return f}var z=b.addEvent,H=b.fireEvent,G=b.isArray,C=b.isNumber,B=b.objectEach,x=b.pick;z(e,"render",function(){var b=this,e=[];(this.labelCollectors||[]).forEach(function(b){e=e.concat(b());});(this.yAxis||[]).forEach(function(b){b.stacking&&
    b.options.stackLabels&&!b.options.stackLabels.allowOverlap&&B(b.stacking.stacks,function(b){B(b,function(b){e.push(b.label);});});});(this.series||[]).forEach(function(f){var d=f.options.dataLabels;f.visible&&(!1!==d.enabled||f._hasPointLabels)&&(d=function(d){return d.forEach(function(d){d.visible&&(G(d.dataLabels)?d.dataLabels:d.dataLabel?[d.dataLabel]:[]).forEach(function(f){var k=f.options;f.labelrank=x(k.labelrank,d.labelrank,d.shapeArgs&&d.shapeArgs.height);k.allowOverlap?(f.oldOpacity=f.opacity,
    f.newOpacity=1,D(f,b)):e.push(f);});})},d(f.nodes||[]),d(f.points));});this.hideOverlappingLabels(e);});e.prototype.hideOverlappingLabels=function(b){var e=this,f=b.length,d=e.renderer,q,k,l,w=!1;var u=function(b){var e,c=b.box?0:b.padding||0,f=e=0,a;if(b&&(!b.alignAttr||b.placed)){var h=b.alignAttr||{x:b.attr("x"),y:b.attr("y")};var k=b.parentGroup;b.width||(e=b.getBBox(),b.width=e.width,b.height=e.height,e=d.fontMetrics(null,b.element).h);var l=b.width-2*c;(a={left:"0",center:"0.5",right:"1"}[b.alignValue])?
    f=+a*l:C(b.x)&&Math.round(b.x)!==b.translateX&&(f=b.x-b.translateX);return {x:h.x+(k.translateX||0)+c-(f||0),y:h.y+(k.translateY||0)+c-e,width:b.width-2*c,height:b.height-2*c}}};for(k=0;k<f;k++)if(q=b[k])q.oldOpacity=q.opacity,q.newOpacity=1,q.absoluteBox=u(q);b.sort(function(b,d){return (d.labelrank||0)-(b.labelrank||0)});for(k=0;k<f;k++){var n=(u=b[k])&&u.absoluteBox;for(q=k+1;q<f;++q){var x=(l=b[q])&&l.absoluteBox;!n||!x||u===l||0===u.newOpacity||0===l.newOpacity||x.x>=n.x+n.width||x.x+x.width<=
    n.x||x.y>=n.y+n.height||x.y+x.height<=n.y||((u.labelrank<l.labelrank?u:l).newOpacity=0);}}b.forEach(function(b){D(b,e)&&(w=!0);});w&&H(e,"afterHideAllOverlappingLabels");};});O(e,"Core/Responsive.js",[e["Core/Chart/Chart.js"],e["Core/Utilities.js"]],function(e,b){var D=b.find,z=b.isArray,H=b.isObject,G=b.merge,C=b.objectEach,B=b.pick,x=b.splat,w=b.uniqueKey;e.prototype.setResponsive=function(b,e){var d=this.options.responsive,f=[],k=this.currentResponsive;!e&&d&&d.rules&&d.rules.forEach(function(b){"undefined"===
    typeof b._id&&(b._id=w());this.matchResponsiveRule(b,f);},this);e=G.apply(0,f.map(function(b){return D(d.rules,function(d){return d._id===b}).chartOptions}));e.isResponsiveOptions=!0;f=f.toString()||void 0;f!==(k&&k.ruleIds)&&(k&&this.update(k.undoOptions,b,!0),f?(k=this.currentOptions(e),k.isResponsiveOptions=!0,this.currentResponsive={ruleIds:f,mergedOptions:e,undoOptions:k},this.update(e,b,!0)):this.currentResponsive=void 0);};e.prototype.matchResponsiveRule=function(b,e){var d=b.condition;(d.callback||
    function(){return this.chartWidth<=B(d.maxWidth,Number.MAX_VALUE)&&this.chartHeight<=B(d.maxHeight,Number.MAX_VALUE)&&this.chartWidth>=B(d.minWidth,0)&&this.chartHeight>=B(d.minHeight,0)}).call(this)&&e.push(b._id);};e.prototype.currentOptions=function(b){function e(b,f,q,u){var k;C(b,function(b,l){if(!u&&-1<d.collectionsWithUpdate.indexOf(l)&&f[l])for(b=x(b),q[l]=[],k=0;k<Math.max(b.length,f[l].length);k++)f[l][k]&&(void 0===b[k]?q[l][k]=f[l][k]:(q[l][k]={},e(b[k],f[l][k],q[l][k],u+1)));else H(b)?
    (q[l]=z(b)?[]:{},e(b,f[l]||{},q[l],u+1)):q[l]="undefined"===typeof f[l]?null:f[l];});}var d=this,q={};e(b,this.options,q,0);return q};});O(e,"masters/highcharts.src.js",[e["Core/Globals.js"],e["Core/Utilities.js"],e["Core/Options.js"],e["Core/Animation/Fx.js"],e["Core/Animation/AnimationUtilities.js"],e["Core/Renderer/HTML/AST.js"],e["Core/FormatUtilities.js"],e["Core/Renderer/SVG/SVGElement.js"],e["Core/Series/Series.js"]],function(e,b,I,z,H,G,C,B,x){e.animate=H.animate;e.animObject=H.animObject;e.getDeferredAnimation=
    H.getDeferredAnimation;e.setAnimation=H.setAnimation;e.stop=H.stop;e.timers=z.timers;e.AST=G;e.Fx=z;e.Series=x;e.SVGElement=B;e.dateFormat=C.dateFormat;e.format=C.format;e.numberFormat=C.numberFormat;e.defaultOptions=I.defaultOptions;e.getOptions=I.getOptions;e.time=I.defaultTime;e.setOptions=I.setOptions;e.addEvent=b.addEvent;e.arrayMax=b.arrayMax;e.arrayMin=b.arrayMin;e.attr=b.attr;e.clearTimeout=b.clearTimeout;e.correctFloat=b.correctFloat;e.createElement=b.createElement;e.css=b.css;e.defined=
    b.defined;e.destroyObjectProperties=b.destroyObjectProperties;e.discardElement=b.discardElement;e.erase=b.erase;e.error=b.error;e.extend=b.extend;e.extendClass=b.extendClass;e.find=b.find;e.fireEvent=b.fireEvent;e.getMagnitude=b.getMagnitude;e.getStyle=b.getStyle;e.inArray=b.inArray;e.isArray=b.isArray;e.isClass=b.isClass;e.isDOMElement=b.isDOMElement;e.isFunction=b.isFunction;e.isNumber=b.isNumber;e.isObject=b.isObject;e.isString=b.isString;e.keys=b.keys;e.merge=b.merge;e.normalizeTickInterval=b.normalizeTickInterval;
    e.objectEach=b.objectEach;e.offset=b.offset;e.pad=b.pad;e.pick=b.pick;e.pInt=b.pInt;e.relativeLength=b.relativeLength;e.removeEvent=b.removeEvent;e.splat=b.splat;e.stableSort=b.stableSort;e.syncTimeout=b.syncTimeout;e.timeUnits=b.timeUnits;e.uniqueKey=b.uniqueKey;e.useSerialIds=b.useSerialIds;e.wrap=b.wrap;return e});e["masters/highcharts.src.js"]._modules=e;return e["masters/highcharts.src.js"]});
    //# sourceMappingURL=highcharts.js.map
    });

    /* src/dansesben/frontend/routes/Graphs.svelte generated by Svelte v3.37.0 */
    const file$1 = "src/dansesben/frontend/routes/Graphs.svelte";

    // (139:0) <Container>
    function create_default_slot_1$1(ctx) {
    	let figure;
    	let div;
    	let t0;
    	let p;
    	let t1;
    	let code0;
    	let t3;
    	let code1;
    	let t5;

    	const block = {
    		c: function create() {
    			figure = element("figure");
    			div = element("div");
    			t0 = space();
    			p = element("p");
    			t1 = text("Se muestra la evolución de créditos aprobados para el grado de ");
    			code0 = element("code");
    			code0.textContent = "Ingeniería informática";
    			t3 = text("\n            en la ");
    			code1 = element("code");
    			code1.textContent = "ETSII";
    			t5 = text(".");
    			attr_dev(div, "id", "container");
    			add_location(div, file$1, 140, 8, 3882);
    			add_location(code0, file$1, 142, 75, 4039);
    			add_location(code1, file$1, 143, 18, 4093);
    			attr_dev(p, "class", "highcharts-description text-center");
    			add_location(p, file$1, 141, 8, 3917);
    			attr_dev(figure, "class", "highcharts-figure");
    			add_location(figure, file$1, 139, 4, 3839);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, figure, anchor);
    			append_dev(figure, div);
    			append_dev(figure, t0);
    			append_dev(figure, p);
    			append_dev(p, t1);
    			append_dev(p, code0);
    			append_dev(p, t3);
    			append_dev(p, code1);
    			append_dev(p, t5);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(figure);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(139:0) <Container>",
    		ctx
    	});

    	return block;
    }

    // (149:0) <Container>
    function create_default_slot$1(ctx) {
    	let figure;
    	let div;
    	let t0;
    	let p;
    	let t1;
    	let code0;
    	let t3;
    	let code1;
    	let t5;

    	const block = {
    		c: function create() {
    			figure = element("figure");
    			div = element("div");
    			t0 = space();
    			p = element("p");
    			t1 = text("Se muestra la evolución de créditos aprobados frente a los matriculados para el grado de ");
    			code0 = element("code");
    			code0.textContent = "Ingeniería informática";
    			t3 = text("\n            en la ");
    			code1 = element("code");
    			code1.textContent = "ETSII";
    			t5 = text(".");
    			attr_dev(div, "id", "container-stack");
    			add_location(div, file$1, 150, 8, 4213);
    			add_location(code0, file$1, 152, 101, 4402);
    			add_location(code1, file$1, 153, 18, 4456);
    			attr_dev(p, "class", "highcharts-description text-center");
    			add_location(p, file$1, 151, 8, 4254);
    			attr_dev(figure, "class", "highcharts-figure");
    			add_location(figure, file$1, 149, 4, 4170);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, figure, anchor);
    			append_dev(figure, div);
    			append_dev(figure, t0);
    			append_dev(figure, p);
    			append_dev(p, t1);
    			append_dev(p, code0);
    			append_dev(p, t3);
    			append_dev(p, code1);
    			append_dev(p, t5);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(figure);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(149:0) <Container>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let container0;
    	let t;
    	let container1;
    	let current;

    	container0 = new Container({
    			props: {
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	container1 = new Container({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(container0.$$.fragment);
    			t = space();
    			create_component(container1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(container0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(container1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const container0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				container0_changes.$$scope = { dirty, ctx };
    			}

    			container0.$set(container0_changes);
    			const container1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				container1_changes.$$scope = { dirty, ctx };
    			}

    			container1.$set(container1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(container0.$$.fragment, local);
    			transition_in(container1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(container0.$$.fragment, local);
    			transition_out(container1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(container0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(container1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Graphs", slots, []);

    	onMount(async () => {
    		let data = await getAllRecords();

    		// Remove not ETSII and Computer-Science data
    		data = data.filter(o => o.center === "ETSII" && o["field-of-knowledge"] === "Computer-Science");

    		// Sort array by date
    		data = data.sort(function (a, b) {
    			if (a.year < b.year) return -1;
    			if (a.year > b.year) return 1;
    			return 0;
    		});

    		// X Axis
    		let xAxisValues = data.map(o => o.year);

    		let rangeStart = Math.min(...xAxisValues);

    		// Y Axis
    		let yAxisValues = data.map(o => o["credits-passed"]);

    		highcharts.chart("container", {
    			title: { text: "Créditos aprobados en la ETSII" },
    			subtitle: { text: "" },
    			yAxis: {
    				title: { text: "Número de créditos aprobados" }
    			},
    			xAxis: {
    				accessibility: { rangeDescription: "Range: 2010 to 2017" }
    			},
    			legend: {
    				layout: "vertical",
    				align: "right",
    				verticalAlign: "middle"
    			},
    			plotOptions: {
    				series: {
    					label: { connectorAllowed: false },
    					pointStart: rangeStart
    				}
    			},
    			series: [
    				{
    					name: "Ingeniería informática",
    					data: yAxisValues
    				}
    			],
    			responsive: {
    				rules: [
    					{
    						condition: { maxWidth: 500 },
    						chartOptions: {
    							legend: {
    								layout: "horizontal",
    								align: "center",
    								verticalAlign: "bottom"
    							}
    						}
    					}
    				]
    			}
    		});

    		let creditsEnrolled = data.map(o => o["credits-enrolled"]);
    		let creditsPassed = data.map(o => o["credits-passed"]);

    		highcharts.chart("container-stack", {
    			chart: { type: "area" },
    			title: {
    				text: "Evolución de créditos matriculados y aprobados en la ETSII para el grado de Ingenieria informatica"
    			},
    			subtitle: { text: "" },
    			xAxis: {
    				categories: xAxisValues,
    				tickmarkPlacement: "on",
    				title: { enabled: false }
    			},
    			yAxis: { title: { text: "Creditos" } },
    			tooltip: { split: true, valueSuffix: " creditos" },
    			plotOptions: {
    				area: {
    					pointStart: rangeStart,
    					marker: {
    						enabled: false,
    						symbol: "circle",
    						radius: 2,
    						states: { hover: { enabled: true } }
    					}
    				}
    			},
    			series: [
    				{
    					name: "Matriculados",
    					data: creditsEnrolled
    				},
    				{ name: "Aprobados", data: creditsPassed }
    			]
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Graphs> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Highcharts: highcharts,
    		Container,
    		getAllRecords,
    		onMount
    	});

    	return [];
    }

    class Graphs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graphs",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/dansesben/frontend/App.svelte generated by Svelte v3.37.0 */
    const file = "src/dansesben/frontend/App.svelte";

    // (20:8) <Col>
    function create_default_slot_2(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Rendimiento según grado";
    			attr_dev(h1, "class", "text-center mt-3");
    			add_location(h1, file, 19, 13, 477);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(20:8) <Col>",
    		ctx
    	});

    	return block;
    }

    // (19:4) <Row>
    function create_default_slot_1(ctx) {
    	let col;
    	let current;

    	col = new Col({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(col.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const col_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				col_changes.$$scope = { dirty, ctx };
    			}

    			col.$set(col_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(19:4) <Row>",
    		ctx
    	});

    	return block;
    }

    // (18:0) <Container>
    function create_default_slot(ctx) {
    	let row;
    	let current;

    	row = new Row({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(row.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const row_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				row_changes.$$scope = { dirty, ctx };
    			}

    			row.$set(row_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(18:0) <Container>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let container;
    	let t;
    	let body;
    	let router;
    	let current;

    	container = new Container({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(container.$$.fragment);
    			t = space();
    			body = element("body");
    			create_component(router.$$.fragment);
    			add_location(body, file, 23, 0, 566);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(container, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, body, anchor);
    			mount_component(router, body, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const container_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				container_changes.$$scope = { dirty, ctx };
    			}

    			container.$set(container_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(container, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(body);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const routes = {
    		"/": Home,
    		"/graphs": Graphs,
    		"/:center/:year/:field-of-knowledge": EditElement,
    		"*": NotFound
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Router,
    		Home,
    		NotFound,
    		EditElement,
    		Graphs,
    		Container,
    		Row,
    		Col,
    		routes
    	});

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
        target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
