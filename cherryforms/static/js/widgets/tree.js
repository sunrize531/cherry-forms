(function() {
    var TSAdmin = window.CherryForms,
        Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        Models = CherryForms.Models,
        Templates = CherryForms.Templates,
        Events = CherryForms.Events;

    var TreeNode = Models.TreeNode = Backbone.Model.extend({
        defaults: {
            'selected': false
        },

        initialize: function(data) {
            this.tree.nodes.add(this);
            this.children = new this.tree.NodesCollection(data['children']);
            this.children.each(function(node) {
                node.parent = this;
            }, this);
        },

        select: function() {
            this.set('selected', !this.get('selected'));
        },

        toJSON: function() {
            return _.extend(Backbone.Model.prototype.toJSON.call(this), {
                'num_children': this.children.length
            });
        },

        isChild: function(node) {
            var isChild = false;
            this.children.each(function(child) {
                if (child.id == node.id) {
                    isChild = true;
                    return false;
                }
            });
            return isChild;
        },

        isAncestor: function(node) {
            var isAncestor = false;
            this.children.each(function(child) {
                if (child.id == node.id || child.isAncestor(node)) {
                    isAncestor = true;
                    return false;
                }
            });
            return isAncestor;
        },

        isDescendant: function(node) {
            if (!_.isUndefined(this.parent)) {
                return this.parent.id == node.id || this.parent.isDescendant(node);
            } else {
                return false;
            }
        }
    });

    var TreeNodesCollection = Models.TreeNodesCollection = Backbone.Collection.extend({
        model: TreeNode
    });

    var Tree = Models.Tree = Backbone.Model.extend({
        NodeModelPrototype: TreeNode,
        NodesCollectionPrototype: TreeNodesCollection,

        initialize: function(attributes) {
            var tree = attributes['tree'];

            this.NodeModel = this.NodeModelPrototype.extend({tree: this});
            this.NodesCollection = this.NodesCollectionPrototype.extend({model: this.NodeModel, tree: this});
            this.nodes = new this.NodesCollection();
            this.roots = new this.NodesCollection(tree);
        },

        getSelected: function() {
            return this.nodes.filter(function(node) {
                return node.get('selected');
            });
        }
    });

    var treeNodeDefaults = {
        'node_class': 'tsadmin-field-tree-node',
        'title_class': 'tsadmin-field-tree-node-title',
        'children_class': 'tsadmin-field-tree-children',
        'expand_icon': 'tsadmin-icon-expand',
        'collapse_icon': 'tsadmin-icon-collapse',
        'selected_class': 'tsadmin-field-selected'
    };

    Templates.TreeNode = _.template(
        '{% if (num_children) { %}' +
            '<ins class="ui-icon ui-icon-triangle-1-e {{ expand_icon }}"></ins>' +
            '<ins class="ui-icon ui-icon-triangle-1-se {{ collapse_icon }}"></ins>' +
        '{% } %}' +
        '<a href="#" class="{{ title_class }}{% if (selected) { %} {{ selected_class }}{% } %}">{{ title }}</a>' +
        '<ul class="{{ children_class }}"></ul>');
    var TreeNodeView = Backbone.View.extend({
        tagName: 'li',
        className: treeNodeDefaults['node_class'],
        defaults: treeNodeDefaults,
        events: function() {
            var events = {};
            events['click .' + this.options['expand_icon']] = 'expand';
            events['click .' + this.options['collapse_icon']] = 'collapse';
            events['click .' + this.options['title_class']] = 'selectNode';
            return events;
        },

        render: function() {
            $(this.el).html(Templates.TreeNode(_.extend(this.model.toJSON(), this.options)));
            if (this.model.get('selected')) {
                this.expand();
            } else {
                this.collapse();
            }
            return this;
        },

        getChildren: function() {
            if (_.isUndefined(this.$children)) {
                this.$children = this.$('.' + this.options['children_class']);
            }
            return this.$children;
        },

        getExpandIcon: function() {
            if (_.isUndefined(this.$expandIcon)) {
                this.$expandIcon = this.$el.children('.' + this.options['expand_icon']);
            }
            return this.$expandIcon;
        },

        getCollapseIcon: function() {
            if (_.isUndefined(this.$collapseIcon)) {
                this.$collapseIcon = this.$el.children('.' + this.options['collapse_icon']);
            }
            return this.$collapseIcon;
        },

        getTitle: function() {
            if (_.isUndefined(this.$title)) {
                this.$title = this.$el.children('.' + this.options['title_class']);
            }
            return this.$title;
        },

        expand: function() {
            var $children = this.getChildren();
            this.model.children.each(function(node) {
                var nodeView = new TreeNodeView(_.defaults({model: node}, this.options));
                $children.append(nodeView.render().el);
            }, this);
            this.getExpandIcon().hide();
            this.getCollapseIcon().show();
            return false;
        },

        expandTo: function(node) {
            this.expand();
            this.children.each(function(child) {
                if (child.isAncestor(node)) {
                    child.expandTo(node);
                }
            });
            return false;
        },

        collapse: function() {
            this.getChildren().empty();
            this.getExpandIcon().show();
            this.getCollapseIcon().hide();
            return false;
        },

        selectNode: function() {
            this.getTitle().toggleClass(this.options['selected_class']);
            this.model.select();
            return false;
        }
    });

    Templates.Tree = _.template(
        '{{ label }}<ul class="{{ roots_class }}"></ul>'
    );

    Widgets.Tree = Widget.extend({
        TreeModel: Tree,
        template: 'Tree',

        defaults: _.extend(_.clone(treeNodeDefaults), {
            'roots_class': 'tsadmin-field-roots',
            'value': []
        }),

        initialize: function() {
            Widget.prototype.initialize.call(this);
            this.tree = new this.TreeModel({tree: this.options['tree']});
            var nodes = this.tree.nodes,
                value = this.options['value'];
            nodes.on('change', this.onSelectNode, this);
            _.each(this.options['value'], function(nodeId) {
                var node = nodes.get(nodeId);
                if (!_.isUndefined(node)) {
                    nodes.get(nodeId).select();
                }
            });
        },

        onSelectNode: function(node) {
            var value = this.options['value'];
            if (!_.isArray(value)) {
                this.options['value'] = value = [];
            }
            value.push(node.id);
            this.trigger(Events.FIELD_CHANGE, this);
        },

        getSelectedNodes: function() {
            var nodes = this.tree.nodes;
            return _.map(this.getValue(), function(nodeId) {
                return nodes.get(nodeId);
            }, this);
        },

        render: function() {
            Widget.prototype.render.call(this);
            var nodeDefaults = _.pick(this.options, _.keys(treeNodeDefaults)),
                $tree = this.$('.' + this.options['roots_class']);
            this.tree.roots.each(function(node) {
                var nodeView = new TreeNodeView(_.extend({model: node}, nodeDefaults));
                $tree.append(nodeView.render().el);
            }, this);
            return this;
        },

        dumpValue: function() {
            return JSON.stringify(this.getValue());
        }
    });
})();
