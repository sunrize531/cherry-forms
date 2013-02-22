define(['underscore', 'backbone', 'core', 'utils',
    'less!chf-tree.less'], function(_, Backbone, CherryForms, Utils) {
    "use strict";

    var Widgets = CherryForms.Widgets,
        Models = CherryForms.Models,
        Fields = CherryForms.Fields,
        Field = Fields.Field,
        Widget = Widgets.Widget,
        Templates = CherryForms.Templates,
        Patterns = CherryForms.Patterns,
        Events = CherryForms.Events,
        Unset = Utils.Unset,
        isSimple = Utils.isSimple,

        Node = Backbone.Model.extend({
            defaults: {
                'selected': false,
                'expanded': false
            },

            initialize: function(data) {
                this.tree.nodes.add(this);
                this.children = new this.tree.NodesCollection(data['children']);
                this.children.each(function(node) {
                    node.parent = this;
                }, this);
            },

            numChildren: function () {
                return this.children.length;
            },

            toJSON: function() {
                return _.extend(Backbone.Model.prototype.toJSON.call(this), {
                    'num_children': this.numChildren()
                });
            },

            toggle: function() {
                var selected = !this.get('selected');
                this.set('selected', selected);
                return selected;
            },

            isEqual: function (node) {
                return node.id === this.id;
            },

            isChild: function(node) {
                return !_.isUndefined(this.children.find(function (child) {
                    return child.id === node.id;
                }));
            },

            getPath: function () {
                var path = [this],
                    parent = this.parent;
                while (!_.isUndefined(parent)) {
                    path.unshift(parent);
                    parent = parent.parent;
                }
                return path;
            },

            getAncestorPath: function (node) {
                if (this.isEqual(node)) {
                    return [this];
                }
                var parent = this.parent,
                    path = [this];
                while (!_.isUndefined(parent)) {
                    path.unshift(parent);
                    if (parent.isEqual(node)) {
                        return path;
                    }
                }
                return undefined;
            },

            isAncestor: function(node) {
                return !_.isUndefined(this.getAncestorPath(node));
            },

            _cursor: {
                queue: [],
                currentPath: []
            },

            _pathIterator: function (node) {
                var cursor = this._cursor;
                cursor.queue.push(cursor.currentPath.concat([node]));
            },

            getDescendantPath: function (node) {
                if (this.isEqual(node)) {
                    return [this];
                }

                var cursor = this._cursor,
                    queue = cursor.queue,
                    currentPath = cursor.currentPath = [this],
                    currentNode;

                this.children.each(this._pathIterator, this);
                while (queue) {
                    currentPath = queue.shift();
                    currentNode = currentPath[-1];
                    if (currentNode.isEqual(node)) {
                        queue.length = 0;
                        return currentPath;
                    }
                    cursor.currentPath = currentPath;
                    currentNode.children.each(this._pathIterator, this);
                }
                queue.length = 0;
                return undefined;
            },

            isDescendant: function(node) {
                return !_.isUndefined(this.getDescendantPath(node));
            },

            _childrenIterator: function (node) {
                this._cursor.queue.push(node);
            },

            getSubtree: function () {
                var descendants = [this],
                    cursor = this._cursor,
                    queue = cursor.queue,
                    currentNode;
                this.children.each(this._childrenIterator, this);
                while (queue.length) {
                    currentNode = queue.shift();
                    descendants.push(currentNode);
                    currentNode.children.each(this._childrenIterator, this);
                }
                return descendants;
            }
        }),

        NodesCollection = Models.TreeNodesCollection = Backbone.Collection.extend({
            model: Node
        }),

        Tree = Models.Tree = Backbone.Model.extend({
            NodeModelPrototype: Node,
            NodesCollectionPrototype: NodesCollection,

            initialize: function(attributes) {
                this.NodeModel = this.NodeModelPrototype.extend({tree: this});
                this.NodesCollection = this.NodesCollectionPrototype.extend({model: this.NodeModel, tree: this});
                this.nodes = new this.NodesCollection();
                this.roots = new this.NodesCollection(attributes['tree']);
            },

            getSelected: function() {
                return this.nodes.filter(function (node) {
                    return node.get('selected');
                });
            },

            getNode: function (value) {
                if (value instanceof Node) {
                    value = value.get('value');
                } else if (_.isObject(value)) {
                    value = value['value'];
                }
                return this.nodes.find(function (node) {
                    return node.get('value') === value;
                });
            }
        }),

        nodeDefaults = {
            'node_class': 'chf-tree-node',
            'title_class': 'chf-tree-node-title',
            'children_class': 'chf-tree-children',
            'controls_class': 'chf-controls',
            'node_icon': 'chf-icon',
            'selected_class': 'chf-selected',
            'collapsed_icon': 'icon-angle-right',
            'expanded_icon': 'icon-angle-down',
            'collapse_icon': 'icon-angle-up',
            'leaf_icon': 'icon-caret-right',
            'select_icon': 'chf-icon-select',
            'deselect_icon': 'chf-icon-deselect'
        },

        NodeView = Backbone.View.extend({
            tagName: 'li',
            className: nodeDefaults['node_class'],
            nodeTemplate: _.template('<i class="{{ node_icon }}"></i>' +
                '<a href="#" class="{{ title_class }}{% if (selected) { %} {{ selected_class }}{% } %}">' +
                    '{{ title }}</a>' +
                '&nbsp;<span class="{{ controls_class }}">' +
                    '<i class="icon-ok-sign {{ select_icon }}" title="Select subtree"></i>' +
                    '<i class="icon-remove-sign {{ deselect_icon }}" title="Deselect subtree"></i>' +
                '</span>' +
                '<ul class="{{ children_class }}"></ul>'),
            leafTemplate: _.template('<i class="{{ node_icon }}"></i>' +
                '<a href="#" class="{{ title_class }}{% if (selected) { %} {{ selected_class }}{% } %}">' +
                    '{{ title }}</a>'),

            events: function () {
                var events = {};
                events['mouseenter'] = '_showControls';
                events['mouseleave'] = '_hideControls';
                events['click > .' + this.options['title_class']] = '_toggleSelection';
                if (this.model.numChildren()) {
                    events['click > .' + this.options['node_icon']] = '_toggleChildren';
                    events['mouseover > .' + this.options['node_icon']] = '_onIconOver';
                    events['mouseout > .' + this.options['node_icon']] = '_onIconOut';
                    events['click > .' + this.options['controls_class'] +
                        ' .' + this.options['select_icon']] = '_selectSubtree';
                    events['click > .' + this.options['controls_class'] +
                        ' .' + this.options['deselect_icon']] = '_deselectSubtree';
                }
                return events;
            },

            initialize: function (options) {
                _.defaults(this.options, nodeDefaults);
                this.listenTo(this.model, 'change:selected', this._onSelectedStateChange);
                this.listenTo(this.model, 'change:expanded', this._onExpandedStateChange);
            },

            render: function () {
                var template;
                if (this.model.numChildren()) {
                    template = this.nodeTemplate;
                } else {
                    template = this.leafTemplate;
                }
                $(this.el).html(template(_.extend(this.model.toJSON(), this.options)));
                this._onSelectedStateChange();
                this._onExpandedStateChange();
                this.getControls().hide();
                return this;
            },

            getChildren: function () {
                if (_.isUndefined(this.$children)) {
                    this.$children = this.$('.' + this.options['children_class']);
                }
                return this.$children;
            },

            getIcon: function () {
                if (_.isUndefined(this.$icon)) {
                    this.$icon = this.$el.children('.' + this.options['node_icon']);
                }
                return this.$icon;
            },

            getTitle: function () {
                if (_.isUndefined(this.$title)) {
                    this.$title = this.$el.children('.' + this.options['title_class']);
                }
                return this.$title;
            },

            getControls: function () {
                if (_.isUndefined(this.$controls)) {
                    this.$controls = this.$el.children('.' + this.options['controls_class']);
                }
                return this.$controls;
            },

            expand: function () {
                this.model.set('expanded', true);
                return false;
            },

            collapse: function () {
                this.model.set('expanded', false);
                return false;
            },

            expandTo: function (node) {
                var path = this.model.getDescendantPath(node);
                if (!_.isUndefined(path)) {
                    _.each(path, function (node) {
                        node.set('expanded', true);
                    });
                }
                return false;
            },

            _toggleChildren: function () {
                this.model.set('expanded', !this.model.get('expanded'));
                return false;
            },

            _onIconOver: function () {
                var options = this.options;
                if (this.model.get('expanded')) {
                    this.getIcon()
                        .addClass(options['collapse_icon'])
                        .removeClass(options['collapsed_icon'] + ' ' + options['expanded_icon']);
                } else {
                    this.getIcon()
                        .addClass(options['expanded_icon'])
                        .removeClass(options['collapse_icon'] + ' ' + options['collapsed_icon']);
                }
            },

            _onIconOut: function () {
                var options = this.options;
                if (this.model.numChildren()) {
                    if (this.model.get('expanded')) {
                        this.getIcon()
                            .addClass(options['expanded_icon'])
                            .removeClass(options['collapsed_icon'] + ' ' + options['collapse_icon'])
                            .prop('title', 'Hide children');
                    } else {
                        this.getIcon()
                            .addClass(options['collapsed_icon'])
                            .removeClass(options['expanded_icon'] + ' ' + options['collapse_icon'])
                            .prop('title', 'Show children');
                    }
                } else {
                    this.getIcon().addClass(options['leaf_icon']);
                }
            },

            _toggleSelection: function() {
                if (this.model.toggle()) {
                    _.each(this.model.getPath(), function (node) {
                        node.set('expanded', true);
                    });
                }
                return false;
            },

            _onSelectedStateChange: function () {
                if (this.model.get('selected')) {
                    this.getTitle().addClass(this.options['selected_class']);
                } else {
                    this.getTitle().removeClass(this.options['selected_class']);
                }
            },

            _onExpandedStateChange: function () {
                if (this.model.get('expanded')) {
                    var $children = this.getChildren();
                    this.model.children.each(function(node) {
                        var nodeView = new NodeView(_.defaults({model: node}, this.options));
                        $children.append(nodeView.render().el);
                    }, this);

                } else {
                    this.getChildren().empty();
                }
                this._onIconOut();
            },

            _showControls: function () {
                this.getControls().show();
            },

            _hideControls: function () {
                this.getControls().hide();
            },

            _selectSubtree: function () {
                _.each(this.model.getSubtree(), function (node) {
                    node.set('selected', true);
                });
            },

            _deselectSubtree: function () {
                _.each(this.model.getSubtree(), function (node) {
                    node.set('selected', false);
                });
            }
        }),

        TreeField = Fields.Tree = Field.extend({
            defaults: function () {
                return _.extend({}, Field.prototype.defaults.call(this), {
                    'field_class': 'chf-field-tree',
                    'tree_class': 'chf-tree'
                }, nodeDefaults);
            },

            initialize: function (attributes) {
                this.tree = new Tree({tree: this.get('tree')});
                this.tree.nodes.on('change:selected', this._onNodeSelect, this);
                Field.prototype.initialize.apply(this, arguments);
            },

            processValue: function () {
                var value = this.get('value'),
                    node;
                if (!_.isArray(value)) {
                    value = [value];
                }
                this.value = new NodesCollection();
                _.each(value, function (nodeValue) {
                    node = this.tree.getNode(nodeValue);
                    if (_.isUndefined(node)) {
                        console.error('Node not found in tree', nodeValue);
                    } else {
                        node.set('selected', true);
                        _.each(node.getPath(), function (node) {
                            node.set('expanded', true);
                        });
                        this.value.add(node);
                    }
                }, this);
            },

            plainValue: function () {
                return this.value.pluck('value');
            },

            dumpValue: function () {
                return JSON.stringify(this.plainValue());
            },

            _onNodeSelect: function (node) {
                if (node.get('selected')) {
                    this.value.add(node);
                } else {
                    this.value.remove(node);
                }
                this.trigger(Events.FIELD_CHANGE, this);
            }
        }),

        TreeWidget = Widgets.Tree = Widget.extend({
            template: _.template('<div class="control-group">' +
                '<label>{{ label }}</label>' +
                '<ul class="{{ tree_class }}">' +
                '</ul>' +
            '</div>'),
            FieldModel: TreeField,
            className: 'chf-field-tree',

            getTree: function () {
                if (_.isUndefined(this._tree)) {
                    this._tree = this.$('.' + this.model.get('tree_class'));
                }
                return this._tree;
            },

            render: function () {
                Widget.prototype.render.call(this);
                this.getTree().append(
                    this.model.tree.roots.map(function (node) {
                        return (new NodeView({model: node})).render().el;
                    })
                );
            }
        });

    return CherryForms;
});
